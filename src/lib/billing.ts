import "server-only";
import { createAdminClient } from "./supabase/admin";
import { createPaymentLink } from "./razorpay";
import { addDays, diffDays, fmtDate, todayIST } from "./format";
import { buildReceipt, buildReminder, type Built } from "./messages";

/** Invoices are created this many days before the due date. */
const INVOICE_LEAD_DAYS = 5;

async function enqueue(row: {
  gym_id: string;
  client_id: string;
  invoice_id: string;
  kind: string;
  to_phone: string;
  msg: Built;
}) {
  const db = createAdminClient();
  const { error } = await db.from("outbox").upsert(
    {
      gym_id: row.gym_id,
      client_id: row.client_id,
      invoice_id: row.invoice_id,
      kind: row.kind,
      to_phone: row.to_phone,
      template: row.msg.template,
      params: row.msg.params,
      body: row.msg.body,
    },
    { onConflict: "invoice_id,kind", ignoreDuplicates: true },
  );
  if (error) throw error;
}

async function attachPaymentLink(invoice: { id: string; amount_paise: number; due_date: string }, client: { name: string; phone: string }, gymName: string) {
  const db = createAdminClient();
  try {
    const link = await createPaymentLink({
      invoiceId: invoice.id,
      amountPaise: invoice.amount_paise,
      description: `${gymName} membership fee (due ${fmtDate(invoice.due_date)})`,
      customerName: client.name,
      customerPhone: client.phone,
    });
    if (link) {
      await db.from("invoices").update({ payment_link_id: link.id, payment_link_url: link.url }).eq("id", invoice.id);
    }
  } catch (e) {
    console.error("payment link failed for invoice", invoice.id, e);
  }
}

/** Creates invoices (with Razorpay links) for active clients whose due date is near. Idempotent. */
export async function generateInvoices(opts: { clientId?: string } = {}) {
  const db = createAdminClient();
  const horizon = addDays(todayIST(), INVOICE_LEAD_DAYS);

  let q = db
    .from("clients")
    .select("id, gym_id, name, phone, next_due_date, plans(price_paise), gyms(name)")
    .eq("status", "active")
    .lte("next_due_date", horizon);
  if (opts.clientId) q = q.eq("id", opts.clientId);
  const { data: clients, error } = await q;
  if (error) throw error;

  let created = 0;
  for (const c of clients ?? []) {
    const plan = Array.isArray(c.plans) ? c.plans[0] : c.plans;
    const gym = Array.isArray(c.gyms) ? c.gyms[0] : c.gyms;
    if (!plan?.price_paise) continue; // no plan -> nothing to bill

    const { data: inserted, error: insErr } = await db
      .from("invoices")
      .upsert(
        { gym_id: c.gym_id, client_id: c.id, amount_paise: plan.price_paise, due_date: c.next_due_date },
        { onConflict: "client_id,due_date", ignoreDuplicates: true },
      )
      .select("id, amount_paise, due_date");
    if (insErr) throw insErr;
    for (const inv of inserted ?? []) {
      created++;
      await attachPaymentLink(inv, c, gym?.name ?? "Gym");
    }
  }

  // retry links that failed earlier
  const { data: missing } = await db
    .from("invoices")
    .select("id, amount_paise, due_date, clients(name, phone), gyms(name)")
    .eq("status", "pending")
    .is("payment_link_url", null)
    .limit(100);
  for (const inv of missing ?? []) {
    const client = Array.isArray(inv.clients) ? inv.clients[0] : inv.clients;
    const gym = Array.isArray(inv.gyms) ? inv.gyms[0] : inv.gyms;
    if (client) await attachPaymentLink(inv, client, gym?.name ?? "Gym");
  }
  return { created };
}

/** Queues a WhatsApp reminder for every pending invoice that hits one of its gym's reminder days today. */
export async function queueReminders() {
  const db = createAdminClient();
  const today = todayIST();
  const { data: invoices, error } = await db
    .from("invoices")
    .select("id, gym_id, client_id, amount_paise, due_date, payment_link_url, clients(name, phone, status), gyms(name, reminder_days)")
    .eq("status", "pending")
    .lte("due_date", addDays(today, INVOICE_LEAD_DAYS));
  if (error) throw error;

  let queued = 0;
  for (const inv of invoices ?? []) {
    const client = Array.isArray(inv.clients) ? inv.clients[0] : inv.clients;
    const gym = Array.isArray(inv.gyms) ? inv.gyms[0] : inv.gyms;
    if (!client || !gym || client.status !== "active") continue;
    const offset = diffDays(inv.due_date, today); // <0 before due, >0 overdue
    if (!(gym.reminder_days as number[]).includes(offset)) continue;
    await enqueue({
      gym_id: inv.gym_id,
      client_id: inv.client_id,
      invoice_id: inv.id,
      kind: `r${offset}`,
      to_phone: client.phone,
      msg: buildReminder({
        name: client.name,
        gym: gym.name,
        amountPaise: inv.amount_paise,
        dueDate: inv.due_date,
        link: inv.payment_link_url,
        offsetDays: offset,
      }),
    });
    queued++;
  }
  return { queued };
}

/** Owner pressed "Send reminder now". Caller must have verified the invoice belongs to the owner. */
export async function queueManualReminder(invoiceId: string) {
  const db = createAdminClient();
  const { data: inv, error } = await db
    .from("invoices")
    .select("id, gym_id, client_id, amount_paise, due_date, status, payment_link_url, clients(name, phone), gyms(name)")
    .eq("id", invoiceId)
    .single();
  if (error) throw error;
  if (inv.status !== "pending") return false;
  const client = Array.isArray(inv.clients) ? inv.clients[0] : inv.clients;
  const gym = Array.isArray(inv.gyms) ? inv.gyms[0] : inv.gyms;
  await enqueue({
    gym_id: inv.gym_id,
    client_id: inv.client_id,
    invoice_id: inv.id,
    kind: `manual-${Date.now()}`,
    to_phone: client.phone,
    msg: buildReminder({
      name: client.name,
      gym: gym.name,
      amountPaise: inv.amount_paise,
      dueDate: inv.due_date,
      link: inv.payment_link_url,
      offsetDays: diffDays(inv.due_date, todayIST()),
    }),
  });
  return true;
}

/** Marks an invoice paid (idempotent), rolls the client's due date forward and queues a receipt. */
export async function settlePayment(invoiceId: string, paymentId: string | null, method: string) {
  const db = createAdminClient();
  const { data: changed, error } = await db.rpc("mark_invoice_paid", {
    p_invoice: invoiceId,
    p_payment_id: paymentId,
    p_method: method,
  });
  if (error) throw error;
  if (!changed) return false; // already settled, nothing else to do

  const { data: inv } = await db
    .from("invoices")
    .select("id, gym_id, client_id, amount_paise, clients(name, phone, next_due_date), gyms(name)")
    .eq("id", invoiceId)
    .single();
  if (inv) {
    const client = Array.isArray(inv.clients) ? inv.clients[0] : inv.clients;
    const gym = Array.isArray(inv.gyms) ? inv.gyms[0] : inv.gyms;
    await enqueue({
      gym_id: inv.gym_id,
      client_id: inv.client_id,
      invoice_id: inv.id,
      kind: "receipt",
      to_phone: client.phone,
      msg: buildReceipt({ name: client.name, gym: gym.name, amountPaise: inv.amount_paise, nextDue: client.next_due_date }),
    });
  }
  return true;
}

export async function runDailyJob() {
  const invoices = await generateInvoices();
  const reminders = await queueReminders();
  return { ...invoices, ...reminders };
}
