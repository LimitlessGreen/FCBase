import * as React from "react";

import {
  VIEW_MODE_STORAGE_KEY,
  getInitialViewMode,
  parseViewMode,
  type ViewMode,
} from "@/lib/viewMode";

type ViewModeScopeProps = {
  scope: string;
};

const resolveScopeRoot = (node: HTMLElement | null, scope: string) => {
  if (node) {
    const scoped = node.closest(`section[data-view-scope="${scope}"]`);
    if (scoped instanceof HTMLElement) {
      return scoped;
    }
  }

  const fallback = document.querySelector(`section[data-view-scope="${scope}"]`);
  return fallback instanceof HTMLElement ? fallback : null;
};

export default function ViewModeScope({ scope }: ViewModeScopeProps) {
  const markerRef = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    const root = resolveScopeRoot(markerRef.current, scope);
    if (!root) {
      return;
    }

    const applyMode = (mode: ViewMode) => {
      root.dataset.view = mode;
    };

    const applyFromState = () => {
      applyMode(getInitialViewMode());
    };

    const handleViewMode = (event: Event) => {
      const detail = (event as CustomEvent<ViewMode>).detail;
      const next = parseViewMode(detail);
      if (next) {
        applyMode(next);
      }
    };

    const handlePopState = () => {
      applyFromState();
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === VIEW_MODE_STORAGE_KEY) {
        applyFromState();
      }
    };

    applyFromState();
    window.addEventListener("fcbase:viewmode", handleViewMode);
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("fcbase:viewmode", handleViewMode);
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("storage", handleStorage);
    };
  }, [scope]);

  return <span ref={markerRef} className="hidden" aria-hidden="true" />;
}
