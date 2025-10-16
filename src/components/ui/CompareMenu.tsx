import * as React from "react";
import { Button } from "@/components/ui/Button";
import {
  COMPARE_EVENT_NAME,
  type CompareEventDetail,
  type CompareType,
  getCompareStorageKey,
  readCompareList,
} from "@/lib/compare";

interface CompareMenuProps {
  basePath: string;
  layout?: "inline" | "stacked";
  onNavigate?: () => void;
}

type CompareCounts = Record<CompareType, number>;

const defaultCounts: CompareCounts = {
  controller: 0,
  transmitter: 0,
};

export function CompareMenu({ basePath, layout = "inline", onNavigate }: CompareMenuProps) {
  const [counts, setCounts] = React.useState<CompareCounts>(() => ({
    controller: readCompareList("controller").length,
    transmitter: readCompareList("transmitter").length,
  }));

  const updateCounts = React.useCallback(() => {
    setCounts({
      controller: readCompareList("controller").length,
      transmitter: readCompareList("transmitter").length,
    });
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const controllerKey = getCompareStorageKey("controller");
    const transmitterKey = getCompareStorageKey("transmitter");

    const handleStorage = (event: StorageEvent) => {
      if (event.key === controllerKey || event.key === transmitterKey) {
        updateCounts();
      }
    };

    const handleCompareChange = (event: Event) => {
      const detail = (event as CustomEvent<CompareEventDetail>).detail;
      if (!detail) {
        return;
      }

      setCounts((previous) => ({
        ...previous,
        [detail.type]: detail.ids.length,
      }));
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
  }, [updateCounts]);

  const buildHref = React.useCallback(
    (path: string) => `${basePath}${path}`.replace(/\/{2,}/g, "/"),
    [basePath],
  );

  const controllerHref = React.useMemo(
    () => buildHref("/controllers/compare"),
    [buildHref],
  );
  const transmitterHref = React.useMemo(
    () => buildHref("/transmitters/compare"),
    [buildHref],
  );

  const isStacked = layout === "stacked";
  const containerClass = isStacked
    ? "flex w-full flex-col gap-2"
    : "flex items-center gap-2";
  const buttonClass = isStacked
    ? "w-full justify-between rounded-lg"
    : "rounded-full px-4";
  const size = isStacked ? "lg" : "sm";

  const renderButton = (
    type: CompareType,
    label: string,
    href: string,
  ) => {
    const count = counts[type] ?? defaultCounts[type];
    const disabled = count === 0;
    const badge = (
      <span className="inline-flex h-5 min-w-[1.75rem] items-center justify-center rounded-full bg-muted px-2 text-xs font-semibold leading-none text-muted-foreground">
        {count}
      </span>
    );

    const content = (
      <>
        <span>{label}</span>
        {badge}
      </>
    );

    if (disabled) {
      return (
        <Button key={type} type="button" variant="outline" size={size} className={buttonClass} disabled>
          {content}
        </Button>
      );
    }

    const handleClick = () => {
      if (onNavigate) {
        onNavigate();
      }
    };

    return (
      <Button
        key={type}
        asChild
        variant="outline"
        size={size}
        className={buttonClass}
        type="button"
        onClick={handleClick}
      >
        <a href={href}>{content}</a>
      </Button>
    );
  };

  return (
    <div className={containerClass}>
      {renderButton("controller", "Compare FCs", controllerHref)}
      {renderButton("transmitter", "Compare TXs", transmitterHref)}
    </div>
  );
}
