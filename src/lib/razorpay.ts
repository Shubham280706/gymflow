import Razorpay from "razorpay";
import crypto from "node:crypto";

export function getRazorpay(): Razorpay | null {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) return null;
  return new Razorpay({ key_id, key_secret });
}

export async function createPaymentLink(opts: {
  invoiceId: string;
  amountPaise: number;
  description: string;
  customerName: string;
  customerPhone: string; // 91XXXXXXXXXX
}): Promise<{ id: string; url: string } | null> {
  const rz = getRazorpay();
  if (!rz) return null;
  const link = await rz.paymentLink.create({
    amount: opts.amountPaise,
    currency: "INR",
    description: opts.description,
    reference_id: opts.invoiceId,
    customer: { name: opts.customerName, contact: "+" + opts.customerPhone },
    notify: { sms: false, email: false }, // we send the WhatsApp message ourselves
    reminder_enable: false,
  });
  return { id: link.id, url: link.short_url };
}

export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
