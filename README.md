# Expiry Date Monitoring & Food Waste Reduction

A low-code system that helps a supermarket sell products **before they expire** instead of throwing them away.
Every morning it checks all expiry dates, gives products a discount, tells the manager and the staff what to do, and shows customers today's offers.

Built in one week by a team of 7 with **PostgreSQL (Supabase)**, **n8n** and **Budibase**.

---

## The problem and the idea

Supermarkets lose money and waste food when products pass their expiry date unnoticed.
This system:

1. **Finds** products that expire within 3 days, or have already expired.
2. **Discounts** them automatically: 30% when 0–1 days are left, 20% when 2–3 days are left.
3. **Tells people:** the manager gets one report, and each employee gets an alert for their own department.
4. **Sells** them: customers see the discounted products on a public offers page.

## Who uses it

| User | What they do | Where |
|---|---|---|
| **Manager** | Sees the whole store, manages products, departments and employees, gets the daily report | Budibase manager screens + email |
| **Employee** | Sees and updates only their department's stock, gets a daily department alert | Budibase employee screens + email |
| **Customer** | Sees today's discounted products, no login needed | Public offers page (QR code) |
| **n8n** (automatic) | Every morning: calculates and saves discounts, sends the emails | n8n Cloud |

## Team

| # | Member | Part | Folder |
|---|---|---|---|
| 1 | Sandra | Team lead & integration, architecture, test plan | `docs/` |
| 2 | Cindra | Database (shared Supabase, views, sample data, ER diagram) | `database/` |
| 3 | Nilsha | n8n expiry automation + manager report email | `n8n/expiry-check.json` |
| 4 | Nayma | Department alerts, email layouts, optional Gemini AI | `n8n/notifications.json`, `n8n/email-templates/` |
| 5 | Prionto | Manager dashboard (Admin) | `dashboards/` |
| 6 | Sachini | Employee dashboard, login and roles | `dashboards/` |
| 7 | Tpraiz | Customer offers page, QR code, final report and slides | `dashboards/`, `docs/` |

Tasks and schedule: [PROJECT_PLAN.md](PROJECT_PLAN.md).

---

## How it works

All parts share **one PostgreSQL database** on Supabase. The database is the contract between the parts. Nothing is sent directly between n8n and Budibase, so the emails and the app always show the same numbers.

```
                ┌──────────── Shared Supabase (PostgreSQL) ────────────┐
                │  tables: departments · employees · products          │
                │  views:  products_live · customer_offers             │
                └──────▲────────────────────▲─────────────────▲────────┘
                       │ writes             │ reads / edits   │ reads
                       │                    │                 │
        n8n Cloud                      Budibase app        Public offers page
        8:00 expiry check + manager    manager screens     (Budibase, no login)
             report  (Member 3)        employee screens
        8:15 department alerts         login + roles
             (Member 4)
                       │
                       ▼
                     Gmail ──► manager and employees ──► "See today's offers" button
```

### A day in the system

| Time | What happens |
|---|---|
| During the day | Employees add or update stock in Budibase. |
| **8:00 AM** | n8n `expiry-check.json` saves the discount and action for every product, then emails the manager one HTML report with all products that need attention. No products → no email. |
| **8:15 AM** | n8n `notifications.json` emails each active employee only their own department's products. |
| Any time | Customers open the offers page and see the discounted, in-stock, not expired products. |

### Discount rules

The same rules are used in n8n, in the database views and in both emails.

| Days left | Discount | Action |
|---|---|---|
| Expired | 0% | EXPIRED - Remove from shelf |
| 0–1 | 30% | Apply 30% discount |
| 2–3 | 20% | Apply 20% discount |
| More than 3 | 0% | No action |

Products with `quantity = 0` are not shown in the emails or on the offers page.
The views `products_live` and `customer_offers` calculate the discount from today's date every time they are read, so the app is correct even before n8n runs.

### Live app

- **App:** https://yuvtuhj0b.budibase.app/app/default%20workspace/supermarket-dashbord
- **Public offers page:** the same link + `#/public-offers`

Use the published link above, not the Budibase builder link (the builder asks for a builder login).

---

## Repository structure

```
database/
  database.sql              schema, views, RLS and sample data (resets everything!)
  refresh-demo-dates.sql    moves the sample expiry dates to today, deletes nothing
  add-product-images.sql    adds picture columns to an existing database
  merge-duplicate-stock.sql adding the same product + expiry date raises the quantity
                            instead of creating a new row
  product-images/           product and department pictures
n8n/
  expiry-check.json         Member 3: daily discounts + manager report
  notifications.json        Member 4: department alerts (+ optional Gemini)
  email-templates/          HTML layouts + readable copies of the email code
  screenshots/
dashboards/
  screenshots/              screenshots of every Budibase screen
docs/
  diagrams/                 architecture, workflow and ER diagrams, test screenshots
  report-sections/          one report section per member
  test-plan.md              end-to-end test cases
archive/
  google-sheets-version/    first prototype with Google Sheets (not used)
.claude/skills/
  discount-check/SKILL.md   team skill: checks the discount rule is the same everywhere
.github/                    pull request template
.env.example                names of the connection settings (no real values)
AGENTS.md                   rules for AI coding agents working in this repo
PROJECT_PLAN.md             1-week plan, tasks and demo script
```

Every part folder has its own README with the detailed setup:
[database](database/README.md) · [n8n](n8n/README.md) · [email layouts](n8n/email-templates/README.md) · [dashboards](dashboards/README.md) · [docs](docs/README.md)

---

## Getting started

### 1. Get the code

```
git clone <your-fork-url>
cd <repo-folder>
git checkout -b <your-branch>
```

The main repo is `sandra1-8/Supermarket-handler`, branch **`master`**. Work on a branch in your fork and open a Pull Request to `master`.

### 2. Database

- **Shared database (team):** Cindra shares the connection details in the private group chat. Don't create the tables again.
- **Your own test database (optional):** create a free Supabase project → **SQL Editor** → paste `database/database.sql` → **Run**.

Details: [database/README.md](database/README.md).

### 3. n8n

1. In n8n, **Import → From File** → `n8n/expiry-check.json` or `n8n/notifications.json`.
2. Create a **Postgres** credential with the **Session pooler** details (n8n Cloud can't use the direct connection). Turn on SSL **Require** and **Ignore SSL Issues**.
3. Sign in with Google in the Gmail node and set a real **To** address (`manager@example.com` is a placeholder).
4. **Execute** to test. **Publish** turns on the daily schedule. Publish each workflow in **one** n8n workspace only, otherwise everyone gets every email twice.

Details: [n8n/README.md](n8n/README.md).

### 4. Budibase

One shared Budibase app connected to the same PostgreSQL database. Each member edits only their own screens.
Roles: **Admin** (manager), **Basic** (employee), **Public** (offers page).

Details: [dashboards/README.md](dashboards/README.md).

---

## Testing and demo

- Test cases: [docs/test-plan.md](docs/test-plan.md). They cover the database, n8n, emails, login and roles, dashboards, the offers page and an end-to-end run.
- **Demo script** (about 5 minutes):
  1. An employee logs in, sees only their department and adds milk expiring tomorrow.
  2. Run the n8n workflow. The milk gets a 30% discount.
  3. The manager gets the report and the department employee gets their alert.
  4. Click "See today's offers" in the email or scan the QR code. Milk is shown at 30% off.
  5. The manager logs in, the overview updates and the manager adds a new employee to Bakery.
  6. The employee tries to open a manager screen and gets access denied.
- Before the demo, run `database/refresh-demo-dates.sql` on the shared database (only after the team agrees) so the sample dates are fresh.

## Report

Each member writes their section in `docs/report-sections/` (copy `TEMPLATE.md`). Tpraiz combines them into the final report. Outline: [docs/README.md](docs/README.md).

---

## Team rules

- **Never run `database.sql` on the shared database.** It drops all tables and deletes everyone's data. Use `refresh-demo-dates.sql` instead.
- **Don't rename tables or columns** without telling the team.
- **Change only your own files.** In Budibase, edit only your own screens.
- **No secrets in GitHub.** Passwords, API keys and the shared database details go only in the credential screens and the private group chat. Keep placeholders like `manager@example.com`, and check n8n exports for personal email addresses before committing.
- One branch per member and one Pull Request per change, merged by Sandra.
- **AI coding agents** must follow [AGENTS.md](AGENTS.md). Before a demo, or after changing the discount rule, run the `discount-check` skill. It only reports and changes nothing.

## Future scope

- **Gemini AI tips** in the department email (built into `notifications.json`, switched off and not tested yet).
- Discounts that also look at the quantity in stock, not only the days left.
