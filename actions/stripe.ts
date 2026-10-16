"use server";
/** Paid listings are deliberately disabled throughout the private alpha. */
export async function createCheckoutSession(
  _jobPostId: string,
): Promise<{ url: null; error: string }> {
  void _jobPostId;
  return {
    url: null,
    error:
      "Posting is free during the private alpha. Publish from the job preview.",
  };
}
