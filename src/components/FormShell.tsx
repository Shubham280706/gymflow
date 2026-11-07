"use client";

import { useActionState, useEffect, useRef } from "react";
import type { FormState } from "@/app/(app)/actions";

/** A <form> bound to a server action that shows its error and clears itself on success. */
export default function FormShell({
  action,
  children,
  className,
  submitLabel,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  children: React.ReactNode;
  className?: string;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={formAction} className={className}>
      {children}
      <button disabled={pending} className="btn-primary">
        {pending ? "Saving…" : submitLabel}
      </button>
      {state?.error && <p className="basis-full text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
