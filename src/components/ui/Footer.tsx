import * as React from "react";
import { Github, Twitter, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

interface FooterProps {
  className?: string;
  basePath?: string;
}

export function Footer({ className, basePath = "" }: FooterProps) {
  return (
    <footer className={cn("border-t bg-background", className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <a href={`${basePath}/`} className="flex items-center space-x-2">
              <span className="font-bold text-xl">FCBase</span>
            </a>
            <p className="text-sm text-muted-foreground">
              Your comprehensive flight controller database.
            </p>
            <div className="flex gap-4">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <Github className="h-5 w-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="mailto:contact@fcbase.com" className="text-muted-foreground hover:text-foreground transition-colors">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div className="flex flex-col gap-4">
            <h3 className="font-semibold">Product</h3>
            <div className="flex flex-col gap-2 text-sm">
              <a href={`${basePath}/controllers`} className="text-muted-foreground hover:text-foreground transition-colors">
                Controllers
              </a>
              <a href={`${basePath}/firmware`} className="text-muted-foreground hover:text-foreground transition-colors">
                Firmware
              </a>
              <a href={`${basePath}/sensors`} className="text-muted-foreground hover:text-foreground transition-colors">
                Sensors
              </a>
              <a href={`${basePath}/mcu`} className="text-muted-foreground hover:text-foreground transition-colors">
                MCUs
              </a>
              <a href={`${basePath}/manufacturers`} className="text-muted-foreground hover:text-foreground transition-colors">
                Manufacturers
              </a>
            </div>
          </div>

          {/* Resources */}
          <div className="flex flex-col gap-4">
            <h3 className="font-semibold">Resources</h3>
            <div className="flex flex-col gap-2 text-sm">
              <a href={`${basePath}/docs`} className="text-muted-foreground hover:text-foreground transition-colors">
                Documentation
              </a>
              <a href={`${basePath}/api`} className="text-muted-foreground hover:text-foreground transition-colors">
                API
              </a>
              <a href={`${basePath}/guides`} className="text-muted-foreground hover:text-foreground transition-colors">
                Guides
              </a>
              <a href={`${basePath}/blog`} className="text-muted-foreground hover:text-foreground transition-colors">
                Blog
              </a>
            </div>
          </div>

          {/* Company */}
          <div className="flex flex-col gap-4">
            <h3 className="font-semibold">Company</h3>
            <div className="flex flex-col gap-2 text-sm">
              <a href={`${basePath}/about`} className="text-muted-foreground hover:text-foreground transition-colors">
                About
              </a>
              <a href={`${basePath}/contact`} className="text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </a>
              <a href={`${basePath}/privacy`} className="text-muted-foreground hover:text-foreground transition-colors">
                Privacy
              </a>
              <a href={`${basePath}/terms`} className="text-muted-foreground hover:text-foreground transition-colors">
                Terms
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} FCBase. All rights reserved.
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <a href={`${basePath}/privacy`} className="hover:text-foreground transition-colors">
              Privacy Policy
            </a>
            <a href={`${basePath}/terms`} className="hover:text-foreground transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
