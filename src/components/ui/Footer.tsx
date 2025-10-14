import * as React from "react";
import { Github, Twitter, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { GITHUB_REPO_URL } from "@/lib/constants";

const RELATIVE_TIME_DIVISIONS: Array<{ amount: number; unit: Intl.RelativeTimeFormatUnit }> = [
  { amount: 60, unit: "second" },
  { amount: 60, unit: "minute" },
  { amount: 24, unit: "hour" },
  { amount: 7, unit: "day" },
  { amount: 4.34524, unit: "week" },
  { amount: 12, unit: "month" },
  { amount: Number.POSITIVE_INFINITY, unit: "year" },
];

function getRelativeTimeFromIso(isoDate: string) {
  if (!isoDate) {
    return "";
  }

  const commitDate = new Date(isoDate);

  if (Number.isNaN(commitDate.getTime())) {
    return "";
  }

  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  let duration = (commitDate.getTime() - Date.now()) / 1000;

  for (const division of RELATIVE_TIME_DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return formatter.format(Math.round(duration), division.unit);
    }

    duration /= division.amount;
  }

  return "";
}

function getFormattedCommitDate(isoDate: string) {
  if (!isoDate) {
    return "";
  }

  const commitDate = new Date(isoDate);

  if (Number.isNaN(commitDate.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(commitDate);
}

interface FooterProps {
  className?: string;
  basePath?: string;
}

export function Footer({ className, basePath = "" }: FooterProps) {
  const commitHash = import.meta.env.PUBLIC_GIT_COMMIT_HASH;
  const commitHashFull = import.meta.env.PUBLIC_GIT_COMMIT_HASH_FULL;
  const commitAuthor = import.meta.env.PUBLIC_GIT_COMMIT_AUTHOR;
  const commitDate = import.meta.env.PUBLIC_GIT_COMMIT_DATE;

  const formattedDateRaw = React.useMemo(() => getFormattedCommitDate(commitDate), [commitDate]);
  const formattedDate = formattedDateRaw || "Unknown date";
  const relativeTime = React.useMemo(() => getRelativeTimeFromIso(commitDate), [commitDate]);
  const commitUrl = React.useMemo(() => {
    if (!commitHashFull) {
      return "";
    }

    return `${GITHUB_REPO_URL}/commit/${commitHashFull}`;
  }, [commitHashFull]);

  const hasCommitInfo = Boolean(commitHash && commitAuthor);

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
              <a
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
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

        <div className="mt-12 border-t pt-8 flex flex-col sm:flex-row justify-between items-center gap-6 sm:gap-4">
          <div className="flex flex-col items-center sm:items-start gap-2 text-center sm:text-left">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} FCBase. All rights reserved.
            </p>
            {hasCommitInfo ? (
              <p className="text-xs text-muted-foreground">
                Latest commit {commitUrl ? (
                  <a
                    href={commitUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    {commitHash}
                  </a>
                ) : (
                  <span className="font-medium text-foreground">{commitHash}</span>
                )}{" "}
                by <span className="font-medium text-foreground">{commitAuthor}</span>{" "}
                on <span suppressHydrationWarning>{formattedDate}</span>
                {relativeTime ? <span suppressHydrationWarning> ({relativeTime})</span> : ""}.
              </p>
            ) : null}
          </div>
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
