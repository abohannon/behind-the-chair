"use client";
import { useRef, useState } from "react";
import { submitApplication } from "@/actions/applications";
import { createClient } from "@/lib/supabase/client";
import { validateResume } from "@/lib/validation/alpha";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useRouter } from "next/navigation";
export function ApplicationSheet({
  jobId,
  contact,
  open,
  onOpenChange,
  onSuccess,
}: {
  jobId: string;
  contact: { name: string; email: string; phone: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const [staged, setStaged] = useState<{ path: string; name: string } | null>(
    null,
  );
  async function apply(form: FormData) {
    setPending(true);
    setError("");
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in again before applying.");
      let attachment = staged;
      const file = form.get("resume");
      if (file instanceof File && file.size) {
        const invalid = validateResume(file);
        if (invalid) throw new Error(invalid);
        if ((await file.slice(0, 5).text()) !== "%PDF-")
          throw new Error("Choose a valid PDF resume.");
        const path = `${user.id}/${crypto.randomUUID()}/resume.pdf`;
        const { error: uploadError } = await supabase.storage
          .from("resumes")
          .upload(path, file, {
            contentType: "application/pdf",
            upsert: false,
          });
        if (uploadError)
          throw new Error("Resume upload failed. Please try again.");
        if (staged)
          await supabase.storage.from("resumes").remove([staged.path]);
        attachment = { path, name: file.name };
        setStaged(attachment);
        if (fileInput.current) fileInput.current.value = "";
      }
      if (!attachment) throw new Error("Attach a PDF resume.");
      form.set("resumePath", attachment.path);
      form.set("resumeName", attachment.name);
      form.delete("resume");
      form.set("jobPostId", jobId);
      const result = await submitApplication({}, form);
      if (result.error) throw new Error(result.error);
      setStaged(null);
      onSuccess();
      onOpenChange(false);
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to apply. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }
  const input = "mt-1 w-full rounded-md border bg-background p-2.5";
  return (
    <Sheet
      open={open}
      onOpenChange={(value) => {
        if (!pending) onOpenChange(value);
      }}
    >
      <SheetContent
        side="bottom"
        className="mx-auto max-h-[90vh] max-w-2xl overflow-y-auto rounded-t-2xl p-6"
      >
        <SheetHeader className="p-0">
          <SheetTitle>Make your introduction.</SheetTitle>
          <SheetDescription>
            Your contact details and this resume will be shared with the hiring
            business. A cover letter is optional.
          </SheetDescription>
        </SheetHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void apply(new FormData(event.currentTarget));
          }}
          className="mt-5 space-y-4"
        >
          <label className="block text-sm font-medium">
            Full name *
            <input
              name="fullName"
              className={input}
              required
              maxLength={200}
              defaultValue={contact.name}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              Contact email *
              <input
                name="email"
                type="email"
                className={input}
                required
                defaultValue={contact.email}
              />
            </label>
            <label className="block text-sm font-medium">
              Phone number *
              <input
                name="phone"
                type="tel"
                className={input}
                required
                defaultValue={contact.phone}
              />
            </label>
          </div>
          <label className="block text-sm font-medium">
            Resume (PDF, up to 10 MB) *
            <input
              ref={fileInput}
              name="resume"
              type="file"
              accept="application/pdf"
              className={input}
              required={!staged}
            />
          </label>
          {staged && (
            <p className="text-sm">
              Ready to submit: {staged.name}. You can retry without uploading
              again.
            </p>
          )}
          <label className="block text-sm font-medium">
            Personalized cover letter (optional)
            <textarea
              name="coverLetter"
              rows={4}
              maxLength={5000}
              className={input}
              placeholder="Tell this business why you'd be a great fit."
            />
          </label>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button disabled={pending} className="w-full">
            {pending ? "Submitting…" : "Submit application"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
