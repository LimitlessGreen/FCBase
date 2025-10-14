import * as React from "react";
import { Search, Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

type PagefindModule = {
  init: (options?: { baseUrl?: string }) => Promise<void>;
  options?: (options: { baseUrl?: string }) => Promise<void> | void;
  search: (
    query: string,
    options?: { filters?: Record<string, string | string[]> }
  ) => Promise<{
    results: Array<{
      data: () => Promise<{
        url: string;
        excerpt?: string;
        content?: string;
        meta?: Record<string, unknown>;
        filters?: Record<string, string[]>;
      }>;
    }>;
  }>;
};

type GlobalResult = {
  id: string;
  title: string;
  summary: string;
  url: string;
  type: string;
  meta: Record<string, unknown>;
};

const BASE_PATH = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
const PAGEFIND_BUNDLE_URL = `${BASE_PATH}/pagefind/`;
const PAGEFIND_SCRIPT_URL = `${PAGEFIND_BUNDLE_URL}pagefind.js`;

const TYPE_LABELS: Record<string, string> = {
  controller: "Controllers",
  sensor: "Sensors",
  mcu: "MCUs",
  manufacturer: "Manufacturers",
  firmware: "Firmware",
  page: "Pages",
};

const typeLabel = (type: string) => TYPE_LABELS[type] ?? type.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const parseGlobalResult = (payload: {
  url: string;
  excerpt?: string;
  content?: string;
  meta?: Record<string, unknown>;
  filters?: Record<string, string[]>;
}): GlobalResult => {
  const meta = payload.meta ?? {};
  const url = typeof payload.url === "string" ? payload.url : "/";
  const id = String(meta.id ?? meta.slug ?? url);
  const title = typeof meta.title === "string"
    ? meta.title
    : typeof meta.name === "string"
      ? meta.name
      : id;
  const summarySource =
    typeof meta.summary === "string"
      ? meta.summary
      : payload.excerpt ?? payload.content ?? "";
  const summary = summarySource
    ? summarySource.replace(/\s+/g, " ").trim().slice(0, 280)
    : "Read the full entry for details.";
  const typeValue =
    (typeof meta.type === "string" && meta.type) ||
    payload.filters?.type?.[0] ||
    "page";

  return {
    id,
    title,
    summary,
    url,
    type: typeValue,
    meta,
  };
};

export function SiteSearch() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [resultsByType, setResultsByType] = React.useState<Record<string, GlobalResult[]>>({});
  const [activeType, setActiveType] = React.useState("controller");
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, setIsPending] = React.useState(false);
  const [isSearching, setIsSearching] = React.useState(false);
  const [pagefindStatus, setPagefindStatus] = React.useState<"loading" | "ready" | "error">("loading");

  const pagefindRef = React.useRef<PagefindModule | null>(null);
  const paramsReadyRef = React.useRef(false);

  const normalizedSearchTerm = searchTerm.trim();

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q") ?? "";
    const tab = params.get("type") ?? "controller";
    setSearchTerm(q);
    setActiveType(tab);
    paramsReadyRef.current = true;
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (!paramsReadyRef.current) return;
    const params = new URLSearchParams();
    if (normalizedSearchTerm) params.set("q", normalizedSearchTerm);
    if (activeType) params.set("type", activeType);
    const query = params.toString();
    const next = `${window.location.pathname}${query ? `?${query}` : ""}`;
    window.history.replaceState({}, "", next);
  }, [normalizedSearchTerm, activeType]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;

    const load = async () => {
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
      } catch (err) {
        console.error("Pagefind failed to load", err);
        if (!cancelled) {
          setPagefindStatus("error");
          setError(
            import.meta.env.DEV
              ? "Global search is only available after building the site."
              : "Search is temporarily unavailable."
          );
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (pagefindStatus !== "ready") return;
    if (!paramsReadyRef.current) return;
    const module = pagefindRef.current;
    if (!module) return;

    let cancelled = false;
    setIsPending(true);

    const timer = window.setTimeout(() => {
      const runSearch = async () => {
        setIsSearching(true);
        try {
          const response = await module.search(normalizedSearchTerm, {});
          if (cancelled) return;

          const loaded = await Promise.all(
            response.results.map(async (result) => {
              try {
                const data = await result.data();
                return parseGlobalResult(data);
              } catch (err) {
                console.error("Failed to parse global search result", err);
                return null;
              }
            })
          );
          if (cancelled) return;

          const grouped: Record<string, GlobalResult[]> = {};
          for (const record of loaded) {
            if (!record) continue;
            const bucket = record.type;
            grouped[bucket] = grouped[bucket] ?? [];
            grouped[bucket].push(record);
          }

          Object.keys(grouped).forEach((key) => {
            grouped[key] = grouped[key].slice(0, 12);
          });

          setResultsByType(grouped);
          setError(Object.values(grouped).some((items) => items.length > 0) ? null : "No matches yet.");
        } catch (err) {
          console.error("Global search failed", err);
          if (!cancelled) {
            setError("Search failed. Please try again.");
            setResultsByType({});
          }
        } finally {
          if (!cancelled) {
            setIsSearching(false);
            setIsPending(false);
          }
        }
      };

      runSearch();
    }, 340);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [normalizedSearchTerm, pagefindStatus]);

  const availableTypes = React.useMemo(() => {
    const types = Object.keys(resultsByType);
    return types.length ? types : [activeType];
  }, [resultsByType, activeType]);

  React.useEffect(() => {
    const types = Object.keys(resultsByType);
    if (types.length && !types.includes(activeType)) {
      setActiveType(types[0]);
    }
  }, [resultsByType, activeType]);

  const typeCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const [type, list] of Object.entries(resultsByType)) {
      counts[type] = list.length;
    }
    return counts;
  }, [resultsByType]);

  const isDisabled = pagefindStatus !== "ready";

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Search FCBase</CardTitle>
          <CardDescription>
            Search flight controllers, MCUs, sensors, manufacturers, and more using the static Pagefind index generated during
            build.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              disabled={isDisabled}
              placeholder="Search everything…"
              className={cn(
                "w-full rounded-lg border bg-background py-2.5 pl-10 pr-12 text-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
                {
                  "opacity-70": isPending,
                }
              )}
            />
            {(isSearching || isPending) && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>
        </CardContent>
      </Card>

      {pagefindStatus === "error" ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            {error ?? "Search is unavailable in this environment."}
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeType} onValueChange={setActiveType} defaultValue={activeType} className="space-y-4">
          <TabsList className="flex w-full flex-wrap gap-2 bg-muted/40 p-2">
            {availableTypes.map((type) => (
              <TabsTrigger key={type} value={type} className="flex items-center gap-2 text-xs">
                {typeLabel(type)}
                <Badge variant="outline" className="text-[10px]">
                  {typeCounts[type] ?? 0}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {availableTypes.map((type) => {
            const list = resultsByType[type] ?? [];
            return (
              <TabsContent key={type} value={type} className="space-y-4">
                {list.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="py-10 text-center text-sm text-muted-foreground">
                      {error ?? "No results for this category."}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {list.map((item) => {
                      const href = `${BASE_PATH}${item.url}`;
                      return (
                        <a key={`${type}-${item.id}`} href={href} className="group block focus-visible:outline-hidden">
                          <Card className="h-full transition group-hover:-translate-y-1 group-hover:shadow-md">
                            <CardHeader className="space-y-1">
                              <CardTitle className="text-lg font-semibold text-foreground group-hover:text-primary">
                                {item.title}
                              </CardTitle>
                              <CardDescription className="text-xs uppercase tracking-wide text-muted-foreground">
                                {typeLabel(type)}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-muted-foreground line-clamp-4">{item.summary}</p>
                            </CardContent>
                          </Card>
                        </a>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      )}
    </section>
  );
}

export default SiteSearch;
