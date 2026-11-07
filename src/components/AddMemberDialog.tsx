"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { addClient, type FormState } from "@/app/(app)/actions";
import { IconClose, IconPlus } from "./Icons";

export default function AddMemberDialog({
  plans,
  today,
}: {
  plans: { id: string; name: string; price: string }[];
  today: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<FormState, FormData>(addClient, undefined);

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      ref.current?.close();
    }
  }, [state]);

  return (
    <>
      <button type="button" onClick={() => ref.current?.showModal()} className="btn btn-primary">
        <IconPlus width={18} height={18} /> Add member
      </button>
      <dialog
        ref={ref}
        aria-labelledby="add-member-title"
        onClick={(e) => e.target === ref.current && ref.current?.close()}
        className="m-0 mb-0 mt-auto w-full max-w-none rounded-t-2xl bg-surface p-0 text-ink md:m-auto md:max-w-md md:rounded-2xl"
      >
        <form ref={formRef} action={action} className="space-y-5 p-5 pb-8 md:p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 id="add-member-title" className="h-display text-3xl font-bold">New member</h2>
              <p className="mt-1 text-sm text-ink-2">Their first fee is billed on the joining date.</p>
            </div>
            <button type="button" onClick={() => ref.current?.close()} aria-label="Close" className="btn btn-ghost size-10 px-0">
              <IconClose />
            </button>
          </div>

          {plans.length === 0 ? (
            <p className="rounded-[10px] bg-warn-soft px-3 py-3 text-sm text-warn-ink">
              You need a plan before adding members.{" "}
              <Link href="/plans" className="font-semibold underline">Create a plan</Link>
            </p>
          ) : (
            <>
              <div>
                <label htmlFor="m-name" className="label">Name</label>
                <input id="m-name" name="name" required autoComplete="off" className="input" />
              </div>
              <div>
                <label htmlFor="m-phone" className="label">WhatsApp number</label>
                <input id="m-phone" name="phone" required inputMode="tel" autoComplete="off" className="input" placeholder="98765 43210" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="m-plan" className="label">Plan</label>
                  <select id="m-plan" name="plan_id" required defaultValue="" className="input">
                    <option value="" disabled>Choose</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.price})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="m-date" className="label">Joining date</label>
                  <input id="m-date" name="start_date" type="date" defaultValue={today} className="input" />
                </div>
              </div>
              {state?.error && (
                <p role="alert" className="rounded-[10px] bg-bad-soft px-3 py-2.5 text-sm font-medium text-bad-ink">{state.error}</p>
              )}
              <button disabled={pending} className="btn btn-primary h-12 w-full text-base">
                {pending ? "Adding…" : "Add member"}
              </button>
            </>
          )}
        </form>
      </dialog>
    </>
  );
}
