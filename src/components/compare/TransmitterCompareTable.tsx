import * as React from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  COMPARE_EVENT_NAME,
  type CompareEventDetail,
  clearCompareList,
  getCompareStorageKey,
  readCompareList,
  writeCompareList,
} from "@/lib/compare";

interface ComplianceEntry {
  id: string;
  type: string;
  url?: string | null;
}

interface TransmitterCompareItem {
  id: string;
  slug: string;
  title: string;
  manufacturer: string;
  supportLevelLabel: string;
  supportStatusLabel: string;
  sinceVersion: string;
  lastVersion?: string | null;
  notes?: string | null;
  hardwareVariants: string[];
  compliance: ComplianceEntry[];
}

interface TransmitterCompareTableProps {
  items: TransmitterCompareItem[];
  basePath: string;
}

const type = "transmitter" as const;

export default function TransmitterCompareTable({
  items,
  basePath,
}: TransmitterCompareTableProps) {
  const [selectedIds, setSelectedIds] = React.useState<string[]>(() =>
    readCompareList(type),
  );

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const storageKey = getCompareStorageKey(type);

    const handleStorage = (event: StorageEvent) => {
      if (event.key === storageKey) {
        setSelectedIds(readCompareList(type));
      }
    };

    const handleCompareChange = (event: Event) => {
      const detail = (event as CustomEvent<CompareEventDetail>).detail;
      if (detail?.type === type) {
        setSelectedIds(detail.ids);
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(COMPARE_EVENT_NAME, handleCompareChange as EventListener);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(
        COMPARE_EVENT_NAME,
        handleCompareChange as EventListener,
      );
    };
  }, []);

  React.useEffect(() => {
    if (selectedIds.length === 0) {
      return;
    }

    const validIds = selectedIds.filter((id) =>
      items.some((item) => item.id === id),
    );

    if (validIds.length !== selectedIds.length) {
      setSelectedIds(validIds);
      writeCompareList(type, validIds);
    }
  }, [items, selectedIds]);

  const selectedItems = React.useMemo(
    () =>
      selectedIds
        .map((id) => items.find((item) => item.id === id))
        .filter((item): item is TransmitterCompareItem => Boolean(item)),
    [items, selectedIds],
  );

  const removeItem = React.useCallback(
    (id: string) => {
      const next = selectedIds.filter((value) => value !== id);
      setSelectedIds(next);
      writeCompareList(type, next);
    },
    [selectedIds],
  );

  const clearAll = React.useCallback(() => {
    clearCompareList(type);
    setSelectedIds([]);
  }, []);

  const rows: {
    id: string;
    label: string;
    render: (item: TransmitterCompareItem) => React.ReactNode;
  }[] = [
    {
      id: "manufacturer",
      label: "Manufacturer",
      render: (item) => item.manufacturer,
    },
    {
      id: "supportLevel",
      label: "Support level",
      render: (item) => item.supportLevelLabel,
    },
    {
      id: "supportStatus",
      label: "Support status",
      render: (item) => item.supportStatusLabel,
    },
    {
      id: "since",
      label: "Support since",
      render: (item) => item.sinceVersion,
    },
    {
      id: "last",
      label: "Last supported",
      render: (item) => item.lastVersion ?? "—",
    },
    {
      id: "notes",
      label: "Support notes",
      render: (item) => item.notes ?? "—",
    },
    {
      id: "variants",
      label: "Hardware variants",
      render: (item) =>
        item.hardwareVariants.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {item.hardwareVariants.map((variant) => (
              <Badge key={variant} variant="outline" className="border-border/60">
                {variant}
              </Badge>
            ))}
          </div>
        ) : (
          "—"
        ),
    },
    {
      id: "compliance",
      label: "Compliance IDs",
      render: (item) =>
        item.compliance.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {item.compliance.map((entry) => (
              entry.url ? (
                <a
                  key={entry.id}
                  href={entry.url}
                  className="inline-flex items-center rounded-full border border-border/60 bg-background px-2.5 py-0.5 text-xs font-medium text-primary transition-colors hover:text-primary/80"
                >
                  {entry.id}
                </a>
              ) : (
                <span
                  key={entry.id}
                  className="inline-flex items-center rounded-full border border-border/60 bg-background px-2.5 py-0.5 text-xs font-medium"
                >
                  {entry.id}
                </span>
              )
            ))}
          </div>
        ) : (
          "—"
        ),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Compare EdgeTX transmitters</h1>
          <p className="text-sm text-muted-foreground">
            Use the compare toggle on each transmitter page to track radios you want to evaluate side by side.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start rounded-full px-4"
          onClick={clearAll}
          disabled={selectedItems.length === 0}
        >
          Clear all
        </Button>
      </div>

      {selectedItems.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/70 bg-muted/30 p-8 text-center">
          <p className="text-base font-medium text-foreground">
            No transmitters selected yet.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Browse any transmitter page and enable compare to add it to this list.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {selectedItems.map((item) => (
              <span
                key={item.id}
                className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background px-3 py-1 text-sm shadow-xs"
              >
                <a
                  href={`${basePath}/transmitters/${item.slug}`}
                  className="font-medium text-primary transition-colors hover:text-primary/80"
                >
                  {item.title}
                </a>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs"
                  onClick={() => removeItem(item.id)}
                >
                  Remove
                </Button>
              </span>
            ))}
          </div>

          <div className="overflow-x-auto rounded-xl border border-border/60 bg-background shadow-sm">
            <table className="min-w-[640px] w-full divide-y divide-border/60 text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Attribute
                  </th>
                  {selectedItems.map((item) => (
                    <th key={item.id} className="px-4 py-3 text-left align-bottom">
                      <div className="flex flex-col gap-1">
                        <a
                          href={`${basePath}/transmitters/${item.slug}`}
                          className="text-sm font-semibold text-primary transition-colors hover:text-primary/80"
                        >
                          {item.title}
                        </a>
                        <span className="text-xs uppercase tracking-wide text-muted-foreground">
                          {item.manufacturer}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {rows.map((row) => (
                  <tr key={row.id} className="bg-background">
                    <th
                      scope="row"
                      className="bg-muted/20 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      {row.label}
                    </th>
                    {selectedItems.map((item) => (
                      <td key={`${row.id}-${item.id}`} className="px-4 py-3 align-top text-sm text-foreground">
                        {row.render(item)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
