import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";

/**
 * サブスクリプション用のStripeチェックアウトセッションを作成するためのGETリクエストを処理します。
 *
 * @async
 * @returns {Promise<NextResponse>} セッションURLまたはエラーステータスを含むJSONレスポンス
 *
 * @throws Stripeクライアントシークレットまたはサブスクリプション価格IDが設定されていない場合にエラーをスローします
 *
 * @description
 * この関数は以下の処理を行います:
 * 1. 現在のユーザーを取得します。未認証の場合、401エラーレスポンスを返します
 * 2. 必要なStripe環境変数をチェックします。不足している場合はエラーをスローします
 * 3. 設定された価格IDを使用してStripeチェックアウトセッションを作成します
 * 4. 成功した場合はセッションURLと顧客IDを返し、失敗した場合はエラーログを記録してエラーレスポンスを返します
 */

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

    if (session) {
      return NextResponse.json({
        status: 200,
        session_url: session.url,
        customer_id: session.customer,
      });
    }
  } catch (error) {
    console.error("Payment processing error:", error);
    return NextResponse.json(
      { error: "Payment processing failed" },
      { status: 500 }
    );
  }
}
