/**
 * Turns raw Postgres / GoTrue errors into something a resident can act on.
 * The RPCs in schema.sql raise bare codes (INVALID_CODE, ALREADY_VOTED …) so
 * the wording lives here in one place rather than in the database.
 */

const MESSAGES: Record<string, string> = {
  // schema.sql RPCs
  AUTH_REQUIRED: 'צריך להתחבר מחדש כדי לבצע את הפעולה.',
  ALREADY_MEMBER: 'המשתמש הזה כבר משויך לבניין.',
  INVALID_CODE: 'קוד ההצטרפות לא נמצא. בדוק שהעתקת אותו במלואו.',
  FORBIDDEN: 'הפעולה הזו פתוחה לחברי ועד בלבד.',
  NOT_FOUND: 'הפריט המבוקש לא נמצא.',
  PROPOSAL_CLOSED: 'ההצבעה על ההצעה הזו כבר נסגרה.',
  ALREADY_VOTED: 'כבר הצבעת על ההצעה הזו.',

  // GoTrue
  'Invalid login credentials': 'אימייל או סיסמה שגויים.',
  'User already registered': 'כתובת האימייל הזו כבר רשומה. אפשר פשוט להתחבר.',
  'Email not confirmed': 'החשבון עדיין לא אומת מול האימייל.',
  'Signups not allowed for this instance': 'ההרשמה סגורה כרגע.',
};

const PG_CODES: Record<string, string> = {
  '23505': 'הרשומה כבר קיימת במערכת.',
  '23514': 'אחד השדות לא עומד בכללי התקינות.',
  '42501': 'אין לך הרשאה לבצע את הפעולה הזו.',
};

type SupabaseLikeError = {
  message?: string;
  code?: string;
} | null;

export function toHebrewError(
  error: SupabaseLikeError,
  fallback = 'משהו השתבש. נסה שוב בעוד רגע.',
): string {
  if (!error) return fallback;

  const raw = error.message ?? '';

  // plpgsql raises arrive as `AUTH_REQUIRED` or wrapped in a longer sentence
  for (const key of Object.keys(MESSAGES)) {
    if (raw === key || raw.includes(key)) return MESSAGES[key];
  }

  if (error.code && PG_CODES[error.code]) return PG_CODES[error.code];
  if (raw.toLowerCase().includes('password')) {
    return 'הסיסמה קצרה מדי — נדרשים לפחות 8 תווים.';
  }

  return fallback;
}
