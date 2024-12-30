import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_CLIENT_SECRET as string);

/**
 * GETリクエストハンドラ
 * @async
 * @returns {Promise<NextResponse>} レスポンスオブジェクト
 * @description
 * 1. 現在のユーザーを取得
 * 2. ユーザーが存在しない場合、401 Unauthorizedエラーを返す
 * 3. Stripeのサブスクリプション価格IDを環境変数から取得
 * 4. Stripeのチェックアウトセッションを作成
 *    - モード: サブスクリプション
 *    - 価格: 環境変数から取得した価格ID
 *    - 数量: 1
 *    - 成功時リダイレクトURL: 支払いページにセッションID付きでリダイレクト
 *    - キャンセル時リダイレクトURL: 支払いページにキャンセルフラグ付きでリダイレクト
 * 5. セッションが正常に作成された場合、200ステータスとセッションURL、顧客IDを返す
 * 6. セッション作成に失敗した場合、400ステータスを返す
 */
export async function GET() {
  const user = await currentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const priceId = process.env.STRIPE_SUBSCRIPTION_PRICE_ID;

  // Stripeのチェックアウトセッションを作成
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

  // セッションが正常に作成された場合
  if (session) {
    return NextResponse.json({
      status: 200,
      session_url: session.url,
      customer_id: session.customer,
    });
  }

  // セッション作成に失敗した場合
  return NextResponse.json({ status: 400 });
}
