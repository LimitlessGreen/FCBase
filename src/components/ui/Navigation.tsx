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
        "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
        className,
      )}
      aria-current={isActive ? "page" : undefined}
    >
      {label}
    </a>
  );
}

interface NavigationProps {
  className?: string;
  basePath?: string;
}

export function Navigation({ className, basePath = "" }: NavigationProps) {
  const [isOpen, setIsOpen] = React.useState(false);
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

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const updatePath = () => setCurrentPath(normalizePath(window.location.pathname));
      updatePath();

      window.addEventListener("popstate", updatePath);
      return () => window.removeEventListener("popstate", updatePath);
    }

    return undefined;
  }, []);

  const getLinkIsActive = React.useCallback(
    (href: string) => {
      const combined = `${basePath}${href}`;
      return normalizePath(combined) === currentPath;
    },
    [basePath, currentPath],
  );

  return (
    <nav
      className={cn(
        "relative overflow-hidden border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className,
      )}
    >
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/20 via-background to-background" />
      <div className="absolute inset-y-0 right-[-25%] w-1/2 -z-10 opacity-40 bg-[radial-gradient(circle_at_top,hsl(var(--primary))_0%,transparent_65%)]" />
      <div className="container">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <a href={homeHref} className="flex items-center gap-2">
              <span className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xl font-semibold text-primary">
                <Compass className="h-5 w-5" aria-hidden="true" />
                <span className="text-foreground">FCBase</span>
              </span>
            </a>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
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

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            <Button asChild variant="secondary" size="sm">
              <a href={contributeHref}>Contribute</a>
            </Button>
            <ThemeToggle />
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden border-t">
          <div className="container py-4 flex flex-col gap-3">
            {navLinks.map((link) => (
              <NavigationLink
                key={link.href}
                basePath={basePath}
                className="rounded-sm px-3 py-2 hover:bg-muted"
                isActive={getLinkIsActive(link.href)}
                {...link}
              />
            ))}
            <Button asChild size="sm" className="w-full justify-center">
              <a href={contributeHref}>Contribute</a>
            </Button>
          </div>
        </div>
      )}
    </nav>
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
