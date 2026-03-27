const normalizePath = (path: string): string => {
  if (!path) {
    return '/';
  }

  return path.startsWith('/') ? path : `/${path}`;
};

const removeTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

export const getPublicApiBaseUrl = (): string => {
  return removeTrailingSlash((process.env.NEXT_PUBLIC_ESTRUTURA_API_URL ?? '').trim());
};

export const buildPublicApiUrl = (path: string): string => {
  const normalizedPath = normalizePath(path);
  const baseUrl = getPublicApiBaseUrl();

  return baseUrl ? `${baseUrl}${normalizedPath}` : normalizedPath;
};
