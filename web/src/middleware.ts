import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 許可するオリジンのリスト
const allowedOrigins = ["http://localhost:5173", "http://localhost:3000"];

// CORS設定オプション
const corsOptions = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// 認証保護が必要なルートの定義
const isProtectedRoutes = createRouteMatcher([
  "/dashboard(.*)",
  "/payment(.*)",
]);

// メインのミドルウェア関数
export default clerkMiddleware(async (auth, req: NextRequest) => {
  // リクエストのオリジンを取得
  const origin = req.headers.get("origin") ?? "";
  const isAllowedOrigin = allowedOrigins.includes(origin);

  // OPTIONSメソッドのリクエストに対するプリフライトレスポンス
  if (req.method === "OPTIONS") {
    const preflightHeaders = {
      ...(isAllowedOrigin && { "Access-Control-Allow-Origin": origin }),
      ...corsOptions,
    };
    return NextResponse.json({}, { headers: preflightHeaders });
  }

  // 保護されたルートへのアクセスをチェック
  if (isProtectedRoutes(req)) {
    await auth.protect();
  }

  // 次のミドルウェアまたはルートハンドラに進むためのレスポンス
  const response = NextResponse.next();

  // 許可されたオリジンからのリクエストの場合、CORSヘッダーを設定
  if (isAllowedOrigin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }

  // CORSオプションをレスポンスヘッダーに設定
  Object.entries(corsOptions).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
});

// ミドルウェアが適用されるルートの設定
export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
