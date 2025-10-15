import { execSync } from "node:child_process";

type GitMetadata = {
  contributors: string[];
  lastModified: string | null;
};

const gitMetadataCache = new Map<string, GitMetadata>();
const GIT_FIELD_SEPARATOR = "\u001F";

function getFileGitMetadata(filePath?: string | null): GitMetadata {
  if (!filePath) {
    return { contributors: [], lastModified: null };
  }

  const cached = gitMetadataCache.get(filePath);
  if (cached) {
    return cached;
  }

  try {
    const output = execSync(
      `git log --follow --format=%an%x1f%cI -- "${filePath}"`,
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      },
    );

    const contributors = new Set<string>();
    let lastModified: string | null = null;

    for (const line of output.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }

      const [author, isoDate] = trimmed.split(GIT_FIELD_SEPARATOR);

      if (!lastModified && isoDate) {
        lastModified = isoDate.trim() || null;
      }

      if (author) {
        const normalizedAuthor = author.trim();
        if (normalizedAuthor) {
          contributors.add(normalizedAuthor);
        }
      }
    }

    const metadata: GitMetadata = {
      contributors: Array.from(contributors),
      lastModified,
    };

    gitMetadataCache.set(filePath, metadata);
    return metadata;
  } catch (error) {
    console.warn(`[git] Unable to resolve git metadata for ${filePath}:`, error);
    const fallback: GitMetadata = { contributors: [], lastModified: null };
    gitMetadataCache.set(filePath, fallback);
    return fallback;
  }
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
