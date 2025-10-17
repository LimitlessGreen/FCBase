import { defineConfig } from "astro/config";
import { execSync } from "node:child_process";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

function getGitValue(command) {
  try {
    return execSync(command, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch (error) {
    return "";
  }
}

function deriveGithubRepoUrl(remoteUrl) {
  if (!remoteUrl) {
    return "";
  }

  const sanitized = remoteUrl.replace(/\.git$/i, "").trim();

  if (!sanitized) {
    return "";
  }

  const sshMatch = sanitized.match(/^git@github\.com:(.+)$/i);
  if (sshMatch) {
    return `https://github.com/${sshMatch[1]}`;
  }

  const sshUrlMatch = sanitized.match(/^ssh:\/\/git@github\.com\/(.+)$/i);
  if (sshUrlMatch) {
    return `https://github.com/${sshUrlMatch[1]}`;
  }

  const httpsMatch = sanitized.match(/^https?:\/\/github\.com\/(.+)$/i);
  if (httpsMatch) {
    return `https://github.com/${httpsMatch[1]}`;
  }

  return "";
}

function deriveGithubProfileUrl(email) {
  if (!email) {
    return "";
  }

  const noreplyMatch = email.match(/^(?:\d+\+)?([a-z0-9-]+)@users\.noreply\.github\.com$/i);

  if (noreplyMatch) {
    return `https://github.com/${noreplyMatch[1]}`;
  }

  const githubMatch = email.match(/^([a-z0-9-]+)@github\.com$/i);

  if (githubMatch) {
    return `https://github.com/${githubMatch[1]}`;
  }

  return "";
}

const gitLogOutput = getGitValue(
  "git log -1 --pretty=format:%h%x1f%H%x1f%an%x1f%ae%x1f%cI"
);
const gitLogFields = gitLogOutput
  ? gitLogOutput.split("\x1f").map((value) => value.trim())
  : [];
const [
  commitHashShort = "",
  commitHashFull = "",
  commitAuthor = "",
  commitAuthorEmail = "",
  commitDateIso = "",
] = gitLogFields;
const commitAuthorUrl = deriveGithubProfileUrl(commitAuthorEmail);
const remoteOriginUrl = getGitValue("git config --get remote.origin.url");
const currentBranch = getGitValue("git rev-parse --abbrev-ref HEAD") || "main";
const githubRepoUrl =
  deriveGithubRepoUrl(remoteOriginUrl) || "https://github.com/LimitlessGreen/FCBase";
const githubEditBaseUrl = githubRepoUrl ? `${githubRepoUrl}/edit/${currentBranch}` : "";

export default defineConfig({
  site: "https://limitlessgreen.github.io",
  base: "/FCBase",
  output: "static",
  build: {
    format: "file",
  },
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    define: {
      "import.meta.env.PUBLIC_GIT_COMMIT_HASH": JSON.stringify(commitHashShort),
      "import.meta.env.PUBLIC_GIT_COMMIT_HASH_FULL": JSON.stringify(commitHashFull),
      "import.meta.env.PUBLIC_GIT_COMMIT_AUTHOR": JSON.stringify(commitAuthor),
      "import.meta.env.PUBLIC_GIT_COMMIT_AUTHOR_URL": JSON.stringify(commitAuthorUrl),
      "import.meta.env.PUBLIC_GIT_COMMIT_DATE": JSON.stringify(commitDateIso),
      "import.meta.env.PUBLIC_GITHUB_REPO_URL": JSON.stringify(githubRepoUrl),
      "import.meta.env.PUBLIC_GITHUB_EDIT_BASE_URL": JSON.stringify(githubEditBaseUrl),
    },
  },
});
