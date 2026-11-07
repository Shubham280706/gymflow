import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Logo from "@/components/Logo";

export const metadata = { title: "Set up your gym" };

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
    <main className="grid min-h-dvh place-items-center bg-paper px-4 py-10">
      <div className="w-full max-w-[26rem]">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <form action={createGym} className="panel space-y-5 p-6 md:p-8">
          <div>
            <h1 className="h-display text-3xl font-bold">Set up your gym</h1>
            <p className="mt-1 text-[15px] text-ink-2">Members will see this name in their reminders. Next, you&rsquo;ll add your plans.</p>
          </div>
          <div>
            <label htmlFor="name" className="label">Gym name</label>
            <input id="name" name="name" required className="input" placeholder="Iron Paradise Fitness" />
          </div>
          <div>
            <label htmlFor="phone" className="label">Gym phone (optional)</label>
            <input id="phone" name="phone" inputMode="tel" className="input" placeholder="98765 43210" />
          </div>
          <button className="btn btn-primary h-12 w-full text-base">Continue</button>
        </form>
      </div>
    </main>
  );
}
