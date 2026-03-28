import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});

export const PRICE_SINGLE_POST_CENTS = 3900;
export const JOB_DURATION_DAYS = 30;
