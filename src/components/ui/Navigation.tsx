import * as React from "react";
import { Compass, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { ThemeToggle } from "./ThemeToggle";

const navLinks = [
  { href: "/controllers", label: "Controllers" },
  { href: "/transmitters", label: "Transmitters" },
  { href: "/firmware", label: "Firmware" },
  { href: "/sensors", label: "Sensors" },
  { href: "/mcu", label: "MCUs" },
  { href: "/manufacturers", label: "Manufacturers" },
];

interface NavigationLinkProps {
  basePath: string;
  href: string;
  label: string;
  className?: string;
  isActive?: boolean;
}

function NavigationLink({ basePath, href, label, className, isActive }: NavigationLinkProps) {
  const fullHref = `${basePath}${href}`.replace(/\/{2,}/g, "/");

  return (
    <a
      href={fullHref}
      className={cn(
        "group relative inline-flex items-center gap-1 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40",
        isActive
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground",
        className,
      )}
      aria-current={isActive ? "page" : undefined}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-0 scale-95 rounded-[inherit] bg-primary/10 opacity-0 transition-all duration-200 group-hover:scale-105 group-hover:opacity-100",
          isActive && "scale-105 bg-primary/20 opacity-100 shadow-lg",
        )}
      />
      <span className="relative flex items-center gap-1">{label}</span>
    </a>
  );
}

interface NavigationProps {
  className?: string;
  basePath?: string;
}

export function Navigation({ className, basePath = "" }: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [currentPath, setCurrentPath] = React.useState(() => {
    if (typeof window !== "undefined") {
      return normalizePath(window.location.pathname);
    }

    return "/";
  });
  const contributeHref = React.useMemo(
    () => `${basePath}/contribute`.replace(/\/{2,}/g, "/"),
    [basePath],
  );
  const homeHref = React.useMemo(() => `${basePath}/`.replace(/\/{2,}/g, "/"), [basePath]);
  const mobileMenuId = React.useId();

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const updatePath = () => setCurrentPath(normalizePath(window.location.pathname));
    updatePath();

    window.addEventListener("popstate", updatePath);
    window.addEventListener("hashchange", updatePath);
    return () => {
      window.removeEventListener("popstate", updatePath);
      window.removeEventListener("hashchange", updatePath);
    };
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  React.useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    setIsMenuOpen(false);
  }, [currentPath, isMenuOpen]);

  React.useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    const { body } = document;
    const previousOverflow = body.style.overflow;

    if (isMenuOpen) {
      body.style.overflow = "hidden";
    } else {
      body.style.overflow = "";
    }

    return () => {
      body.style.overflow = previousOverflow;
    };
  }, [isMenuOpen]);

  React.useEffect(() => {
    if (!isMenuOpen || typeof window === "undefined") {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMenuOpen]);

  const toggleMenu = React.useCallback(() => {
    setIsMenuOpen((previous) => !previous);
  }, []);

  const getLinkIsActive = React.useCallback(
    (href: string) => {
      const combined = `${basePath}${href}`;
      return normalizePath(combined) === currentPath;
    },
    [basePath, currentPath],
  );

  return (
    <>
      <nav
        aria-label="Primary navigation"
        className={cn(
          "relative isolate border-b border-white/10 bg-background/90 transition-colors duration-300 supports-[backdrop-filter]:bg-background/60",
          isScrolled
            ? "backdrop-blur-md supports-[backdrop-filter]:backdrop-blur-xl shadow-lg"
            : "backdrop-blur-sm supports-[backdrop-filter]:backdrop-blur-md shadow-sm",
          "dark:border-white/5",
          className,
        )}
      >
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent" />
          <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-primary/25 to-transparent" />
        </div>
        <div className="container">
          <div className="flex h-16 items-center justify-between gap-3">
            <div className="flex items-center gap-6">
              <a
                href={homeHref}
                className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary transition-transform duration-200 hover:-translate-y-0.5"
              >
                <Compass className="h-5 w-5" aria-hidden="true" />
                <span className="text-base text-foreground">FCBase</span>
              </a>
              <div className="hidden items-center gap-2 md:flex lg:gap-3">
                {navLinks.map((link) => (
                  <NavigationLink
                    key={link.href}
                    basePath={basePath}
                    isActive={getLinkIsActive(link.href)}
                    {...link}
                  />
                ))}
              </div>
            </div>
            <div className="hidden items-center gap-2 md:flex">
              <Button asChild size="sm" variant="secondary" className="rounded-full px-4">
                <a href={contributeHref}>Contribute</a>
              </Button>
              <ThemeToggle />
            </div>
            <div className="flex items-center gap-1 md:hidden">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={toggleMenu}
                aria-controls={mobileMenuId}
                aria-expanded={isMenuOpen}
                aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              >
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </nav>
      <div
        id={mobileMenuId}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile primary navigation"
        className={cn(
          "fixed inset-x-0 top-0 z-30 flex h-screen flex-col bg-background/95 pb-12 pt-24 shadow-xl backdrop-blur-xl transition-all duration-200 md:hidden",
          "border-b border-white/10 dark:border-white/5",
          isMenuOpen
            ? "pointer-events-auto opacity-100 translate-y-0"
            : "pointer-events-none -translate-y-4 opacity-0",
        )}
      >
        <div className="container flex flex-1 flex-col gap-4 overflow-y-auto">
          {navLinks.map((link) => (
            <NavigationLink
              key={link.href}
              basePath={basePath}
              className="w-full justify-between rounded-lg px-3 py-2 text-base"
              isActive={getLinkIsActive(link.href)}
              {...link}
            />
          ))}
          <Button asChild size="lg" className="mt-2 w-full justify-center rounded-lg">
            <a href={contributeHref}>Contribute</a>
          </Button>
        </div>
      </div>
    </>
  );
}

function normalizePath(path: string) {
  if (!path) {
    return "/";
  }

  const condensed = path.replace(/\/{2,}/g, "/");
  if (condensed.length > 1 && condensed.endsWith("/")) {
    return condensed.slice(0, -1);
  }

  return condensed || "/";
}
