"use client";
import { startTransition, useActionState, useState } from "react";
import {
  upsertEmployerProfile,
  uploadBusinessImage,
} from "@/actions/employer-profile";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Tables } from "@/lib/types/database";
export function EmployerProfileForm({
  initial,
}: {
  initial: Tables<"employer_profiles"> | null;
}) {
  const [state, action, pending] = useActionState(upsertEmployerProfile, {});
  const [upload, setUpload] = useState<{ error?: string; success?: boolean }>(
    {},
  );
  const [uploadPending, setUploadPending] = useState(false);
  const router = useRouter();
  async function uploadAction(form: FormData) {
    setUploadPending(true);
    setUpload({});
    let path: string | null = null;
    try {
      const file = form.get("image");
      if (
        !(file instanceof File) ||
        !file.size ||
        file.size > 5 * 1024 * 1024 ||
        !["image/jpeg", "image/png", "image/webp"].includes(file.type)
      )
        throw new Error("Choose a JPEG, PNG or WebP image, 5 MB or smaller.");
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in again.");
      path = `${user.id}/${crypto.randomUUID()}.${file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1]}`;
      const { error } = await supabase.storage.from("logos").upload(path, file);
      if (error) throw new Error("Image upload failed. Please try again.");
      const attachment = new FormData();
      attachment.set("path", path);
      attachment.set("kind", String(form.get("kind")));
      const result = await uploadBusinessImage({}, attachment);
      if (result.error) {
        await supabase.storage.from("logos").remove([path]);
        throw new Error(result.error);
      }
      setUpload({ success: true });
      router.refresh();
    } catch (e) {
      setUpload({
        error:
          e instanceof Error
            ? e.message
            : "Unable to save image. Please try again.",
      });
    } finally {
      setUploadPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          startTransition(() => action(data));
        }}
        className="space-y-5 rounded-xl border bg-card p-6"
      >
        <label className="block text-sm font-medium">
          Business name *
          <input
            className="mt-2 w-full rounded-md border p-3"
            name="salonName"
            defaultValue={initial?.salon_name ?? ""}
            required
            maxLength={200}
          />
        </label>
        <p className="text-sm text-muted-foreground">
          Portland, Oregon · Our pilot city
        </p>
        <label className="block text-sm font-medium">
          About your business *
          <textarea
            className="mt-2 w-full rounded-md border p-3"
            name="description"
            rows={5}
            required
            maxLength={10000}
            defaultValue={initial?.description ?? ""}
          />
        </label>
        <label className="block text-sm font-medium">
          Website
          <input
            className="mt-2 w-full rounded-md border p-3"
            name="websiteUrl"
            type="url"
            defaultValue={initial?.website_url ?? ""}
          />
        </label>
        <label className="block text-sm font-medium">
          Instagram
          <input
            className="mt-2 w-full rounded-md border p-3"
            name="instagramHandle"
            placeholder="@yourbusiness"
            defaultValue={initial?.instagram_handle ?? ""}
          />
        </label>
        {state.error && (
          <p role="alert" className="text-destructive">
            {state.error}
          </p>
        )}
        <button
          disabled={pending}
          className="rounded-md bg-primary px-5 py-3 text-primary-foreground"
        >
          {pending ? "Saving…" : "Save business"}
        </button>
      </form>
      {initial && (
        <form
          action={uploadAction}
          className="space-y-4 rounded-xl border bg-card p-6"
        >
          <h2 className="text-xl font-semibold">Logo & photos</h2>
          <p className="text-sm text-muted-foreground">
            JPEG, PNG or WebP, up to 5 MB each. Add up to five gallery photos.
          </p>
          <label className="block">
            Image type
            <select name="kind" className="ml-3 rounded border p-2">
              <option value="photo">Gallery photo</option>
              <option value="logo">Business logo</option>
            </select>
          </label>
          <input
            className="block w-full min-w-0 text-sm"
            aria-label="Business image"
            type="file"
            name="image"
            accept="image/jpeg,image/png,image/webp"
            required
          />
          {upload.error && <p role="alert">{upload.error}</p>}
          {upload.success && <p role="status">Image saved.</p>}
          <button
            disabled={uploadPending}
            className="block rounded-md border px-4 py-2"
          >
            {uploadPending ? "Uploading…" : "Upload image"}
          </button>
        </form>
      )}
    </div>
  );
}
