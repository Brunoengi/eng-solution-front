const toFiniteNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
};

const isLegacyPositiveDownEnabled =
  process.env.NEXT_PUBLIC_LEGACY_Q_POSITIVE_DOWN === 'true';

export const normalizePointLoadFyForApi = (fy: unknown): number => {
  return toFiniteNumber(fy);
};

export const normalizeDistributedLoadQForApi = (q: unknown): number => {
  const numericQ = toFiniteNumber(q);

  if (isLegacyPositiveDownEnabled && numericQ > 0) {
    return -numericQ;
  }

  return numericQ;
};
