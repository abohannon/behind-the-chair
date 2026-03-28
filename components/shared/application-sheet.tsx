"use client";

import { useActionState, useEffect } from "react";
import { submitApplication, type ApplyState } from "@/actions/applications";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import Link from "next/link";

interface ApplicationSheetProps {
  jobId: string;
  hasResume: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ApplicationSheet({
  jobId,
  hasResume,
  open,
  onOpenChange,
  onSuccess,
}: ApplicationSheetProps) {
  const [state, formAction, isPending] = useActionState<ApplyState, FormData>(
    submitApplication,
    {}
  );

  useEffect(() => {
    if (state.success) {
      toast.success("Application submitted!");
      onOpenChange(false);
      onSuccess();
    }
    if (state.error) {
      toast.error(state.error);
    }
  }, [state, onOpenChange, onSuccess]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[80vh]">
        <SheetHeader>
          <SheetTitle>Apply to this position</SheetTitle>
          <SheetDescription>
            Submit your application. A cover letter is optional but recommended.
          </SheetDescription>
        </SheetHeader>
        <form action={formAction} className="mt-4 space-y-4">
          <input type="hidden" name="jobPostId" value={jobId} />
          <div className="space-y-2">
            <Label htmlFor="coverLetter">Cover letter (optional)</Label>
            <Textarea
              id="coverLetter"
              name="coverLetter"
              rows={5}
              placeholder="Why are you interested in this position?"
            />
          </div>
          {!hasResume && (
            <p className="text-sm text-muted-foreground">
              Want to include a resume?{" "}
              <Link
                href="/seeker/profile"
                className="text-primary hover:underline"
              >
                Add one to your profile
              </Link>
            </p>
          )}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Submitting..." : "Submit Application"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
