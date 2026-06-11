# Slingshotz Telemarketing CRM

A production CRM for prospecting, call logging, follow-ups, event leads, and sales pipeline management.

**Architecture:** `index.html` (frontend, GitHub Pages) → GET query params → Google Apps Script Web App (`api.gs`) → Google Sheets (database). Every route returns JSON `{ok: true/false, ...}`.

- `api.gs` contains **backend code only** — no HTML.
- `index.html` contains **frontend only** — no backend code.
- Keep `api.gs` as the **only** script file in the Apps Script project. Every `.gs` file executes, so backup copies cause duplicate-function failures.

---

## 1. Deployment

### A. Google Sheets + Apps Script (backend)

1. Create (or open) the Google Spreadsheet that will hold the CRM data. If you already have `COMPANY MASTER` with the ~1,978 companies, use that spreadsheet — the column headers must match:
   `COMPANY ID, COMPANY NAME, INDUSTRY / CATEGORY, PRIMARY CONTACT, TITLE, PHONE, MOBILE, EMAIL, OTHER CONTACTS, EVENTS PARTICIPATED, POSSIBLE REQUIREMENTS`
2. In the spreadsheet: **Extensions → Apps Script**. Delete everything in the editor and paste the full contents of `api.gs`. (Because the script is bound to the sheet, leave `SPREADSHEET_ID = ''`.)
3. **Save**, then run `setupSheets` once from the editor (▶ Run) and authorize. This creates all missing sheets + headers and seeds the 4 users (ARN, MRY, BRN, MGO — all PIN `1111`; change PINs from Users/Settings after first login).
4. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Copy the Web App URL (ends in `/exec`).

> **Re-deploying after code changes:** Deploy → **Manage deployments** → pencil icon → Version: **New version** → Deploy. Editing code without deploying a new version does NOT update the live URL.

### B. GitHub Pages (frontend)

1. Open `index.html` and paste your `/exec` URL into `API_URL` near the top of the `<script>` block.
2. Push/upload `index.html` to your GitHub repo (root or `/docs` per your Pages settings).
3. Repo → Settings → Pages → make sure Pages is serving the branch/folder containing `index.html`.
4. Open your Pages URL and **hard refresh** (Cmd+Shift+R / Ctrl+Shift+R) so the browser drops the cached old version.

---

## 2. Direct route tests (run BEFORE trusting the frontend)

Replace `<URL>` with your `/exec` URL. Each should return JSON with `"ok": true`.

| # | Test | URL |
|---|------|-----|
| 1 | Login | `<URL>?action=login&mode=DEMO&code=ARN&pin=1111` → `{ok:true, user:{code:"ARN", role:"MANAGER", ...}}` |
| 2 | Company load | `<URL>?action=getCallQueue&mode=DEMO&user=ARN` → `{ok:true, count:~1978, companies:[...]}` |
| 3 | Agent dashboard | `<URL>?action=getAgentDashboardReport&mode=DEMO&user=BRN` → `{ok:true, counts:{targets, followups, callsLogged, ...}, followups:[...]}` |
| 4 | Manager dashboard | `<URL>?action=getManagerDashboardReport&mode=DEMO&fromDate=2026-06-01&toDate=2026-06-30&agent=BRN` → `{ok:true, kpis:{...}, lists:{...}, snapshot:[...], attention:[...]}` |
| 5 | Work trail | `<URL>?action=getWorkTrailRange&mode=DEMO&fromDate=2026-06-01&toDate=2026-06-30&user=BRN` → `{ok:true, entries:[...]}` (shows call logs even if activity log is empty) |
| 6 | Events | `<URL>?action=getEvents&mode=DEMO&range=all` → `{ok:true, events:[...]}` |

Other useful direct tests:
- `<URL>?action=setup` — idempotent; creates missing sheets, seeds users if USERS is empty.
- `<URL>` (no action) — returns the full route list.
- `<URL>?action=logCall&mode=DEMO&user=BRN&companyId=<ID>&result=ASKED%20TO%20CALL%20BACK&notes=test` — writes a demo call.

---

## 3. What each sheet does

| Sheet | Purpose |
|---|---|
| `COMPANY MASTER` | Source of all ~1,978 companies. Never deleted/reset. Shared by both modes (read-only source for DEMO; only manager Edit Company writes to it). |
| `COMPANY STATUS` / `DEMO COMPANY STATUS` | Latest state per company: owner, account status, latest result/next action/deadline, client event, attempt + follow-up counts. Upserted on every call log. |
| `CALL LOG` / `DEMO CALL LOG` | Append-only history of every call. The authoritative source for dashboards, follow-ups, and the work trail. |
| `DAILY ACTION LIST` / `DEMO DAILY ACTION LIST` | Each agent's self-built target list. Rows are PENDING → DONE (or REMOVED). Retry results keep the row PENDING up to 3 attempts. |
| `USERS` | User codes, PINs, roles, active flag, permissions. Shared by both modes. Login is always validated here, server-side. |
| `APP ACTIVITY LOG` / `DEMO APP ACTIVITY LOG` | Breadcrumbs: logins, targets added/removed, company edits, event changes, user admin, mode switches. |
| `EVENT MASTER` / `DEMO EVENT MASTER` | Event leads. Deletes are soft (`DELETED = TRUE`); rows are never physically removed. |

## 4. DEMO vs LIVE mode

- Every read/write route takes `mode=DEMO|LIVE`. DEMO operations only touch the `DEMO *` sheets — LIVE operational data can never be polluted by training/testing.
- `COMPANY MASTER` and `USERS` are shared across modes. A `DEMO COMPANY STATUS` sheet exists so demo call logging never writes to the live status sheet.
- The frontend starts in DEMO. Managers (and agents explicitly granted `CAN SWITCH LIVE`) can switch; switching **to LIVE shows a confirmation warning**. Other agents never see the switch.
- **Reset Demo Data** (Users/Settings, manager-only) clears all `DEMO *` sheets and leaves LIVE + COMPANY MASTER untouched.

## 5. Business rules implemented

- **Call results** — exactly the 13 agreed values, validated server-side.
- **Meaningful** = ASKED TO CALL BACK, BIDDING REQUIREMENT, COMPANY PROFILE SENT, both MEETING SET results, EVENT IDENTIFIED. First meaningful result sets ACCOUNT OWNER + OWNERSHIP DATE; follow-ups are owner/agent-specific.
- **Retry** = NO ANSWER, BUSY / TRY AGAIN, CONTACT PERSON NOT AVAILABLE → stays in target list up to 3 attempts, then DONE + account status RESEARCH NEEDED.
- **Follow-ups** = latest call per company that is one of the four follow-up-worthy results (even with **no date** — shown as “Needs follow-up date”) OR any non-closed result with a saved follow-up date. The dashboard card, the My Follow-Ups tab, and the manager Follow-Ups Due drilldown all use this single backend computation, so counts always match the lists.
- **Work Trail** merges APP ACTIVITY LOG + CALL LOG (call-log breadcrumbs are skipped to avoid double counting) — it is never empty when calls exist.
- **Date parsing** accepts TIMESTAMP, CREATED AT, and DATE LOGGED columns.
- **Quality score** = conversion% × 0.6 + min(40, meetings×8 + bids×6 + profiles sent×2), capped at 100.

## 6. Confirmations

- ✅ No HTML inside Apps Script — `api.gs` is pure backend JavaScript.
- ✅ No backend code inside `index.html` — it only calls the web app via `fetch` GET.
- ✅ Single backend file, single frontend file, unique function names, all braces verified (`node --check` passes on both).
