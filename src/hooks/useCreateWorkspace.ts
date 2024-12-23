import { useMutationData } from "./useMutationData";
import { createWorkspace } from "@/actions/workspace";
import useZodForm from "./useZodForm";
import { workspaceSchema } from "@/components/forms/workspace-form/schema";

/**
 * ワークスペースを作成するための関数と変数のセットを返すフック。
 *
 * @returns 次のプロパティを持つオブジェクト:
 *   - `errors`: フォームのバリデーションエラーを含むオブジェクト。
 *   - `onFormSubmit`: ワークスペースを作成するためにフォームを送信する関数。
 *   - `register`: 各フォーム入力要素を登録する関数。
 *   - `isPending`: ワークスペースの作成が進行中かどうかを示すブール値。
 */
export const useCreateWorkspace = () => {
  const { mutate, isPending } = useMutationData(
    ["create-workspace"],
    (data: { name: string }) => createWorkspace(data.name),
    "user-workspaces"
  );

  const { errors, onFormSubmit, register } = useZodForm(
    workspaceSchema,
    mutate
  );

  return { errors, onFormSubmit, register, isPending };
};
