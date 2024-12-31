import { useEffect, useState } from "react";
import { useZodForm } from "./useZodForm";
import { updateStudioSettingsSchema } from "@/schema/studio-settings.schema";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateStudioSettings } from "@/lib/utils";

/**
 * スタジオ設定を管理するためのカスタムフック
 * @param id - スタジオの一意な識別子
 * @param screen - 選択された画面キャプチャデバイスのID
 * @param audio - 選択されたオーディオデバイスのID
 * @param preset - ビデオ品質プリセット ("HD" | "SD")
 * @param plan - ユーザーのプラン ("PRO" | "FREE")
 * @returns {Object} - フォーム登録関数、ローディング状態、現在のプリセット
 */
export const useStudioSettings = (
  id: string,
  screen?: string | null,
  audio?: string | null,
  preset?: "HD" | "SD",
  plan?: "PRO" | "FREE"
) => {
  // 現在のプリセット設定を管理する状態
  const [onPreset, setOnPreset] = useState<"HD" | "SD" | undefined>();

  // Zodフォームを使用してフォームのバリデーションと状態管理を初期化
  const { register, watch } = useZodForm(updateStudioSettingsSchema, {
    screen: screen!,
    audio: audio!,
    preset: preset,
  });

  // スタジオ設定を更新するためのMutation
  const { mutate, isPending } = useMutation({
    mutationKey: ["update-studio"],
    /**
     * スタジオ設定を更新するための非同期関数。
     * @param data - スタジオ設定の新しい値。
     * @returns Promise<Response> - スタジオ設定の更新結果。
     */
    mutationFn: (data: {
      screen: string;
      id: string;
      preset: "HD" | "SD";
      audio: string;
    }) => {
      return updateStudioSettings(
        data.id,
        data.screen,
        data.audio,
        data.preset
      );
    },
    onSuccess: (data) => {
      return toast(data.status === 200 ? "Success" : "Error", {
        description: data.message,
      });
    },
  });

  // 画面とオーディオデバイスが変更された場合にメディアソースを更新
  useEffect(() => {
    if (screen && audio) {
      window.ipcRenderer.send("media-sources", {
        screen,
        id,
        audio,
        preset,
        plan,
      });
    }
  }, [screen, audio]);

  // フォームの値が変更された場合に設定を更新
  useEffect(() => {
    const subscribe = watch((values) => {
      setOnPreset(values.preset);
      mutate({
        screen: values.screen!,
        audio: values.audio!,
        preset: values.preset!,
        id,
      });

      window.ipcRenderer.send("media-sources", {
        screen: values.screen,
        id,
        audio: values.audio,
        preset: values.preset,
        plan,
      });
    });

    return () => subscribe.unsubscribe();
  }, [watch]);

  return { register, isPending, onPreset };
};
