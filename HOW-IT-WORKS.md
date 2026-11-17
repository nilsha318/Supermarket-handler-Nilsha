# FreshSave: how it works (guide for a new person)

This guide explains the whole system in plain words: how to open the app, what each person sees,
what happens automatically every day, and how a product travels from the shelf to a customer offer.
No technical knowledge needed. For setup and code, see [README.md](README.md).

---

## 1. What FreshSave does

Supermarkets throw away food because expiry dates are checked by hand and discounts come too late.
FreshSave checks every product's expiry date automatically, gives it a discount in time, tells the
staff what to do, and shows customers today's bargains.

## 2. The tools (in one sentence each)

| Tool | What it is for |
|---|---|
| **Supabase (PostgreSQL)** | The shop's shared notebook: every product, price, expiry date and employee |
| **n8n** | A robot on a timer: every morning it sets discounts and sends emails |
| **Budibase** | The app people use: the screens, the login and the roles |
| **Gmail** | Delivers the alert emails |
| **GitHub** | Keeps our files, documents and the history of every change |

---

## 3. Opening the app

**One link for everyone:**
https://yuvtuhj0b.budibase.app/app/default%20workspace/supermarket-dashbord

The first page asks **"Who are you?"** and shows three cards:

| You are | Click | Login? | You land on |
|---|---|---|---|
| 🛒 **Customer** | See today's offers | No | Today's offers |
| 🪪 **Employee** | Employee login | Yes, your staff account | **My Department** |
| 💼 **Manager** | Manager login | Yes, the admin account | **Manager Overview** |

- The login page is Budibase's own page ("Log in to Budibase"). Type your email and password there.
- After login you go **straight to your own dashboard**. You do not see "Who are you?" again
  while you are logged in.
- **"🔄 Switch to…"** (top right of every page) changes the view:
  - **Customer**: logs you out and opens the offers.
  - A role you are not logged in as: logs you out and asks you to log in with that account.
- To end your session: click your avatar (top right) → **Log out**.

> Logins, passwords and roles are handled by Budibase. Passwords are never stored in our database.
> Ask the team lead for your account. Never share passwords in GitHub or screenshots.

---

## 4. What each person can do

### 🛒 Customer (no login)
- **Today's offers**: every discounted product that is not expired and is in stock, with old price,
  discount and new price.
- **Department buttons** (All, Dairy, Bakery …) filter the offers.
- **"🔥 Last chance! Today only"** marks products that expire today.
- **"📱 Get my offer QR"**: shows today's offer code as a QR code. Show it at the billing counter.

### 🪪 Employee (role Basic)
Menu: **Home · My Department · Update Stock · Today's offers**
- **My Department**: only your department's products, the most urgent at the top.
  Colours: **red** = expired, **orange** = expires today, **yellow** = expiring soon (1–3 days).
- **Update Stock**:
  - *Add new stock*: product name, quantity, price, expiry date and department (dropdown).
  - *Update quantity*: click a product in the table, change the quantity, press **Save**.
- Every morning you get an email with your department's tasks (see section 5).

### 💼 Manager (role Admin)
Menu: **Home · Manager · Employees · Update Stock · Today's offers**
- **Manager Overview**:
  - Four boxes: **Expired**, **Expiring today**, **Active offers**, **Value at risk**.
  - **Needs action today**: products that expire today or tomorrow, with what to do.
  - **Department summary**: one row per department, plus a bar chart.
- **Employees**: add, edit or deactivate staff and choose their department. Only the manager can do this.
- Every morning you get the full **manager report** email.

---

## 5. What happens automatically every day

| Time | What | Who gets it |
|---|---|---|
| **8:00** | n8n **expiry check**: works out the days left for every product, saves the discount and the action, then emails a report (only if something needs attention) | Manager |
| **8:15** | n8n **department emails**: one email per active employee with only their department's tasks: remove from shelf, 30% labels, 20% labels | Each employee |
| **All day** | The app shows the **live** discount for today's date, even before n8n has run | Everyone |

### The discount rule (the same everywhere)

| Days left | Discount | What to do |
|---|---|---|
| expired (below 0) | 0% | **Remove from shelf** |
| 0 to 1 | **30%** | Apply 30% discount |
| 2 to 3 | **20%** | Apply 20% discount |
| more than 3 | 0% | No action |

Example: milk at 30.00 that expires tomorrow is offered at **21.00**.

### The manager report email
- **Header:** "30 products need attention today" (the number changes daily).
- **Three tiles:** expired · 0–1 days (30% off) · 2–3 days (20% off).
- **Money line:** stock value at risk, what can still be recovered, what is already lost.
- **One section per group**, with every product, and a button to the customer offers page.

---

## 6. One day in FreshSave: the life of a carton of milk

1. **Day before:** a Dairy employee adds 20 cartons of milk at 30.00, best before tomorrow (Update Stock).
2. **8:00:** n8n sees "1 day left", saves **30% off** and puts the milk in the manager's report.
3. **8:15:** Dairy staff get an email: "Put 30% off labels on milk".
4. **During the day:** the milk appears on **Today's offers** for **21.00**. The manager sees it under
   *Needs action today* and in *Value at risk*.
5. **At the till:** the customer shows the offer QR; the cashier scans it and sees today's valid offers.
6. **If it still does not sell:** the next morning it is flagged **"Remove from shelf"**.

---

## 7. The offer QR code

1. The customer taps **Get my offer QR**. The app turns **today's date** into a code, e.g. `FS-1711-P94Z`.
2. A free QR service (`api.qrserver.com`) draws the QR picture. Only the link with the code is sent there.
3. The cashier scans it. The **Offer check** page recalculates today's code:
   **✅ valid today** (with the list of discounts) or **❌ not valid today** (an old QR).

The code is the same for everyone on the same day and changes automatically every day.

---

## 8. Where the data lives

| Table / view | What is in it | Used by |
|---|---|---|
| `departments` | The 8 departments | All |
| `employees` | Staff, their department, role, active or not. The **email must match the Budibase login** | Manager only |
| `products` | Name, department, quantity, price, expiry date, discount, action | Update Stock, n8n |
| `products_live` (view) | Adds days left, status, discount, offer price, stock value for today | All dashboards |
| `customer_offers` (view) | Only discounted, not expired, in-stock products | Offers page |

Rule for the team: **read from the views, write to the tables.** Details: [database/README.md](database/README.md).

---

## 9. Security in short

- **Budibase** checks every login and role on the server. Hiding a menu item is not the protection;
  the server is. Without a login, staff data answers **401**; the wrong role answers **403**.
- **Employee records** can only be read and changed by the manager.
- **Supabase**: Row Level Security blocks the public database API.
- **n8n**: the database and Gmail logins are saved as credentials inside n8n.
- **GitHub**: no passwords in the repository. `.env` is in `.gitignore`; `.env.example` lists names only.

---

## 10. Common problems

| You see | Why | What to do |
|---|---|---|
| "Log in to Budibase" when you expected your page | You were logged out. One account has one active session, so logging in somewhere else logs you out here | Log in again. Use a separate browser or Incognito window for each account |
| **My Department** is empty | Your login email does not match your row in `employees`, or the row is not active | Ask the manager to fix the email or tick *is_active* on the **Employees** page |
| "You don't have permission to use this app" | The app has been disabled in Budibase | The app owner enables it in the builder and publishes |
| A product shows in the wrong department | The wrong department was chosen when it was added | Fix its department (manager) |
| No email this morning | Nothing needed attention, or the n8n workflow is not published | Check the workflow's *Executions* in n8n |
| The offer QR says "not valid today" | It is an old QR from another day | Tap **Get my offer QR** again |

---

## 11. More documents

- [README.md](README.md): setup for developers
- [PROJECT_PLAN.md](PROJECT_PLAN.md): team, tasks and schedule
- [database/README.md](database/README.md): tables, views, discount rule
- [n8n/README.md](n8n/README.md): the two workflows and how to connect them
- [AGENTS.md](AGENTS.md): rules for AI coding agents working on this project
