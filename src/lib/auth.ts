import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";

/** For pages/actions inside the owner app: returns the user's Supabase client + their gym, or redirects. */
export async function requireGym() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: gym } = await supabase.from("gyms").select("id, name, phone, reminder_days").maybeSingle();
  if (!gym) redirect("/onboarding");
  return { supabase, user, gym };
}
