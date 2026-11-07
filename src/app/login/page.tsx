import { signIn, signUp } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;
  return (
    <main className="min-h-screen grid place-items-center bg-slate-50 px-4">
      <form className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">GymFlow</h1>
          <p className="text-sm text-slate-500">Memberships, payments and reminders in one place.</p>
        </div>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {message && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}
        <label className="block text-sm font-medium text-slate-700">
          Email
          <input name="email" type="email" required autoComplete="email" className="input mt-1" />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Password
          <input name="password" type="password" required minLength={6} autoComplete="current-password" className="input mt-1" />
        </label>
        <div className="flex gap-2">
          <button formAction={signIn} className="btn-primary flex-1">Sign in</button>
          <button formAction={signUp} className="btn-secondary flex-1">Create account</button>
        </div>
      </form>
    </main>
  );
}
