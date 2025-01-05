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

    /**
     * ミューテーション成功時に実行するコールバック関数。
     * @param data - ミューテーションの結果。
     * @returns void
     * onSuccessコールバック関数が存在する場合はその関数を実行し、
     * その後ミューテーションの結果に応じてトーストを表示します。
     * トーストのメッセージは、ミューテーションの結果のstatusが
     * 200か201の場合は"Success"、そうでない場合は"Error"になります。
     * トーストのdescriptionには、ミューテーションの結果のdataが設定されます。
     */
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
    /**
     * ミューテーションの結果が確定した後実行するコールバック関数。
     * @returns Promise<void>
     * 関連するクエリのキャッシュを無効化します。
     * `queryKey`が存在する場合はそのクエリを、ない場合はミューテーションキーを使用してクエリを指定します。
     */
    onSettled: async () => {
      return await client.invalidateQueries({
        queryKey: [queryKey],
        exact: true,
      });
    },
  });

  return { mutate, isPending };
};

/**
 * カスタムフックuseMutationDataStateは、指定されたミューテーションキーに関連付けられた
 * ミューテーションの状態を監視し、最新のミューテーション変数を取得します。
 *
 * @param mutationKey - ミューテーションの状態をフィルタリングするためのミューテーションキー。
 * @returns latestVariables - 最新のミューテーション変数を含むオブジェクト。
 */

export const useMutationDataState = (mutationKey: MutationKey) => {
  const data = useMutationState({
    filters: { mutationKey },
    /**
     * select関数は、ミューテーションの状態から最新のミューテーション変数と状態を抽出します。
     * @param mutation - ミューテーションの状態。
     * @returns { variables: any, status: MutationStatus } - ミューテーション変数と状態を含むオブジェクト。
     */
    select: (mutation) => {
      return {
        variables: mutation.state.variables as any,
        status: mutation.state.status,
      };
    },
  });

  const latestVariables = data[data.length - 1];
  return { latestVariables };
};
