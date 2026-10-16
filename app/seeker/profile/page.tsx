import { requireUser } from "@/lib/auth/require-user";
import { SeekerProfileForm } from "@/components/forms/seeker-profile-form";
export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string; saved?: string }>;
}) {
  const { supabase, user, profile } = await requireUser("seeker");
  const { data: initial, error } = await supabase
    .from("seeker_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw new Error("Unable to load your profile. Please try again.");
  const params = await searchParams;
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="eyebrow">YOUR NEXT CHAPTER</p>
        <h1 className="mt-2 text-3xl font-semibold">Your profile</h1>
        <p className="mt-2 text-muted-foreground">
          Introduce yourself to the businesses you apply to.
        </p>
      </div>
      {params.saved && <p role="status">Profile saved.</p>}
      <SeekerProfileForm
        initial={initial}
        fullName={profile.full_name}
        email={user.email ?? ""}
        returnTo={params.returnTo ?? null}
      />
    </div>
  );
}
