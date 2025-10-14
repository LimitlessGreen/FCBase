import * as React from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { ThemeToggle } from "./ThemeToggle";

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
            <a href={`${basePath}/controllers`} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Controllers
            </a>
            <a href={`${basePath}/firmware`} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Firmware
            </a>
            <a href={`${basePath}/sensors`} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Sensors
            </a>
            <a href={`${basePath}/mcu`} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              MCUs
            </a>
            <a href={`${basePath}/manufacturers`} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Manufacturers
            </a>
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
            <a href={`${basePath}/controllers`} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2 px-2 rounded-sm hover:bg-muted">
              Controllers
            </a>
            <a href={`${basePath}/firmware`} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2 px-2 rounded-sm hover:bg-muted">
              Firmware
            </a>
            <a href={`${basePath}/sensors`} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2 px-2 rounded-sm hover:bg-muted">
              Sensors
            </a>
            <a href={`${basePath}/mcu`} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2 px-2 rounded-sm hover:bg-muted">
              MCUs
            </a>
            <a href={`${basePath}/manufacturers`} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2 px-2 rounded-sm hover:bg-muted">
              Manufacturers
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
