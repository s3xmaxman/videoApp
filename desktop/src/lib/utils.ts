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

export const getMediaSources = async () => {
  const displays = await window.ipcRenderer.invoke("getSources");

  const enumerateDevices =
    await window.navigator.mediaDevices.enumerateDevices();

  const audioInputs = enumerateDevices.filter(
    (device) => device.kind === "audioinput"
  );

  return { displays, audio: audioInputs };
};
