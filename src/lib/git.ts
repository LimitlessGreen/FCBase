import { execSync } from "node:child_process";

/**
 * Returns the unique list of human contributor names for the provided file.
 *
 * Contributors are discovered via `git log` so the repository history must be
 * available in the environment where the site is built.
 */
export function getFileContributors(filePath?: string | null): string[] {
  if (!filePath) {
    return [];
  }

  try {
    const output = execSync(`git log --follow --format=%an -- "${filePath}"`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });

    const contributors = output
      .split("\n")
      .map((name) => name.trim())
      .filter(Boolean);

    return Array.from(new Set(contributors));
  } catch (error) {
    console.warn(`[git] Unable to resolve contributors for ${filePath}:`, error);
    return [];
  }
}

/**
 * Returns the last modified date (ISO string) for the provided file.
 */
export function getFileLastModified(filePath?: string | null): string | null {
  if (!filePath) {
    return null;
  }

  try {
    const output = execSync(`git log -1 --format=%cI -- "${filePath}"`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });

    return output.trim() || null;
  } catch (error) {
    console.warn(`[git] Unable to resolve last modified date for ${filePath}:`, error);
    return null;
  }
}
