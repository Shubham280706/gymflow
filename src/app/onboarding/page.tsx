import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function createGym(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const name = String(formData.get("name")).trim();
  if (!name) redirect("/onboarding");
  const { error } = await supabase.from("gyms").insert({
    owner_id: user.id,
    name,
    phone: String(formData.get("phone") ?? "").trim() || null,
  });
  if (error) redirect("/onboarding");
  redirect("/plans");
}

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: gym } = await supabase.from("gyms").select("id").maybeSingle();
  if (gym) redirect("/dashboard");
  return (
    <main className="min-h-screen grid place-items-center bg-slate-50 px-4">
      <form action={createGym} className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Set up your gym</h1>
          <p className="text-sm text-slate-500">This name appears in the messages your members receive.</p>
        </div>
        <label className="block text-sm font-medium text-slate-700">
          Gym name
          <input name="name" required className="input mt-1" placeholder="Iron Paradise Fitness" />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Gym phone (optional)
          <input name="phone" className="input mt-1" placeholder="98765 43210" />
        </label>
        <button className="btn-primary w-full">Continue</button>
      </form>
    </main>
  );
}
