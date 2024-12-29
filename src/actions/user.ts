"use server";

import { currentUser } from "@clerk/nextjs/server";
import { client } from "../lib/prisma";

/**
 * ユーザー認証処理
 * @returns {Promise<{status: number, user?: User}>} 認証結果とユーザーデータ
 */
export const onAuthenticateUser = async () => {
  try {
    const user = await currentUser();

    // ユーザーが存在しない場合は403エラーを返す
    if (!user) {
      return { status: 403 };
    }

    // データベースからユーザー情報を取得
    const userExist = await client.user.findUnique({
      where: {
        clerkid: user.id,
      },
      include: {
        workspace: {
          where: {
            User: {
              clerkid: user.id,
            },
          },
        },
      },
    });

    // ユーザーが既に存在する場合はその情報を返す
    if (userExist) {
      return { status: 200, user: userExist };
    }

    // 新規ユーザーを作成
    const newUser = await client.user.create({
      data: {
        clerkid: user.id,
        email: user.emailAddresses[0].emailAddress,
        firstname: user.firstName,
        lastname: user.lastName,
        image: user.imageUrl,
        studio: {
          create: {},
        },
        subscription: {
          create: {},
        },
        workspace: {
          create: {
            name: `${user.firstName}'s Workspace`,
            type: "PERSONAL",
          },
        },
      },
      include: {
        workspace: {
          where: {
            User: {
              clerkid: user.id,
            },
          },
        },
        subscription: {
          select: {
            plan: true,
          },
        },
      },
    });

    // 新規ユーザー作成成功時は201ステータスを返す
    if (newUser) {
      return { status: 201, user: newUser };
    }

    return { status: 400 };
  } catch (error) {
    console.log("🔴 ERROR", error);
    return { status: 500 };
  }
};

/**
 * ユーザーの通知を取得
 * @returns {Promise<{status: number, data: any}>} 通知データ
 */
export const getNotifications = async () => {
  try {
    const user = await currentUser();

    // ユーザーが存在しない場合は404エラーを返す
    if (!user) {
      return { status: 404 };
    }

    // データベースから通知情報を取得
    const notifications = await client.user.findUnique({
      where: {
        clerkid: user.id,
      },
      select: {
        notification: true,
        _count: {
          select: {
            notification: true,
          },
        },
      },
    });

    // 通知が存在する場合はその情報を返す
    if (notifications && notifications.notification.length > 0) {
      return { status: 200, data: notifications };
    }

    return { status: 404, data: [] };
  } catch (error) {
    console.log(error);
    return { status: 400, data: [] };
  }
};

/**
 * ユーザーを検索
 * @param {string} query 検索クエリ
 * @returns {Promise<{status: number, data: any}>} 検索結果
 */
export const searchUsers = async (query: string) => {
  try {
    const user = await currentUser();
    if (!user) return { status: 404 };

    // データベースからユーザーを検索
    const users = await client.user.findMany({
      where: {
        OR: [
          { firstname: { contains: query } },
          { email: { contains: query } },
          { lastname: { contains: query } },
        ],
        NOT: [{ clerkid: user.id }],
      },
      select: {
        id: true,
        subscription: {
          select: {
            plan: true,
          },
        },
        firstname: true,
        lastname: true,
        image: true,
        email: true,
      },
    });

    // 検索結果が存在する場合はその情報を返す
    if (users && users.length > 0) {
      return { status: 200, data: users };
    }

    return { status: 404, data: undefined };
  } catch (error) {
    console.log(error);
    return { status: 500, data: undefined };
  }
};

export const getPaymentInfo = async () => {
  try {
    const user = await currentUser();

    if (!user) return { status: 404 };

    const payment = await client.user.findUnique({
      where: {
        clerkid: user.id,
      },
      select: {
        subscription: {
          select: {
            plan: true,
          },
        },
      },
    });

    if (payment) {
      return { status: 200, data: payment };
    }

    return { status: 400 };
  } catch (error) {
    console.log(error);
    return { status: 400 };
  }
};

export const enableFirstView = async (state: boolean) => {
  try {
    const user = await currentUser();

    if (!user) return { status: 404 };

    const view = await client.user.update({
      where: {
        clerkid: user.id,
      },
      data: {
        firstView: state,
      },
    });

    if (view) {
      return { status: 200, data: "Setting Updated" };
    }
  } catch (error) {
    console.log(error);
    return { status: 400 };
  }
};

export const getFirstView = async () => {
  try {
    const user = await currentUser();

    if (!user) return { status: 404 };

    const userData = await client.user.findUnique({
      where: {
        clerkid: user.id,
      },
      select: {
        firstView: true,
      },
    });

    if (userData) {
      return { status: 200, data: userData.firstView };
    }

    return { status: 400, data: false };
  } catch (error) {
    console.log(error);
    return { status: 400 };
  }
};
