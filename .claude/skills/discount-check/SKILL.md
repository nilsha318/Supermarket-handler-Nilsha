---
name: discount-check
description: Checks that the FreshSave discount rule is the same in the database view, the n8n expiry workflow and the department emails, and that no discounted product is shown wrongly to customers. Use before a demo, after changing the discount rule, or when a price in an email and on the offers page do not match. Reports only, changes nothing.
---

# Discount check

Our discount rule must be identical in every part of the project. This skill compares the parts and
reports any difference. **It only reads and reports. It never edits a file, never runs SQL that changes
data, and never reads `.env`.**

## The rule (source of truth: `AGENTS.md`)

| Days left | discount_percent | action |
|---|---|---|
| less than 0 | 0 | EXPIRED - Remove from shelf |
| 0 to 1 | 30 | Apply 30% discount |
| 2 to 3 | 20 | Apply 20% discount |
| more than 3 | 0 | No action |

Offer price = price × (100 − discount_percent) / 100, rounded to 2 decimals.

## Steps

1. **Database view.** Open `database/database.sql`. Find the `products_live` view and read its two
   `CASE` blocks. Write down each boundary (`< 0`, `<= 1`, `<= 3`) with its discount and action.
2. **Customer view.** In the same file, check that `customer_offers` only shows rows with
   `discount_percent > 0`, `days_left >= 0` and `quantity > 0`.
3. **Expiry workflow.** Open `n8n/expiry-check.json`. Find the SQL in the PostgreSQL node that updates
   `products`. Write down its boundaries, discounts and action texts.
4. **Department emails.** Open `n8n/notifications.json` (and `n8n/email-templates/build-department-emails.js`
   if the rule is there). Write down how it groups products into remove, 30% and 20%.
5. **Compare.** Put the four parts side by side against the rule above. A difference in a boundary
   (for example `< 1` instead of `<= 1`), a percentage or an action text is a finding.
6. **Sample data check (optional).** If the user gives you query results from `products_live`
   (they run the query, not you), check five products: one expired, one today, one with 1 day,
   one with 3 days, one with more than 3 days. Recalculate discount and offer price by hand.

## Report

Answer with one table and a verdict, nothing else:

| Part | File | Boundaries | Discounts | Action texts | Matches rule? |
|---|---|---|---|---|---|
| products_live | database/database.sql | … | … | … | yes / no: what differs |
| customer_offers | database/database.sql | filter … | – | – | yes / no |
| Expiry workflow | n8n/expiry-check.json | … | … | … | yes / no |
| Department emails | n8n/notifications.json | … | … | … | yes / no |

**Verdict:** "All parts match" or "N differences found", followed by where each must be fixed.
Do not fix anything yourself; the owner of that file decides.

## Do not

- Do not run `database/database.sql`: it deletes all data.
- Do not connect to the shared database or read credentials.
- Do not guess: if a file or node is missing, say so in the table.
