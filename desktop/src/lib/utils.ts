import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import axios from "axios";

const httpClient = axios.create({
  baseURL: import.meta.env.VITE_HOST_URL,
});

/**
 * 複数のクラス名を結合し、Tailwind CSSのクラス名の競合を解決する
 * @param {...ClassValue} inputs - 結合するクラス名
 * @returns {string} 結合されたクラス名
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * アプリケーションを終了する
 */
export const onCloseApp = () => window.ipcRenderer.send("closeApp");

/**
 * ユーザープロフィール情報を取得する
 * @param {string} clerkId - ユーザーID
 * @returns {Promise<Object>} ユーザープロフィール情報
 */
export const fetchUserProfile = async (clerkId: string) => {
  const response = await httpClient.get(`/auth/${clerkId}`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  return response.data;
};

/**
 * メディアソース（ディスプレイとオーディオ入力デバイス）を取得する
 * @returns {Promise<Object>} ディスプレイとオーディオ入力デバイスの情報
 */
export const getMediaSources = async () => {
  const displays = await window.ipcRenderer.invoke("getSources");

  const enumerateDevices =
    await window.navigator.mediaDevices.enumerateDevices();

  const audioInputs = enumerateDevices.filter(
    (device) => device.kind === "audioinput"
  );

  return { displays, audio: audioInputs };
};

/**
 * スタジオ設定を更新する
 * @param {string} id - スタジオID
 * @param {string} screen - 選択されたスクリーン
 * @param {string} audio - 選択されたオーディオデバイス
 * @param {"HD" | "SD"} preset - プリセット設定
 * @returns {Promise<Object>} 更新されたスタジオ設定情報
 */
export const updateStudioSettings = async (
  id: string,
  screen: string,
  audio: string,
  preset: "HD" | "SD"
) => {
  const response = await httpClient.post(
    `/studio/${id}`,
    {
      screen,
      audio,
      preset,
    },
    {
      headers: { "Content-Type": "application/json" },
    }
  );

  return response.data;
};

/**
 * プラグインウィンドウの表示/非表示を切り替える
 * @param {boolean} state - ウィンドウを非表示にするかどうか
 */
export const hidePluginWindow = (state: boolean) => {
  window.ipcRenderer.send("hide-plugin", { state });
};

/**
 * ミリ秒を時間形式（HH:MM:SS）に変換する
 * @param {number} ms - ミリ秒
 * @returns {Object} 時間形式の文字列と分
 */
export const videoRecordingTime = (ms: number) => {
  const second = Math.floor((ms / 1000) % 60)
    .toString()
    .padStart(2, "0");
  const minute = Math.floor((ms / 1000 / 60) % 60)
    .toString()
    .padStart(2, "0");
  const hour = Math.floor((ms / 1000 / 60 / 60) % 60)
    .toString()
    .padStart(2, "0");
  return { length: `${hour}:${minute}:${second}`, minute };
};

/**
 * ウィンドウのサイズを変更する
 * @param {boolean} shrink - ウィンドウを縮小するかどうか
 */
export const resizeWindow = (shrink: boolean) => {
  window.ipcRenderer.send("resize-studio", { shrink });
};
