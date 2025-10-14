/**
 * ControllerGrid - Client-side search and filter controller for server-rendered cards
 * 
 * This component provides search and filtering functionality for controller cards
 * that are pre-rendered on the server using ControllerCard.astro.
 * 
 * It uses Pagefind for search and CSS classes to show/hide cards based on filters.
 */

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
      data: () => Promise<{ meta: ControllerRecord }>;
    }>;
  }>;
  filters: () => Promise<Record<string, Record<string, number>>>;
};

const normalizeBasePath = (basePath?: string) => {
  if (!basePath || basePath === "/") {
    return "";
  }
  return basePath.endsWith("/") ? basePath.slice(0, -1) : basePath;
};

const resolveWithBase = (path: string) => {
  const normalizedBase = normalizeBasePath(import.meta.env.BASE_URL ?? "/");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (!normalizedBase) {
    return normalizedPath;
  }
  return `${normalizedBase}${normalizedPath}`;
};

const PAGEFIND_SCRIPT_URL = resolveWithBase("pagefind/pagefind.js");
const PAGEFIND_BASE_URL = `${resolveWithBase("pagefind/")}`;

interface ControllerGridProps {
  totalControllers: number;
}

interface ControllerRecord {
  id: string;
  slug: string;
  title: string;
  brand: string;
  brand_name: string;
  mcu_family: string;
  mounting: string;
  uarts: number | null;
  can: number;
  sd: boolean;
  firmware_statuses: string[];
  lifecycle: string;
  url: string;
  filters: Record<string, string[]>;
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

export function ControllerGrid({ totalControllers }: ControllerGridProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = React.useState("");
  const [filters, setFilters] = React.useState<FilterState>({
    mcu: null,
    mounting: null,
    uarts: null,
    firmware: [],
    lifecycle: null,
    can: false,
    sd: false,
  });
  const [results, setResults] = React.useState<ControllerRecord[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [pagefind, setPagefind] = React.useState<PagefindModule | null>(null);
  const [visibleIds, setVisibleIds] = React.useState<Set<string>>(new Set());
  const [filtersStatus, setFiltersStatus] = React.useState<"ready" | "dev" | "unavailable">("ready");

  // Debounce search term
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Initialize Pagefind
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const revealAllCards = () => {
      if (cancelled) return;
      const allCards = document.querySelectorAll<HTMLElement>("[data-controller-id]");
      const allIds = new Set<string>();
      allCards.forEach((card) => {
        card.classList.remove("hidden");
        const id = card.getAttribute("data-controller-id");
        if (id) {
          allIds.add(id);
        }
      });
      setVisibleIds(allIds);
    };

    const handleUnavailable = (status: "dev" | "unavailable", message: string) => {
      if (cancelled) return;
      revealAllCards();
      setError(message);
      setFiltersStatus(status);
      setIsLoading(false);
    };

    const loadPagefind = async () => {
      try {
        const response = await fetch(PAGEFIND_SCRIPT_URL, { method: "HEAD" });
        if (!response.ok) {
          throw new Error(`Pagefind script not found (status ${response.status})`);
        }

        const pfModule = (await import(/* @vite-ignore */ PAGEFIND_SCRIPT_URL)) as PagefindModule;
        if (cancelled) return;

        if (typeof pfModule.options === "function") {
          await pfModule.options({ baseUrl: PAGEFIND_BASE_URL });
        }

        await pfModule.init({ baseUrl: PAGEFIND_BASE_URL });
        if (cancelled) return;

        setPagefind(pfModule);
        setFiltersStatus("ready");
        setError(null);
      } catch (err) {
        console.error("Failed to load Pagefind", err);
        const isDev = import.meta.env.DEV;
        const message = isDev
          ? "🔧 Dev Mode: Search & filters available after build. Showing all controllers."
          : "Search is temporarily unavailable. Showing all controllers.";
        handleUnavailable(isDev ? "dev" : "unavailable", message);
      }
    };

    loadPagefind();

    return () => {
      cancelled = true;
    };
  }, []);

  // Load initial results and perform search
  React.useEffect(() => {
    async function performSearch() {
      if (!pagefind) {
        setIsLoading(filtersStatus === "ready");
        return;
      }

      setIsLoading(true);

      try {
        // Build filter object
        const filterObj: Record<string, string | string[]> = {};
        if (filters.mcu) filterObj.mcu = filters.mcu;
        if (filters.mounting) filterObj.mounting = filters.mounting;
        if (filters.uarts) filterObj.uarts = filters.uarts;
        if (filters.lifecycle) filterObj.lifecycle = filters.lifecycle;
        if (filters.can) filterObj.can = "1";
        if (filters.sd) filterObj.sd = "1";
        if (filters.firmware.length > 0) {
          filterObj.firmware = filters.firmware;
        }

        // Perform search
        const searchResults = await pagefind.search(debouncedSearchTerm, {
          filters: filterObj,
        });

        // Load full data for results
        const loadedResults = await Promise.all(
          searchResults.results.map(async (result) => {
            const data = await result.data();
            return data.meta as ControllerRecord;
          })
        );

        setResults(loadedResults);
        setVisibleIds(new Set(loadedResults.map((record) => record.id)));
        setError(null);
      } catch (err) {
        console.error("Search error:", err);
        setError("Search failed");
        setResults([]);
        setVisibleIds(new Set());
      } finally {
        setIsLoading(false);
      }
    }

    performSearch();
  }, [pagefind, debouncedSearchTerm, filters, filtersStatus]);

  // Get filter options from Pagefind
  const [filterOptions, setFilterOptions] = React.useState<{
    mcu: Array<{ value: string; count: number }>;
    mounting: Array<{ value: string; count: number }>;
    uarts: Array<{ value: string; count: number }>;
    firmware: Array<{ value: string; count: number }>;
    lifecycle: Array<{ value: string; count: number }>;
  }>({
    mcu: [],
    mounting: [],
    uarts: [],
    firmware: [],
    lifecycle: [],
  });

  React.useEffect(() => {
    async function loadFilterOptions() {
      if (!pagefind) return;

      try {
        const filterData = await pagefind.filters();

        setFilterOptions({
          mcu: Object.entries(filterData.mcu || {})
            .map(([value, count]) => ({ value, count: count as number }))
            .sort((a, b) => a.value.localeCompare(b.value)),
          mounting: Object.entries(filterData.mounting || {})
            .map(([value, count]) => ({ value, count: count as number }))
            .sort((a, b) => a.value.localeCompare(b.value)),
          uarts: Object.entries(filterData.uarts || {})
            .map(([value, count]) => ({ value, count: count as number }))
            .sort((a, b) => a.value.localeCompare(b.value)),
          firmware: Object.entries(filterData.firmware || {})
            .map(([value, count]) => ({ value, count: count as number }))
            .sort((a, b) => a.value.localeCompare(b.value)),
          lifecycle: Object.entries(filterData.lifecycle || {})
            .map(([value, count]) => ({ value, count: count as number }))
            .sort((a, b) => a.value.localeCompare(b.value)),
        });
      } catch (err) {
        console.error("Failed to load filter options:", err);
      }
    }

    loadFilterOptions();
  }, [pagefind]);

  const clearFilters = () => {
    setSearchTerm("");
    setFilters({
      mcu: null,
      mounting: null,
      uarts: null,
      firmware: [],
      lifecycle: null,
      can: false,
      sd: false,
    });
  };

  const toggleFirmwareFilter = (firmware: string) => {
    setFilters((prev) => ({
      ...prev,
      firmware: prev.firmware.includes(firmware)
        ? prev.firmware.filter((f) => f !== firmware)
        : [...prev.firmware, firmware],
    }));
  };

  // Apply visibility to cards via CSS
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const cards = document.querySelectorAll("[data-controller-id]");
    cards.forEach((card) => {
      const id = card.getAttribute("data-controller-id");
      if (id && visibleIds.has(id)) {
        card.classList.remove("hidden");
      } else {
        card.classList.add("hidden");
      }
    });
  }, [visibleIds]);

  const displayedResultsCount = filtersStatus === "ready" ? results.length : totalControllers;

  return (
    <section className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search controllers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border bg-background pl-9 pr-9 py-2 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Filters
            {filtersStatus === "dev" && " (Disabled in dev mode)"}
            {filtersStatus === "unavailable" && " (Temporarily unavailable)"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {filtersStatus !== "ready" ? (
            <div className="text-sm text-muted-foreground">
              {filtersStatus === "dev"
                ? (
                    <>
                      Filters are disabled in development mode. Run <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">pnpm run build && pnpm run preview</code> to test search functionality.
                    </>
                  )
                : (
                    <>Search and filters are temporarily unavailable. We are showing every controller while the index is restored.</>
                  )}
            </div>
          ) : (
            <>
          {/* MCU Family Filter */}
          <div>
            <label className="mb-2 block text-sm font-medium">MCU Family</label>
            <div className="flex flex-wrap gap-2">
              {filterOptions.mcu.map((option) => {
                const isActive = filters.mcu === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        mcu: isActive ? null : option.value,
                      }))
                    }
                    className={cn(
                      "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors",
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    {isActive && <Check className="h-3 w-3" />}
                    {option.value}
                    <Badge variant="secondary">{option.count}</Badge>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mounting Filter */}
          <div>
            <label className="mb-2 block text-sm font-medium">Mounting</label>
            <div className="flex flex-wrap gap-2">
              {filterOptions.mounting.map((option) => {
                const isActive = filters.mounting === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        mounting: isActive ? null : option.value,
                      }))
                    }
                    className={cn(
                      "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors",
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    {isActive && <Check className="h-3 w-3" />}
                    {option.value}
                    <Badge variant="secondary">{option.count}</Badge>
                  </button>
                );
              })}
            </div>
          </div>

          {/* UART Count Filter */}
          <div>
            <label className="mb-2 block text-sm font-medium">UART Count</label>
            <div className="flex flex-wrap gap-2">
              {filterOptions.uarts.map((option) => {
                const isActive = filters.uarts === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        uarts: isActive ? null : option.value,
                      }))
                    }
                    className={cn(
                      "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors",
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    {isActive && <Check className="h-3 w-3" />}
                    {option.value}
                    <Badge variant="secondary">{option.count}</Badge>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Firmware Filter (Multi-select) */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Firmware Support
            </label>
            <div className="flex flex-wrap gap-2">
              {filterOptions.firmware.map((option) => {
                const isActive = filters.firmware.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleFirmwareFilter(option.value)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors",
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    {isActive && <Check className="h-3 w-3" />}
                    {option.value}
                    <Badge variant="secondary">{option.count}</Badge>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lifecycle Filter */}
          <div>
            <label className="mb-2 block text-sm font-medium">Lifecycle</label>
            <div className="flex flex-wrap gap-2">
              {filterOptions.lifecycle.map((option) => {
                const isActive = filters.lifecycle === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        lifecycle: isActive ? null : option.value,
                      }))
                    }
                    className={cn(
                      "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors",
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    {isActive && <Check className="h-3 w-3" />}
                    {option.value}
                    <Badge variant="secondary">{option.count}</Badge>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Boolean Filters */}
          <div>
            <label className="mb-2 block text-sm font-medium">Features</label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  setFilters((prev) => ({ ...prev, can: !prev.can }))
                }
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors",
                  filters.can
                    ? "border-primary bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                {filters.can && <Check className="h-3 w-3" />}
                CAN Bus
              </button>
              <button
                type="button"
                onClick={() =>
                  setFilters((prev) => ({ ...prev, sd: !prev.sd }))
                }
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors",
                  filters.sd
                    ? "border-primary bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                {filters.sd && <Check className="h-3 w-3" />}
                SD Card
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={clearFilters}
              disabled={filtersStatus !== "ready"}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors",
                filtersStatus !== "ready" ? "cursor-not-allowed opacity-60" : "hover:bg-muted"
              )}
            >
              <RotateCcw className="h-4 w-4" />
              Reset filters
            </button>

            <span className="text-xs text-muted-foreground">
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Searching...
                </span>
              ) : (
                `${displayedResultsCount} / ${totalControllers} controllers`
              )}
            </span>
          </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Status Messages */}
      {error && (
        <div className="rounded-lg border border-muted bg-muted/30 p-4 text-sm text-muted-foreground">
          ℹ️ {error}
        </div>
      )}

      {results.length === 0 && !isLoading && !error && (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          No controllers match your search criteria. Try adjusting your filters or search term.
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
