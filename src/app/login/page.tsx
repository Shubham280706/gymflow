import Link from "next/link";
import Logo from "@/components/Logo";
import { signIn, signUp } from "./actions";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;
  return (
    <main className="grid min-h-dvh place-items-center bg-paper px-4 py-10">
      <div className="w-full max-w-[26rem]">
        <Link href="/" className="mb-8 flex justify-center">
          <Logo />
        </Link>
        <form className="panel space-y-5 p-6 md:p-8">
          <div>
            <h1 className="h-display text-3xl font-bold">Welcome</h1>
            <p className="mt-1 text-[15px] text-ink-2">Sign in, or create an account for your gym.</p>
          </div>
          {error && (
            <p role="alert" className="rounded-[10px] bg-bad-soft px-3 py-2.5 text-sm font-medium text-bad-ink">
              {error}
            </p>
          )}
          {message && (
            <p role="status" className="rounded-[10px] bg-ok-soft px-3 py-2.5 text-sm font-medium text-ok-ink">
              {message}
            </p>
          )}
          <div>
            <label htmlFor="email" className="label">Email</label>
            <input id="email" name="email" type="email" required autoComplete="email" className="input" placeholder="you@yourgym.com" />
          </div>
          <div>
            <label htmlFor="password" className="label">Password</label>
            <input id="password" name="password" type="password" required minLength={6} autoComplete="current-password" className="input" />
            <p className="mt-1.5 text-xs text-ink-3">At least 6 characters.</p>
          </div>
          <div className="grid gap-2.5">
            <button formAction={signIn} className="btn btn-primary h-12 text-base">Sign in</button>
            <button formAction={signUp} className="btn btn-quiet h-12 text-base">Create a new account</button>
          </div>
        </form>
      </div>
    </main>
  );
}
