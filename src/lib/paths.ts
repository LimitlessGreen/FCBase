export function getBasePath(base?: string): string {
  const rawBase = base ?? import.meta.env?.BASE_URL ?? '/';

  if (!rawBase || rawBase === '/') {
    return '';
  }

  return rawBase.replace(/\/+$/, '');
}
