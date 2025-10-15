import * as React from "react";
import { Menu, X } from "lucide-react";
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
}

function NavigationLink({ basePath, href, label, className }: NavigationLinkProps) {
  return (
    <a
      href={`${basePath}${href}`}
      className={cn(
        "text-sm font-medium text-muted-foreground hover:text-foreground transition-colors",
        className,
      )}
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

  return (
    <nav className={cn("border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", className)}>
      <div className="container">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <a href={`${basePath}/`} className="flex items-center space-x-2">
              <span className="font-bold text-xl">FCBase</span>
            </a>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <NavigationLink key={link.href} basePath={basePath} {...link} />
            ))}
          </div>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-2">
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
                className="py-2 px-2 rounded-sm hover:bg-muted"
                {...link}
              />
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
