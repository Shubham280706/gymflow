"use server";

import { revalidatePath } from "next/cache";
import { requireGym } from "@/lib/auth";
import { generateInvoices, queueManualReminder, settlePayment } from "@/lib/billing";
import { normalizePhone, todayIST } from "@/lib/format";

export type FormState = { error?: string; ok?: boolean } | undefined;

export async function addPlan(_: FormState, formData: FormData): Promise<FormState> {
  const { supabase, gym } = await requireGym();
  const name = String(formData.get("name")).trim();
  const price = Math.round(Number(formData.get("price")) * 100);
  const days = Math.round(Number(formData.get("days")));
  if (!name || !(price > 0) || !(days > 0)) return { error: "Enter a name, a price and a duration." };
  const { error } = await supabase.from("plans").insert({ gym_id: gym.id, name, price_paise: price, duration_days: days });
  if (error) return { error: error.message };
  revalidatePath("/plans");
  return { ok: true };
}

export async function togglePlan(formData: FormData) {
  const { supabase } = await requireGym();
  await supabase.from("plans").update({ active: formData.get("active") === "true" }).eq("id", String(formData.get("id")));
  revalidatePath("/plans");
}

export async function addClient(_: FormState, formData: FormData): Promise<FormState> {
  const { supabase, gym } = await requireGym();
  const name = String(formData.get("name")).trim();
  const phone = normalizePhone(String(formData.get("phone")));
  const planId = String(formData.get("plan_id"));
  const start = String(formData.get("start_date")) || todayIST();
  if (!name) return { error: "Enter the client's name." };
  if (!phone) return { error: "Enter a valid 10-digit mobile number." };
  if (!planId) return { error: "Choose a plan (add one under Plans first)." };

  const { data: client, error } = await supabase
    .from("clients")
    .insert({ gym_id: gym.id, plan_id: planId, name, phone, start_date: start, next_due_date: start })
    .select("id")
    .single();
  if (error) return { error: error.message };

  // first fee is due on the joining date: bill straight away so a payment link exists
  await generateInvoices({ clientId: client.id });
  revalidatePath("/clients");
  revalidatePath("/invoices");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function setClientStatus(formData: FormData) {
  const { supabase } = await requireGym();
  await supabase
    .from("clients")
    .update({ status: String(formData.get("status")) })
    .eq("id", String(formData.get("id")));
  revalidatePath("/clients");
}

// The invoice is read through the owner's RLS-scoped client first, so one gym can never touch another's.
async function ownedInvoice(id: string) {
  const { supabase } = await requireGym();
  const { data } = await supabase.from("invoices").select("id").eq("id", id).maybeSingle();
  return data?.id as string | undefined;
}

export async function markPaidCash(formData: FormData) {
  const id = await ownedInvoice(String(formData.get("id")));
  if (id) await settlePayment(id, null, "cash");
  revalidatePath("/invoices");
  revalidatePath("/dashboard");
  revalidatePath("/clients");
}

export async function sendReminderNow(formData: FormData) {
  const id = await ownedInvoice(String(formData.get("id")));
  if (id) await queueManualReminder(id);
  revalidatePath("/invoices");
}
