import { client } from "@/lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * ユーザープロファイルを取得または作成するAPIエンドポイント
 *
 * このAPIは以下の処理を行います：
 * 1. 指定されたユーザーIDに基づいてデータベースからユーザープロファイルを検索
 * 2. ユーザープロファイルが存在しない場合、Clerkからユーザー情報を取得
 * 3. 取得した情報に基づいて新しいユーザープロファイルを作成
 * 4. 成功時にはユーザープロファイルを返却、エラー時には適切なステータスコードを返却
 *
 * @param {NextRequest} req - Next.jsのリクエストオブジェクト
 * @param {Object} params - パスパラメータを含むオブジェクト
 * @param {Promise<{ id: string }>} params.params - ユーザーIDを含むパスパラメータ
 * @returns {Promise<NextResponse>} - 以下の形式のJSONレスポンス：
 *   - 成功時（200）：{ status: number, user: UserProfile }
 *   - 新規作成時（201）：{ status: number, user: UserProfile }
 *   - エラー時（400）：{ status: number }
 * @throws {Error} - 予期せぬエラーが発生した場合
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // データベースからユーザープロファイルを取得
    const userProfile = await client.user.findUnique({
      where: {
        clerkid: id,
      },
      include: {
        studio: true,
        subscription: {
          select: {
            plan: true,
          },
        },
      },
    });

    // ユーザープロファイルが存在する場合、それを返す
    if (userProfile) {
      return NextResponse.json({ status: 200, user: userProfile });
    }

    // Clerkからユーザー情報を取得
    const clerkClientInstance = await clerkClient();
    const clerkUserInstance = await clerkClientInstance.users.getUser(id);

    // ユーザープロファイルが存在しない場合、新たに作成
    const createUser = await client.user.create({
      data: {
        clerkid: id,
        email: clerkUserInstance.emailAddresses[0].emailAddress,
        firstname: clerkUserInstance.firstName,
        lastname: clerkUserInstance.lastName,
        studio: {
          create: {},
        },
        workspace: {
          create: {
            name: `${clerkUserInstance.firstName}'s Workspace`,
            type: "PERSONAL",
          },
        },
        subscription: {
          create: {},
        },
      },
      include: {
        subscription: {
          select: {
            plan: true,
          },
        },
      },
    });

    // ユーザープロファイルの作成に成功した場合、それを返す
    if (createUser) {
      return NextResponse.json({ status: 201, user: createUser });
    }

    // リクエストが不正な場合、400エラーを返す
    return NextResponse.json({ status: 400 });
  } catch (error) {
    // 予期せぬエラーが発生した場合、エラーログを出力
    console.error("Error in GET /api/auth/[id]:", error);
    return NextResponse.json({ status: 500 });
  }
}
