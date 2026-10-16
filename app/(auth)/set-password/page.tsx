"use client";
import { useActionState } from "react";
import { setPassword } from "@/actions/auth";
import Link from "next/link";
export default function SetPassword() {
  const [state, action, pending] = useActionState(setPassword, {});
  return (
    <div className="mx-auto max-w-md space-y-5 py-12">
      <h1 className="text-2xl font-semibold">Set your password</h1>
      <p>Choose a password with at least 8 characters.</p>
      <form action={action} className="space-y-4">
        <label className="block">
          New password
          <input
            className="mt-2 w-full rounded-md border p-3"
            name="password"
            type="password"
            minLength={8}
            maxLength={128}
            autoComplete="new-password"
            required
          />
        </label>
        {state.error && <p role="alert">{state.error}</p>}
        <button
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
          disabled={pending}
        >
          {pending ? "Saving…" : "Save password"}
        </button>
      </form>
      <Link className="underline" href="/forgot-password">
        Request a new link
      </Link>
    </div>
  );
}
