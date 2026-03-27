import { requestApi } from '@/services/api/client';
import { buildPublicApiUrl } from '@/services/api/url';
import type { Nbr6118Entry } from '@/types/nbr6118';

const STANDARDS_BASE_PATH = '/standards/nbr6118';

export class Nbr6118ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'Nbr6118ApiError';
    this.status = status;
  }
}

const hasEditorialTableId = (entry: Nbr6118Entry): boolean => {
  return Boolean(entry.metadata.table?.trim());
};

const isNbr6118Entry = (value: unknown): value is Nbr6118Entry => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const maybeEntry = value as Partial<Nbr6118Entry>;
  return Boolean(maybeEntry.metadata && maybeEntry.metadata.sourceId);
};

const normalizeEntryList = (value: unknown): Nbr6118Entry[] => {
  if (Array.isArray(value)) {
    return value.filter(isNbr6118Entry);
  }

  if (!value || typeof value !== 'object') {
    return [];
  }

  const maybeObject = value as {
    items?: unknown;
    entries?: unknown;
    data?: unknown;
  };

  if (Array.isArray(maybeObject.items)) {
    return maybeObject.items.filter(isNbr6118Entry);
  }

  if (Array.isArray(maybeObject.entries)) {
    return maybeObject.entries.filter(isNbr6118Entry);
  }

  if (Array.isArray(maybeObject.data)) {
    return maybeObject.data.filter(isNbr6118Entry);
  }

  return [];
};

const normalizeSingleEntry = (value: unknown): Nbr6118Entry | null => {
  if (isNbr6118Entry(value)) {
    return value;
  }

  if (!value || typeof value !== 'object') {
    return null;
  }

  const maybeObject = value as {
    item?: unknown;
    entry?: unknown;
    data?: unknown;
  };

  if (isNbr6118Entry(maybeObject.item)) {
    return maybeObject.item;
  }

  if (isNbr6118Entry(maybeObject.entry)) {
    return maybeObject.entry;
  }

  if (isNbr6118Entry(maybeObject.data)) {
    return maybeObject.data;
  }

  return null;
};

const toErrorMessage = (status: number, fallback: string): string => {
  return `Erro ${status}: ${fallback}`;
};

export async function getNbr6118Tables(): Promise<Nbr6118Entry[]> {
  const response = await requestApi<unknown>(buildPublicApiUrl(`${STANDARDS_BASE_PATH}/tables`));

  if (!response.ok) {
    throw new Nbr6118ApiError(toErrorMessage(response.status, 'Falha ao carregar tabelas da NBR 6118.'), response.status);
  }

  return normalizeEntryList(response.data).filter(hasEditorialTableId);
}

export async function getNbr6118TableById(tableId: string): Promise<Nbr6118Entry | null> {
  const response = await requestApi<unknown>(
    buildPublicApiUrl(`${STANDARDS_BASE_PATH}/tables/${encodeURIComponent(tableId)}`),
  );

  if (!response.ok) {
    throw new Nbr6118ApiError(toErrorMessage(response.status, 'Falha ao carregar tabela da NBR 6118.'), response.status);
  }

  return normalizeSingleEntry(response.data);
}

export async function getNbr6118EntryBySourceId(sourceId: string): Promise<Nbr6118Entry | null> {
  const response = await requestApi<unknown>(
    buildPublicApiUrl(`${STANDARDS_BASE_PATH}/entries/${encodeURIComponent(sourceId)}`),
  );

  if (!response.ok) {
    throw new Nbr6118ApiError(toErrorMessage(response.status, 'Falha ao carregar entrada da NBR 6118.'), response.status);
  }

  return normalizeSingleEntry(response.data);
}
