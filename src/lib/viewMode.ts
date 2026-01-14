export type ViewMode = "grid" | "list";

export const VIEW_MODE_STORAGE_KEY = "fcbase:viewMode";

const isValidViewMode = (value: string | null | undefined): value is ViewMode =>
  value === "grid" || value === "list";

export function getInitialViewMode(): ViewMode {
  if (typeof window === "undefined") {
    return "grid";
  }

  const url = new URL(window.location.href);
  const viewFromUrl = url.searchParams.get("view");
  if (isValidViewMode(viewFromUrl)) {
    return viewFromUrl;
  }

  try {
    const stored = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    if (isValidViewMode(stored)) {
      return stored;
    }
  } catch (error) {
    console.warn("Unable to access localStorage for view mode", error);
  }

  return "grid";
}

export function persistViewMode(mode: ViewMode) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
  } catch (error) {
    console.warn("Unable to persist view mode", error);
  }
}

export function setUrlViewParam(mode: ViewMode) {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);
  url.searchParams.set("view", mode);
  window.history.replaceState({}, "", url.toString());
}

export function broadcastViewMode(mode: ViewMode) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent<ViewMode>("fcbase:viewmode", { detail: mode }));
}

export function parseViewMode(value: string | null | undefined): ViewMode | undefined {
  return isValidViewMode(value) ? value : undefined;
}
