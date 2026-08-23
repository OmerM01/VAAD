#!/usr/bin/env python3
"""
Builds the demo building that the "try it" buttons on the sign-in screen open.

Run it once to create the accounts and fill them with content:

    python scripts/seed_demo.py

It is safe to re-run: accounts that already exist are signed into rather than
created. To start the content over, first run the wipe block printed at the end
in the Supabase SQL editor, then run this again.

Reads NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and DEMO_PASSWORD
from .env.local.
"""

import json
import re
import sys
import time
import urllib.error
import urllib.request
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOMAIN = "vaad-demo.app"
VAAD_EMAIL = f"demo.vaad@{DOMAIN}"
DAYAR_EMAIL = f"demo.dayar@{DOMAIN}"


def load_env():
    env = {}
    for line in (ROOT / ".env.local").read_text(encoding="utf-8").splitlines():
        match = re.match(r"^([A-Z0-9_]+)=(.*)$", line.strip())
        if match:
            env[match.group(1)] = match.group(2)
    missing = [
        k
        for k in ("NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "DEMO_PASSWORD")
        if k not in env
    ]
    if missing:
        sys.exit(f"missing in .env.local: {', '.join(missing)}")
    return env


ENV = load_env()
URL = ENV["NEXT_PUBLIC_SUPABASE_URL"]
KEY = ENV["NEXT_PUBLIC_SUPABASE_ANON_KEY"]
PASSWORD = ENV["DEMO_PASSWORD"]


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


def account(email):
    """Signs in, creating the account first if it is not there yet."""
    status, data = call(
        "POST", "/auth/v1/token?grant_type=password", {"email": email, "password": PASSWORD}
    )
    if status == 200 and data.get("access_token"):
        return data["access_token"], False

    status, data = call("POST", "/auth/v1/signup", {"email": email, "password": PASSWORD})
    token = (data or {}).get("access_token")
    if not token:
        sys.exit(f"could not create {email}: {status} {data}\nIs 'Confirm email' still on?")
    time.sleep(0.4)  # stay under the auth rate limit
    return token, True


def rpc(token, fn, args=None):
    return call("POST", f"/rest/v1/rpc/{fn}", args or {}, token)


def get(token, path):
    return call("GET", f"/rest/v1/{path}", token=token)


def insert(token, table, row, select=None):
    path = f"/rest/v1/{table}" + (f"?select={select}" if select else "")
    return call("POST", path, row, token, {"Prefer": "return=representation"})


def uid(token):
    return call("GET", "/auth/v1/user", token=token)[1]["id"]


NOW = datetime.now(timezone.utc)


def ago(days=0, hours=0):
    return (NOW - timedelta(days=days, hours=hours)).isoformat()


def ahead(days):
    return (NOW + timedelta(days=days)).isoformat()


def day(offset):
    return (date.today() - timedelta(days=offset)).isoformat()


# ---------------------------------------------------------------------------
#  Residents
# ---------------------------------------------------------------------------

# (key, name, apartment, role) — the first two are the accounts the buttons use
PEOPLE = [
    ("vaad", "מיכל אברמוב", "3", "vaad"),
    ("dayar", "דניאל רוזן", "7", "dayar"),
    ("yael", "יעל שטרן", "1", "vaad"),
    ("avi", "אבי לוינסון", "4", "dayar"),
    ("neta", "נטע בן-חיים", "6", "dayar"),
    ("omer", "עומר קדוש", "9", "dayar"),
    ("ronit", "רונית פלד", "12", "dayar"),
]

print("accounts")
tokens = {}
for key, name, apt, role in PEOPLE:
    email = VAAD_EMAIL if key == "vaad" else DAYAR_EMAIL if key == "dayar" else f"demo.{key}@{DOMAIN}"
    token, created = account(email)
    tokens[key] = token
    print(f"  {'created' if created else 'exists '}  {email}")

# ---------------------------------------------------------------------------
#  Building
# ---------------------------------------------------------------------------

existing = get(tokens["vaad"], "buildings?select=id,name")[1]
if existing:
    BUILDING = existing[0]["id"]
    print(f"\nbuilding already set up: {existing[0]['name']}")
else:
    status, rows = rpc(
        tokens["vaad"],
        "create_building",
        {
            "p_name": "רוטשילד 42",
            "p_address": "רוטשילד 42, רמת גן",
            "p_full_name": "מיכל אברמוב",
            "p_apartment_number": "3",
        },
    )
    BUILDING = rows[0]["building_id"]
    codes = rows[0]
    print(f"\nbuilding created — dayar code {codes['dayar_code']}, vaad code {codes['vaad_code']}")

    for key, name, apt, role in PEOPLE[1:]:
        code = codes["vaad_code"] if role == "vaad" else codes["dayar_code"]
        rpc(
            tokens[key],
            "join_building",
            {"p_invite_code": code, "p_full_name": name, "p_apartment_number": apt},
        )
        print(f"  joined  {name} ({role})")

USERS = {key: uid(token) for key, token in tokens.items()}

if get(tokens["vaad"], "faults?select=id&limit=1")[1]:
    print("\ncontent already present — nothing to add")
    print("\nto rebuild it, run this in the Supabase SQL editor and then re-run this script:")
    sys.exit(0)

# ---------------------------------------------------------------------------
#  Faults
# ---------------------------------------------------------------------------

FAULTS = [
    ("dayar", "המעלית נעצרת בין קומה 2 ל-3", "קרה לי שלוש פעמים השבוע. הדלת נפתחת רק אחרי כמה שניות ארוכות.", "elevator", "in_progress", 6),
    ("neta", "תאורת החירום בחדר המדרגות לא נדלקת", "בדקתי בקומה 2 ובקומה 5, בשתיהן כבויה.", "electricity", "open", 3),
    ("omer", "אין מים חמים בקומה 3 בשעות הבוקר", None, "plumbing", "open", 2),
    ("yael", "סדק בקיר החיצוני בצד הדרומי", "הסדק התארך מאז החורף. מצורף למעקב.", "structure", "open", 11),
    ("omer", "שער החניה נסגר לאט ולפעמים נתקע", "לפעמים נשאר פתוח לגמרי אחרי שרכב עובר.", "parking", "in_progress", 14),
    ("avi", "דלת הכניסה לא ננעלת אוטומטית", "הקפיץ נראה שבור.", "structure", "in_progress", 9),
    ("avi", "נזילה בתקרת החניון, ליד עמוד 4", "שלולית קבועה כבר שבוע.", "plumbing", "closed", 34),
    ("ronit", "לכלוך מצטבר בפיר האשפה", "ריח חזק בקומות התחתונות.", "cleaning", "closed", 41),
    ("dayar", "הברז בגינה דולף כל הלילה", None, "plumbing", "closed", 52),
    ("neta", "נורה שרופה בכניסה לבניין", "חשוך לגמרי בערב.", "electricity", "closed", 67),
]

print("\nfaults")
for who, title, desc, category, status, days in FAULTS:
    status_code, data = insert(
        tokens[who],
        "faults",
        {
            "building_id": BUILDING,
            "reported_by": USERS[who],
            "title": title,
            "description": desc,
            "category": category,
            "created_at": ago(days),
        },
        select="id",
    )
    if status_code != 201:
        print("  FAILED", title, status_code, data)
        continue
    if status != "open":
        call(
            "PATCH",
            f"/rest/v1/faults?id=eq.{data[0]['id']}",
            {"status": status},
            tokens["vaad"],
        )
    print(f"  {status:12s} {title}")

# ---------------------------------------------------------------------------
#  Budget
# ---------------------------------------------------------------------------

DUES = 2800
LEDGER = [
    ("income", DUES, "דמי ועד — אפריל", 137),
    ("expense", 850, "ניקיון חדר מדרגות — אפריל", 132),
    ("expense", 400, "גינון — אפריל", 130),
    ("expense", 618, "תחזוקת מעליות — רבעון שני", 126),
    ("income", DUES, "דמי ועד — מאי", 107),
    ("expense", 850, "ניקיון חדר מדרגות — מאי", 102),
    ("expense", 400, "גינון — מאי", 100),
    ("expense", 437, "חשמל שטחים משותפים", 96),
    ("income", DUES, "דמי ועד — יוני", 76),
    ("expense", 850, "ניקיון חדר מדרגות — יוני", 71),
    ("expense", 400, "גינון — יוני", 69),
    ("expense", 1240, "תיקון נזילה בתקרת החניון", 63),
    ("income", 320, "החזר מחברת הביטוח", 58),
    ("income", DUES, "דמי ועד — יולי", 45),
    ("expense", 850, "ניקיון חדר מדרגות — יולי", 40),
    ("expense", 400, "גינון — יולי", 38),
    ("expense", 618, "תחזוקת מעליות — רבעון שלישי", 34),
    ("expense", 452, "חשמל שטחים משותפים", 30),
    ("income", DUES, "דמי ועד — אוגוסט", 14),
    ("expense", 850, "ניקיון חדר מדרגות — אוגוסט", 9),
    ("expense", 400, "גינון — אוגוסט", 7),
    ("expense", 289, "החלפת נורות בחניון", 5),
]

print("\nbudget")
tx_ids = []
for kind, amount, description, days in LEDGER:
    # alternate between the two committee members; the token has to belong to
    # whoever the row is credited to, or the insert policy rejects it
    author = "vaad" if days % 2 == 0 else "yael"
    status_code, data = insert(
        tokens[author],
        "budget_transactions",
        {
            "building_id": BUILDING,
            "created_by": USERS[author],
            "type": kind,
            "amount": amount,
            "description": description,
            "date": day(days),
        },
        select="id",
    )
    if status_code == 201:
        tx_ids.append((data[0]["id"], description))
print(f"  {len(tx_ids)} transactions recorded")

# one entry was a mistake, corrected the honest way
mistake = next((i for i, d in tx_ids if d == "החלפת נורות בחניון"), None)
if mistake:
    rpc(tokens["vaad"], "reverse_transaction", {"p_transaction_id": mistake})
    print("  1 of them cancelled by a correcting entry")

# ---------------------------------------------------------------------------
#  Proposals and votes
# ---------------------------------------------------------------------------

PROPOSALS = [
    {
        "by": "vaad",
        "title": "להתקין מצלמות אבטחה בכניסה ובחניון",
        "desc": "קיבלנו שתי הצעות מחיר. הזולה עומדת על 6,400 ש\"ח לארבע מצלמות כולל התקנה ושנה אחריות. ההקלטה נשמרת שבועיים ונגישה רק לחברי הוועד.",
        "anon": False,
        "created": 4,
        "closes": ahead(5),
        "votes": [("dayar", "for", False), ("yael", "for", False), ("avi", "for", True), ("neta", "against", True)],
    },
    {
        "by": "avi",
        "title": "להחליף את חברת הניקיון",
        "desc": "השירות ירד מאוד בחצי השנה האחרונה. חדר המדרגות מנוקה פעם בשבוע במקום פעמיים, ופיר האשפה כמעט לא נשטף.",
        "anon": True,
        "created": 2,
        "closes": ahead(12),
        "votes": [("neta", "for", False), ("ronit", "for", True)],
    },
    {
        "by": "yael",
        "title": "לשפץ את לובי הכניסה",
        "desc": "צביעה, תאורה חדשה ותיבות דואר. אומדן ראשוני: 9,000 ש\"ח.",
        "anon": False,
        "created": 58,
        "closes": ago(24),
        "votes": [("vaad", "for", False), ("dayar", "for", False), ("neta", "for", True),
                  ("omer", "for", False), ("ronit", "for", False), ("avi", "against", False),
                  ("yael", "against", True)],
    },
    {
        "by": "omer",
        "title": "להוסיף עמדת טעינה לרכב חשמלי בחניון",
        "desc": "שני דיירים כבר עברו לרכב חשמלי. העלות המשוערת 11,000 ש\"ח, ואפשר לגבות תשלום לפי שימוש.",
        "anon": True,
        "created": 92,
        "closes": ago(62),
        "votes": [("vaad", "against", False), ("yael", "against", False), ("ronit", "against", True),
                  ("avi", "against", False), ("dayar", "for", False), ("neta", "for", True)],
    },
    {
        "by": "vaad",
        "title": "לרכוש גנרטור גיבוי למעלית",
        "desc": "אחרי ההפסקה הארוכה בחורף. עלות 7,500 ש\"ח, מתוך יתרת הקופה.",
        "anon": False,
        "created": 124,
        "closes": ago(94),
        "votes": [("dayar", "for", False), ("yael", "for", False), ("neta", "for", False),
                  ("omer", "for", True), ("avi", "against", False)],
    },
]

print("\nproposals")
for spec in PROPOSALS:
    status_code, data = insert(
        tokens[spec["by"]],
        "proposals",
        {
            "building_id": BUILDING,
            "created_by": USERS[spec["by"]],
            "title": spec["title"],
            "description": spec["desc"],
            "creator_anonymous": spec["anon"],
            "closes_at": spec["closes"],
            "created_at": ago(spec["created"]),
        },
        select="id",
    )
    if status_code != 201:
        print("  FAILED", spec["title"], status_code, data)
        continue
    pid = data[0]["id"]

    # a closed proposal cannot take votes through the RPC, so the ballots go in
    # directly — the votes policy still pins each row to its own voter
    for who, choice, anon in spec["votes"]:
        insert(
            tokens[who],
            "votes",
            {"proposal_id": pid, "user_id": USERS[who], "vote": choice, "voter_anonymous": anon},
            select="id",
        )
    tally = f"{sum(1 for v in spec['votes'] if v[1] == 'for')}-{sum(1 for v in spec['votes'] if v[1] == 'against')}"
    print(f"  {tally:5s} {'anon ' if spec['anon'] else '     '} {spec['title']}")

print("\ndone.")
print(f"  vaad   {VAAD_EMAIL}")
print(f"  dayar  {DAYAR_EMAIL}")
print("\nTo rebuild the content later, run this in the Supabase SQL editor,")
print("then run this script again:\n")
print(f"""  delete from public.votes v using public.proposals p
   where v.proposal_id = p.id and p.building_id = '{BUILDING}';
  delete from public.proposals where building_id = '{BUILDING}';
  delete from public.budget_transactions where building_id = '{BUILDING}';
  delete from public.faults where building_id = '{BUILDING}';""")
