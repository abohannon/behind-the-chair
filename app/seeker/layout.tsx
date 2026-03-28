import { createClient } from "@/lib/supabase/server";
import { ProfileBanner } from "@/components/shared/profile-banner";

export default async function SeekerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profileComplete = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("profile_complete")
      .eq("id", user.id)
      .single();
    profileComplete = profile?.profile_complete ?? false;
  }

  return (
    <>
      {!profileComplete && <ProfileBanner />}
      {children}
    </>
  );
}
