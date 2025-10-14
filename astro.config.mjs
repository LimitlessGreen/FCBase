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

const commitHashShort = getGitValue("git rev-parse --short HEAD");
const commitHashFull = getGitValue("git rev-parse HEAD");
const commitAuthor = getGitValue("git log -1 --pretty=format:%an");
const commitDateIso = getGitValue("git log -1 --pretty=format:%cI");

export default defineConfig({
  site: "https://limitlessgreen.github.io",
  base: "/FCBase",
  output: "static",
  integrations: [
    react(),
  ],
  vite: {
    plugins: [tailwindcss()],
    define: {
      "import.meta.env.PUBLIC_GIT_COMMIT_HASH": JSON.stringify(commitHashShort),
      "import.meta.env.PUBLIC_GIT_COMMIT_HASH_FULL": JSON.stringify(commitHashFull),
      "import.meta.env.PUBLIC_GIT_COMMIT_AUTHOR": JSON.stringify(commitAuthor),
      "import.meta.env.PUBLIC_GIT_COMMIT_DATE": JSON.stringify(commitDateIso),
    },
  },
});
