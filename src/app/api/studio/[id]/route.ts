import { client } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * POSTリクエストを処理し、指定されたユーザーのスタジオ設定を更新します。
 *
 * @param req - NextRequestオブジェクト。リクエストの詳細を含みます。
 * @param params - パラメータを含むオブジェクト。`id`は更新対象のユーザーIDです。
 * @returns {Promise<NextResponse>} - 更新結果を含むNextResponseオブジェクト。
 *
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // パラメータからユーザーIDを取得
  const { id } = await params;

  // リクエストボディをJSON形式で取得
  const body = await req.json();

  // ユーザーのスタジオ設定を更新
  const studio = await client.user.update({
    where: {
      id,
    },
    data: {
      studio: {
        update: {
          screen: body.screen, // 画面設定を更新
          mic: body.audio, // マイク設定を更新
          preset: body.preset, // プリセット設定を更新
        },
      },
    },
  });

  // 更新が成功した場合
  if (studio) {
    return NextResponse.json({
      status: 200,
      message: "Studio updated",
    });
  }

  // 更新が失敗した場合
  return NextResponse.json({
    status: 400,
    message: "Studio not updated",
  });
}
