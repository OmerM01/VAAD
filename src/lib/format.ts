const RTF = new Intl.RelativeTimeFormat('he', { numeric: 'auto' });

const DATE = new Intl.DateTimeFormat('he-IL', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const DATE_TIME = new Intl.DateTimeFormat('he-IL', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const SHEKEL = new Intl.NumberFormat('he-IL', {
  style: 'currency',
  currency: 'ILS',
  maximumFractionDigits: 2,
});

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
];

/**
 * ICU's Hebrew data renders singular and dual forms as "לפני דקה (1)" and
 * "לפני יומיים (2)". The parenthetical count reads badly in a sentence, so
 * strip it.
 */
function tidy(value: string): string {
  return value.replace(/\s*\(\d+\)$/, '');
}

/** Rendered on the server, so there is no hydration mismatch. */
export function relativeTime(iso: string): string {
  const seconds = (Date.parse(iso) - Date.now()) / 1000;
  const abs = Math.abs(seconds);

  if (abs < 60) return 'הרגע';

  for (const [unit, size] of UNITS) {
    if (abs >= size) return tidy(RTF.format(Math.round(seconds / size), unit));
  }
  return tidy(RTF.format(Math.round(seconds / 60), 'minute'));
}

export function formatDate(iso: string): string {
  return DATE.format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return DATE_TIME.format(new Date(iso));
}

export function formatMoney(amount: number): string {
  return SHEKEL.format(amount);
}

const MONTH = new Intl.DateTimeFormat('he-IL', { month: 'long', year: 'numeric' });

/** "אוגוסט 2026" from a YYYY-MM key. */
export function formatMonth(yearMonth: string): string {
  return MONTH.format(new Date(`${yearMonth}-01T00:00:00`));
}

const DAY = new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'short' });

export function formatDay(iso: string): string {
  return DAY.format(new Date(`${iso}T00:00:00`));
}

const HOUR_IN_ISRAEL = new Intl.DateTimeFormat('he-IL', {
  hour: 'numeric',
  hour12: false,
  timeZone: 'Asia/Jerusalem',
});

/**
 * Rendered on the server, so it must not use the server's own time zone.
 * Vercel runs on UTC, which would be three hours off for Israeli residents.
 */
export function greeting(): string {
  const hour = Number(HOUR_IN_ISRAEL.format(new Date()));
  if (hour < 5) return 'לילה טוב';
  if (hour < 12) return 'בוקר טוב';
  if (hour < 16) return 'צהריים טובים';
  if (hour < 19) return 'אחר צהריים טובים';
  return 'ערב טוב';
}
