import { requireUser } from "@/lib/auth/require-user";
import { EmployerProfileForm } from "@/components/forms/employer-profile-form";
import {
  removeBusinessPhoto,
  moveBusinessPhoto,
} from "@/actions/employer-profile";
/* eslint-disable @next/next/no-img-element -- User-managed Supabase images. */
export default async function BusinessProfile({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { supabase, user } = await requireUser("employer");
  const { data: initial, error } = await supabase
    .from("employer_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw new Error("Unable to load business profile");
  const photos = Array.isArray(initial?.photos)
    ? initial.photos.filter((v): v is string => typeof v === "string")
    : [];
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-semibold">Your business</h1>
      {(await searchParams).saved && (
        <p role="status">
          Business saved. You can now add images or post a job.
        </p>
      )}
      {initial?.logo_url && (
        <img
          src={initial.logo_url}
          className="h-20 w-20 rounded-lg object-cover"
          alt={`${initial.salon_name} logo`}
        />
      )}
      <EmployerProfileForm initial={initial} />
      <div className="grid gap-4 sm:grid-cols-2">
        {photos.map((url, i) => (
          <div key={url} className="space-y-2 rounded-xl border p-3">
            <img
              src={url}
              alt={`${initial?.salon_name} gallery photo ${i + 1}`}
              className="aspect-video w-full rounded-lg object-cover"
            />
            <div className="flex gap-4">
              <form action={removeBusinessPhoto}>
                <input type="hidden" name="url" value={url} />
                <button className="text-sm underline">
                  Remove photo {i + 1}
                </button>
              </form>
              {i > 0 && (
                <form action={moveBusinessPhoto}>
                  <input type="hidden" name="url" value={url} />
                  <button className="text-sm underline">Move earlier</button>
                </form>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
