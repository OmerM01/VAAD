import Link from 'next/link';

import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { getMembers } from '@/lib/members';
import { relativeTime } from '@/lib/format';
import { KIND_BADGE, KIND_LABEL, POST_KINDS, effectiveStatus, isPostKind } from '@/lib/board';
import type { NeighbourPost, PostInterest } from '@/lib/database.types';

import { NewPost } from './new-post';
import { ClosePostButton, InterestButton } from './post-actions';

export const metadata = { title: 'לוח שכנים' };

export default async function BoardPage({ searchParams }: PageProps<'/board'>) {
  const { kind, show } = await searchParams;
  const filter = isPostKind(kind) ? kind : null;
  const showClosed = show === 'closed';

  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: posts }, { data: interests }, members] = await Promise.all([
    supabase
      .from('neighbour_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .returns<NeighbourPost[]>(),
    supabase.from('post_interests').select('*').returns<PostInterest[]>(),
    getMembers(),
  ]);

  const all = (posts ?? []).map((post) => ({
    ...post,
    live: effectiveStatus(post.status, post.expires_at) === 'active',
  }));

  const byPost = new Map<string, PostInterest[]>();
  for (const row of interests ?? []) {
    const bucket = byPost.get(row.post_id);
    if (bucket) bucket.push(row);
    else byPost.set(row.post_id, [row]);
  }

  const active = all.filter((p) => p.live);
  const closed = all.filter((p) => !p.live);
  const pool = showClosed ? closed : active;
  const visible = filter ? pool.filter((p) => p.kind === filter) : pool;

  const counts = Object.fromEntries(
    POST_KINDS.map((k) => [k.id, active.filter((p) => p.kind === k.id).length]),
  );

  return (
    <div className="space-y-6">
      <div className="animate-rise flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">שכנים עוזרים לשכנים</span>
          <h1 className="mt-1 font-display text-3xl font-bold text-heading">
            לוח שכנים
          </h1>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-ink-2">
            בייביסיטר, הוצאת כלב, ארגז ירקות מחקלאי או מקדחה להשאלה. הלוח סגור
            לדיירי הבניין בלבד.
          </p>
        </div>
        <NewPost />
      </div>

      <div className="animate-rise flex flex-wrap gap-2">
        <Chip href="/board" active={filter === null && !showClosed} label="הכל" count={active.length} />
        {POST_KINDS.map((k) => (
          <Chip
            key={k.id}
            href={`/board?kind=${k.id}`}
            active={filter === k.id && !showClosed}
            label={k.short}
            count={counts[k.id]}
          />
        ))}
        <Chip href="/board?show=closed" active={showClosed} label="הסתיימו" count={closed.length} />
      </div>

      {visible.length === 0 ? (
        <EmptyState showClosed={showClosed} filtered={filter !== null} />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {visible.map((post, i) => {
            const author = members.get(post.created_by);
            const rows = byPost.get(post.id) ?? [];
            const mine = post.created_by === profile.id;
            const canRemove = post.live && (mine || profile.role === 'vaad');

            return (
              <li
                key={post.id}
                className="animate-rise"
                style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}
              >
                <article
                  className={`card flex h-full flex-col p-5 ${post.live ? '' : 'opacity-70'}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <span className={`badge ${KIND_BADGE[post.kind]}`}>
                      {KIND_LABEL[post.kind]}
                    </span>
                    {post.price_note && (
                      <span className="badge badge-neutral num">{post.price_note}</span>
                    )}
                  </div>

                  <h2 className="mt-3 font-display text-base leading-snug font-bold text-heading">
                    {post.title}
                  </h2>

                  {post.description && (
                    <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-wrap text-ink-2">
                      {post.description}
                    </p>
                  )}

                  {post.contact && post.live && (
                    <p className="mt-3 rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-ink">
                      <span className="text-xs font-semibold text-ink-3">ליצירת קשר: </span>
                      {post.contact}
                    </p>
                  )}

                  <div className="mt-4 flex-1" />

                  {rows.length > 0 && (
                    <p className="mb-3 text-xs leading-relaxed text-ink-3">
                      <span className="font-semibold">נרשמו: </span>
                      {rows
                        .map((r) => members.get(r.user_id)?.full_name ?? 'דייר')
                        .join(', ')}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
                    <span className="text-xs text-ink-3">
                      {author?.full_name ?? 'דייר'}
                      {author?.apartment_number && ` · דירה ${author.apartment_number}`}
                      {mine && ' (אתה)'}
                      {' · '}
                      {relativeTime(post.created_at)}
                    </span>

                    <span className="flex items-center gap-2">
                      {canRemove && <ClosePostButton postId={post.id} />}
                      {post.live && !mine && (
                        <InterestButton
                          postId={post.id}
                          interested={rows.some((r) => r.user_id === profile.id)}
                          count={rows.length}
                        />
                      )}
                      {post.live && mine && rows.length === 0 && (
                        <span className="text-xs text-ink-3">טרם נרשמו</span>
                      )}
                    </span>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Chip({
  href,
  active,
  label,
  count,
}: {
  href: string;
  active: boolean;
  label: string;
  count: number;
}) {
  return (
    <Link
      href={href as never}
      aria-current={active ? 'page' : undefined}
      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
        active
          ? 'border-cta bg-cta text-cta-ink'
          : 'border-line-strong bg-surface text-ink-2 hover:border-ink-3 hover:text-ink'
      }`}
    >
      {label}
      <span className={`num rounded-full px-1.5 text-xs ${active ? 'bg-white/20' : 'bg-paper text-ink-3'}`}>
        {count}
      </span>
    </Link>
  );
}

function EmptyState({ showClosed, filtered }: { showClosed: boolean; filtered: boolean }) {
  return (
    <div className="card-quiet animate-rise flex flex-col items-center px-6 py-14 text-center">
      <svg viewBox="0 0 48 48" className="h-12 w-12 text-line-strong" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="7" y="11" width="34" height="26" rx="3" />
        <path d="M14 20h12M14 27h20" strokeLinecap="round" />
      </svg>
      <p className="mt-4 font-display text-lg font-bold text-heading">
        {showClosed
          ? 'אין מודעות שהסתיימו'
          : filtered
            ? 'אין מודעות בקטגוריה הזו'
            : 'הלוח עדיין ריק'}
      </p>
      <p className="mt-1 max-w-sm text-sm leading-relaxed text-ink-2">
        {showClosed || filtered
          ? 'אפשר לבחור קטגוריה אחרת, או להציג את כל המודעות.'
          : 'מציעים בייביסיטר? מחפשים מישהו שיוציא את הכלב? מזמינים ירקות ורוצים שותפים? זה המקום.'}
      </p>
    </div>
  );
}
