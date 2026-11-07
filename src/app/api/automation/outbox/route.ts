import { NextResponse } from "next/server";
import { isAuthorized } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

// n8n polls this. Returns queued messages and marks them "sending" so a second poll can't double-send.
export async function GET(req: Request) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const limit = Math.min(Number(new URL(req.url).searchParams.get("limit") ?? 50), 200);
  const db = createAdminClient();

  // messages stuck in "sending" for >10 min (n8n crashed mid-run) go back to the queue
  await db
    .from("outbox")
    .update({ status: "queued" })
    .eq("status", "sending")
    .lt("claimed_at", new Date(Date.now() - 10 * 60_000).toISOString());

  const { data: queued, error } = await db
    .from("outbox")
    .select("id")
    .eq("status", "queued")
    .order("created_at")
    .limit(limit);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!queued?.length) return NextResponse.json({ messages: [] });

  // the status filter makes the claim atomic: only rows still queued are returned
  const { data: claimed, error: claimErr } = await db
    .from("outbox")
    .update({ status: "sending", claimed_at: new Date().toISOString() })
    .in("id", queued.map((r) => r.id))
    .eq("status", "queued")
    .select("id, to_phone, template, params, body, kind");
  if (claimErr) return NextResponse.json({ error: claimErr.message }, { status: 500 });

  return NextResponse.json({ messages: claimed });
}
