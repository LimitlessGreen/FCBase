import * as React from "react";
import {
  Search,
  Loader2,
  SlidersHorizontal,
  RefreshCcw,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type PagefindModule = {
  init: (options?: { baseUrl?: string }) => Promise<void>;
  options?: (options: { baseUrl?: string }) => Promise<void> | void;
  search: (
    query: string,
    options?: {
      filters?: Record<string, string | string[]>;
    }
  ) => Promise<{
    results: Array<{
      data: () => Promise<{
        url: string;
        excerpt?: string;
        meta?: Record<string, unknown>;
        filters?: Record<string, string[]>;
      }>;
    }>;
  }>;
  filters: () => Promise<Record<string, Record<string, number>>>;
};

type FilterState = {
  mcu: string | null;
  mounting: string | null;
  lifecycle: string | null;
  can: boolean;
  sd: boolean;
};

type ControllerResult = {
  cacheKey: string;
  id: string;
  title: string;
  manufacturer?: string;
  mcu?: string;
  mcuFamily?: string;
  mounting?: string;
  uarts?: number | null;
  canCount?: number | null;
  hasCan: boolean;
  hasSd: boolean;
  lifecycle?: string | null;
  firmwareStatuses: string[];
  summary?: string;
  image?: string | null;
  url: string;
};

type FacetOption = {
  label: string;
  value: string;
  count: number;
};

interface ControllerSearchProps {
  totalControllers: number;
}

const PAGE_SIZE = 24;
const BASE_PATH = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
const PAGEFIND_BUNDLE_URL = `${BASE_PATH}/pagefind/`;
const PAGEFIND_SCRIPT_URL = `${PAGEFIND_BUNDLE_URL}pagefind.js`;

const DEFAULT_FILTERS: FilterState = {
  mcu: null,
  mounting: null,
  lifecycle: null,
  can: false,
  sd: false,
};

const lifecycleLabel = (value?: string | null) => {
  if (!value) return "Unknown";
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
};

const parseNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const parseBoolean = (value: unknown): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return value === "1" || value.toLowerCase() === "true" || value.toLowerCase() === "yes";
  }
  return false;
};

const buildPortSummary = (result: ControllerResult) => {
  const parts: string[] = [];
  if (typeof result.uarts === "number") {
    parts.push(`${result.uarts} UART${result.uarts === 1 ? "" : "s"}`);
  }
  if (typeof result.canCount === "number" && result.canCount > 0) {
    parts.push(`${result.canCount} CAN`);
  } else if (result.hasCan) {
    parts.push("CAN ready");
  }
  if (result.hasSd) {
    parts.push("MicroSD");
  }
  return parts.length ? parts.join(" • ") : "Key specs coming soon";
};

const formatMounting = (value?: string | null) => {
  if (!value) return "Custom";
  if (value === "cube" || value === "wing") {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
  return value.replace(/x/gi, "×") + " mm";
};

const formatMcu = (value?: string | null) => {
  if (!value) return "Unknown MCU";
  return value.toUpperCase();
};

const parseControllerMeta = (payload: {
  url: string;
  meta?: Record<string, unknown>;
  filters?: Record<string, string[]>;
}): ControllerResult | null => {
  const meta = payload.meta ?? {};
  const url = typeof payload.url === "string" ? payload.url : "/controllers";

  const id = String(meta.id ?? meta.slug ?? url.replace(/\/?index\.html$/i, "").split("/").filter(Boolean).pop() ?? url);
  const title = typeof meta.title === "string" ? meta.title : id;
  const manufacturer = typeof meta.brand_name === "string"
    ? meta.brand_name
    : typeof meta.manufacturer === "string"
      ? meta.manufacturer
      : undefined;
  const mcu = typeof meta.mcu === "string" ? meta.mcu : undefined;
  const mcuFamily = typeof meta.mcu_family === "string" ? meta.mcu_family : undefined;
  const mounting = typeof meta.mounting === "string" ? meta.mounting : undefined;
  const uarts = parseNumber(meta.io_uarts ?? meta.uarts);
  const canCount = parseNumber(meta.io_can ?? meta.can);
  const hasCan = parseBoolean(meta.has_can ?? meta.io_can ?? payload.filters?.has_can?.[0]);
  const hasSd = parseBoolean(meta.has_sd ?? meta.io_sd_card ?? payload.filters?.has_sd?.[0]);
  const lifecycle = typeof meta.lifecycle === "string" ? meta.lifecycle : undefined;
  const summary = typeof meta.summary === "string" ? meta.summary : undefined;
  const image = typeof meta.image === "string" ? meta.image : null;
  const firmwareStatusesRaw = meta.firmware_status ?? payload.filters?.firmware_status ?? [];
  const firmwareStatuses = Array.isArray(firmwareStatusesRaw)
    ? firmwareStatusesRaw.map(String)
    : typeof firmwareStatusesRaw === "string"
      ? [firmwareStatusesRaw]
      : [];

  return {
    cacheKey: `${id}:${url}`,
    id,
    title,
    manufacturer,
    mcu,
    mcuFamily,
    mounting,
    uarts,
    canCount,
    hasCan,
    hasSd,
    lifecycle,
    firmwareStatuses,
    summary,
    image,
    url,
  };
};

const mapFacetOptions = (entries?: Record<string, number>, formatter?: (value: string) => string): FacetOption[] => {
  if (!entries) return [];
  return Object.entries(entries)
    .map(([value, count]) => ({
      value,
      count: Number(count) || 0,
      label: formatter ? formatter(value) : value,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
};

export function ControllerSearch({ totalControllers }: ControllerSearchProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filters, setFilters] = React.useState<FilterState>(DEFAULT_FILTERS);
  const [page, setPage] = React.useState(1);
  const [totalMatches, setTotalMatches] = React.useState(totalControllers);
  const [error, setError] = React.useState<string | null>(null);
  const [pagefindStatus, setPagefindStatus] = React.useState<"loading" | "ready" | "error">("loading");
  const [isPending, setIsPending] = React.useState(false);
  const [isSearching, setIsSearching] = React.useState(false);
  const [facetOptions, setFacetOptions] = React.useState<{
    mcu: FacetOption[];
    mounting: FacetOption[];
    lifecycle: FacetOption[];
  }>({
    mcu: [],
    mounting: [],
    lifecycle: [],
  });

  const pagefindRef = React.useRef<PagefindModule | null>(null);
  const resultCacheRef = React.useRef<Map<string, ControllerResult>>(new Map());
  const [resultOrder, setResultOrder] = React.useState<string[]>([]);
  const paramsReadyRef = React.useRef(false);
  const initialSearchRef = React.useRef(true);

  const normalizedSearchTerm = searchTerm.trim();
  const filtersKey = React.useMemo(() => JSON.stringify(filters), [filters]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q") ?? "";
    const mcu = params.get("mcu");
    const mounting = params.get("mounting");
    const lifecycle = params.get("lifecycle");
    const can = params.get("can");
    const sd = params.get("sd");
    const pageParam = params.get("page");

    setSearchTerm(q);
    setFilters({
      mcu: mcu || null,
      mounting: mounting || null,
      lifecycle: lifecycle || null,
      can: can === "1" || can === "true",
      sd: sd === "1" || sd === "true",
    });

    if (pageParam) {
      const parsed = Number.parseInt(pageParam, 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        setPage(parsed);
      }
    }

    paramsReadyRef.current = true;
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (!paramsReadyRef.current) return;

    const params = new URLSearchParams();
    if (normalizedSearchTerm) params.set("q", normalizedSearchTerm);
    if (filters.mcu) params.set("mcu", filters.mcu);
    if (filters.mounting) params.set("mounting", filters.mounting);
    if (filters.lifecycle) params.set("lifecycle", filters.lifecycle);
    if (filters.can) params.set("can", "1");
    if (filters.sd) params.set("sd", "1");
    if (page > 1) params.set("page", String(page));

    const query = params.toString();
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}`;
    window.history.replaceState({}, "", nextUrl);
  }, [normalizedSearchTerm, filters, page]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;

    const loadPagefind = async () => {
      try {
        const module = (await import(/* @vite-ignore */ PAGEFIND_SCRIPT_URL)) as PagefindModule;
        if (cancelled) return;

        if (typeof module.options === "function") {
          await module.options({ baseUrl: PAGEFIND_BUNDLE_URL });
        }
        await module.init({ baseUrl: PAGEFIND_BUNDLE_URL });
        if (cancelled) return;

        pagefindRef.current = module;
        setPagefindStatus("ready");
        setError(null);

        const filterData = await module.filters();
        if (!cancelled) {
          setFacetOptions({
            mcu: mapFacetOptions(filterData.mcu_family, (value) => value.toUpperCase()),
            mounting: mapFacetOptions(filterData.mounting, formatMounting),
            lifecycle: mapFacetOptions(filterData.lifecycle, lifecycleLabel),
          });
        }
      } catch (err) {
        console.error("Failed to initialise Pagefind", err);
        if (!cancelled) {
          setPagefindStatus("error");
          setError(
            import.meta.env.DEV
              ? "Search is disabled in dev mode. Run `npm run build` to generate the index."
              : "Search is temporarily unavailable."
          );
        }
      }
    };

    loadPagefind();

    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (pagefindStatus !== "ready") return;
    const module = pagefindRef.current;
    if (!module) return;
    if (!paramsReadyRef.current) return;

    let cancelled = false;
    setIsPending(true);

    const timeout = window.setTimeout(() => {
      const performSearch = async () => {
        setIsSearching(true);
        try {
          const filterPayload: Record<string, string | string[]> = { type: "controller" };
          if (filters.mcu) filterPayload.mcu_family = filters.mcu;
          if (filters.mounting) filterPayload.mounting = filters.mounting;
          if (filters.lifecycle) filterPayload.lifecycle = filters.lifecycle;
          if (filters.can) filterPayload.has_can = "true";
          if (filters.sd) filterPayload.has_sd = "true";

          const response = await module.search(normalizedSearchTerm, {
            filters: filterPayload,
          });
          if (cancelled) return;

          const records = await Promise.all(
            response.results.map(async (result) => {
              try {
                const data = await result.data();
                return parseControllerMeta(data);
              } catch (err) {
                console.error("Failed to load search result", err);
                return null;
              }
            })
          );
          if (cancelled) return;

          const validRecords = records.filter((record): record is ControllerResult => Boolean(record));
          const cache = new Map<string, ControllerResult>();
          const order: string[] = [];
          for (const record of validRecords) {
            cache.set(record.cacheKey, record);
            order.push(record.cacheKey);
          }

          resultCacheRef.current = cache;
          setResultOrder(order);
          setTotalMatches(validRecords.length);
          setError(validRecords.length === 0 ? "No controllers match your query." : null);

          if (initialSearchRef.current) {
            initialSearchRef.current = false;
            if (page > 1) {
              const maxPage = Math.max(1, Math.ceil(validRecords.length / PAGE_SIZE));
              if (page > maxPage) {
                setPage(maxPage);
              }
            }
          } else {
            setPage(1);
          }
        } catch (err) {
          console.error("Search error", err);
          if (!cancelled) {
            setError("Search failed. Please try again.");
            resultCacheRef.current = new Map();
            setResultOrder([]);
            setTotalMatches(0);
            setPage(1);
          }
        } finally {
          if (!cancelled) {
            setIsSearching(false);
            setIsPending(false);
          }
        }
      };

      performSearch();
    }, 360);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [normalizedSearchTerm, filtersKey, pagefindStatus]);

  React.useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(resultOrder.length / PAGE_SIZE));
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [resultOrder, page]);

  const paginatedResults = React.useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const slice = resultOrder.slice(start, end);
    const items: ControllerResult[] = [];
    for (const key of slice) {
      const record = resultCacheRef.current.get(key);
      if (record) {
        items.push(record);
      }
    }
    return items;
  }, [page, resultOrder]);

  const totalPages = Math.max(1, Math.ceil(resultOrder.length / PAGE_SIZE));
  const showFallback = pagefindStatus === "error";

  const hasActiveFilters =
    Boolean(filters.mcu) ||
    Boolean(filters.mounting) ||
    Boolean(filters.lifecycle) ||
    filters.can ||
    filters.sd ||
    Boolean(normalizedSearchTerm);

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSearchTerm("");
    setPage(1);
  };

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader className="gap-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            Refine controllers
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Search across {totalControllers} documented boards with Pagefind-powered facets. Filters pause while results update
            to keep everything smooth.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              inputMode="search"
              autoComplete="off"
              placeholder="Search by name, MCU, firmware…"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              disabled={isPending || pagefindStatus !== "ready"}
              className={cn(
                "w-full rounded-lg border bg-background py-2.5 pl-10 pr-12 text-sm transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
                {
                  "opacity-70": isPending,
                }
              )}
            />
            {(isSearching || isPending) && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
            {searchTerm && !isSearching && !isPending && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <label className="flex flex-col gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">MCU family</span>
              <select
                value={filters.mcu ?? ""}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    mcu: event.target.value ? event.target.value : null,
                  }))
                }
                disabled={isPending || pagefindStatus !== "ready"}
                className="h-10 rounded-lg border bg-background px-3 text-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">All MCUs</option>
                {facetOptions.mcu.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} ({option.count})
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Mounting</span>
              <select
                value={filters.mounting ?? ""}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    mounting: event.target.value ? event.target.value : null,
                  }))
                }
                disabled={isPending || pagefindStatus !== "ready"}
                className="h-10 rounded-lg border bg-background px-3 text-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">All mounting patterns</option>
                {facetOptions.mounting.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} ({option.count})
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Lifecycle</span>
              <select
                value={filters.lifecycle ?? ""}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    lifecycle: event.target.value ? event.target.value : null,
                  }))
                }
                disabled={isPending || pagefindStatus !== "ready"}
                className="h-10 rounded-lg border bg-background px-3 text-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">All lifecycles</option>
                {facetOptions.lifecycle.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} ({option.count})
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">CAN bus</span>
              <button
                type="button"
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    can: !prev.can,
                  }))
                }
                disabled={isPending || pagefindStatus !== "ready"}
                className={cn(
                  "flex h-10 items-center justify-between rounded-lg border px-3 text-sm transition",
                  filters.can
                    ? "border-primary bg-primary/10 text-primary"
                    : "bg-background text-muted-foreground"
                )}
                aria-pressed={filters.can}
              >
                <span>{filters.can ? "Requires CAN" : "Any CAN support"}</span>
                <span className="text-xs uppercase tracking-wide">
                  {filters.can ? "On" : "Off"}
                </span>
              </button>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">MicroSD</span>
              <button
                type="button"
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    sd: !prev.sd,
                  }))
                }
                disabled={isPending || pagefindStatus !== "ready"}
                className={cn(
                  "flex h-10 items-center justify-between rounded-lg border px-3 text-sm transition",
                  filters.sd
                    ? "border-primary bg-primary/10 text-primary"
                    : "bg-background text-muted-foreground"
                )}
                aria-pressed={filters.sd}
              >
                <span>{filters.sd ? "Requires MicroSD" : "Any MicroSD"}</span>
                <span className="text-xs uppercase tracking-wide">
                  {filters.sd ? "On" : "Off"}
                </span>
              </button>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetFilters}
              disabled={!hasActiveFilters || isPending || pagefindStatus !== "ready"}
            >
              <RefreshCcw className="h-4 w-4" />
              Reset filters
            </Button>

            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2">
                {normalizedSearchTerm && (
                  <Badge variant="secondary" className="gap-1">
                    Query: “{normalizedSearchTerm}”
                  </Badge>
                )}
                {filters.mcu && (
                  <Badge variant="outline" className="gap-1">
                    MCU: {filters.mcu.toUpperCase()}
                  </Badge>
                )}
                {filters.mounting && (
                  <Badge variant="outline" className="gap-1">
                    Mounting: {formatMounting(filters.mounting)}
                  </Badge>
                )}
                {filters.lifecycle && (
                  <Badge variant="outline" className="gap-1">
                    Lifecycle: {lifecycleLabel(filters.lifecycle)}
                  </Badge>
                )}
                {filters.can && <Badge variant="outline">CAN required</Badge>}
                {filters.sd && <Badge variant="outline">MicroSD required</Badge>}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {showFallback ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-lg">Search unavailable</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              The interactive filters rely on the Pagefind bundle generated during the production build. Run the build locally or
              visit the deployed site to use the full experience.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{paginatedResults.length}</span> of
              <span className="font-semibold text-foreground"> {totalMatches}</span> matching controllers.
            </p>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Page {page} of {totalPages}
            </p>
          </div>

          {error && !paginatedResults.length ? (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center">
                <p className="text-base font-medium text-foreground">{error}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try relaxing filters or clearing the query to browse the full catalogue.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {paginatedResults.map((result) => {
                const href = `${BASE_PATH}${result.url}`;
                return (
                  <a key={result.cacheKey} href={href} className="group block h-full focus-visible:outline-hidden">
                    <Card className="h-full overflow-hidden transition will-change-transform group-hover:-translate-y-1 group-hover:shadow-lg">
                      <div className="relative aspect-video bg-gradient-to-br from-muted/60 via-background to-muted/40">
                        {result.image ? (
                          <img
                            src={result.image}
                            alt={`${result.title} preview`}
                            loading="lazy"
                            decoding="async"
                            width={480}
                            height={270}
                            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs font-medium text-muted-foreground">
                            {result.title}
                          </div>
                        )}
                        <div className="absolute inset-x-3 bottom-3 rounded-md bg-background/90 px-3 py-2 shadow-sm">
                          <p className="text-sm font-semibold text-foreground line-clamp-2">{result.title}</p>
                          {result.manufacturer && (
                            <p className="text-xs text-muted-foreground">{result.manufacturer}</p>
                          )}
                        </div>
                      </div>
                      <CardContent className="space-y-3 py-4">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          {result.mcu && <Badge variant="outline" className="uppercase">{formatMcu(result.mcu)}</Badge>}
                          {result.mounting && (
                            <Badge variant="secondary" className="uppercase">
                              {formatMounting(result.mounting)}
                            </Badge>
                          )}
                          {result.lifecycle && (
                            <Badge variant="outline">{lifecycleLabel(result.lifecycle)}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {result.summary ?? buildPortSummary(result)}
                        </p>
                        {result.firmwareStatuses.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {result.firmwareStatuses.map((status) => (
                              <Badge key={status} variant="outline" className="text-[10px] uppercase tracking-wide">
                                {status}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </a>
                );
              })}
            </div>
          )}

          {resultOrder.length > PAGE_SIZE && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1 || isPending || isSearching}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="rounded-md border bg-muted/40 px-3 py-1 text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page === totalPages || isPending || isSearching}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default ControllerSearch;
