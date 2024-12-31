"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { client } from "../lib/prisma";
import { sendEmail } from "./user";

/**
 * ワークスペースへのアクセス権を検証する
 * @param {string} workspaceId - 検証するワークスペースのID
 * @returns {Promise<{status: number, data: {workspace: any}}>} 検証結果
 * @throws {Error} データベース接続エラーが発生した場合
 */
export const verifyAccessToWorkspace = async (workspaceId: string) => {
  try {
    const user = await currentUser();

    if (!user) {
      return { status: 403, data: { workspace: null } };
    }

    // ユーザーがワークスペースにアクセス権を持っているか確認 (Read操作)
    const isUserInWorkspace = await client.workSpace.findUnique({
      where: {
        id: workspaceId,
        OR: [
          {
            User: {
              clerkid: user.id,
            },
          },
          {
            members: {
              every: {
                User: {
                  clerkid: user.id,
                },
              },
            },
          },
        ],
      },
    });

    return { status: 200, data: { workspace: isUserInWorkspace } };
  } catch (error) {
    console.log(error);
    return { status: 403, data: { workspace: null } };
  }
};

/**
 * ワークスペース内のフォルダ一覧を取得する
 * @param {string} workSpaceId - ワークスペースID
 * @returns {Promise<{status: number, data: any[]}>} フォルダ一覧
 * @throws {Error} データベース接続エラーが発生した場合
 */
export const getWorkspaceFolders = async (workSpaceId: string) => {
  try {
    // フォルダ一覧を取得 (Read操作)
    const isFolders = await client.folder.findMany({
      where: {
        workSpaceId,
      },
      include: {
        _count: {
          select: {
            videos: true,
          },
        },
      },
    });

    if (isFolders && isFolders.length > 0) {
      return { status: 200, data: isFolders };
    }

    return { status: 404, data: [] };
  } catch (error) {
    console.log(error);
    return { status: 403, data: [] };
  }
};

/**
 * ユーザーの全ての動画を取得する
 * @param {string} workSpaceId - ワークスペースID
 * @returns {Promise<{status: number, data?: any[]}>} 動画一覧
 * @throws {Error} データベース接続エラーが発生した場合
 */
export const getAllUserVideos = async (workSpaceId: string) => {
  try {
    const user = await currentUser();

    if (!user) {
      return { status: 404 };
    }

    // ワークスペースIDまたはフォルダIDで動画を検索 (Read操作)
    const videos = await client.video.findMany({
      where: {
        OR: [{ workSpaceId }, { folderId: workSpaceId }],
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        source: true,
        processing: true,
        Folder: {
          select: {
            id: true,
            name: true,
          },
        },
        User: {
          select: {
            firstname: true,
            lastname: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (videos && videos.length > 0) {
      return { status: 200, data: videos };
    }

    return { status: 404 };
  } catch (error) {
    console.log(error);
    return { status: 404 };
  }
};

/**
 * ユーザーの全てのワークスペースを取得する
 * @returns {Promise<{status: number, data?: any}>} ワークスペース一覧
 * @throws {Error} データベース接続エラーが発生した場合
 */
export const getWorkSpaces = async () => {
  try {
    const user = await currentUser();

    if (!user) {
      return { status: 404 };
    }

    // ユーザーのサブスクリプション情報とワークスペース情報を取得 (Read操作)
    const workspaces = await client.user.findUnique({
      where: {
        clerkid: user.id,
      },
      select: {
        subscription: {
          select: {
            plan: true,
          },
        },
        workspace: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        members: {
          select: {
            WorkSpace: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
      },
    });

    if (workspaces) {
      return { status: 200, data: workspaces };
    }
  } catch (error) {
    console.log(error);
    return { status: 404 };
  }
};

/**
 * 新しいワークスペースを作成する
 * @param {string} name - ワークスペース名
 * @returns {Promise<{status: number, data: string}>} 作成結果
 * @throws {Error} データベース接続エラーが発生した場合
 */
export const createWorkspace = async (name: string) => {
  try {
    const user = await currentUser();

    if (!user) {
      return { status: 404 };
    }

    // ユーザーの認証状態を確認 (Read操作)
    const authorized = await client.user.findUnique({
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

    // PROプランのユーザーのみワークスペースを作成可能
    if (authorized?.subscription?.plan === "PRO") {
      // ワークスペースを作成 (Create操作)
      const workspace = await client.user.update({
        where: {
          clerkid: user.id,
        },
        data: {
          workspace: {
            create: {
              name,
              type: "PUBLIC",
            },
          },
        },
      });

      if (workspace) {
        return { status: 201, data: "Workspace Created" };
      }
    }

    return {
      status: 401,
      data: "You are not authorized to create a workspace.",
    };
  } catch (error) {
    console.log(error);
    return { status: 400 };
  }
};

/**
 * フォルダ名を変更する
 * @param {string} folderId - フォルダID
 * @param {string} name - 新しいフォルダ名
 * @returns {Promise<{status: number, data: string}>} 変更結果
 * @throws {Error} データベース接続エラーが発生した場合
 */
export const renameFolders = async (folderId: string, name: string) => {
  try {
    // フォルダ名を更新 (Update操作)
    const folder = await client.folder.update({
      where: {
        id: folderId,
      },
      data: {
        name,
      },
    });

    if (folder) {
      return { status: 200, data: "Folder Renamed" };
    }

    return { status: 400, data: "Folder Not Found" };
  } catch (error) {
    console.log(error);
    return { status: 500, data: "Opps! something went wrong" };
  }
};

/**
 * 新しいフォルダを作成する
 * @param {string} workspaceId - ワークスペースID
 * @returns {Promise<{status: number, message: string}>} 作成結果
 * @throws {Error} データベース接続エラーが発生した場合
 */
export const createFolder = async (workspaceId: string) => {
  try {
    // 新しいフォルダを作成 (Create操作)
    const isNewFolder = await client.workSpace.update({
      where: {
        id: workspaceId,
      },
      data: {
        folders: {
          create: { name: "Untitled" },
        },
      },
    });

    if (isNewFolder) {
      return { status: 200, message: "New Folder Created" };
    }
  } catch (error) {
    return { status: 500, message: "Oppose something went wrong" };
  }
};

/**
 * フォルダ情報を取得する
 * @param {string} folderId - フォルダID
 * @returns {Promise<{status: number, data: any}>} フォルダ情報
 * @throws {Error} データベース接続エラーが発生した場合
 */
export const getFolderInfo = async (folderId: string) => {
  try {
    // フォルダ情報を取得 (Read操作)
    const folder = await client.folder.findUnique({
      where: {
        id: folderId,
      },
      select: {
        name: true,
        _count: {
          select: {
            videos: true,
          },
        },
      },
    });

    if (folder) {
      return { status: 200, data: folder };
    }

    return { status: 404, data: null };
  } catch (error) {
    return { status: 500, data: null };
  }
};

/**
 * 動画の保存場所を変更する
 * @param {string} videoId - 動画ID
 * @param {string} workSpaceId - ワークスペースID
 * @param {string} folderId - フォルダID
 * @returns {Promise<{status: number, data: string}>} 変更結果
 * @throws {Error} データベース接続エラーが発生した場合
 */
export const moveVideoLocation = async (
  videoId: string,
  workSpaceId: string,
  folderId: string
) => {
  try {
    // 動画の保存場所を更新 (Update操作)
    const location = await client.video.update({
      where: {
        id: videoId,
      },
      data: {
        folderId: folderId || null,
        workSpaceId,
      },
    });

    if (location) {
      return { status: 200, data: "folder changed successfully" };
    }

    return { status: 404, data: "workspace or folder not found" };
  } catch (error) {
    return { status: 500, data: "Opps! something went wrong" };
  }
};

/**
 * 動画のプレビュー情報を取得する
 * @param {string} videoId - 動画ID
 * @returns {Promise<{status: number, data: any, author: boolean}>} 動画情報
 * @throws {Error} データベース接続エラーが発生した場合
 */
export const getPreviewVideo = async (videoId: string) => {
  try {
    const user = await currentUser();

    if (!user) {
      return { status: 404 };
    }

    // 動画情報を取得 (Read操作)
    const video = await client.video.findUnique({
      where: {
        id: videoId,
      },
      select: {
        title: true,
        createdAt: true,
        source: true,
        description: true,
        processing: true,
        views: true,
        summery: true,
        User: {
          select: {
            firstname: true,
            lastname: true,
            image: true,
            clerkid: true,
            trial: true,
            subscription: {
              select: {
                plan: true,
              },
            },
          },
        },
      },
    });

    if (video) {
      return {
        status: 200,
        data: video,
        author: video.User?.clerkid ? true : false,
      };
    }

    return { status: 404 };
  } catch (error) {
    return { status: 500 };
  }
};

/**
 * 初回視聴時にメールを送信する
 * @param {string} videoId - 動画ID
 * @returns {Promise<void>}
 * @throws {Error} メール送信エラーが発生した場合
 */
export const sendEmailForFirstView = async (videoId: string) => {
  try {
    const user = await currentUser();

    if (!user) {
      return { status: 404 };
    }

    // 初回視聴設定を取得 (Read操作)
    const firstViewSettings = await client.user.findUnique({
      where: {
        clerkid: user.id,
      },
      select: {
        firstView: true,
      },
    });

    if (!firstViewSettings?.firstView) return;

    // 動画情報を取得 (Read操作)
    const video = await client.video.findUnique({
      where: {
        id: videoId,
      },
      select: {
        title: true,
        views: true,
        User: {
          select: {
            email: true,
          },
        },
      },
    });

    if (video && video.views === 0) {
      // 動画の視聴回数を更新 (Update操作)
      await client.video.update({
        where: {
          id: videoId,
        },
        data: {
          views: video.views + 1,
        },
      });

      const { transporter, mailOptions } = await sendEmail(
        video.User?.email!,
        "You got a viewer",
        `Your video ${video.title} just got its first viewer`
      );

      transporter.sendMail(mailOptions, async (error, info) => {
        if (error) {
          console.log(error.message);
        } else {
          // 通知を作成 (Create操作)
          const notification = await client.user.update({
            where: {
              clerkid: user.id,
            },
            data: {
              notification: {
                create: {
                  content: mailOptions.text,
                },
              },
            },
          });

          if (notification) {
            return {
              status: 200,
            };
          }
        }
      });
    }
  } catch (error) {
    console.log(error);
  }
};
