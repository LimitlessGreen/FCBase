import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Compass, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { compareComponentDefinitions } from "@/lib/component-registry";
import { Button } from "./Button";
import { CompareMenu } from "./CompareMenu";
import { ThemeToggle } from "./ThemeToggle";
import {
  NavigationMenu,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "./navigation-menu";

type NavigationItem = {
  key: string;
  href: string;
  label: string;
};

const componentNavigationItems: NavigationItem[] = compareComponentDefinitions.map(
  (definition) => ({
    key: definition.id,
    href: definition.navigation.primaryRoute,
    label: definition.navigation.label,
  }),
);

const supplementalNavigationItems: NavigationItem[] = [
  { key: "firmware", href: "/firmware", label: "Firmware" },
  { key: "sensors", href: "/sensors", label: "Sensors" },
  { key: "mcu", href: "/mcu", label: "MCUs" },
  { key: "manufacturers", href: "/manufacturers", label: "Manufacturers" },
];

const navigationItems: NavigationItem[] = [
  ...componentNavigationItems,
  ...supplementalNavigationItems,
];

interface NavigationProps {
  className?: string;
  basePath?: string;
}

export function Navigation({ className, basePath = "" }: NavigationProps) {
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [currentPath, setCurrentPath] = React.useState("/");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const mobileMenuId = React.useId();

  const createHref = React.useCallback(
    (href: string) => `${basePath}${href}`.replace(/\/{2,}/g, "/"),
    [basePath],
  );

  const contributeHref = React.useMemo(() => createHref("/contribute"), [createHref]);
  const homeHref = React.useMemo(() => createHref("/"), [createHref]);

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
    if (!isMobileMenuOpen) {
      return;
    }

    setIsMobileMenuOpen(false);
  }, [currentPath, isMobileMenuOpen]);

  const getLinkIsActive = React.useCallback(
    (href: string) => {
      const combined = createHref(href);
      return normalizePath(combined) === currentPath;
    },
    [createHref, currentPath],
  );

  const closeMobileMenu = React.useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  return (
    <>
      <nav
        aria-label="Primary navigation"
        className={cn(
          "relative border-b border-white/10 bg-background/85 transition-all duration-300 supports-[backdrop-filter]:bg-background/60",
          isScrolled
            ? "backdrop-blur-xl shadow-lg"
            : "backdrop-blur-md shadow-xs",
          "dark:border-white/5",
          className,
        )}
      >
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
              <NavigationMenu className="hidden md:flex">
                <NavigationMenuList>
                  {navigationItems.map((link) => {
                    const isActive = getLinkIsActive(link.href);
                    const href = createHref(link.href);

                    return (
                      <NavigationMenuItem key={link.key}>
                        <NavigationMenuLink asChild>
                          <a
                            href={href}
                            className={cn(
                              navigationMenuTriggerStyle({ active: isActive }),
                              "rounded-full px-4 py-2 text-sm",
                            )}
                            aria-current={isActive ? "page" : undefined}
                            data-active={isActive ? "true" : undefined}
                          >
                            {link.label}
                          </a>
                        </NavigationMenuLink>
                      </NavigationMenuItem>
                    );
                  })}
                </NavigationMenuList>
                <NavigationMenuIndicator />
              </NavigationMenu>
            </div>
            <div className="hidden items-center gap-2 md:flex">
              <CompareMenu basePath={basePath} />
              <Button asChild size="sm" variant="secondary" className="rounded-full px-4">
                <a href={contributeHref}>Contribute</a>
              </Button>
              <ThemeToggle />
            </div>
            <div className="flex items-center gap-1 md:hidden">
              <ThemeToggle />
              <Dialog.Root open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <Dialog.Trigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-controls={mobileMenuId}
                    aria-expanded={isMobileMenuOpen}
                    aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                  >
                    {isMobileMenuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
                  </Button>
                </Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Overlay
                    className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm transition-opacity duration-200 data-[state=open]:opacity-100 data-[state=closed]:opacity-0"
                  />
                  <Dialog.Content
                    id={mobileMenuId}
                    className="fixed inset-x-0 top-0 z-50 flex h-screen flex-col gap-6 border-b border-white/10 bg-background/95 px-4 pb-12 pt-24 shadow-xl outline-hidden transition-all duration-200 data-[state=open]:translate-y-0 data-[state=open]:opacity-100 data-[state=closed]:-translate-y-4 data-[state=closed]:opacity-0 dark:border-white/5"
                  >
                    <Dialog.Title className="sr-only">Mobile primary navigation</Dialog.Title>
                    <Dialog.Close asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-4 top-4"
                        aria-label="Close navigation menu"
                      >
                        <X className="h-5 w-5" aria-hidden="true" />
                      </Button>
                    </Dialog.Close>
                    <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
                      <CompareMenu
                        basePath={basePath}
                        layout="stacked"
                        onNavigate={closeMobileMenu}
                      />
                      {navigationItems.map((link) => {
                        const isActive = getLinkIsActive(link.href);
                        const href = createHref(link.href);

                        return (
                          <Button
                            key={link.key}
                            asChild
                            variant="ghost"
                            size="lg"
                            className={cn(
                              "w-full justify-between rounded-lg px-4 py-3 text-base font-medium",
                              isActive
                                ? "bg-primary/15 text-foreground shadow-xs"
                                : "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
                            )}
                          >
                            <a href={href} aria-current={isActive ? "page" : undefined} onClick={closeMobileMenu}>
                              {link.label}
                            </a>
                          </Button>
                        );
                      })}
                      <Button asChild size="lg" className="mt-2 w-full justify-center rounded-lg">
                        <a href={contributeHref} onClick={closeMobileMenu}>
                          Contribute
                        </a>
                      </Button>
                    </div>
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>
            </div>
          </div>
        </div>
      </nav>
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
