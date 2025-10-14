import * as React from "react";
import { Laptop, Moon, Sun } from "lucide-react";
import { Button } from "./Button";

type ThemeMode = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

const THEME_STORAGE_KEY = "theme";

const isThemeMode = (value: unknown): value is ThemeMode =>
  value === "light" || value === "dark" || value === "system";

const getSystemPreference = (): ResolvedTheme => {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const resolveTheme = (mode: ThemeMode): ResolvedTheme =>
  mode === "system" ? getSystemPreference() : mode;

const getInitialMode = (): ThemeMode => {
  if (typeof document !== "undefined") {
    const datasetMode = document.documentElement.dataset.themeMode;
    if (isThemeMode(datasetMode)) {
      return datasetMode;
    }
  }

  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (isThemeMode(stored)) {
      return stored;
    }
  }

  return "system";
};

const getInitialResolvedTheme = (): ResolvedTheme => {
  if (typeof document !== "undefined") {
    const datasetResolved = document.documentElement.dataset.themeResolved;
    if (datasetResolved === "dark" || datasetResolved === "light") {
      return datasetResolved;
    }
  }

  return resolveTheme(getInitialMode());
};

export function ThemeToggle() {
  const [mode, setMode] = React.useState<ThemeMode>(getInitialMode);
  const [resolvedTheme, setResolvedTheme] = React.useState<ResolvedTheme>(getInitialResolvedTheme);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const root = document.documentElement;
    const nextResolvedTheme = resolveTheme(mode);

    root.classList.toggle("dark", nextResolvedTheme === "dark");
    root.dataset.themeMode = mode;
    root.dataset.themeResolved = nextResolvedTheme;
    setResolvedTheme(nextResolvedTheme);

    if (typeof localStorage !== "undefined") {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    }
  }, [mode]);

  React.useEffect(() => {
    if (mode !== "system" || typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event: MediaQueryListEvent) => {
      const nextResolvedTheme: ResolvedTheme = event.matches ? "dark" : "light";
      setResolvedTheme(nextResolvedTheme);

      if (typeof document !== "undefined") {
        const root = document.documentElement;
        root.classList.toggle("dark", nextResolvedTheme === "dark");
        root.dataset.themeResolved = nextResolvedTheme;
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [mode]);

  const cycleTheme = () => {
    setMode((currentMode) => {
      if (currentMode === "light") {
        return "dark";
      }

      if (currentMode === "dark") {
        return "system";
      }

      return "light";
    });
  };

  const icon = {
    light: <Sun className="h-5 w-5" />,
    dark: <Moon className="h-5 w-5" />,
    system: <Laptop className="h-5 w-5" />,
  }[mode];

  // Use static label during SSR to prevent hydration mismatch
  const label = mounted 
    ? `Toggle theme (current: ${mode === "system" ? `system · ${resolvedTheme}` : mode} mode)`
    : "Toggle theme";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      aria-label={label}
      title={label}
    >
      {icon}
    </Button>
  );
}
