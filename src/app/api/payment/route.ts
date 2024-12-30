import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function GET() {
  try {
    if (!process.env.STRIPE_CLIENT_SECRET) {
      throw new Error("STRIPE_CLIENT_SECRET environment variable is missing");
    }

    const stripe = new Stripe(process.env.STRIPE_CLIENT_SECRET);

    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const priceId = process.env.STRIPE_SUBSCRIPTION_PRICE_ID;
    if (!priceId) {
      return NextResponse.json(
        { error: "Subscription price not configured" },
        { status: 500 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_HOST_URL}/payment?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_HOST_URL}/payment?cancel=true`,
    });

    if (!session?.url) {
      throw new Error("Failed to create checkout session");
    }

    return NextResponse.json({
      session_url: session.url,
      customer_id: session.customer,
    });
  } catch (error) {
    console.error("Payment processing error:", error);
    return NextResponse.json(
      { error: "Payment processing failed" },
      { status: 500 }
    );
  }
}
