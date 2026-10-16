import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { MobileNav } from "./mobile-nav";
import { Scissors } from "lucide-react";
import { signOut } from "@/actions/auth";

export async function Nav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { role: string; full_name: string } | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  const role = profile?.role;

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/jobs" className="flex items-center gap-2 font-semibold">
          <Scissors className="h-5 w-5" />
          <span>Behind the Chair</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-4 md:flex">
          {!user && (
            <>
              <Link
                href="/jobs"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Browse Jobs
              </Link>
              <Button asChild size="sm" variant="outline">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">Post a Job</Link>
              </Button>
            </>
          )}

          {role === "employer" && (
            <>
              <Link
                href="/employer/dashboard"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Dashboard
              </Link>
              <Button asChild size="sm">
                <Link href="/employer/jobs/new">Post a Job</Link>
              </Button>
              <form action={signOut}>
                <Button variant="ghost" size="sm" type="submit">
                  Sign out
                </Button>
              </form>
            </>
          )}

          {role === "seeker" && (
            <>
              <Link
                href="/jobs"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Jobs
              </Link>
              <Link
                href="/seeker/applications"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                My Applications
              </Link>
              <Link
                href="/seeker/profile"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Profile
              </Link>
              <form action={signOut}>
                <Button variant="ghost" size="sm" type="submit">
                  Sign out
                </Button>
              </form>
            </>
          )}
        </nav>

        {/* Mobile nav */}
        <div className="md:hidden">
          <MobileNav user={user} role={role ?? null} />
        </div>
      </div>
    </header>
  );
}
