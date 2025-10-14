import * as React from "react";
import {
  Search,
  Loader2,
  RotateCcw,
  X,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface SearchAndFiltersProps {
  basePath?: string;
  totalControllers: number;
}

interface ControllerRecord {
  id: string;
  slug: string;
  title: string;
  brand: string;
  brand_name: string;
  model: string;
  mcu: string;
  mcu_name: string;
  mcu_family: string;
  mounting: string;
  uarts: number | null;
  can: number;
  sd: boolean;
  firmware_ids: string[];
  firmware_statuses: string[];
  lifecycle: string;
  summary: string;
  notes: string;
  keywords: string[];
  features: string[];
  url: string;
  filters: Record<string, string[]>;
}

interface ControllerResult {
  id: string;
  title: string;
  brandName: string;
  url: string;
  mcuFamily: string;
  mcuName: string;
  mounting: string;
  uarts?: number | null;
  can?: number;
  sd?: boolean;
  lifecycle: string;
  firmwareStatuses: string[];
  firmwareIds: string[];
  summary: string;
  excerpt?: string;
}

type FilterState = {
  mcu: string | null;
  mounting: string | null;
  uarts: string | null;
  firmware: string[];
  lifecycle: string | null;
  can: boolean;
  sd: boolean;
};

type FilterOption = {
  value: string;
  count: number;
  label: string;
};

type AvailableFilters = {
  mcu: FilterOption[];
  mounting: FilterOption[];
  uarts: FilterOption[];
  firmware: FilterOption[];
  lifecycle: FilterOption[];
  can: FilterOption[];
  sd: FilterOption[];
};

type PagefindModule = {
  init: () => Promise<void>;
  search: (
    query: string,
    options?: { filters?: Record<string, string[]> }
  ) => Promise<PagefindSearchResponse>;
  options?: (options: Record<string, unknown>) => Promise<void> | void;
};

type PagefindSearchResponse = {
  results: Array<{
    id: string;
    data: () => Promise<PagefindResultData>;
  }>;
  unfilteredResultCount?: number;
};

type PagefindResultData = {
  url: string;
  meta: Record<string, string>;
  excerpt?: string;
};

const UART_BUCKETS: Record<string, string> = {
  "0-4": "0–4 UARTs",
  "5-6": "5–6 UARTs",
  "7-8": "7–8 UARTs",
  "9-10": "9–10 UARTs",
  "11+": "11+ UARTs",
};

const DEFAULT_FILTERS: AvailableFilters = {
  mcu: [],
  mounting: [],
  uarts: [],
  firmware: [],
  lifecycle: [],
  can: [],
  sd: [],
};

const createInitialFilterState = (): FilterState => ({
  mcu: null,
  mounting: null,
  uarts: null,
  firmware: [],
  lifecycle: null,
  can: false,
  sd: false,
});

const normalizeBasePath = (basePath?: string) => {
  if (!basePath) return "";
  if (basePath === "/") return "";
  return basePath.endsWith("/") ? basePath.slice(0, -1) : basePath;
};

const encodeMcuParam = (value: string | null) => {
  if (!value) return null;
  const match = value.match(/^STM32([A-Z0-9]+)/i);
  if (match && match[1]) {
    return match[1].toUpperCase();
  }
  return value;
};

const decodeMcuParam = (value: string | null) => {
  if (!value) return null;
  if (/^STM32/i.test(value)) return value.toUpperCase();
  return `STM32${value.toUpperCase()}`;
};

const titleCase = (value: string) =>
  value.replace(/(^|\s)([a-z])/g, (match) => match.toUpperCase());

const applyFacets = (
  records: ControllerRecord[],
  filters: FilterState
): ControllerRecord[] => {
  return records.filter((record) => {
    if (filters.mcu && record.mcu_family !== filters.mcu) {
      return false;
    }
    if (filters.mounting && record.mounting !== filters.mounting) {
      return false;
    }
    if (filters.uarts) {
      const bucket = record.filters?.uarts?.[0];
      if (!bucket || bucket !== filters.uarts) {
        return false;
      }
    }
    if (filters.lifecycle && record.lifecycle !== filters.lifecycle) {
      return false;
    }
    if (filters.can && !(record.can > 0)) {
      return false;
    }
    if (filters.sd && !record.sd) {
      return false;
    }
    if (filters.firmware.length > 0) {
      const statuses = record.firmware_statuses.map((status) => status.toLowerCase());
      const matches = filters.firmware.every((status) =>
        statuses.includes(status.toLowerCase())
      );
      if (!matches) {
        return false;
      }
    }
    return true;
  });
};

const computeFilterOptions = (
  records: ControllerRecord[]
): AvailableFilters => {
  const counts: Record<string, Map<string, number>> = {
    mcu: new Map(),
    mounting: new Map(),
    uarts: new Map(),
    firmware: new Map(),
    lifecycle: new Map(),
    can: new Map(),
    sd: new Map(),
  };

  for (const record of records) {
    const mcuValue = record.mcu_family;
    counts.mcu.set(mcuValue, (counts.mcu.get(mcuValue) ?? 0) + 1);

    const mounting = record.mounting;
    counts.mounting.set(mounting, (counts.mounting.get(mounting) ?? 0) + 1);

    const uartsBucket = record.filters?.uarts?.[0] ?? "unknown";
    counts.uarts.set(uartsBucket, (counts.uarts.get(uartsBucket) ?? 0) + 1);

    const lifecycle = record.lifecycle || "unknown";
    counts.lifecycle.set(lifecycle, (counts.lifecycle.get(lifecycle) ?? 0) + 1);

    const canValue = record.can > 0 ? "1" : "0";
    counts.can.set(canValue, (counts.can.get(canValue) ?? 0) + 1);

    const sdValue = record.sd ? "1" : "0";
    counts.sd.set(sdValue, (counts.sd.get(sdValue) ?? 0) + 1);

    for (const status of record.firmware_statuses) {
      const key = status.toLowerCase();
      counts.firmware.set(key, (counts.firmware.get(key) ?? 0) + 1);
    }
  }

  const toOptions = (
    map: Map<string, number>,
    formatter?: (value: string) => string
  ): FilterOption[] =>
    Array.from(map.entries())
      .filter(([, count]) => count > 0)
      .map(([value, count]) => ({
        value,
        count,
        label: formatter ? formatter(value) : value,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

  const formatUarts = (value: string) => UART_BUCKETS[value] ?? value;
  const formatLifecycle = (value: string) =>
    value === "unknown" ? "Unknown" : titleCase(value.replace(/-/g, " "));

  return {
    mcu: toOptions(counts.mcu, (value) => value.toUpperCase()),
    mounting: toOptions(counts.mounting),
    uarts: toOptions(counts.uarts, formatUarts),
    firmware: toOptions(counts.firmware, (value) => value.toUpperCase()),
    lifecycle: toOptions(counts.lifecycle, formatLifecycle),
    can: toOptions(counts.can),
    sd: toOptions(counts.sd),
  };
};

const mapResultToController = (
  data: PagefindResultData,
  basePath: string
): ControllerResult => {
  const meta = data.meta ?? {};
  const firmwareStatuses = meta.firmware_statuses
    ? meta.firmware_statuses.split(',').map((item) => item.trim()).filter(Boolean)
    : [];
  const firmwareIds = meta.firmware_ids
    ? meta.firmware_ids.split(',').map((item) => item.trim()).filter(Boolean)
    : [];

  const url = meta.url || data.url;
  const href = `${basePath}${url.startsWith('/') ? url : `/${url}`}`;

  return {
    id: meta.id || meta.slug || url,
    title: meta.title || '',
    brandName: meta.brand_name || meta.brand || '',
    url: href,
    mcuFamily: meta.mcu_family || '',
    mcuName: meta.mcu_name || meta.mcu || '',
    mounting: meta.mounting || '',
    uarts: meta.uarts ? Number(meta.uarts) : null,
    can: meta.can ? Number(meta.can) : undefined,
    sd: meta.sd === '1',
    lifecycle: meta.lifecycle || 'unknown',
    firmwareStatuses,
    firmwareIds,
    summary: meta.summary || meta.notes || '',
    excerpt: data.excerpt,
  };
};

const convertRecord = (
  record: ControllerRecord,
  basePath: string
): ControllerResult => {
  const href = `${basePath}${record.url}`;
  return {
    id: record.id,
    title: record.title,
    brandName: record.brand_name || record.brand,
    url: href,
    mcuFamily: record.mcu_family,
    mcuName: record.mcu_name || record.mcu,
    mounting: record.mounting,
    uarts: record.uarts,
    can: record.can,
    sd: record.sd,
    lifecycle: record.lifecycle || 'unknown',
    firmwareStatuses: record.firmware_statuses,
    firmwareIds: record.firmware_ids,
    summary: record.summary || record.notes,
  };
};

export function SearchAndFilters({
  basePath = "",
  totalControllers,
}: SearchAndFiltersProps) {
  const normalizedBase = React.useMemo(() => normalizeBasePath(basePath), [basePath]);
  const [pagefind, setPagefind] = React.useState<PagefindModule | null>(null);
  const [records, setRecords] = React.useState<ControllerRecord[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filters, setFilters] = React.useState<FilterState>(createInitialFilterState);
  const [results, setResults] = React.useState<ControllerResult[]>([]);
  const [resultsCount, setResultsCount] = React.useState<number>(totalControllers);
  const [availableFilters, setAvailableFilters] = React.useState<AvailableFilters>(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSearching, setIsSearching] = React.useState(false);
  const [initialised, setInitialised] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const initialQuery = params.get("q") ?? "";
    const mcuParam = decodeMcuParam(params.get("mcu"));
    const mountingParam = params.get("mounting");
    const uartsParam = params.get("uarts");
    const lifecycleParam = params.get("lifecycle");
    const canParam = params.get("can") === "1";
    const sdParam = params.get("sd") === "1";

    const firmwareParams = params.getAll("firmware");
    const firmwareValues = Array.from(
      new Set(
        firmwareParams
          .flatMap((value) => value.split(","))
          .map((value) => value.trim())
          .filter(Boolean)
      )
    );

    setSearchQuery(initialQuery);
    setFilters({
      mcu: mcuParam,
      mounting: mountingParam || null,
      uarts: uartsParam || null,
      lifecycle: lifecycleParam || null,
      can: canParam,
      sd: sdParam,
      firmware: firmwareValues,
    });
    setInitialised(true);
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const modulePath = `${normalizedBase}/pagefind/pagefind.js`.replace(/\/\//g, "/");
        const mod = (await import(/* @vite-ignore */ modulePath)) as PagefindModule;
        if (mod.options) {
          const baseUrl = `${normalizedBase}/pagefind/`.replace(/\/\//g, "/");
          await mod.options({ baseUrl });
        }
        await mod.init();
        if (cancelled) return;
        setPagefind(mod);

        const response = await fetch(`${normalizedBase}/pagefind/controllers.json`.replace(/\/\//g, "/"));
        if (!response.ok) {
          throw new Error(`Failed to fetch controllers.json (${response.status})`);
        }
        const data = (await response.json()) as ControllerRecord[];
        if (cancelled) return;
        setRecords(data);
        setAvailableFilters(computeFilterOptions(data));
      } catch (err) {
        console.error("Failed to initialise search", err);
        if (!cancelled) {
          setError("Search is temporarily unavailable.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [normalizedBase]);

  React.useEffect(() => {
    if (typeof window === "undefined" || !initialised) return;
    const params = new URLSearchParams();
    if (searchQuery.trim().length > 0) {
      params.set("q", searchQuery);
    }
    if (filters.mcu) {
      const value = encodeMcuParam(filters.mcu);
      if (value) params.set("mcu", value);
    }
    if (filters.mounting) {
      params.set("mounting", filters.mounting);
    }
    if (filters.uarts) {
      params.set("uarts", filters.uarts);
    }
    if (filters.lifecycle) {
      params.set("lifecycle", filters.lifecycle);
    }
    if (filters.can) {
      params.set("can", "1");
    }
    if (filters.sd) {
      params.set("sd", "1");
    }
    if (filters.firmware.length > 0) {
      params.set("firmware", filters.firmware.join(","));
    }

    const queryString = params.toString();
    const nextUrl = queryString
      ? `${window.location.pathname}?${queryString}`
      : window.location.pathname;
    window.history.replaceState({}, "", nextUrl);
  }, [filters, searchQuery, initialised]);

  React.useEffect(() => {
    if (!initialised || isLoading) {
      return;
    }

    const run = async () => {
      if (!searchQuery.trim()) {
        const filtered = applyFacets(records, filters);
        const mapped = filtered
          .map((record) => convertRecord(record, normalizedBase))
          .sort((a, b) => a.title.localeCompare(b.title));
        setResults(mapped);
        setResultsCount(filtered.length);
        const filterSource = filtered.length > 0 ? filtered : records;
        setAvailableFilters(computeFilterOptions(filterSource));
        setError(null);
        return;
      }

      if (!pagefind) {
        return;
      }

      setIsSearching(true);
      try {
        const filterPayload: Record<string, string[]> = {};
        if (filters.mcu) filterPayload.mcu = [filters.mcu];
        if (filters.mounting) filterPayload.mounting = [filters.mounting];
        if (filters.uarts) filterPayload.uarts = [filters.uarts];
        if (filters.lifecycle) filterPayload.lifecycle = [filters.lifecycle];
        if (filters.can) filterPayload.can = ["1"];
        if (filters.sd) filterPayload.sd = ["1"];
        if (filters.firmware.length > 0) {
          filterPayload.firmware = filters.firmware;
        }

        const response = await pagefind.search(searchQuery.trim(), {
          filters: filterPayload,
        });
        const resolved = await Promise.all(
          (response?.results ?? []).map((result) => result.data())
        );
        const mapped = resolved.map((data) =>
          mapResultToController(data, normalizedBase)
        );
        setResults(mapped);
        const count =
          typeof response?.unfilteredResultCount === "number"
            ? response.unfilteredResultCount
            : mapped.length;
        setResultsCount(count);
        const matchedRecords = records.filter((record) =>
          mapped.some((result) => result.id === record.id)
        );
        const filterSource = matchedRecords.length > 0 ? matchedRecords : records;
        setAvailableFilters(computeFilterOptions(filterSource));
        setError(null);
      } catch (err) {
        console.error("Search failed", err);
        setError("Unable to run search right now.");
      } finally {
        setIsSearching(false);
      }
    };

    run();
  }, [filters, searchQuery, records, pagefind, normalizedBase, initialised, isLoading]);

  const clearFilters = React.useCallback(() => {
    setFilters(createInitialFilterState());
  }, []);

  const renderSummary = () => {
    if (error) {
      return <p className="text-sm text-destructive">{error}</p>;
    }
    if (isLoading) {
      return (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Initialising search index…
        </p>
      );
    }
    if (isSearching) {
      return (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Searching {resultsCount} controllers…
        </p>
      );
    }
    if (resultsCount === 0) {
      return (
        <p className="text-sm text-muted-foreground">
          No controllers matched your criteria.
        </p>
      );
    }
    return (
      <p className="text-sm text-muted-foreground">
        Showing {resultsCount} controller{resultsCount === 1 ? "" : "s"}
      </p>
    );
  };

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-xl font-semibold">Search &amp; Filters</CardTitle>
          {renderSummary()}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by title, brand, MCU, or keywords…"
              className="w-full rounded-lg border bg-background py-3 pl-10 pr-12 text-base shadow-xs focus:outline-hidden focus:ring-2 focus:ring-ring"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground" htmlFor="filter-mcu">
                MCU family
              </label>
              <select
                id="filter-mcu"
                value={filters.mcu ?? ''}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    mcu: event.target.value ? event.target.value : null,
                  }))
                }
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-ring"
              >
                <option value="">All MCU families</option>
                {availableFilters.mcu.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} ({option.count})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground" htmlFor="filter-mounting">
                Mounting
              </label>
              <select
                id="filter-mounting"
                value={filters.mounting ?? ''}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    mounting: event.target.value ? event.target.value : null,
                  }))
                }
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-ring"
              >
                <option value="">All mounting options</option>
                {availableFilters.mounting.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} ({option.count})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground" htmlFor="filter-uarts">
                UART capacity
              </label>
              <select
                id="filter-uarts"
                value={filters.uarts ?? ''}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    uarts: event.target.value ? event.target.value : null,
                  }))
                }
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-ring"
              >
                <option value="">All ranges</option>
                {availableFilters.uarts.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} ({option.count})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground" htmlFor="filter-lifecycle">
                Lifecycle
              </label>
              <select
                id="filter-lifecycle"
                value={filters.lifecycle ?? ''}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    lifecycle: event.target.value ? event.target.value : null,
                  }))
                }
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-ring"
              >
                <option value="">All lifecycle states</option>
                {availableFilters.lifecycle.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} ({option.count})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  can: !prev.can,
                }))
              }
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
                filters.can
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-background hover:bg-muted"
              )}
            >
              <Check className={cn("h-4 w-4", filters.can ? "opacity-100" : "opacity-40")} />
              CAN bus ({availableFilters.can.find((option) => option.value === '1')?.count ?? 0})
            </button>

            <button
              type="button"
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  sd: !prev.sd,
                }))
              }
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
                filters.sd
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-background hover:bg-muted"
              )}
            >
              <Check className={cn("h-4 w-4", filters.sd ? "opacity-100" : "opacity-40")} />
              MicroSD ({availableFilters.sd.find((option) => option.value === '1')?.count ?? 0})
            </button>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium text-muted-foreground">Firmware status</span>
            <div className="flex flex-wrap gap-2">
              {availableFilters.firmware.map((option) => {
                const isActive = filters.firmware.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setFilters((prev) => {
                        const exists = prev.firmware.includes(option.value);
                        const next = exists
                          ? prev.firmware.filter((value) => value !== option.value)
                          : [...prev.firmware, option.value];
                        return { ...prev, firmware: next };
                      })
                    }
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm uppercase transition-colors",
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : "bg-background hover:bg-muted"
                    )}
                  >
                    <span>{option.value}</span>
                    <Badge variant="secondary">{option.count}</Badge>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors hover:bg-muted"
            >
              <RotateCcw className="h-4 w-4" />
              Reset filters
            </button>

            <span className="text-xs text-muted-foreground">
              {totalControllers} controllers indexed
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {results.map((controller) => (
          <a
            key={controller.id}
            href={controller.url}
            className="group rounded-lg border bg-card p-4 shadow-xs transition-all hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold tracking-tight group-hover:text-primary">
                  {controller.title}
                </h3>
                <p className="text-sm text-muted-foreground">{controller.brandName}</p>
              </div>
              <Badge variant="outline">{controller.mcuFamily}</Badge>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
              {controller.mounting && (
                <Badge variant="secondary">{controller.mounting}</Badge>
              )}
              {typeof controller.uarts === "number" && (
                <Badge variant="secondary">{controller.uarts} UARTs</Badge>
              )}
              {typeof controller.can === "number" && (
                <Badge variant="secondary">{controller.can} CAN</Badge>
              )}
              {controller.sd && <Badge variant="secondary">MicroSD</Badge>}
            </div>
            {controller.summary && (
              <p className="mt-4 line-clamp-3 text-sm text-muted-foreground">
                {controller.summary}
              </p>
            )}
            {controller.firmwareStatuses.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                {controller.firmwareStatuses.map((status) => (
                  <Badge key={status} variant="outline">
                    {status}
                  </Badge>
                ))}
              </div>
            )}
          </a>
        ))}
      </div>

      {results.length === 0 && !isLoading && !error && (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Adjust your filters or enter a broader search term to see matching controllers.
        </div>
      )}

      <noscript>
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          JavaScript is required to use the interactive search. Enable it to browse the controller directory.
        </div>
      </noscript>
    </section>
  );
}
