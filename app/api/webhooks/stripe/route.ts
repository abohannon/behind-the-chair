import { NextResponse } from "next/server";
import { stripe, JOB_DURATION_DAYS } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const jobPostId = session.metadata?.job_post_id;
    const employerId = session.metadata?.employer_id;
    const stripePaymentId = session.payment_intent as string;

    if (!jobPostId || !employerId || !stripePaymentId) {
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Idempotency: check if payment already exists
    const { data: existingPayment } = await supabase
      .from("payments")
      .select("id")
      .eq("stripe_payment_id", stripePaymentId)
      .single();

    if (existingPayment) {
      return NextResponse.json({ received: true });
    }

    // Create payment record
    const { error: paymentError } = await supabase.from("payments").insert({
      employer_id: employerId,
      job_post_id: jobPostId,
      stripe_payment_id: stripePaymentId,
      amount_cents: session.amount_total ?? 3900,
      type: "single_post",
    });

    if (paymentError) {
      console.error("Payment insert error:", paymentError);
      return NextResponse.json(
        { error: "Payment recording failed" },
        { status: 500 }
      );
    }

    // Activate job post
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + JOB_DURATION_DAYS);

    const { error: jobError } = await supabase
      .from("job_posts")
      .update({
        status: "active",
        posted_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .eq("id", jobPostId);

    if (jobError) {
      console.error("Job activation error:", jobError);
      return NextResponse.json(
        { error: "Job activation failed" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}
