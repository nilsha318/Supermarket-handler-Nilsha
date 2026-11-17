# Setup and User Guide

How to **use** the Expiry Date Monitoring app, and how to **set up your own copy** of the whole system step by step.
For what the project is and how the parts work together, see the main [README](README.md).

> **Try the live app**
> - **Today's offers (customers, no login):** https://yuvtuhj0b.budibase.app/app/default%20workspace/supermarket-dashbord#/public-offers
> - **Staff app (manager and employees, login needed):** https://yuvtuhj0b.budibase.app/app/default%20workspace/supermarket-dashbord

---

## Use the app

| You are | Open | Login | What you can do |
|---|---|---|---|
| **Customer** | [Today's offers](https://yuvtuhj0b.budibase.app/app/default%20workspace/supermarket-dashbord#/public-offers) | No | See discounted products with old and new price, filter by department |
| **Manager** | [Staff app](https://yuvtuhj0b.budibase.app/app/default%20workspace/supermarket-dashbord) | Yes (Admin) | Overview of the whole store, add, edit and delete products, manage departments and employees |
| **Employee** | [Staff app](https://yuvtuhj0b.budibase.app/app/default%20workspace/supermarket-dashbord) | Yes (Basic) | See and update only your own department's stock, add new stock |

Staff logins are Budibase users invited by the team. Ask the team for an account. Your login email must be the same as your email in the `employees` table, because the app uses it to find your department.

The manager and the employees also get the daily emails (see [A day in the system](README.md#a-day-in-the-system)). The button in the manager email opens today's offers.

---

## Set up your own copy (step by step)

Follow these steps to run the whole system with your own accounts. It takes about an hour.

**You need** free accounts at [Supabase](https://supabase.com), [n8n Cloud](https://n8n.io) and [Budibase](https://budibase.com), plus a Gmail account to send the emails.

### Step 1: Get the code

```
git clone https://github.com/sandra1-8/Supermarket-handler.git
```

Or click **Code → Download ZIP** on GitHub.

### Step 2: Database (Supabase)

1. In Supabase, click **New project**. Write down the **database password**.
2. Open `database/database.sql` in an editor. Replace every `uxzoipytinpxyeaqpmyc` with **your project ID** (the part before `.supabase.co` in your project URL). Otherwise the pictures load from the original team's project.
3. **SQL Editor** → paste the whole `database.sql` → **Run**. This creates the 3 tables, the 2 views and the sample data (8 departments, 10 employees, 59 products).
4. Check: **Table Editor → products** shows 59 rows.
5. Pictures: **Storage → New bucket** named `product-images`, set to **Public**. Upload all `.jpg` files from `database/product-images/`.
6. Use real email addresses. The sample employees have `@example.com` addresses, which don't exist. For example:
   ```sql
   UPDATE employees SET email = 'your-email@gmail.com' WHERE full_name = 'Store Manager';
   UPDATE employees SET email = 'your-email@gmail.com' WHERE full_name = 'Anu Thomas';  -- Dairy
   ```
7. Get the connection details for n8n and Budibase: **Connect → Direct → Method: Session pooler → View parameters**.

| Field | Value |
|---|---|
| Host | `aws-0-<region>.pooler.supabase.com` |
| Port | `5432` |
| Database | `postgres` |
| User | `postgres.<project-id>` (with the dot) |
| Password | the database password from point 1 |

Keep these details private. Never put them in GitHub.

More: [database/README.md](database/README.md).

### Step 3: Staff app and offers page (Budibase)

The Budibase app is built in the Budibase builder, so the screens are not files in this repo. Build them like this:

1. In Budibase, click **Create app**.
2. **Data → Add source → PostgreSQL** → enter the Session pooler details from step 2, with SSL on → **Fetch tables**.
3. Build the screens:

   | Screen | Role | Reads | Writes |
   |---|---|---|---|
   | Manager overview, products, departments, employees | Admin | `products_live`, `departments`, `employees` | `products`, `departments`, `employees` |
   | Employee stock + add stock | Basic | `products_live`, filtered by `employees.email = {{ Current User.email }}` | `products` |
   | Public offers (`/public-offers`) | Public | `customer_offers` | nothing |

   Always **read** from the view `products_live` (it calculates today's discount) and **write** to the table `products`.
4. **Users → Invite** the manager as **Admin** and the employees as **Basic**, with the same emails as in the `employees` table.
5. Click **Publish** and copy the published link (`https://<your-tenant>.budibase.app/app/...`). Your offers page is that link + `#/public-offers`.

More: [dashboards/README.md](dashboards/README.md).

### Step 4: Daily automation and emails (n8n)

1. In n8n, create a new workflow → **⋯ → Import from File** → `n8n/expiry-check.json`. Do the same for `n8n/notifications.json` in a second workflow.
2. **Postgres credential:** open a Postgres node → **Create new credential** → enter the Session pooler details from step 2. Set **SSL = Require** and **Ignore SSL Issues = ON**. Select this credential in every Postgres node:
   - Expiry check: **Calculate & Save Discounts** and **Get Products Needing Attention**
   - Department alerts: **Get Department Items**
3. **Gmail:** in **Email Manager** and **Email Employee**, click **Sign in with Google**.
4. **Manager address:** in **Email Manager**, change **To** from `manager@example.com` to the real manager address. **Email Employee** sends to each employee's email from the database automatically.
5. **Your app link:** at the top of the code in **Build Manager Email**, set `DASHBOARD_URL` to your offers page (your link + `#/public-offers`). In **Build Department Emails**, set `DASHBOARD_URL` to your staff app link. Use the published link, not the builder link.
6. **Test:** click **Execute** in the expiry check. All 6 nodes turn green and the manager gets the report. Then run the department alerts: each employee with products to handle gets their own email.
7. **Go live:** click **Publish** in both workflows. From now on they run every morning, the expiry check at **8:00** and the department alerts at **8:15**.

More: [n8n/README.md](n8n/README.md).

### Step 5: Check that everything works together

1. Open your offers page without logging in. Milk is shown at **30% off** (₹30 → ₹21), because the sample data makes it expire tomorrow.
2. Run the expiry check. The manager email lists the same products and prices. Click **See today's offers**: the offers page opens.
3. Log in as an employee. You see only your own department.
4. Log in as an employee and try to open a manager screen. Access is denied.

**Keep the demo dates fresh.** The sample expiry dates are set from the day you ran `database.sql`. After a few days, run `database/refresh-demo-dates.sql` in the SQL Editor. It moves the dates to today and deletes nothing.

### If something goes wrong

| Problem | Fix |
|---|---|
| n8n can't connect to the database | Use the **Session pooler** host, not `db.xxx.supabase.co` |
| "self-signed certificate in certificate chain" | Turn on **Ignore SSL Issues** in the n8n credential |
| "password authentication failed" | Type the password again. The user must be `postgres.<project-id>` |
| The email bounced | The address is still `@example.com`. Change it (step 2.6 and step 4.4) |
| No email at all | Nothing expires within 3 days. Run `refresh-demo-dates.sql` |
| The offers page is empty | The sample dates are in the past. Run `refresh-demo-dates.sql` |
| The email button opens the Budibase builder or a login | Put the **published** app link in `DASHBOARD_URL` |
| Product pictures are missing | Make the `product-images` bucket **Public** and check you replaced the project ID (step 2.2) |
| Every email arrives twice | The workflow is published in two n8n workspaces. Publish it in only one |
