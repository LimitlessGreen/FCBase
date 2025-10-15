export function getBasePath(base?: string): string {
  const rawBase = base ?? import.meta.env?.BASE_URL ?? '/';

  if (!rawBase || rawBase === '/') {
    return '';
  }

  return rawBase.replace(/\/+$/, '');
}

export function getSiteUrl(
  relativePath: string,
  site?: string | URL | null
): string {
  const basePath = getBasePath();
  const trimmed = relativePath.replace(/^\/+/, '');
  const normalized = trimmed ? `/${trimmed}` : '/';
  const prefixedPath = `${basePath}${normalized}` || normalized;

  if (site) {
    return new URL(prefixedPath, site).toString();
  }

  return prefixedPath;
}
