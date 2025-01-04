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

    const userWorkspace = await client.user.findUnique({
      where: {
        id,
      },
      select: {
        workspace: {
          where: {
            type: "PERSONAL",
          },
          select: {
            id: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    const workspaceWithNewVideo = await client.workSpace.update({
      where: {
        id: userWorkspace?.workspace[0].id,
      },
      data: {
        videos: {
          create: {
            source: body.filename,
            userId: id,
          },
        },
      },
      select: {
        User: {
          select: {
            subscription: {
              select: {
                plan: true,
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
