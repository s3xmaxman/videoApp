import { client } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * ユーザーのビデオ処理リクエストを処理するAPIエンドポイント
 *
 * @param {NextRequest} req - Next.jsのリクエストオブジェクト
 * @param {Object} params - ルートパラメータを含むオブジェクト
 * @param {Promise<{id: string}>} params.params - ユーザーIDを含むPromiseオブジェクト
 * @returns {Promise<NextResponse>} - 処理結果を含むNextResponseオブジェクト
 *
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    // ユーザーのワークスペースを取得
    const userWorkspace = await client.user.findUnique({
      where: {
        id, // ユーザーIDで検索
      },
      select: {
        workspace: {
          where: {
            type: "PERSONAL", // 個人用ワークスペースのみ取得
          },
          select: {
            id: true, // ワークスペースIDのみ選択
          },
          orderBy: {
            createdAt: "asc", // 作成日が古い順に並び替え
          },
        },
      },
    });

    // 取得したワークスペースに新しいビデオを追加
    const workspaceWithNewVideo = await client.workSpace.update({
      where: {
        id: userWorkspace?.workspace[0].id, // 最初に見つかったワークスペースIDを使用
      },
      data: {
        videos: {
          create: {
            source: body.filename, // リクエストボディからファイル名を取得
            userId: id, // ユーザーIDを関連付け
          },
        },
      },
      select: {
        User: {
          select: {
            subscription: {
              select: {
                plan: true, // ユーザーのサブスクリプションプランを取得
              },
            },
          },
        },
      },
    });

    if (workspaceWithNewVideo) {
      return NextResponse.json({
        status: 200,
        plan: workspaceWithNewVideo.User?.subscription?.plan,
      });
    }

    return NextResponse.json({ status: 400 });
  } catch (error) {
    console.log("🔴 Error in processing video", error);
  }
}
