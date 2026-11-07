"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { FormState } from "@/app/(app)/actions";

/** A <form> bound to a server action: shows its error, and briefly confirms success. */
export default function FormShell({
  action,
  children,
  className,
  submitLabel,
  successMessage,
  resetOnSuccess = false,
  submitClassName = "btn btn-primary",
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  children: React.ReactNode;
  className?: string;
  submitLabel: string;
  successMessage?: string;
  resetOnSuccess?: boolean;
  submitClassName?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const ref = useRef<HTMLFormElement>(null);
  // the success note is "shown" until its timer marks that particular result as dismissed
  const [dismissed, setDismissed] = useState<FormState>(undefined);
  const shown = !!state?.ok && dismissed !== state;

  useEffect(() => {
    if (!state?.ok) return;
    if (resetOnSuccess) ref.current?.reset();
    const t = setTimeout(() => setDismissed(state), 2500);
    return () => clearTimeout(t);
  }, [state, resetOnSuccess]);

  return (
    <form ref={ref} action={formAction} className={className}>
      {children}
      <div className="flex flex-wrap items-center gap-3 basis-full">
        <button disabled={pending} className={submitClassName}>
          {pending ? "Saving…" : submitLabel}
        </button>
        {shown && successMessage && <p role="status" className="text-sm font-semibold text-ok-ink">{successMessage}</p>}
      </div>
      {state?.error && (
        <p role="alert" className="basis-full rounded-[10px] bg-bad-soft px-3 py-2.5 text-sm font-medium text-bad-ink">
          {state.error}
        </p>
      )}
    </form>
  );
}
