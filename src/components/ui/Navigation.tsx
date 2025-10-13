import * as React from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

interface NavigationProps {
  className?: string;
}

export function Navigation({ className }: NavigationProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <nav className={cn("border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", className)}>
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <a href="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl">FCBase</span>
          </a>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <a href="/controllers" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Controllers
            </a>
            <a href="/firmware" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Firmware
            </a>
            <a href="/sensors" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Sensors
            </a>
            <a href="/manufacturers" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Manufacturers
            </a>
          </div>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          <Button variant="ghost" size="sm">
            Sign In
          </Button>
          <Button size="sm">
            Get Started
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden border-t">
          <div className="container py-4 flex flex-col gap-3">
            <a href="/controllers" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2 px-2 rounded-sm hover:bg-muted">
              Controllers
            </a>
            <a href="/firmware" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2 px-2 rounded-sm hover:bg-muted">
              Firmware
            </a>
            <a href="/sensors" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2 px-2 rounded-sm hover:bg-muted">
              Sensors
            </a>
            <a href="/manufacturers" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2 px-2 rounded-sm hover:bg-muted">
              Manufacturers
            </a>
            <div className="pt-4 flex flex-col gap-3">
              <Button variant="ghost" className="w-full justify-start">
                Sign In
              </Button>
              <Button className="w-full">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
