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

interface ControllerCompareItem {
  id: string;
  slug: string;
  title: string;
  manufacturer: string;
  image?: {
    url: string;
    alt?: string | null;
    width?: number | null;
    height?: number | null;
  } | null;
  mounting?: string | null;
  mcu?: string | null;
  uarts?: number | null;
  can?: number | null;
  pwm?: number | null;
  ethernet?: boolean | null;
  sdCard?: boolean | null;
  firmwares: string[];
}

interface ControllerCompareTableProps {
  items: ControllerCompareItem[];
  basePath: string;
}

const type = "controller" as const;

const formatMounting = (value?: string | null) => {
  if (!value) {
    return "—";
  }

  if (value === "cube" || value === "wing" || value === "custom") {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  return `${value.replace(/x/gi, "×")}mm`;
};

const formatBoolean = (value?: boolean | null) => {
  if (value === undefined || value === null) {
    return "—";
  }

  return value ? "Yes" : "No";
};

const formatNumber = (value?: number | null) => {
  if (value === undefined || value === null) {
    return "—";
  }

  return value.toString();
};

const toFirmwareLabel = (value: string) => value.toUpperCase();

export default function ControllerCompareTable({
  items,
  basePath,
}: ControllerCompareTableProps) {
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
        .filter((item): item is ControllerCompareItem => Boolean(item)),
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
    render: (item: ControllerCompareItem) => React.ReactNode;
  }[] = [
    {
      id: "manufacturer",
      label: "Manufacturer",
      render: (item) => item.manufacturer,
    },
    {
      id: "mcu",
      label: "MCU",
      render: (item) => item.mcu?.toUpperCase() ?? "—",
    },
    {
      id: "mounting",
      label: "Mounting",
      render: (item) => formatMounting(item.mounting),
    },
    {
      id: "firmware",
      label: "Firmware support",
      render: (item) =>
        item.firmwares.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {item.firmwares.map((firmware) => (
              <Badge key={firmware} variant="outline" className="border-border/60">
                {toFirmwareLabel(firmware)}
              </Badge>
            ))}
          </div>
        ) : (
          "—"
        ),
    },
    {
      id: "uarts",
      label: "UART ports",
      render: (item) => formatNumber(item.uarts),
    },
    {
      id: "can",
      label: "CAN buses",
      render: (item) => formatNumber(item.can),
    },
    {
      id: "pwm",
      label: "PWM outputs",
      render: (item) => formatNumber(item.pwm),
    },
    {
      id: "ethernet",
      label: "Ethernet",
      render: (item) => formatBoolean(item.ethernet),
    },
    {
      id: "sdCard",
      label: "SD card",
      render: (item) => formatBoolean(item.sdCard),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Compare flight controllers</h1>
          <p className="text-sm text-muted-foreground">
            Toggle controllers on their detail pages to build a side-by-side comparison here.
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
            No controllers selected yet.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Visit any controller page and toggle the compare switch to start building your list.
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
                  href={`${basePath}/controllers/${item.slug}`}
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
            <table className="min-w-[720px] w-full divide-y divide-border/60 text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Specification
                  </th>
                  {selectedItems.map((item) => (
                    <th key={item.id} className="px-4 py-3 text-left align-bottom">
                      <div className="flex flex-col items-start gap-2">
                        <div className="flex h-24 w-full max-w-[140px] items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-muted/30 p-2">
                          {item.image?.url ? (
                            <img
                              src={item.image.url}
                              alt={item.image.alt ?? item.title}
                              loading="lazy"
                              decoding="async"
                              width={item.image.width ?? undefined}
                              height={item.image.height ?? undefined}
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <span className="text-xs font-medium text-muted-foreground/70">No image</span>
                          )}
                        </div>
                        <div className="flex flex-col gap-1">
                          <a
                            href={`${basePath}/controllers/${item.slug}`}
                            className="text-sm font-semibold text-primary transition-colors hover:text-primary/80"
                          >
                            {item.title}
                          </a>
                          <span className="text-xs uppercase tracking-wide text-muted-foreground">
                            {item.manufacturer}
                          </span>
                        </div>
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
