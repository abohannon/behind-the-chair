"use client";
import { useActionState } from "react";
import { requestPasswordReset } from "@/actions/auth";
import Link from "next/link";
export default function ForgotPassword() {
  const [state, action, pending] = useActionState(requestPasswordReset, {});
  return (
    <div className="mx-auto max-w-md space-y-5 py-12">
      <h1 className="text-2xl font-semibold">Recover your account</h1>
      <p>
        If your invitation or recovery link has expired, request a new email
        here.
      </p>
      <form action={action} className="space-y-4">
        <label className="block">
          Email
          <input
            className="mt-2 w-full rounded-md border p-3"
            name="email"
            type="email"
            required
          />
        </label>
        {state.error && <p role="alert">{state.error}</p>}
        {state.success && (
          <p role="status">
            If an account exists, you’ll receive a recovery email shortly.
          </p>
        )}
        <button
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
          disabled={pending}
        >
          {pending ? "Sending…" : "Send recovery email"}
        </button>
      </form>
      <Link className="block underline" href="/login">
        Back to sign in
      </Link>
    </div>
  );
}
