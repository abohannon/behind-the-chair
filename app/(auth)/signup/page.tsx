"use client";

import { useState } from "react";
import Link from "next/link";
import { signUp } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Scissors, Briefcase } from "lucide-react";

export default function SignUpPage() {
  const [role, setRole] = useState<"employer" | "seeker" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    if (!role) {
      setError("Please select a role");
      return;
    }
    setLoading(true);
    setError(null);
    formData.set("role", role);
    const result = await signUp(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <CardDescription>
            Join the salon industry&apos;s job board
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole("employer")}
              className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
                role === "employer"
                  ? "border-primary bg-primary/5"
                  : "border-muted hover:border-muted-foreground/25"
              }`}
            >
              <Briefcase className="h-6 w-6" />
              <span className="text-sm font-medium">I&apos;m hiring</span>
            </button>
            <button
              type="button"
              onClick={() => setRole("seeker")}
              className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
                role === "seeker"
                  ? "border-primary bg-primary/5"
                  : "border-muted hover:border-muted-foreground/25"
              }`}
            >
              <Scissors className="h-6 w-6" />
              <span className="text-sm font-medium">
                I&apos;m looking for work
              </span>
            </button>
          </div>

          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                required
                placeholder="Your name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                placeholder="At least 6 characters"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
