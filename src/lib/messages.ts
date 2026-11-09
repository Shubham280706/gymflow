import { fmtDate, inr } from "./format";

// WhatsApp business-initiated messages must use pre-approved templates.
// Create these two templates in your WhatsApp provider with the parameter order below.
//   reminder  ->  {{1}} name, {{2}} gym, {{3}} amount, {{4}} due date, {{5}} payment link
//   receipt   ->  {{1}} name, {{2}} gym, {{3}} amount, {{4}} next due date
// Meta cannot rename a template after it is submitted, so the names are overridable
// with WHATSAPP_TEMPLATE_REMINDER / WHATSAPP_TEMPLATE_RECEIPT if yours differ.
export const TEMPLATE_REMINDER = process.env.WHATSAPP_TEMPLATE_REMINDER ?? "reminder";
export const TEMPLATE_RECEIPT = process.env.WHATSAPP_TEMPLATE_RECEIPT ?? "receipt";

export type Built = { template: string; params: string[]; body: string };

export function buildReminder(a: {
  name: string;
  gym: string;
  amountPaise: number;
  dueDate: string;
  link: string | null;
  offsetDays: number; // negative = before due date, positive = overdue
}): Built {
  const amount = inr(a.amountPaise);
  const due = fmtDate(a.dueDate);
  const link = a.link ?? "Please pay at the gym desk";
  let lead: string;
  if (a.offsetDays < 0) lead = `your membership fee of ${amount} is due on ${due}`;
  else if (a.offsetDays === 0) lead = `your membership fee of ${amount} is due today`;
  else lead = `your membership fee of ${amount} was due on ${due} and is still pending`;
  return {
    template: TEMPLATE_REMINDER,
    params: [a.name, a.gym, amount, due, link],
    body: `Hi ${a.name}, ${lead} at ${a.gym}. Pay here: ${link}`,
  };
}

export function buildReceipt(a: {
  name: string;
  gym: string;
  amountPaise: number;
  nextDue: string;
}): Built {
  const amount = inr(a.amountPaise);
  const next = fmtDate(a.nextDue);
  return {
    template: TEMPLATE_RECEIPT,
    params: [a.name, a.gym, amount, next],
    body: `Hi ${a.name}, we received your payment of ${amount} at ${a.gym}. Thank you! Next due: ${next}.`,
  };
}
