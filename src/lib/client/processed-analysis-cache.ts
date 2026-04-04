'use client';

export interface PersistedProcessedAnalysisRecord<TRequest = unknown, TResult = unknown> {
  moduleKey: string;
  sessionKey: string;
  signature: string;
  requestBody: TRequest;
  result: TResult;
  processedAt: string;
}

type StoredProcessedAnalysisRecord<TRequest = unknown, TResult = unknown> =
  PersistedProcessedAnalysisRecord<TRequest, TResult> & {
    storageKey: string;
  };

const DB_NAME = 'eng-solution-processed-analyses';
const DB_VERSION = 1;
const STORE_NAME = 'processed_analyses';

function buildStorageKey(moduleKey: string, sessionKey: string, signature: string) {
  return `${moduleKey}::${sessionKey}::${signature}`;
}

function openProcessedAnalysisDb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || typeof window.indexedDB === 'undefined') {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'storageKey' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
    request.onblocked = () => resolve(null);
  });
}

export function getOrCreateProcessedAnalysisSessionKey(moduleKey: string): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const storageKey = `eng-solution:${moduleKey}:analysis-session`;

  try {
    const existing = window.sessionStorage.getItem(storageKey);
    if (existing) {
      return existing;
    }

    const next =
      typeof window.crypto?.randomUUID === 'function'
        ? window.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    window.sessionStorage.setItem(storageKey, next);
    return next;
  } catch {
    return null;
  }
}

export async function saveProcessedAnalysis<TRequest = unknown, TResult = unknown>(
  record: PersistedProcessedAnalysisRecord<TRequest, TResult>,
): Promise<void> {
  const db = await openProcessedAnalysisDb();
  if (!db) {
    return;
  }

  await new Promise<void>((resolve) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put({
      ...record,
      storageKey: buildStorageKey(record.moduleKey, record.sessionKey, record.signature),
    } satisfies StoredProcessedAnalysisRecord<TRequest, TResult>);

    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => resolve();
    transaction.onabort = () => resolve();
  });

  db.close();
}

export async function loadProcessedAnalysis<TRequest = unknown, TResult = unknown>(params: {
  moduleKey: string;
  sessionKey: string;
  signature: string;
}): Promise<PersistedProcessedAnalysisRecord<TRequest, TResult> | null> {
  const db = await openProcessedAnalysisDb();
  if (!db) {
    return null;
  }

  const record = await new Promise<PersistedProcessedAnalysisRecord<TRequest, TResult> | null>((resolve) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(buildStorageKey(params.moduleKey, params.sessionKey, params.signature));

    request.onsuccess = () => {
      const result = request.result as StoredProcessedAnalysisRecord<TRequest, TResult> | undefined;
      if (!result) {
        resolve(null);
        return;
      }

      const { storageKey, ...rest } = result;
      void storageKey;
      resolve(rest);
    };
    request.onerror = () => resolve(null);
    transaction.onerror = () => resolve(null);
    transaction.onabort = () => resolve(null);
  });

  db.close();
  return record;
}
