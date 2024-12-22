import {
  MutationFunction,
  MutationKey,
  useMutation,
  useMutationState,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

/**
 * React QueryのuseMutationフックをラップしたカスタムフック。
 * データ変更と状態管理を簡略化します。
 *
 * @param mutationKey - ミューテーションキー。ミューテーションのキャッシュと再実行に使用されます。
 * @param mutationFn - データ変更のための非同期関数。
 * @param queryKey - 関連するクエリキー（オプション）。ミューテーション成功後にこのキーのクエリを無効化します。
 * @param onSuccess - ミューテーション成功時に実行するコールバック関数（オプション）。
 * @returns mutate - ミューテーションを実行するための関数。
 * @returns isPending - ミューテーションが保留中かどうか。
 */
export const useMutationData = (
  mutationKey: MutationKey,
  mutationFn: MutationFunction<any, any>,
  queryKey?: string,
  onSuccess?: () => void
) => {
  const client = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationKey,
    mutationFn,
    onSuccess: (data) => {
      if (onSuccess) {
        onSuccess();
      }
      return toast(
        data?.status === 200 || data?.status === 201 ? "Success" : "Error",
        {
          description: data?.data,
        }
      );
    },
    onSettled: async () => {
      return await client.invalidateQueries({
        queryKey: [queryKey],
        exact: true,
      });
    },
  });

  return { mutate, isPending };
};
