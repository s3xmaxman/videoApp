"use server";

import { currentUser } from "@clerk/nextjs/server";
import { client } from "../lib/prisma";
import nodemailer from "nodemailer";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_CLIENT_SECRET as string);

/**
 * メール送信処理
 * @param {string} to 送信先メールアドレス
 * @param {string} subject 件名
 * @param {string} text 本文（テキスト形式）
 * @param {string} [html] 本文（HTML形式、オプション）
 * @returns {Promise<{transporter: nodemailer.Transporter, mailOptions: nodemailer.SendMailOptions}>} メール送信設定
 */
export const sendEmail = async (
  to: string,
  subject: string,
  text: string,
  html?: string
) => {
  // GmailのSMTP設定
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.MAILER_EMAIL,
      pass: process.env.MAILER_PASSWORD,
    },
  });

  const mailOptions = {
    to,
    subject,
    text,
    html,
  };

  return { transporter, mailOptions };
};

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

    // データベースからユーザー情報を取得 (Read操作)
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

    // 新規ユーザー作成処理 (Create操作)
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

    // データベースから通知情報を取得 (Read操作)
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

    // データベースからユーザーを検索 (Read操作)
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

/**
 * ユーザーの支払い情報を取得
 * @returns {Promise<{status: number, data: any}>} 支払い情報
 */
export const getPaymentInfo = async () => {
  try {
    const user = await currentUser();

    if (!user) return { status: 404 };

    // データベースから支払い情報を取得 (Read操作)
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

/**
 * 初回ビューの有効/無効を設定
 * @param {boolean} state 設定する状態
 * @returns {Promise<{status: number, data: string}>} 更新結果
 */
export const enableFirstView = async (state: boolean) => {
  try {
    const user = await currentUser();

    if (!user) return { status: 404 };

    // 初回ビューの状態を更新 (Update操作)
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

/**
 * 初回ビューの状態を取得
 * @returns {Promise<{status: number, data: boolean}>} 初回ビューの状態
 */
export const getFirstView = async () => {
  try {
    const user = await currentUser();

    if (!user) return { status: 404 };

    // データベースから初回ビューの状態を取得 (Read操作)
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

/**
 * ビデオのコメントを取得
 * @param {string} Id ビデオID
 * @returns {Promise<{status: number, data: any}>} コメントデータ
 */
export const getVideoComments = async (Id: string) => {
  try {
    // データベースからビデオのコメントを取得 (Read操作)
    const comments = await client.comment.findMany({
      where: {
        OR: [{ videoId: Id }, { commentId: Id }],
        commentId: null,
      },
      include: {
        reply: {
          include: {
            User: true,
          },
        },
        User: true,
      },
    });

    return { status: 200, data: comments };
  } catch (error) {
    return { status: 400 };
  }
};

/**
 * コメントと返信を作成
 * @param {string} userId ユーザーID
 * @param {string} comment コメント内容
 * @param {string} videoId ビデオID
 * @param {string | undefined} commentId 返信先コメントID（任意）
 * @returns {Promise<{status: number, data: string}>} 作成結果
 */
export const createCommentAndReply = async (
  userId: string,
  comment: string,
  videoId: string,
  commentId?: string | undefined
) => {
  try {
    if (commentId) {
      // 返信を作成 (Create操作)
      const reply = await client.comment.update({
        where: {
          id: commentId,
        },
        data: {
          reply: {
            create: {
              comment,
              userId,
              videoId,
            },
          },
        },
      });

      if (reply) {
        return { status: 200, data: "Reply posted" };
      }
    }

    // 新しいコメントを作成 (Create操作)
    const newComment = await client.video.update({
      where: {
        id: videoId,
      },
      data: {
        Comment: {
          create: {
            comment,
            userId,
          },
        },
      },
    });

    if (newComment) {
      return { status: 200, data: "New comment added" };
    }
  } catch (error) {
    return { status: 400 };
  }
};

/**
 * ユーザープロフィール情報を取得
 * @returns {Promise<{status: number, data: {image: string, id: string} | undefined}>} プロフィール情報
 */
export const getUserProfile = async () => {
  try {
    const user = await currentUser();

    if (!user) return { status: 404 };

    // データベースからユーザープロフィール情報を取得 (Read操作)
    const profileIdAndImage = await client.user.findUnique({
      where: {
        clerkid: user.id,
      },
      select: {
        image: true,
        id: true,
      },
    });

    if (profileIdAndImage) {
      return { status: 200, data: profileIdAndImage };
    }
  } catch (error) {
    console.log(error);
    return { status: 400 };
  }
};

/**
 * メンバーをワークスペースに招待
 * @param {string} workspaceId ワークスペースID
 * @param {string} receiverId 受信者ID
 * @param {string} email メールアドレス
 * @returns {Promise<{status: number, data: string}>} 招待結果
 */
export const inviteMembers = async (
  workspaceId: string,
  receiverId: string,
  email: string
) => {
  try {
    const user = await currentUser();

    if (!user) {
      return {
        status: 404,
      };
    }

    // 送信者の情報を取得 (Read操作)
    const senderInfo = await client.user.findUnique({
      where: {
        clerkid: user.id,
      },
      select: {
        id: true,
        firstname: true,
        lastname: true,
      },
    });

    if (senderInfo?.id) {
      // ワークスペースの情報を取得 (Read操作)
      const workspace = await client.workSpace.findUnique({
        where: {
          id: workspaceId,
        },
        select: {
          name: true,
        },
      });

      if (workspace) {
        // 招待を作成 (Create操作)
        const invitation = await client.invite.create({
          data: {
            senderId: senderInfo.id,
            recieverId: receiverId,
            workSpaceId: workspaceId,
            content: `You are invited to join ${workspace.name} Workspace, click accept to confirm`,
          },
          select: {
            id: true,
          },
        });

        // 通知を作成 (Create操作)
        await client.user.update({
          where: {
            clerkid: user.id,
          },
          data: {
            notification: {
              create: {
                content: `${user.firstName} ${user.lastName} invited ${senderInfo.firstname} into ${workspace.name}`,
              },
            },
          },
        });

        if (invitation) {
          const { transporter, mailOptions } = await sendEmail(
            email,
            "You got an invitation",
            "You are invited to join ${workspace.name} Workspace, click accept to confirm",
            `<a href="${process.env.NEXT_PUBLIC_HOST_URL}/invite/${invitation.id}" style="background-color: #000; padding: 5px 10px; border-radius: 10px;">Accept Invite</a>`
          );

          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.log("🔴", error.message);
            } else {
              console.log("✅ Email send");
            }
          });
          return { status: 200, data: "Invite sent" };
        }
        return { status: 400, data: "invitation failed" };
      }
      return { status: 404, data: "workspace not found" };
    }
    return { status: 404, data: "recipient not found" };
  } catch (error) {
    console.log(error);
    return { status: 400, data: "Oops! something went wrong" };
  }
};

/**
 * 招待を承認
 * @param {string} inviteId 招待ID
 * @returns {Promise<{status: number}>} 承認結果
 */
export const acceptInvite = async (inviteId: string) => {
  try {
    const user = await currentUser();

    if (!user)
      return {
        status: 404,
      };

    // 招待情報を取得 (Read操作)
    const invitation = await client.invite.findUnique({
      where: {
        id: inviteId,
      },
      select: {
        workSpaceId: true,
        reciever: {
          select: {
            clerkid: true,
          },
        },
      },
    });

    if (user.id !== invitation?.reciever?.clerkid) {
      return {
        status: 404,
      };
    }

    // 招待を承認 (Update操作)
    const acceptInvite = client.invite.update({
      where: {
        id: inviteId,
      },
      data: {
        accepted: true,
      },
    });

    // メンバーを更新 (Update操作)
    const updateMember = client.user.update({
      where: {
        clerkid: user.id,
      },
      data: {
        members: {
          create: {
            workSpaceId: invitation.workSpaceId,
          },
        },
      },
    });

    const membersTransaction = await client.$transaction([
      acceptInvite,
      updateMember,
    ]);

    if (membersTransaction) {
      return {
        status: 200,
      };
    }

    return { status: 400 };
  } catch (error) {
    return { status: 400 };
  }
};

/**
 * サブスクリプションを完了
 * @param {string} session_id StripeセッションID
 * @returns {Promise<{status: number}>} 完了結果
 */
export const completeSubscription = async (session_id: string) => {
  try {
    const user = await currentUser();

    if (!user) {
      return {
        status: 404,
      };
    }

    // Stripeセッションを取得 (Read操作)
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session) {
      // サブスクリプションを更新 (Update操作)
      const customer = await client.user.update({
        where: {
          clerkid: user.id,
        },
        data: {
          subscription: {
            update: {
              data: {
                customerId: session.customer as string,
                plan: "PRO",
              },
            },
          },
        },
      });

      if (customer) {
        return {
          status: 200,
        };
      }
    }

    return { status: 404 };
  } catch (error) {
    return { status: 400 };
  }
};
