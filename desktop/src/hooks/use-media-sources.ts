import { getMediaSources } from "@/lib/utils";
import { useReducer } from "react";

export type SourceDeviceStateProps = {
  displays?: {
    appIcon: null;
    display_id: string;
    id: string;
    name: string;
    thumbnail: unknown[];
  }[];
  audioInputs?: {
    deviceId: string;
    kind: string;
    label: string;
    groupId: string;
  }[];
  error?: string | null;
  isPending?: boolean;
};

type DisplayDeviceActionProps = {
  type: "GET_DEVICES";
  payload: SourceDeviceStateProps;
};

/**
 * メディアデバイスの情報を管理するカスタムフック
 * @returns {Object} メディアデバイスの状態と取得関数を含むオブジェクト
 * @property {SourceDeviceStateProps} state - メディアデバイスの現在の状態
 * @property {Function} fetchMediaResources - メディアデバイスの情報を取得する関数
 */
export const useMediaSources = () => {
  const [state, action] = useReducer(
    (state: SourceDeviceStateProps, action: DisplayDeviceActionProps) => {
      switch (action.type) {
        case "GET_DEVICES":
          return { ...state, ...action.payload };

        default:
          return state;
      }
    },
    {
      displays: [],
      audioInputs: [],
      error: null,
      isPending: false,
    }
  );

  /**
   * メディアデバイスの情報を非同期で取得する関数
   */
  const fetchMediaResources = () => {
    action({ type: "GET_DEVICES", payload: { isPending: true } });
    getMediaSources().then((sources) =>
      action({
        type: "GET_DEVICES",
        payload: {
          displays: sources.displays,
          audioInputs: sources.audio,
          isPending: false,
        },
      })
    );
  };

  return { state, fetchMediaResources };
};
