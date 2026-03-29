const normalizePath = (path: string): string => {
  if (!path) {
    return '/';
  }

  return path.startsWith('/') ? path : `/${path}`;
};

const removeTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

const getDefaultBaseUrl = (): string => {
  // Padrao unificado: browser sempre fala com o proprio host (Next /api/*).
  return '';
};

export const getPublicApiBaseUrl = (): string => {
  const configuredBaseUrl = (process.env.NEXT_PUBLIC_ESTRUTURA_API_URL ?? '').trim();
  return removeTrailingSlash(configuredBaseUrl || getDefaultBaseUrl());
};

export const buildPublicApiUrl = (path: string): string => {
  const normalizedPath = normalizePath(path);
  const baseUrl = getPublicApiBaseUrl();

  return baseUrl ? `${baseUrl}${normalizedPath}` : normalizedPath;
};
