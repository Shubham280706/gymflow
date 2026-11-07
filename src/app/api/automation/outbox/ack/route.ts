import { NextResponse } from "next/server";
import { isAuthorized } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

// n8n reports the delivery result: { id, status: "sent" | "failed", error?: string }
export async function POST(req: Request) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body?.id || !["sent", "failed"].includes(body.status)) {
    return NextResponse.json({ error: "id and status (sent|failed) required" }, { status: 400 });
  }
  const db = createAdminClient();
  const { error } = await db
    .from("outbox")
    .update({
      status: body.status,
      error: body.status === "failed" ? String(body.error ?? "unknown").slice(0, 500) : null,
      sent_at: body.status === "sent" ? new Date().toISOString() : null,
    })
    .eq("id", body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
