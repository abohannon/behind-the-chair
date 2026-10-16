"use client";
import { startTransition, useActionState } from "react";
import Link from "next/link";
import { signUpBusiness } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
export default function SignupPage() {
  const [state, action, pending] = useActionState(signUpBusiness, {});
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            Create your business account
          </CardTitle>
          <CardDescription>
            Join Behind the Chair’s Portland alpha. Create a profile and post
            jobs for free.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              startTransition(() => action(data));
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                required
              />
              <p className="text-sm text-muted-foreground">
                Use at least 8 characters.
              </p>
            </div>
            {state.error && (
              <p role="alert" className="text-sm text-destructive">
                {state.error}
              </p>
            )}
            <Button className="w-full" disabled={pending}>
              {pending ? "Creating account…" : "Create business account"}
            </Button>
          </form>
          <p className="mt-4 text-sm">
            Already have an account?{" "}
            <Link href="/login" className="underline">
              Sign in
            </Link>
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Looking for work? Applicant accounts are currently available by
            invitation.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
