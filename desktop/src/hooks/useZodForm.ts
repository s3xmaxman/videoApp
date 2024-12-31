import { zodResolver } from "@hookform/resolvers/zod";
import { DefaultValues, useForm } from "react-hook-form";
import z from "zod";

/**
 * Zodスキーマを使用してフォームを管理するカスタムフック
 *
 * @template T - Zodスキーマの型
 * @param {T} schema - フォームのバリデーションに使用するZodスキーマ
 * @param {DefaultValues<z.TypeOf<T>> | undefined} defaultValues - フォームのデフォルト値
 * @returns {Object} フォーム管理に必要なメソッドと状態
 * @property {Function} register - フォームフィールドを登録する関数
 * @property {Object} errors - フォームのエラー情報
 * @property {Function} handleSubmit - フォーム送信を処理する関数
 * @property {Function} watch - フォームフィールドの値を監視する関数
 * @property {Function} reset - フォームをリセットする関数
 */
export const useZodForm = <T extends z.ZodType<any>>(
  schema: T,
  defaultValues: DefaultValues<z.TypeOf<T>> | undefined
) => {
  const {
    register,
    formState: { errors },
    handleSubmit,
    watch,
    reset,
  } = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  return { register, errors, handleSubmit, watch, reset };
};
