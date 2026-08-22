#!/usr/bin/env python3
"""
Security tests for the ועד בית schema.

These do not go through the Next.js app at all — they hit the Supabase REST API
directly with an ordinary member's token, which is exactly what a resident could
do from the browser console. Anything that passes here holds regardless of what
the UI chooses to show or hide.

    python tests/rls_test.py

Reads NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY from .env.local.
Each run creates its own throwaway accounts; the cleanup statement is printed at
the end.
"""

import json
import re
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RUN = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
DOMAIN = "rlstest.local"


# ---------------------------------------------------------------------------
#  Transport
# ---------------------------------------------------------------------------

def load_env():
    env = {}
    for line in (ROOT / ".env.local").read_text(encoding="utf-8").splitlines():
        match = re.match(r"^([A-Z0-9_]+)=(.*)$", line.strip())
        if match:
            env[match.group(1)] = match.group(2)
    try:
        return env["NEXT_PUBLIC_SUPABASE_URL"], env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]
    except KeyError:
        sys.exit("missing Supabase keys in .env.local")


URL, KEY = load_env()


def call(method, path, body=None, token=None, extra=None):
    headers = {"apikey": KEY, "Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if extra:
        headers.update(extra)
    req = urllib.request.Request(
        URL + path,
        data=json.dumps(body).encode() if body is not None else None,
        headers=headers,
        method=method,
    )
    try:
        with urllib.request.urlopen(req) as response:
            raw = response.read().decode()
            return response.status, (json.loads(raw) if raw.strip() else None)
    except urllib.error.HTTPError as error:
        raw = error.read().decode()
        try:
            return error.code, json.loads(raw)
        except json.JSONDecodeError:
            return error.code, raw


def sign_up(role):
    email = f"rls.{role}.{RUN}@{DOMAIN}"
    status, data = call("POST", "/auth/v1/signup",
                        {"email": email, "password": "TestPassword123!"})
    token = (data or {}).get("access_token")
    if not token:
        sys.exit(f"signup failed for {email}: {status} {data}\n"
                 "Is 'Confirm email' still enabled in the Supabase dashboard?")
    return token


def rpc(token, fn, args=None):
    return call("POST", f"/rest/v1/rpc/{fn}", args or {}, token)


def get(token, path):
    return call("GET", f"/rest/v1/{path}", token=token)


def insert(token, table, row, select="*"):
    path = f"/rest/v1/{table}" + (f"?select={select}" if select != "*" else "")
    return call("POST", path, row, token, {"Prefer": "return=representation"})


def patch(token, path, row):
    return call("PATCH", f"/rest/v1/{path}", row, token,
                {"Prefer": "return=representation"})


def uid(token):
    return call("GET", "/auth/v1/user", token=token)[1]["id"]


def future(**kwargs):
    return (datetime.now(timezone.utc) + timedelta(**kwargs)).isoformat()


# ---------------------------------------------------------------------------
#  Reporting
# ---------------------------------------------------------------------------

PASSED, FAILED = [], []


def section(title):
    print(f"\n\033[1m{title}\033[0m")


def check(name, condition, detail=""):
    if condition:
        PASSED.append(name)
        print(f"  \033[32mPASS\033[0m  {name}")
    else:
        FAILED.append(name)
        print(f"  \033[31mFAIL\033[0m  {name}")
        if detail:
            print(f"        {detail}")


def denied(status, data):
    """True when Postgres refused the write, whether by grant or by policy."""
    return status in (401, 403) or data == []


# ---------------------------------------------------------------------------
#  Fixtures: two separate buildings
# ---------------------------------------------------------------------------

section("setup")

T_VAAD = sign_up("vaad")
T_DAYAR = sign_up("dayar")
T_OTHER = sign_up("other")

status, rows = rpc(T_VAAD, "create_building", {
    "p_name": "הרצל 15", "p_address": "הרצל 15, תל אביב",
    "p_full_name": "אורי כהן", "p_apartment_number": "4",
})
BUILDING = rows[0]["building_id"]
DAYAR_CODE, VAAD_CODE = rows[0]["dayar_code"], rows[0]["vaad_code"]
check("building A created with two invite codes",
      len(DAYAR_CODE) == 8 and len(VAAD_CODE) == 8, f"{rows}")

status, rows = rpc(T_OTHER, "create_building", {
    "p_name": "ביאליק 3", "p_address": None,
    "p_full_name": "יוסי אבן", "p_apartment_number": "1",
})
check("building B created", status == 200 and rows, f"{status} {rows}")

U_VAAD, U_DAYAR, U_OTHER = uid(T_VAAD), uid(T_DAYAR), uid(T_OTHER)


# ---------------------------------------------------------------------------

section("invite codes decide the role, and stay hidden afterwards")

status, rows = rpc(T_DAYAR, "join_building", {
    "p_invite_code": DAYAR_CODE.lower(),  # lowercase, to test normalisation
    "p_full_name": "נועה לוי", "p_apartment_number": "7",
})
check("dayar code assigns role=dayar (case-insensitive)",
      rows and rows[0]["assigned_role"] == "dayar", f"{status} {rows}")

status, data = get(T_VAAD, "buildings?select=dayar_invite_code")
check("the code column is not selectable, even by a vaad member",
      status in (401, 403) or "42703" in json.dumps(data), f"{status} {data}")

status, data = rpc(T_DAYAR, "get_invite_codes")
check("get_invite_codes() is closed to a dayar",
      "FORBIDDEN" in json.dumps(data), f"{status} {data}")

status, data = rpc(T_VAAD, "get_invite_codes")
check("...but open to a vaad member", DAYAR_CODE in json.dumps(data), f"{data}")

status, data = rpc(T_DAYAR, "join_building", {
    "p_invite_code": VAAD_CODE, "p_full_name": "x", "p_apartment_number": None})
check("joining a second time is rejected",
      "ALREADY_MEMBER" in json.dumps(data), f"{data}")


# ---------------------------------------------------------------------------

section("faults: everyone reports, only vaad changes status")

status, data = insert(T_DAYAR, "faults", {
    "building_id": BUILDING, "reported_by": U_DAYAR,
    "title": "המעלית נתקעת בין קומה 2 ל-3", "category": "elevator",
})
check("a resident can report a fault", status == 201 and data[0]["status"] == "open",
      f"{status} {data}")
FAULT = data[0]["id"]

status, data = patch(T_DAYAR, f"faults?id=eq.{FAULT}", {"status": "closed"})
check("a resident cannot change the status", denied(status, data), f"{status} {data}")
check("...and the status really is unchanged",
      get(T_DAYAR, f"faults?id=eq.{FAULT}&select=status")[1][0]["status"] == "open")

status, data = patch(T_VAAD, f"faults?id=eq.{FAULT}", {"status": "in_progress"})
check("a vaad member can", status == 200 and data[0]["status"] == "in_progress",
      f"{status} {data}")
check("updated_at moved with it", data[0]["updated_at"] > data[0]["created_at"])

status, data = patch(T_VAAD, f"faults?id=eq.{FAULT}", {"title": "כותרת אחרת"})
check("not even a vaad member can rewrite the title", status in (401, 403),
      f"{status} {data}")

status, data = insert(T_DAYAR, "faults", {
    "building_id": BUILDING, "reported_by": U_VAAD,
    "title": "דיווח בשם מישהו אחר", "category": "other",
})
check("reported_by cannot be forged", denied(status, data), f"{status} {data}")


# ---------------------------------------------------------------------------

section("budget: everyone reads, only vaad writes, balance is derived")

status, data = insert(T_DAYAR, "budget_transactions", {
    "building_id": BUILDING, "created_by": U_DAYAR,
    "type": "income", "amount": 500, "description": "ניסיון של דייר",
})
check("a resident cannot record a transaction", denied(status, data), f"{status} {data}")

for kind, amount, text in [("income", 2400, "דמי ועד — אוגוסט"),
                           ("expense", 780.50, "תיקון משאבת מים")]:
    status, _ = insert(T_VAAD, "budget_transactions", {
        "building_id": BUILDING, "created_by": U_VAAD,
        "type": kind, "amount": amount, "description": text})
    check(f"a vaad member records a {kind}", status == 201)

status, data = get(T_DAYAR, "budget_transactions?select=id")
check("a resident reads the whole ledger", len(data) == 2, f"{data}")

summary = rpc(T_VAAD, "get_building_budget_summary")[1][0]
rows = get(T_VAAD, "budget_transactions?select=type,amount")[1]
manual = sum(float(r["amount"]) * (1 if r["type"] == "income" else -1) for r in rows)
check("the balance equals a manual sum of the rows",
      abs(float(summary["balance"]) - manual) < 0.001,
      f"rpc={summary['balance']} manual={manual}")

tx = get(T_VAAD, "budget_transactions?select=id&limit=1")[1][0]["id"]
status, data = patch(T_VAAD, f"budget_transactions?id=eq.{tx}", {"amount": 1})
check("a recorded amount cannot be edited", status in (401, 403), f"{status} {data}")

for label, row in [
    ("a negative amount is rejected", {"type": "income", "amount": -50, "description": "שלילי"}),
    ("a zero amount is rejected", {"type": "income", "amount": 0, "description": "אפס"}),
    ("an empty description is rejected", {"type": "income", "amount": 10, "description": " "}),
]:
    status, data = insert(T_VAAD, "budget_transactions",
                          {"building_id": BUILDING, "created_by": U_VAAD, **row})
    check(label, status in (400, 409), f"{status} {data}")


# ---------------------------------------------------------------------------

section("proposals: anonymity is a database property, not a display choice")

status, data = insert(T_DAYAR, "proposals", {
    "building_id": BUILDING, "created_by": U_DAYAR,
    "title": "להתקין מצלמות אבטחה בכניסה",
    "creator_anonymous": False, "closes_at": future(days=7),
}, select="id")
NAMED = data[0]["id"]

status, data = insert(T_DAYAR, "proposals", {
    "building_id": BUILDING, "created_by": U_DAYAR,
    "title": "להחליף את חברת הניקיון",
    "creator_anonymous": True, "closes_at": future(days=14),
}, select="id")
ANON = data[0]["id"]
check("both a named and an anonymous proposal were raised", status == 201)

status, data = get(T_VAAD, "proposals?select=created_by")
check("created_by is not selectable",
      status in (401, 403) or "42703" in json.dumps(data), f"{status} {data}")

status, data = get(T_VAAD, "proposals?select=*")
# `*` expands to every column, created_by included, so PostgREST refuses the
# whole request rather than quietly dropping the column.
check("select=* does not smuggle created_by out",
      status in (401, 403)
      or all("created_by" not in row for row in data), f"{status} {data}")

row = rpc(T_VAAD, "get_proposals", {"p_id": ANON})[1][0]
check("another member sees no author on an anonymous proposal",
      row["creator_name"] is None and row["is_mine"] is False, f"{row}")

row = rpc(T_DAYAR, "get_proposals", {"p_id": ANON})[1][0]
check("its author recognises it as theirs, still without a name",
      row["is_mine"] is True and row["creator_name"] is None, f"{row}")

row = rpc(T_VAAD, "get_proposals", {"p_id": NAMED})[1][0]
check("a named proposal does show its author", row["creator_name"] == "נועה לוי", f"{row}")


# ---------------------------------------------------------------------------

section("voting: one ballot each, secret until the vote closes")

status, data = rpc(T_DAYAR, "vote_on_proposal",
                   {"p_proposal_id": NAMED, "p_vote": "for", "p_anonymous": False})
check("the first ballot is accepted", status in (200, 204), f"{status} {data}")

status, data = rpc(T_DAYAR, "vote_on_proposal",
                   {"p_proposal_id": NAMED, "p_vote": "against", "p_anonymous": False})
check("a second ballot is refused", "ALREADY_VOTED" in json.dumps(data), f"{data}")

status, data = insert(T_DAYAR, "votes",
                      {"proposal_id": NAMED, "user_id": U_DAYAR, "vote": "against"},
                      select="id")
check("bypassing the RPC hits the unique constraint",
      status in (400, 409) and "23505" in json.dumps(data), f"{status} {data}")

status, data = insert(T_DAYAR, "votes",
                      {"proposal_id": ANON, "user_id": U_VAAD, "vote": "for"},
                      select="id")
check("a ballot cannot be cast on another member's behalf", denied(status, data),
      f"{status} {data}")

rpc(T_VAAD, "vote_on_proposal",
    {"p_proposal_id": NAMED, "p_vote": "against", "p_anonymous": True})

status, data = get(T_VAAD, f"votes?proposal_id=eq.{NAMED}&select=user_id,vote")
check("a member can read only their own ballot",
      len(data) == 1 and data[0]["user_id"] == U_VAAD, f"{data}")

results = rpc(T_VAAD, "get_proposal_results", {"p_proposal_id": NAMED})[1][0]
check("the running tally is public", results["votes_for"] == 1 and results["votes_against"] == 1,
      f"{results}")
check("the voter roll is withheld while the vote is open", results["voters"] == [],
      f"{results['voters']}")


# ---------------------------------------------------------------------------

section("the roll opens on time, and still honours anonymity")

# closes_at cannot be patched from a client, so the window is simply made short
status, data = insert(T_VAAD, "proposals", {
    "building_id": BUILDING, "created_by": U_VAAD,
    "title": "לשפץ את לובי הכניסה",
    "creator_anonymous": False, "closes_at": future(seconds=12),
}, select="id")
CLOSING = data[0]["id"]

rpc(T_VAAD, "vote_on_proposal",
    {"p_proposal_id": CLOSING, "p_vote": "for", "p_anonymous": False})
rpc(T_DAYAR, "vote_on_proposal",
    {"p_proposal_id": CLOSING, "p_vote": "against", "p_anonymous": True})

print("        (waiting for the voting window to close…)")
time.sleep(13)

results = rpc(T_DAYAR, "get_proposal_results", {"p_proposal_id": CLOSING})[1][0]
check("the proposal closed itself at closes_at", results["is_closed"] is True, f"{results}")

voters = results["voters"]
named = [v for v in voters if not v["anonymous"]]
anon = [v for v in voters if v["anonymous"]]
check("the roll now lists both ballots", len(voters) == 2, f"{voters}")
check("the named voter is identified", len(named) == 1 and named[0]["name"], f"{named}")
check("the anonymous voter carries no name and no apartment",
      len(anon) == 1 and anon[0]["name"] is None and anon[0]["apartment"] is None, f"{anon}")
check("...but their vote is still counted", anon[0]["vote"] == "against", f"{anon}")

status, data = rpc(T_VAAD, "vote_on_proposal",
                   {"p_proposal_id": CLOSING, "p_vote": "for", "p_anonymous": False})
check("a late ballot is refused", "ALREADY_VOTED" in json.dumps(data)
      or "PROPOSAL_CLOSED" in json.dumps(data), f"{data}")


# ---------------------------------------------------------------------------

section("buildings are sealed off from one another")

check("building B sees only its own building",
      len(get(T_OTHER, "buildings?select=id")[1]) == 1)
check("building B sees only its own member",
      len(get(T_OTHER, "users?select=id")[1]) == 1)
check("building B sees no faults", get(T_OTHER, "faults?select=id")[1] == [])
check("building B sees no transactions",
      get(T_OTHER, "budget_transactions?select=id")[1] == [])
check("building B's balance is zero",
      float(rpc(T_OTHER, "get_building_budget_summary")[1][0]["balance"]) == 0)
check("building B sees no proposals",
      rpc(T_OTHER, "get_proposals", {"p_id": None})[1] == [])

status, data = patch(T_OTHER, f"faults?id=eq.{FAULT}", {"status": "closed"})
check("building B cannot touch building A's fault", denied(status, data), f"{status} {data}")

status, data = insert(T_OTHER, "budget_transactions", {
    "building_id": BUILDING, "created_by": U_OTHER,
    "type": "expense", "amount": 10, "description": "החדרה"})
check("building B cannot plant a transaction in building A", denied(status, data),
      f"{status} {data}")

status, data = rpc(T_OTHER, "get_proposal_results", {"p_proposal_id": NAMED})
check("building B cannot read building A's results", "NOT_FOUND" in json.dumps(data),
      f"{data}")

status, data = rpc(T_OTHER, "vote_on_proposal",
                   {"p_proposal_id": NAMED, "p_vote": "for", "p_anonymous": False})
check("building B cannot vote in building A", "NOT_FOUND" in json.dumps(data), f"{data}")


# ---------------------------------------------------------------------------

section("an anonymous visitor gets nothing at all")

for table in ["buildings", "users", "faults", "budget_transactions", "proposals", "votes"]:
    status, _ = call("GET", f"/rest/v1/{table}?select=id&limit=1")
    check(f"anon is refused on {table}", status in (401, 403))


# ---------------------------------------------------------------------------

print()
print(f"\033[1m{len(PASSED)} passed, {len(FAILED)} failed\033[0m")
print()
print("clean up this run's accounts with:")
print(f"  delete from auth.users where email like 'rls.%.{RUN}@{DOMAIN}';")

sys.exit(1 if FAILED else 0)
