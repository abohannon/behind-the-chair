import Link from "next/link";
import { AlertCircle } from "lucide-react";

export function ProfileBanner() {
  return (
    <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
      <AlertCircle className="h-4 w-4 shrink-0" />
      <p>
        Complete your profile to apply to jobs.{" "}
        <Link href="/seeker/profile" className="font-medium underline">
          Set up profile
        </Link>
      </p>
    </div>
  );
}
