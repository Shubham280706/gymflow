import { NextResponse } from "next/server";
import { isAuthorized } from "@/lib/api-auth";
import { runDailyJob } from "@/lib/billing";

// Idempotent: safe to call from n8n, Vercel Cron, or both. Creates invoices + queues reminders.
async function handle(req: Request) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    return NextResponse.json({ ok: true, ...(await runDailyJob()) });
  } catch (e) {
    console.error("daily job failed", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
