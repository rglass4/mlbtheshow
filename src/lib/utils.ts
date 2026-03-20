export const formatPct = (value: number | null | undefined, digits = 3): string => {
  if (value === null || value === undefined || Number.isNaN(value)) return '--';
  return value.toFixed(digits).replace(/^0/, '');
};

export const formatOneDecimal = (value: number | null | undefined): string => {
  if (value === null || value === undefined || Number.isNaN(value)) return '--';
  return value.toFixed(1);
};

export const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export const parseInteger = (value: string | null | undefined): number | null => {
  if (!value) return null;
  const parsed = Number.parseInt(value.replace(/[^\d-]/g, ''), 10);
  return Number.isFinite(parsed) ? parsed : null;
};

export const parseFloatSafe = (value: string | null | undefined): number | null => {
  if (!value) return null;
  const parsed = Number.parseFloat(value.replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
};

export const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const formatGameResult = (userScore: number, opponentScore: number): 'W' | 'L' | 'T' => {
  if (userScore > opponentScore) return 'W';
  if (userScore < opponentScore) return 'L';
  return 'T';
};

export const inningsToDecimal = (value: number): number => {
  const whole = Math.trunc(value);
  const fractional = Math.round((value - whole) * 10);
  return whole + fractional / 3;
};
