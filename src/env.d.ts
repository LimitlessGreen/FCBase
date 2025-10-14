/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_GIT_COMMIT_HASH: string;
  readonly PUBLIC_GIT_COMMIT_HASH_FULL: string;
  readonly PUBLIC_GIT_COMMIT_AUTHOR: string;
  readonly PUBLIC_GIT_COMMIT_DATE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
