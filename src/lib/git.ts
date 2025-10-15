import { execSync } from "node:child_process";

type GitMetadata = {
  contributors: string[];
  lastModified: string | null;
};

const gitMetadataCache = new Map<string, GitMetadata>();
const GIT_FIELD_SEPARATOR = "\u001F";
let gitMetadataInitialized = false;

function loadGitMetadata(): void {
  if (gitMetadataInitialized) {
    return;
  }

  gitMetadataInitialized = true;

  try {
    const output = execSync(
      "git log --name-only --pretty=format:%an%x1f%cI",
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      },
    );

    const contributorsByPath = new Map<string, Set<string>>();
    const lastModifiedByPath = new Map<string, string>();

    let currentAuthor: string | null = null;
    let currentDate: string | null = null;

    for (const line of output.split("\n")) {
      const trimmed = line.trim();

      if (!trimmed) {
        continue;
      }

      if (line.includes(GIT_FIELD_SEPARATOR)) {
        const [author, isoDate] = trimmed.split(GIT_FIELD_SEPARATOR);
        currentAuthor = author?.trim() || null;
        currentDate = isoDate?.trim() || null;
        continue;
      }

      const filePath = trimmed;
      if (!filePath) {
        continue;
      }

      if (!contributorsByPath.has(filePath)) {
        contributorsByPath.set(filePath, new Set());
      }

      if (currentAuthor) {
        contributorsByPath.get(filePath)!.add(currentAuthor);
      }

      if (!lastModifiedByPath.has(filePath) && currentDate) {
        lastModifiedByPath.set(filePath, currentDate);
      }
    }

    for (const [filePath, contributors] of contributorsByPath.entries()) {
      gitMetadataCache.set(filePath, {
        contributors: Array.from(contributors),
        lastModified: lastModifiedByPath.get(filePath) ?? null,
      });
    }
  } catch (error) {
    console.warn("[git] Unable to load git metadata:", error);
  }
}

function getFileGitMetadata(filePath?: string | null): GitMetadata {
  if (!filePath) {
    return { contributors: [], lastModified: null };
  }

  loadGitMetadata();

  const cached = gitMetadataCache.get(filePath);
  if (cached) {
    return cached;
  }

  const fallback: GitMetadata = { contributors: [], lastModified: null };
  gitMetadataCache.set(filePath, fallback);
  return fallback;
}

/**
 * Returns the unique list of human contributor names for the provided file.
 *
 * Contributors are discovered via `git log` so the repository history must be
 * available in the environment where the site is built.
 */
export function getFileContributors(filePath?: string | null): string[] {
  return getFileGitMetadata(filePath).contributors;
}

/**
 * Returns the last modified date (ISO string) for the provided file.
 */
export function getFileLastModified(filePath?: string | null): string | null {
  return getFileGitMetadata(filePath).lastModified;
}
