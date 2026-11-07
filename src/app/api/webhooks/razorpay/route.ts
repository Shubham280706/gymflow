import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { settlePayment } from "@/lib/billing";

// Razorpay -> Dashboard -> Webhooks: subscribe to "payment_link.paid".
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyWebhookSignature(raw, req.headers.get("x-razorpay-signature"))) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(raw);
  if (event.event === "payment_link.paid") {
    const invoiceId: string | undefined = event.payload?.payment_link?.entity?.reference_id;
    const paymentId: string | undefined = event.payload?.payment?.entity?.id;
    const method: string = event.payload?.payment?.entity?.method ?? "online";
    if (invoiceId) {
      try {
        await settlePayment(invoiceId, paymentId ?? null, method);
      } catch (e) {
        console.error("settlePayment failed", e);
        return NextResponse.json({ error: "failed" }, { status: 500 }); // Razorpay will retry
      }
    }
  }
  return NextResponse.json({ ok: true });
}
