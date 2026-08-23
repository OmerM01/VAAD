# Vaad Bait — building committee management

A web app for running a residential building committee: fault reports with a
visible status, a budget every resident can see, and proposals the building can
vote on, plus a board where they offer each other babysitting, dog walking, a
shared produce order or a drill to borrow. It supports many buildings at once. Each building keeps its own
residents, faults and budget, and there is no path by which a resident of one
building can reach another building's data.

Final project for a full-stack course. The interface is in Hebrew and
right-to-left.

**Live:** https://vaad-one.vercel.app

The sign-in screen offers a prepared demo building, as either a committee member
or a resident, so the app can be looked at without signing up. The two accounts
are ordinary members of an ordinary building: the permission model treats them
like anyone else, which is the point — the difference between the two buttons is
the real difference between the two roles.

## The problem

Building committees are usually run from a WhatsApp group plus a spreadsheet
only the treasurer can open. A resident reports a fault and never learns whether
anyone dealt with it, nobody really knows where the money goes, and suggestions
disappear into the group chat without a decision. This app gives each of those a
place: faults with a clear status, a budget open to everyone, and proposals that
close on a known date.

## Stack

| Layer  | Technology                                    |
| ------ | --------------------------------------------- |
| Front  | Next.js 16 (App Router), React 19, TypeScript |
| Style  | Tailwind CSS v4 with a project-specific theme |
| Back   | Supabase — Postgres, Auth, Row Level Security |
| Deploy | Vercel                                        |

## Roles

A building has two kinds of member:

- **Resident (`dayar`)** — reports faults, reads the budget, raises proposals and
  votes on them.
- **Committee member (`vaad`)** — everything a resident can do, plus updating
  fault statuses and recording budget transactions. A building can have several.

The first user to create a building becomes a committee member and receives two
invite codes, one per role. Everyone else signs up with a code, which decides
both the building and the role. After that, sign-in is email and password only.

## Running locally

```bash
npm install
cp .env.example .env.local   # then fill in the Supabase keys
npm run dev
```

### Database setup

1. Run [`supabase/schema.sql`](supabase/schema.sql) once in the Supabase SQL
   Editor. The file is idempotent and can be re-run after changes. The
   `Potential issue detected` warning is expected: the script contains
   `drop policy if exists` and `revoke`, both intentional.
2. Under **Authentication → Sign In / Providers → Email**, turn **Confirm email**
   off. Signup attaches the user to a building immediately after the account is
   created, which needs an active session at the end of signup.
3. Under **Authentication → URL Configuration**, set **Site URL** to the
   production address and add `http://localhost:3000/**` to **Redirect URLs**.
   Without this the password-reset link returns to the default address instead of
   the app: Supabase does not report an error for a URL that is not on the list,
   it simply ignores it.

### The demo building

```bash
python scripts/seed_demo.py
```

Creates seven residents, ten faults across every status and category, five
months of ledger entries including a cancelled one, and five proposals with
mixed anonymity. Set `DEMO_PASSWORD` in `.env.local` first; the buttons only
appear where that variable is present, so a deployment without it simply has no
demo. Re-running the script is safe — it prints the SQL to clear the content if
you want it rebuilt from scratch.

### Deploying

Import the repository on Vercel and set `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY` and `DEMO_PASSWORD` under
**Settings → Environment Variables**. No build configuration is needed; Vercel
detects Next.js on its own.

## Permission model

Permissions are enforced in Postgres, not in the interface. The UI hides
buttons; the database is what refuses.

- **Isolation between buildings.** Every table has an RLS policy filtering on the
  signed-in user's `building_id`. The helper `my_building_id()` is
  `SECURITY DEFINER` so that reading `public.users` from inside a policy does not
  recurse infinitely.
- **Committee actions.** Updating a fault status and recording a transaction are
  blocked by RLS for anyone whose `role <> 'vaad'`. The grant on `faults` is also
  narrowed to the `status` column, so not even a committee member can rewrite the
  title of a fault someone else reported.
- **Invite codes.** `dayar_invite_code` and `vaad_invite_code` are not selectable
  by `authenticated` (a column-level grant). A code is only ever matched inside
  `join_building()`, and committee members read theirs back through
  `get_invite_codes()`.
- **Anonymity.** `proposals.created_by` is not selectable at all, and on `votes` a
  member can read only their own row. Proposer and voter names come only from
  `SECURITY DEFINER` functions that honour the anonymity flags. Without this,
  "anonymous vote" would be a display-only flag: any resident could read the
  table through the API and see who voted what.
- **Derived balance.** There is no stored balance column.
  `get_building_budget_summary()` sums the transactions on read, so the balance
  cannot drift out of sync with the ledger.
- **One changeable ballot.** The unique index on `(proposal_id, user_id)` keeps
  a member to a single row. `vote_on_proposal()` upserts onto it instead of
  refusing a second call, so changing your mind replaces the earlier choice
  rather than adding a vote. Once the proposal closes, nothing is accepted.
- **Vote closing.** `proposal_effective_status()` derives a proposal's state from
  `closes_at` at read time, with no scheduled job. A proposal past its date is
  closed, and the voter roll opens at that moment. `close_proposal()` allows an
  early close by the member who raised it or by any committee member, including
  for an anonymous proposal: `is_mine` comes from a function that knows who the
  author is without revealing the name to anyone else.
- **Append-only ledger.** There is no `UPDATE` or `DELETE` on
  `budget_transactions`. A mistake is corrected through `reverse_transaction()`,
  which records a mirror entry of the same amount and opposite type pointing back
  at the original. The balance nets out because it is a sum of the rows, and a
  unique index on `reverses_id` prevents cancelling the same entry twice.
- **Notifications derived on read.** `get_notifications()` builds the feed with a
  `UNION` over existing rows. There is no events table to keep in sync and
  nothing to backfill, so the feed cannot contradict the data. It skips actions
  the reader performed, and an anonymous proposal is announced without a name.
  The `users.notifications_seen_at` watermark is not writable from the client.
- **The board is deliberately not anonymous.** `neighbour_posts.created_by` is
  readable, the opposite of `proposals.created_by`. A neighbour has to know
  whose door to knock on, so the same permission machinery is pointed the other
  way here on purpose. A notice can be taken down by its author or by any
  committee member, which is what keeps the board moderatable.
- **Orphan buildings.** Foreign keys only cascade downwards, so removing the last
  member used to leave a building behind: invisible, but still holding two valid
  invite codes. A trigger on member deletion drops a building once nobody is left
  in it.

## Tests

```bash
python tests/rls_test.py
```

The tests do not go through the Next.js app. They call the Supabase REST API
directly with an ordinary member's token, which is what a resident could do from
the browser console, so what passes there holds regardless of what the interface
shows. 109 checks covering role assignment by invite code, committee-only actions,
isolation between buildings, proposer and voter anonymity, one ballot per member
that the member may change while the vote is open, transaction reversal, early
vote closing, the notification feed, the neighbours' board and its moderation
rules, and zero access for a signed-out visitor.

Each run creates its own throwaway accounts and prints the cleanup statement at
the end.

## Layout

```
src/
  app/
    (auth)/            sign in, sign up, password reset
    (app)/             screens behind the permission check
      dashboard/       summary
      faults/          fault reports
      budget/          ledger
      proposals/       proposals and voting
      board/           the neighbours' board
    auth/reset/        password-reset callback
    welcome/           completes a signup that stopped before joining a building
  components/          shared UI
  lib/
    actions/           server actions
    database.types.ts  types mirroring the schema
    supabase/          server and proxy clients
  proxy.ts             session refresh and private-route guard
supabase/
  schema.sql           tables, RLS and server-side functions
scripts/
  seed_demo.py         fills the demo building
tests/
  rls_test.py          API-level security tests
```

## Not included

- Notifications are in-app only. Email and push would need an external mail
  service and a scheduled job, both outside the stack set for this project.
- No reminder before a vote closes; the feed reports the close after it happens.
- No file uploads, such as a photo of a fault or a scan of a receipt.
