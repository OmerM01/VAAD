import type { FaultCategory, FaultStatus } from '@/lib/database.types';

export const FAULT_STATUSES: {
  id: FaultStatus;
  label: string;
  badge: string;
  short: string;
}[] = [
  { id: 'open', label: 'פתוח', short: 'פתוחות', badge: 'badge-open' },
  { id: 'in_progress', label: 'בטיפול', short: 'בטיפול', badge: 'badge-progress' },
  { id: 'closed', label: 'סגור', short: 'סגורות', badge: 'badge-closed' },
];

export const STATUS_LABEL: Record<FaultStatus, string> = {
  open: 'פתוח',
  in_progress: 'בטיפול',
  closed: 'סגור',
};

export const STATUS_BADGE: Record<FaultStatus, string> = {
  open: 'badge-open',
  in_progress: 'badge-progress',
  closed: 'badge-closed',
};

export const FAULT_CATEGORIES: { id: FaultCategory; label: string }[] = [
  { id: 'elevator', label: 'מעלית' },
  { id: 'plumbing', label: 'אינסטלציה' },
  { id: 'electricity', label: 'חשמל' },
  { id: 'cleaning', label: 'ניקיון' },
  { id: 'parking', label: 'חניה' },
  { id: 'structure', label: 'מבנה ותשתיות' },
  { id: 'other', label: 'אחר' },
];

export const CATEGORY_LABEL = Object.fromEntries(
  FAULT_CATEGORIES.map((c) => [c.id, c.label]),
) as Record<FaultCategory, string>;

export function isFaultStatus(value: unknown): value is FaultStatus {
  return value === 'open' || value === 'in_progress' || value === 'closed';
}

export function isFaultCategory(value: unknown): value is FaultCategory {
  return FAULT_CATEGORIES.some((c) => c.id === value);
}
