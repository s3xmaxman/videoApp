import { UseMutateFunction } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z, { ZodSchema } from "zod";
/**
 * Zodスキーマとreact-hook-formを使用してフォームのバリデーションと送信を処理するためのカスタムフック。
 *
 * @param schema - フォームデータを検証するためのZodスキーマ。
 * @param mutation - フォーム送信時に呼び出されるミューテーション関数。
 * @param defaultValues - フォームフィールドのオプションのデフォルト値。
 * @returns フォームを管理するための関数と状態を含むオブジェクト:
 *   - register: 入力フィールドを登録する関数。
 *   - watch: フォームの値を監視する関数。
 *   - reset: フォームの値をリセットする関数。
 *   - onFormSubmit: フォーム送信を処理する関数。
 *   - errors: バリデーションエラーを含むオブジェクト。
 */

const useZodForm = (
  schema: ZodSchema,
  mutation: UseMutateFunction,
  defaultValues?: any
) => {
  const {
    register,
    watch,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { ...defaultValues },
  });

  const onFormSubmit = handleSubmit(async (values) => mutation({ ...values }));

  return { register, watch, reset, onFormSubmit, errors };
};

export default useZodForm;
