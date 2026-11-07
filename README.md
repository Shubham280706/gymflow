# GymFlow

Gym owners register clients, collect fees through Razorpay, see who hasn't paid, and send WhatsApp reminders automatically. When a client pays, their status updates on its own.

```
Owner dashboard (Next.js)  <──>  Supabase (Postgres + auth, row-level security per gym)
        │                                 ▲
        │ creates invoice + Razorpay link │
        ▼                                 │ webhook: payment_link.paid
   outbox table  ──── n8n polls ────>  WhatsApp Cloud API        Razorpay ──┘
   (queued messages)   and reports back sent/failed
```

* **The app decides** who gets what message and when (reminder days, templates, idempotency).
* **n8n delivers**: it triggers the daily job, picks up the queued messages, sends them on WhatsApp and reports the result.
* **Razorpay talks straight to the app**, so a payment is recorded even if n8n is down.

## 1. Run it

```bash
cp .env.example .env.local   # fill in the values below
npm run dev
```

### Supabase
1. Create a project at supabase.com.
2. Run `supabase/migrations/0001_init.sql` in the SQL editor (or `supabase db push`).
3. Put the project URL, publishable key and service-role key in `.env.local`.
4. Authentication → Providers → Email. For quick testing, turn off "Confirm email".

### Razorpay
1. Put `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` (use test keys first) in `.env.local`.
2. Dashboard → Webhooks → add `https://YOUR-APP/api/webhooks/razorpay`, event **`payment_link.paid`**, and set a secret. Put it in `RAZORPAY_WEBHOOK_SECRET`.
3. Without keys the app still works. Invoices just have no link, and you use "Mark paid (cash)".

### Secrets
`CRON_SECRET` is a long random string shared with n8n (`openssl rand -hex 32`).

## 2. Set up n8n

1. In n8n set environment variables: `GYMFLOW_URL` (your app URL), `GYMFLOW_SECRET` (= `CRON_SECRET`), `WHATSAPP_PHONE_NUMBER_ID`.
2. Create an **HTTP Header Auth** credential: name `Authorization`, value `Bearer <WhatsApp Cloud API token>`, and attach it to the "Send WhatsApp template" node.
3. Import the workflows from `n8n/`:
   * `gymflow-daily-reminders.json` runs at 9 AM IST: creates invoices, queues reminders, delivers them.
   * `gymflow-instant-delivery.json` runs every 5 minutes: delivers anything queued in between, such as "Remind" button clicks and payment receipts.
4. Activate both.

### WhatsApp templates (needed before messages can send)
Create these two in Meta Business Manager (category: Utility), language `en`:

| Name | Body |
|---|---|
| `gymflow_payment_reminder` | `Hi {{1}}, your membership fee of {{3}} at {{2}} is due on {{4}}. Pay here: {{5}}` |
| `gymflow_payment_receipt` | `Hi {{1}}, we received your payment of {{3}} at {{2}}. Thank you! Next due: {{4}}.` |

Using Interakt, Gupshup or Twilio instead? Replace the "Send WhatsApp template" node. The message payload (`to_phone`, `template`, `params`, `body`) stays the same.

## 3. How a billing cycle works
1. **Daily job** (`POST /api/cron/daily`): creates an invoice, with a Razorpay link, for each active client due within 5 days, and queues reminders for the days set in `gyms.reminder_days` (default: 3 days before, on the day, 3 and 7 days after).
2. **Delivery**: n8n calls `GET /api/automation/outbox`, sends each message and calls `POST /api/automation/outbox/ack`.
3. **Payment**: Razorpay calls the webhook → `mark_invoice_paid()` marks the invoice paid, moves the client's next due date forward by the plan duration and queues a receipt.
4. **Cash**: the owner clicks "Mark paid (cash)", which follows the same path.

All of these are idempotent: re-running the job or receiving the webhook twice does nothing extra.

## Not built yet
* Editing reminder days and message text from the UI (currently a DB column and `src/lib/messages.ts`).
* Bulk client import from Excel.
* Charging gym owners a subscription for GymFlow itself.
* Automated tests. The helpers were only spot-checked, and the database functions and webhook flow have not been run against a live Supabase and Razorpay account.
