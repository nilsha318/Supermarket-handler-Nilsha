# AGENTS.md: instructions for AI coding agents

This file tells an AI coding agent (Claude Code, Copilot, Cursor …) how to work in this repository.
Read it before you change anything.

## The project

**FreshSave: Expiry Date Monitoring & Food Waste Reduction.** A low-code system that helps a supermarket
sell products before they expire.

| Part | Tool | Folder |
|---|---|---|
| Database | PostgreSQL on Supabase | `database/` |
| Daily expiry check and emails | n8n (workflow JSON exports) | `n8n/` |
| Screens, login and roles | Budibase (built in the Budibase builder, not in this repo) | `dashboards/` (docs and screenshots only) |
| Report, diagrams, test plan | Markdown, PNG/SVG | `docs/` |

Three kinds of users:
- **Customer** (Budibase role Public): sees today's offers, no login.
- **Employee** (role Basic): sees and updates only their own department.
- **Manager** (role Admin): sees everything and manages employees.

## The contract: do not break it

- `database/database.sql` defines all tables and views. **Never rename or drop a table, view or column**
  without the team agreeing first. n8n and Budibase depend on these names.
- Tables: `departments`, `employees`, `products`. Views: `products_live`, `customer_offers`.
- **Read** from `products_live`; **add, edit and delete** go to `products`.
- Running `database.sql` again **deletes all data**. Never run it on the shared database.
  For changes to an existing database, write a separate script (like `database/add-product-images.sql`).

## The discount rule (the same everywhere)

| Days left | `discount_percent` | `action` |
|---|---|---|
| less than 0 | 0 | `EXPIRED - Remove from shelf` |
| 0 to 1 | 30 | `Apply 30% discount` |
| 2 to 3 | 20 | `Apply 20% discount` |
| more than 3 | 0 | `No action` |

If you change this rule, change it in **all three places together**: the `products_live` view,
the n8n expiry workflow (`n8n/expiry-check.json`) and the department emails (`n8n/notifications.json`).
Use the skill `discount-check` to verify them.

## Secrets: never

- Never read, print, copy or commit `.env` or any file with real passwords or API keys.
- Never put a secret into code, a workflow JSON, a screenshot, the slides, a log or the chat.
- `.env.example` holds the **names** of settings only. Real values live in the n8n and Budibase
  credential screens and are shared in the team's private chat.
- Before you finish, search your changes for `password`, `key`, `token` and `secret`.

## Security rules

- Hiding a button is **not** protection. Every role must be checked on the server (Budibase screen
  roles and table/query permissions).
- The `employees` table is Admin-only (read and write). Do not loosen this.
- The login email in Budibase must match `employees.email` exactly; the employee page uses it to
  find the department.

## How to work

1. Plan first, then change one thing at a time. Show the diff before you accept it.
2. Change only the files of the task you were given. Each team member owns their own folder
   (see `PROJECT_PLAN.md`).
3. Never commit or push unless a team member asks you to. Never push to `main`; use your branch and a pull request.
4. Use the pull request checklist in `.github/pull_request_template.md`.
5. Write plain, short English in docs. Dates are relative to today in the sample data, so do not hard-code dates.

## How to test

- Database: run the check query at the end of `database/database.sql` in a **personal** Supabase project.
  Expected: Apply 30% = 16, Apply 20% = 10, EXPIRED = 7, No action = 26.
- n8n: run the workflow manually and check the email (expired, today, 1–3 days, nothing expiring).
- Security: without a login, staff tables and queries must answer 401; an employee asking for manager
  data must answer 403; the public offers must answer 200. See `docs/test-plan.md`.
