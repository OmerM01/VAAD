import type { PostKind, PostStatus } from '@/lib/database.types';

export const POST_KINDS: {
  id: PostKind;
  label: string;
  short: string;
  hint: string;
  badge: string;
}[] = [
  {
    id: 'offer',
    label: 'מציע שירות',
    short: 'הצעות',
    hint: 'בייביסיטר, הוצאת כלבים, שיעורים פרטיים',
    badge: 'badge-brand',
  },
  {
    id: 'request',
    label: 'מחפש שירות',
    short: 'מחפשים',
    hint: 'מישהו שישקה עציצים, יאסוף חבילה, ישמור על הכלב',
    badge: 'badge-progress',
  },
  {
    id: 'group_buy',
    label: 'קנייה מרוכזת',
    short: 'קניות',
    hint: 'ארגז ירקות מחקלאי, הזמנה קבוצתית, משלוח משותף',
    badge: 'badge-closed',
  },
  {
    id: 'lending',
    label: 'השאלת ציוד',
    short: 'השאלות',
    hint: 'מקדחה, סולם, מזוודה, כיסאות לאירוח',
    badge: 'badge-neutral',
  },
  {
    id: 'other',
    label: 'אחר',
    short: 'אחר',
    hint: 'שיתופי פעולה, המלצות, כל דבר אחר',
    badge: 'badge-open',
  },
];

export const KIND_LABEL = Object.fromEntries(
  POST_KINDS.map((k) => [k.id, k.label]),
) as Record<PostKind, string>;

export const KIND_BADGE = Object.fromEntries(
  POST_KINDS.map((k) => [k.id, k.badge]),
) as Record<PostKind, string>;

export function isPostKind(value: unknown): value is PostKind {
  return POST_KINDS.some((k) => k.id === value);
}

/** Mirrors post_effective_status() in the schema. */
export function effectiveStatus(
  status: PostStatus,
  expiresAt: string | null,
): PostStatus {
  if (status === 'closed') return 'closed';
  if (expiresAt && Date.parse(expiresAt) <= Date.now()) return 'closed';
  return 'active';
}

/** How long a notice stays up, offered as presets rather than a date picker. */
export const POST_DURATIONS: { days: number; label: string }[] = [
  { days: 7, label: 'שבוע' },
  { days: 14, label: 'שבועיים' },
  { days: 30, label: 'חודש' },
  { days: 90, label: 'שלושה חודשים' },
];
