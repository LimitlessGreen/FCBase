import * as React from "react";
import { LayoutGrid, List } from "lucide-react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  VIEW_MODE_STORAGE_KEY,
  broadcastViewMode,
  getInitialViewMode,
  parseViewMode,
  persistViewMode,
  setUrlViewParam,
  type ViewMode,
} from "@/lib/viewMode";

type ViewModeSwitchProps = {
  mode: ViewMode;
  onChange?: (mode: ViewMode) => void;
  className?: string;
} & Omit<
  React.ComponentPropsWithoutRef<typeof ToggleGroup>,
  "type" | "value" | "onValueChange"
>;

type CommitOptions = {
  updateUrl?: boolean;
  persist?: boolean;
  broadcast?: boolean;
  notify?: boolean;
};

export default function ViewModeSwitch({ mode, onChange, className, ...props }: ViewModeSwitchProps) {
  const [value, setValue] = React.useState<ViewMode>(mode);

  const commit = React.useCallback(
    (next: ViewMode, options?: CommitOptions) => {
      const {
        updateUrl = true,
        persist = true,
        broadcast = true,
        notify = true,
      } = options ?? {};

      setValue(next);
      if (notify) {
        onChange?.(next);
      }
      if (persist) {
        persistViewMode(next);
      }
      if (updateUrl) {
        setUrlViewParam(next);
      }
      if (broadcast) {
        broadcastViewMode(next);
      }
    },
    [onChange]
  );

  React.useEffect(() => {
    setValue(mode);
  }, [mode]);

  React.useEffect(() => {
    const initial = getInitialViewMode();
    commit(initial, { notify: false });
  }, [commit]);

  React.useEffect(() => {
    const handleViewMode = (event: Event) => {
      const detail = (event as CustomEvent<ViewMode>).detail;
      const next = parseViewMode(detail);
      if (next) {
        commit(next, { updateUrl: false, persist: false, broadcast: false });
      }
    };

    const handlePopState = () => {
      const url = new URL(window.location.href);
      const param = parseViewMode(url.searchParams.get("view"));
      if (param) {
        commit(param, { updateUrl: false, broadcast: true });
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== VIEW_MODE_STORAGE_KEY) {
        return;
      }
      const next = parseViewMode(event.newValue);
      if (next) {
        commit(next, { updateUrl: false, persist: false, broadcast: true });
      }
    };

    window.addEventListener("fcbase:viewmode", handleViewMode);
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("fcbase:viewmode", handleViewMode);
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("storage", handleStorage);
    };
  }, [commit]);

  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(next) => next && commit(next as ViewMode)}
      className={className}
      aria-label="View mode"
      {...props}
    >
      <ToggleGroupItem value="grid" aria-label="Grid view" title="Grid view">
        <LayoutGrid aria-hidden className="mr-2 h-4 w-4" />
        <span className="hidden sm:inline">Grid view</span>
        <span className="sm:hidden">Grid</span>
      </ToggleGroupItem>
      <ToggleGroupItem value="list" aria-label="List view" title="List view">
        <List aria-hidden className="mr-2 h-4 w-4" />
        <span className="hidden sm:inline">List view</span>
        <span className="sm:hidden">List</span>
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
