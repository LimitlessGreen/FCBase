import * as React from "react";
import { Button } from "@/components/ui/Button";
import {
  COMPARE_EVENT_NAME,
  type CompareEventDetail,
  type CompareType,
  getCompareLegacyStorageKeys,
  getCompareStorageKey,
  readCompareList,
} from "@/lib/compare";
import {
  compareComponentDefinitions,
  compareComponentIds,
  type CompareComponentDefinition,
} from "@/lib/component-registry";

interface CompareMenuProps {
  basePath: string;
  layout?: "inline" | "stacked";
  onNavigate?: () => void;
}

type CompareCounts = Record<CompareType, number>;

const defaultCounts = Object.fromEntries(
  compareComponentIds.map((id) => [id, 0]),
) as CompareCounts;

const createCounts = (): CompareCounts =>
  Object.fromEntries(
    compareComponentIds.map((id) => [id, readCompareList(id).length]),
  ) as CompareCounts;

const storageKeyMap = new Map<string, CompareType>(
  compareComponentDefinitions.flatMap((definition) => {
    const keys = [
      getCompareStorageKey(definition.id),
      ...getCompareLegacyStorageKeys(definition.id),
    ];
    return keys.map((key) => [key, definition.id] as const);
  }),
);

export function CompareMenu({ basePath, layout = "inline", onNavigate }: CompareMenuProps) {
  const [counts, setCounts] = React.useState<CompareCounts>(() => createCounts());

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleStorage = (event: StorageEvent) => {
      if (!event.key) {
        return;
      }

      const type = storageKeyMap.get(event.key);
      if (type) {
        setCounts((previous) => ({
          ...previous,
          [type]: readCompareList(type).length,
        }));
      }
    };

    const handleCompareChange = (event: Event) => {
      const detail = (event as CustomEvent<CompareEventDetail>).detail;
      if (!detail || !compareComponentIds.includes(detail.type)) {
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
  }, []);

  const buildHref = React.useCallback(
    (path: string) => `${basePath}${path}`.replace(/\/{2,}/g, "/"),
    [basePath],
  );

  const isStacked = layout === "stacked";
  const containerClass = isStacked
    ? "flex w-full flex-col gap-2"
    : "flex items-center gap-2";
  const buttonClass = isStacked
    ? "w-full justify-between rounded-lg"
    : "rounded-full px-4";
  const size = isStacked ? "lg" : "sm";

  const renderButton = (definition: CompareComponentDefinition) => {
    const type = definition.id;
    const count = counts[type] ?? defaultCounts[type];
    const disabled = count === 0;
    const href = buildHref(definition.compareRoute);
    const badge = (
      <span className="inline-flex h-5 min-w-[1.75rem] items-center justify-center rounded-full bg-muted px-2 text-xs font-semibold leading-none text-muted-foreground">
        {count}
      </span>
    );

    const content = (
      <>
        <span>{definition.menuLabel}</span>
        {badge}
      </>
    );

    if (disabled) {
      return (
        <Button
          key={type}
          type="button"
          variant="outline"
          size={size}
          className={buttonClass}
          disabled
        >
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
      {compareComponentDefinitions.map((definition) => renderButton(definition))}
    </div>
  );
}
