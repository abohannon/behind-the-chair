import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user, supabase } = await updateSession(request);
  const path = request.nextUrl.pathname;

  // Public routes — no auth required
  if (
    path.startsWith("/jobs") ||
    path.startsWith("/login") ||
    path.startsWith("/signup") ||
    path.startsWith("/callback") ||
    path.startsWith("/api/webhooks")
  ) {
    return supabaseResponse;
  }

  // Not authenticated — redirect to login
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("returnTo", path);
    return NextResponse.redirect(loginUrl);
  }

  // Get role from profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, profile_complete")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Employer routes
  if (path.startsWith("/employer")) {
    if (profile.role !== "employer") {
      return NextResponse.redirect(new URL("/jobs", request.url));
    }
    if (!profile.profile_complete && !path.startsWith("/employer/profile")) {
      return NextResponse.redirect(new URL("/employer/profile", request.url));
    }
  }

  // Seeker routes
  if (path.startsWith("/seeker")) {
    if (profile.role !== "seeker") {
      return NextResponse.redirect(
        new URL("/employer/dashboard", request.url)
      );
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
