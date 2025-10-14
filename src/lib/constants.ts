const FALLBACK_GITHUB_REPO_URL = "https://github.com/LimitlessGreen/FCBase";

const repoUrlFromEnv = import.meta.env.PUBLIC_GITHUB_REPO_URL?.trim();
export const GITHUB_REPO_URL = repoUrlFromEnv || FALLBACK_GITHUB_REPO_URL;

const editBaseUrlFromEnv = import.meta.env.PUBLIC_GITHUB_EDIT_BASE_URL?.trim();
export const GITHUB_EDIT_BASE_URL =
  editBaseUrlFromEnv || `${GITHUB_REPO_URL}/edit/main`;
