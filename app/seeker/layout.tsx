import { requireUser } from "@/lib/auth/require-user";
import { ProfileBanner } from "@/components/shared/profile-banner";

export default async function SeekerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireUser("seeker");
  const profileComplete = profile.profile_complete;

  return (
    <>
      {!profileComplete && <ProfileBanner />}
      {children}
    </>
  );
}
