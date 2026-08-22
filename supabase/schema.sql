-- =============================================================================
--  ועד בית דיגיטלי  —  Database schema, RLS policies and server-side RPCs
--  Run this whole file once in the Supabase SQL Editor.
--  It is idempotent: safe to re-run after edits.
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
--  Enums
-- -----------------------------------------------------------------------------
do $$ begin create type public.user_role        as enum ('dayar', 'vaad');                exception when duplicate_object then null; end $$;
do $$ begin create type public.fault_status     as enum ('open', 'in_progress', 'closed'); exception when duplicate_object then null; end $$;
do $$ begin create type public.fault_category   as enum ('elevator','plumbing','electricity','cleaning','parking','structure','other'); exception when duplicate_object then null; end $$;
do $$ begin create type public.transaction_type as enum ('income', 'expense');             exception when duplicate_object then null; end $$;
do $$ begin create type public.proposal_status  as enum ('open', 'closed');                exception when duplicate_object then null; end $$;
do $$ begin create type public.vote_choice      as enum ('for', 'against');                exception when duplicate_object then null; end $$;

-- -----------------------------------------------------------------------------
--  Tables
-- -----------------------------------------------------------------------------

create table if not exists public.buildings (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null check (length(btrim(name)) between 2 and 120),
  address            text check (address is null or length(btrim(address)) <= 200),
  dayar_invite_code  text not null unique,
  vaad_invite_code   text not null unique,
  created_at         timestamptz not null default now(),
  constraint buildings_codes_differ check (dayar_invite_code <> vaad_invite_code)
);

create table if not exists public.users (
  id               uuid primary key references auth.users (id) on delete cascade,
  building_id      uuid not null references public.buildings (id) on delete cascade,
  full_name        text not null check (length(btrim(full_name)) between 2 and 80),
  apartment_number text check (apartment_number is null or length(btrim(apartment_number)) <= 10),
  role             public.user_role not null default 'dayar',
  created_at       timestamptz not null default now()
);
create index if not exists users_building_idx on public.users (building_id);

-- watermark for the notification bell: everything newer than this is "new"
alter table public.users
  add column if not exists notifications_seen_at timestamptz not null default now();

create table if not exists public.faults (
  id          uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings (id) on delete cascade,
  reported_by uuid not null references public.users (id) on delete cascade,
  title       text not null check (length(btrim(title)) between 3 and 120),
  description text check (description is null or length(description) <= 2000),
  category    public.fault_category not null default 'other',
  status      public.fault_status not null default 'open',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists faults_building_idx on public.faults (building_id, status, created_at desc);

create table if not exists public.budget_transactions (
  id          uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings (id) on delete cascade,
  created_by  uuid not null references public.users (id) on delete cascade,
  type        public.transaction_type not null,
  amount      numeric(12,2) not null check (amount > 0),
  description text not null check (length(btrim(description)) between 2 and 200),
  date        date not null default current_date,
  created_at  timestamptz not null default now()
);
-- A recorded transaction is never edited or deleted. A mistake is corrected by
-- a mirror transaction pointing back at it, which keeps the audit trail intact.
alter table public.budget_transactions
  add column if not exists reverses_id uuid
  references public.budget_transactions (id) on delete cascade;

create unique index if not exists budget_reverses_once
  on public.budget_transactions (reverses_id) where reverses_id is not null;

create index if not exists budget_building_idx on public.budget_transactions (building_id, date desc);

create table if not exists public.proposals (
  id                uuid primary key default gen_random_uuid(),
  building_id       uuid not null references public.buildings (id) on delete cascade,
  created_by        uuid not null references public.users (id) on delete cascade,
  title             text not null check (length(btrim(title)) between 3 and 120),
  description       text check (description is null or length(description) <= 2000),
  creator_anonymous boolean not null default false,
  closes_at         timestamptz,
  status            public.proposal_status not null default 'open',
  created_at        timestamptz not null default now()
);
create index if not exists proposals_building_idx on public.proposals (building_id, created_at desc);

create table if not exists public.votes (
  id              uuid primary key default gen_random_uuid(),
  proposal_id     uuid not null references public.proposals (id) on delete cascade,
  user_id         uuid not null references public.users (id) on delete cascade,
  vote            public.vote_choice not null,
  voter_anonymous boolean not null default false,
  created_at      timestamptz not null default now(),
  -- one vote per member per proposal
  constraint votes_one_per_user unique (proposal_id, user_id)
);
create index if not exists votes_proposal_idx on public.votes (proposal_id);

-- keep faults.updated_at fresh
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $fn$
begin new.updated_at := now(); return new; end $fn$;

drop trigger if exists faults_touch_updated_at on public.faults;
create trigger faults_touch_updated_at
  before update on public.faults
  for each row execute function public.touch_updated_at();

-- The foreign keys only cascade downwards: deleting a building removes its
-- members, but removing the last member used to leave the building behind as an
-- orphan — invisible to everyone, yet still holding two working invite codes.
-- This puts the building away once nobody is left in it.
--
-- The `b.id = old.building_id` predicate is what makes this safe in the other
-- direction too: when the building itself is being deleted, its members go via
-- the FK cascade and this trigger fires for each of them, but by then the
-- building row is no longer visible to the nested command, so the delete simply
-- matches nothing instead of recursing.
create or replace function public.drop_empty_building()
returns trigger
language plpgsql security definer set search_path = public
as $fn$
begin
  delete from public.buildings b
  where b.id = old.building_id
    and not exists (select 1 from public.users u where u.building_id = b.id);
  return null;
end $fn$;

drop trigger if exists users_drop_empty_building on public.users;
create trigger users_drop_empty_building
  after delete on public.users
  for each row execute function public.drop_empty_building();

-- =============================================================================
--  Identity helpers
--  SECURITY DEFINER so they can read public.users without re-triggering the RLS
--  policies that call them (which would recurse infinitely).
-- =============================================================================

create or replace function public.my_building_id()
returns uuid
language sql stable security definer set search_path = public
as $fn$ select building_id from public.users where id = auth.uid() $fn$;

create or replace function public.my_role()
returns public.user_role
language sql stable security definer set search_path = public
as $fn$ select role from public.users where id = auth.uid() $fn$;

create or replace function public.is_vaad()
returns boolean
language sql stable security definer set search_path = public
as $fn$ select coalesce((select role from public.users where id = auth.uid()) = 'vaad', false) $fn$;

-- =============================================================================
--  Row Level Security
-- =============================================================================

alter table public.buildings           enable row level security;
alter table public.users               enable row level security;
alter table public.faults              enable row level security;
alter table public.budget_transactions enable row level security;
alter table public.proposals           enable row level security;
alter table public.votes               enable row level security;

-- ---------- buildings ----------
-- Members read their own building only. Rows are created exclusively through
-- create_building(); invite codes are additionally hidden by the column grants.
drop policy if exists buildings_select_own on public.buildings;
create policy buildings_select_own on public.buildings
  for select to authenticated
  using (id = public.my_building_id());

-- ---------- users ----------
drop policy if exists users_select_same_building on public.users;
create policy users_select_same_building on public.users
  for select to authenticated
  using (building_id = public.my_building_id());

drop policy if exists users_update_self on public.users;
create policy users_update_self on public.users
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and building_id = public.my_building_id() and role = public.my_role());

-- ---------- faults ----------
drop policy if exists faults_select_building on public.faults;
create policy faults_select_building on public.faults
  for select to authenticated
  using (building_id = public.my_building_id());

drop policy if exists faults_insert_member on public.faults;
create policy faults_insert_member on public.faults
  for insert to authenticated
  with check (building_id = public.my_building_id() and reported_by = auth.uid());

-- status changes are a vaad-only capability, enforced here and not only in the UI
drop policy if exists faults_update_vaad on public.faults;
create policy faults_update_vaad on public.faults
  for update to authenticated
  using (building_id = public.my_building_id() and public.is_vaad())
  with check (building_id = public.my_building_id() and public.is_vaad());

-- ---------- budget_transactions ----------
drop policy if exists budget_select_building on public.budget_transactions;
create policy budget_select_building on public.budget_transactions
  for select to authenticated
  using (building_id = public.my_building_id());

drop policy if exists budget_insert_vaad on public.budget_transactions;
create policy budget_insert_vaad on public.budget_transactions
  for insert to authenticated
  with check (building_id = public.my_building_id() and created_by = auth.uid() and public.is_vaad());

-- ---------- proposals ----------
drop policy if exists proposals_select_building on public.proposals;
create policy proposals_select_building on public.proposals
  for select to authenticated
  using (building_id = public.my_building_id());

drop policy if exists proposals_insert_member on public.proposals;
create policy proposals_insert_member on public.proposals
  for insert to authenticated
  with check (building_id = public.my_building_id() and created_by = auth.uid());

-- ---------- votes ----------
-- A member may read only their own ballot. Everything aggregated goes through
-- get_proposal_results(), which is what makes voter_anonymous actually mean
-- something rather than being a display-only flag.
drop policy if exists votes_select_own on public.votes;
create policy votes_select_own on public.votes
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists votes_insert_own on public.votes;
create policy votes_insert_own on public.votes
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.proposals p
      where p.id = proposal_id and p.building_id = public.my_building_id()
    )
  );

-- =============================================================================
--  Column & table grants
--  Supabase grants ALL on public tables by default; we narrow that down.
-- =============================================================================

revoke all on public.buildings, public.users, public.faults,
              public.budget_transactions, public.proposals, public.votes
  from anon, authenticated;

-- Invite codes are deliberately NOT selectable — they are only ever matched
-- inside join_building(), handed back once by create_building(), and re-read
-- by vaad members through get_invite_codes().
grant select (id, name, address, created_at) on public.buildings to authenticated;

grant select on public.users to authenticated;
grant update (full_name, apartment_number) on public.users to authenticated;

grant select, insert on public.faults to authenticated;
grant update (status) on public.faults to authenticated;

grant select, insert on public.budget_transactions to authenticated;

-- created_by stays hidden so an anonymous proposal cannot be de-anonymised by
-- joining against public.users; names come from get_proposals() instead.
grant select (id, building_id, title, description, creator_anonymous,
              closes_at, status, created_at) on public.proposals to authenticated;
grant insert on public.proposals to authenticated;

grant select, insert on public.votes to authenticated;

-- =============================================================================
--  Onboarding RPCs
-- =============================================================================

create or replace function public.gen_invite_code()
returns text
language plpgsql volatile set search_path = public
as $fn$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- no look-alike chars
  code text := '';
  i int;
begin
  for i in 1..8 loop
    code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;
  return code;
end $fn$;

-- Creates a building and makes the caller its first vaad member.
create or replace function public.create_building(
  p_name             text,
  p_address          text,
  p_full_name        text,
  p_apartment_number text
)
returns table (building_id uuid, dayar_code text, vaad_code text)
language plpgsql volatile security definer set search_path = public
as $fn$
declare
  v_uid   uuid := auth.uid();
  v_id    uuid;
  v_dayar text;
  v_vaad  text;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if exists (select 1 from public.users where id = v_uid) then raise exception 'ALREADY_MEMBER'; end if;

  loop
    v_dayar := public.gen_invite_code();
    exit when not exists (
      select 1 from public.buildings b
      where b.dayar_invite_code = v_dayar or b.vaad_invite_code = v_dayar);
  end loop;

  loop
    v_vaad := public.gen_invite_code();
    exit when v_vaad <> v_dayar and not exists (
      select 1 from public.buildings b
      where b.dayar_invite_code = v_vaad or b.vaad_invite_code = v_vaad);
  end loop;

  insert into public.buildings (name, address, dayar_invite_code, vaad_invite_code)
  values (btrim(p_name), nullif(btrim(coalesce(p_address, '')), ''), v_dayar, v_vaad)
  returning id into v_id;

  insert into public.users (id, building_id, full_name, apartment_number, role)
  values (v_uid, v_id, btrim(p_full_name),
          nullif(btrim(coalesce(p_apartment_number, '')), ''), 'vaad');

  return query select v_id, v_dayar, v_vaad;
end $fn$;

-- Matches an invite code and attaches the caller to the right building + role.
create or replace function public.join_building(
  p_invite_code      text,
  p_full_name        text,
  p_apartment_number text
)
returns table (building_id uuid, building_name text, assigned_role public.user_role)
language plpgsql volatile security definer set search_path = public
as $fn$
declare
  v_uid  uuid := auth.uid();
  v_code text := upper(btrim(coalesce(p_invite_code, '')));
  v_b    public.buildings;
  v_role public.user_role;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if exists (select 1 from public.users where id = v_uid) then raise exception 'ALREADY_MEMBER'; end if;

  select * into v_b from public.buildings
  where dayar_invite_code = v_code or vaad_invite_code = v_code;

  if not found then raise exception 'INVALID_CODE'; end if;

  v_role := case when v_b.vaad_invite_code = v_code then 'vaad'::public.user_role
                 else 'dayar'::public.user_role end;

  insert into public.users (id, building_id, full_name, apartment_number, role)
  values (v_uid, v_b.id, btrim(p_full_name),
          nullif(btrim(coalesce(p_apartment_number, '')), ''), v_role);

  return query select v_b.id, v_b.name, v_role;
end $fn$;

-- The two codes, re-readable by vaad members only (dayarim never see them).
create or replace function public.get_invite_codes()
returns table (dayar_code text, vaad_code text)
language plpgsql stable security definer set search_path = public
as $fn$
begin
  if not public.is_vaad() then raise exception 'FORBIDDEN'; end if;
  return query
    select b.dayar_invite_code, b.vaad_invite_code
    from public.buildings b
    where b.id = public.my_building_id();
end $fn$;

-- =============================================================================
--  Budget
-- =============================================================================

-- Balance is always derived from the transactions, never stored on a column.
create or replace function public.get_building_budget_summary()
returns table (total_income numeric, total_expense numeric, balance numeric, tx_count int)
language sql stable set search_path = public
as $fn$
  select
    coalesce(sum(amount) filter (where type = 'income'),  0)::numeric,
    coalesce(sum(amount) filter (where type = 'expense'), 0)::numeric,
    (coalesce(sum(amount) filter (where type = 'income'),  0)
   - coalesce(sum(amount) filter (where type = 'expense'), 0))::numeric,
    count(*)::int
  from public.budget_transactions
  where building_id = public.my_building_id();
$fn$;

-- =============================================================================
--  Proposals & voting
-- =============================================================================

-- A proposal is closed either explicitly or once closes_at has passed.
create or replace function public.proposal_effective_status(
  p_status public.proposal_status, p_closes_at timestamptz)
returns public.proposal_status
language sql stable
as $fn$ select case when p_status = 'closed' or (p_closes_at is not null and p_closes_at <= now())
                    then 'closed'::public.proposal_status
                    else 'open'::public.proposal_status end $fn$;

create or replace function public.get_proposals(p_id uuid default null)
returns table (
  id                uuid,
  title             text,
  description       text,
  creator_anonymous boolean,
  creator_name      text,
  is_mine           boolean,
  closes_at         timestamptz,
  status            public.proposal_status,
  created_at        timestamptz,
  votes_for         int,
  votes_against     int,
  my_vote           public.vote_choice
)
language plpgsql stable security definer set search_path = public
as $fn$
declare
  v_uid uuid := auth.uid();
  v_bid uuid := public.my_building_id();
begin
  if v_bid is null then return; end if;
  return query
    select p.id, p.title, p.description, p.creator_anonymous,
           case when p.creator_anonymous then null else u.full_name end,
           (p.created_by = v_uid),
           p.closes_at,
           public.proposal_effective_status(p.status, p.closes_at),
           p.created_at,
           (select count(*) from public.votes v where v.proposal_id = p.id and v.vote = 'for')::int,
           (select count(*) from public.votes v where v.proposal_id = p.id and v.vote = 'against')::int,
           (select v.vote from public.votes v where v.proposal_id = p.id and v.user_id = v_uid)
    from public.proposals p
    join public.users u on u.id = p.created_by
    where p.building_id = v_bid
      and (p_id is null or p.id = p_id)
    order by public.proposal_effective_status(p.status, p.closes_at) asc, p.created_at desc;
end $fn$;

-- Tally plus, once the vote is closed, the roll of voters.
create or replace function public.get_proposal_results(p_proposal_id uuid)
returns table (
  votes_for     int,
  votes_against int,
  total_votes   int,
  is_closed     boolean,
  voters        jsonb
)
language plpgsql stable security definer set search_path = public
as $fn$
declare
  v_bid    uuid := public.my_building_id();
  v_p      public.proposals;
  v_closed boolean;
begin
  select * into v_p from public.proposals
  where id = p_proposal_id and building_id = v_bid;
  if not found then raise exception 'NOT_FOUND'; end if;

  v_closed := public.proposal_effective_status(v_p.status, v_p.closes_at) = 'closed';

  return query
    select
      (select count(*) from public.votes v where v.proposal_id = v_p.id and v.vote = 'for')::int,
      (select count(*) from public.votes v where v.proposal_id = v_p.id and v.vote = 'against')::int,
      (select count(*) from public.votes v where v.proposal_id = v_p.id)::int,
      v_closed,
      case when not v_closed then '[]'::jsonb else coalesce((
        select jsonb_agg(jsonb_build_object(
                 'name',      case when v.voter_anonymous then null else vu.full_name end,
                 'apartment', case when v.voter_anonymous then null else vu.apartment_number end,
                 'vote',      v.vote,
                 'anonymous', v.voter_anonymous)
               order by v.voter_anonymous asc, v.created_at asc)
        from public.votes v
        join public.users vu on vu.id = v.user_id
        where v.proposal_id = v_p.id), '[]'::jsonb) end;
end $fn$;

-- One ballot per member: checked before insert, and backed by a unique constraint.
create or replace function public.vote_on_proposal(
  p_proposal_id uuid,
  p_vote        public.vote_choice,
  p_anonymous   boolean default false
)
returns void
language plpgsql volatile security definer set search_path = public
as $fn$
declare
  v_uid uuid := auth.uid();
  v_p   public.proposals;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;

  select * into v_p from public.proposals
  where id = p_proposal_id and building_id = public.my_building_id();
  if not found then raise exception 'NOT_FOUND'; end if;

  if public.proposal_effective_status(v_p.status, v_p.closes_at) = 'closed' then
    raise exception 'PROPOSAL_CLOSED';
  end if;

  if exists (select 1 from public.votes where proposal_id = p_proposal_id and user_id = v_uid) then
    raise exception 'ALREADY_VOTED';
  end if;

  insert into public.votes (proposal_id, user_id, vote, voter_anonymous)
  values (p_proposal_id, v_uid, p_vote, coalesce(p_anonymous, false));
end $fn$;

-- Corrects a mistaken entry by recording its mirror image rather than editing or
-- deleting it, so the ledger stays append-only and the net balance still comes
-- out right.
create or replace function public.reverse_transaction(p_transaction_id uuid)
returns uuid
language plpgsql volatile security definer set search_path = public
as $fn$
declare
  v_uid uuid := auth.uid();
  v_tx  public.budget_transactions;
  v_new uuid;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if not public.is_vaad() then raise exception 'FORBIDDEN'; end if;

  select * into v_tx from public.budget_transactions
  where id = p_transaction_id and building_id = public.my_building_id();
  if not found then raise exception 'NOT_FOUND'; end if;

  if v_tx.reverses_id is not null then raise exception 'IS_A_REVERSAL'; end if;
  if exists (select 1 from public.budget_transactions t where t.reverses_id = v_tx.id) then
    raise exception 'ALREADY_REVERSED';
  end if;

  insert into public.budget_transactions
    (building_id, created_by, type, amount, description, date, reverses_id)
  values (
    v_tx.building_id, v_uid,
    case when v_tx.type = 'income' then 'expense'::public.transaction_type
         else 'income'::public.transaction_type end,
    v_tx.amount,
    left('ביטול: ' || v_tx.description, 200),
    current_date,
    v_tx.id)
  returning id into v_new;

  return v_new;
end $fn$;

-- Ends the voting early. Open to the member who raised the proposal — including
-- an anonymous one, since only they ever see the button — and to any vaad member.
create or replace function public.close_proposal(p_proposal_id uuid)
returns void
language plpgsql volatile security definer set search_path = public
as $fn$
declare
  v_uid uuid := auth.uid();
  v_p   public.proposals;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;

  select * into v_p from public.proposals
  where id = p_proposal_id and building_id = public.my_building_id();
  if not found then raise exception 'NOT_FOUND'; end if;

  if not (v_p.created_by = v_uid or public.is_vaad()) then raise exception 'FORBIDDEN'; end if;

  if public.proposal_effective_status(v_p.status, v_p.closes_at) = 'closed' then
    raise exception 'PROPOSAL_CLOSED';
  end if;

  update public.proposals set status = 'closed' where id = p_proposal_id;
end $fn$;

-- =============================================================================
--  Notifications
--
--  Derived on read from rows that already exist — there is no events table to
--  keep in sync and nothing to backfill. "New" means it happened after the
--  reader last opened the bell.
-- =============================================================================

create or replace function public.get_notifications(p_limit int default 30)
returns table (
  kind      text,
  entity_id uuid,
  title     text,
  detail    text,
  at        timestamptz,
  is_new    boolean
)
language plpgsql stable security definer set search_path = public
as $fn$
declare
  v_uid  uuid := auth.uid();
  v_bid  uuid := public.my_building_id();
  v_seen timestamptz;
begin
  if v_bid is null then return; end if;
  select u.notifications_seen_at into v_seen from public.users u where u.id = v_uid;

  return query
  with events as (
    -- someone else reported a fault
    select 'fault_new'::text as kind, f.id as entity_id, f.title as title,
           u.full_name || ' דיווח על תקלה חדשה' as detail,
           f.created_at as at
      from public.faults f
      join public.users u on u.id = f.reported_by
     where f.building_id = v_bid and f.reported_by <> v_uid

    union all
    -- a fault moved to another status
    select 'fault_status', f.id, f.title,
           case f.status
             when 'open'        then 'התקלה הוחזרה לסטטוס פתוח'
             when 'in_progress' then 'התקלה עברה לטיפול'
             else                    'התקלה נסגרה'
           end,
           f.updated_at
      from public.faults f
     where f.building_id = v_bid and f.updated_at > f.created_at

    union all
    -- money moved
    select 'transaction', t.id, t.description,
           case when t.reverses_id is not null then 'בוטלה תנועה על סך '
                when t.type = 'income'         then 'נרשמה הכנסה של '
                else                                'נרשמה הוצאה של '
           end || to_char(t.amount, 'FM999,999,990.00') || ' ש"ח',
           t.created_at
      from public.budget_transactions t
     where t.building_id = v_bid and t.created_by <> v_uid

    union all
    -- someone else raised a proposal; an anonymous one stays anonymous here too
    select 'proposal_new', p.id, p.title,
           case when p.creator_anonymous then 'הועלתה הצעה חדשה להצבעה'
                else u.full_name || ' העלה הצעה חדשה להצבעה' end,
           p.created_at
      from public.proposals p
      join public.users u on u.id = p.created_by
     where p.building_id = v_bid and p.created_by <> v_uid

    union all
    -- voting ended
    select 'proposal_closed', p.id, p.title,
           'ההצבעה על ההצעה נסגרה',
           coalesce(p.closes_at, p.created_at)
      from public.proposals p
     where p.building_id = v_bid
       and public.proposal_effective_status(p.status, p.closes_at) = 'closed'
  )
  select e.kind, e.entity_id, e.title, e.detail, e.at,
         (e.at > coalesce(v_seen, '-infinity'::timestamptz))
    from events e
   where e.at <= now()
   order by e.at desc
   limit greatest(1, least(coalesce(p_limit, 30), 100));
end $fn$;

create or replace function public.mark_notifications_seen()
returns void
language sql volatile security definer set search_path = public
as $fn$
  update public.users set notifications_seen_at = now() where id = auth.uid();
$fn$;

-- =============================================================================
--  Function grants
-- =============================================================================

revoke all on function public.gen_invite_code()                       from public, anon, authenticated;
revoke all on function public.create_building(text, text, text, text) from public, anon;
revoke all on function public.join_building(text, text, text)         from public, anon;
revoke all on function public.get_invite_codes()                      from public, anon;
revoke all on function public.get_building_budget_summary()           from public, anon;
revoke all on function public.get_proposals(uuid)                     from public, anon;
revoke all on function public.get_proposal_results(uuid)              from public, anon;
revoke all on function public.vote_on_proposal(uuid, public.vote_choice, boolean) from public, anon;
revoke all on function public.reverse_transaction(uuid)               from public, anon;
revoke all on function public.close_proposal(uuid)                    from public, anon;
revoke all on function public.get_notifications(int)                  from public, anon;
revoke all on function public.mark_notifications_seen()               from public, anon;

grant execute on function public.my_building_id()                        to authenticated;
grant execute on function public.my_role()                               to authenticated;
grant execute on function public.is_vaad()                               to authenticated;
grant execute on function public.proposal_effective_status(public.proposal_status, timestamptz) to authenticated;
grant execute on function public.create_building(text, text, text, text) to authenticated;
grant execute on function public.join_building(text, text, text)         to authenticated;
grant execute on function public.get_invite_codes()                      to authenticated;
grant execute on function public.get_building_budget_summary()           to authenticated;
grant execute on function public.get_proposals(uuid)                     to authenticated;
grant execute on function public.get_proposal_results(uuid)              to authenticated;
grant execute on function public.vote_on_proposal(uuid, public.vote_choice, boolean) to authenticated;
grant execute on function public.reverse_transaction(uuid)               to authenticated;
grant execute on function public.close_proposal(uuid)                    to authenticated;
grant execute on function public.get_notifications(int)                  to authenticated;
grant execute on function public.mark_notifications_seen()               to authenticated;
