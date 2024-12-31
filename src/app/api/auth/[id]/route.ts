import { client } from "@/lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * GETリクエストを処理する関数
 *
 * @param req - Next.jsのリクエストオブジェクト
 * @param params - パスパラメータ（ユーザーIDを含む）
 * @returns ユーザープロファイルを含むJSONレスポンス
 */
export async function GET(
  req: NextRequest,
  { params: { id } }: { params: { id: string } }
) {
  try {
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

    // エラーが発生した場合、400エラーを返す
    return NextResponse.json({ status: 400 });
  } catch (error) {
    console.log(error);
  }
}
