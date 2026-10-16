"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { signOut } from "@/actions/auth";
import type { User } from "@supabase/supabase-js";

interface MobileNavProps {
  user: User | null;
  role: string | null;
}

export function MobileNav({ user, role }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[280px]">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <nav className="mt-6 flex flex-col gap-3">
          {!user && (
            <>
              <Link
                href="/jobs"
                onClick={() => setOpen(false)}
                className="text-sm"
              >
                Browse Jobs
              </Link>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="text-sm"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                onClick={() => setOpen(false)}
                className="text-sm font-medium"
              >
                Post a Job
              </Link>
            </>
          )}

          {role === "employer" && (
            <>
              <Link
                href="/employer/dashboard"
                onClick={() => setOpen(false)}
                className="text-sm"
              >
                Dashboard
              </Link>
              <Link
                href="/employer/jobs/new"
                onClick={() => setOpen(false)}
                className="text-sm"
              >
                Post a Job
              </Link>
              <form action={signOut}>
                <button type="submit" className="text-sm text-muted-foreground">
                  Sign out
                </button>
              </form>
            </>
          )}

          {role === "seeker" && (
            <>
              <Link
                href="/jobs"
                onClick={() => setOpen(false)}
                className="text-sm"
              >
                Jobs
              </Link>
              <Link
                href="/seeker/applications"
                onClick={() => setOpen(false)}
                className="text-sm"
              >
                My Applications
              </Link>
              <Link
                href="/seeker/profile"
                onClick={() => setOpen(false)}
                className="text-sm"
              >
                Profile
              </Link>
              <form action={signOut}>
                <button type="submit" className="text-sm text-muted-foreground">
                  Sign out
                </button>
              </form>
            </>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
