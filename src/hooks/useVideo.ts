import { createCommentSchema } from "@/components/forms/comment-form/schema";
import { useMutationData } from "./useMutationData";
import { useQueryData } from "./useQueryData";
import useZodForm from "./useZodForm";
import { createCommentAndReply, getUserProfile } from "@/actions/user";

/**
 * ビデオコメント用のカスタムフック
 * @param {string} videoId ビデオID
 * @param {string} [commentId] 返信先コメントID（任意）
 * @returns {{
 *   register: Function,
 *   errors: Object,
 *   onFormSubmit: Function,
 *   isPending: boolean
 * }} フォーム関連のプロパティを返す
 *
 * @property {Function} register フォーム入力の登録用関数
 * @property {Object} errors フォームバリデーションエラー
 * @property {Function} onFormSubmit フォーム送信ハンドラー
 * @property {boolean} isPending コメント投稿中のローディング状態
 */
export const useVideoComment = (videoId: string, commentId?: string) => {
  const { data } = useQueryData(["user-profile"], getUserProfile);

  const { data: user, status } = data as {
    status: number;
    data: { id: string; image: string };
  };

  const { isPending, mutate } = useMutationData(
    ["new-comment"],
    (data: { comment: string }) =>
      createCommentAndReply(user.id, data.comment, videoId, commentId),
    "video-comments",
    () => reset()
  );

  const { register, onFormSubmit, errors, reset } = useZodForm(
    createCommentSchema,
    mutate
  );

  return { register, errors, onFormSubmit, isPending };
};
