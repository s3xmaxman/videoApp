import { v4 as uuid } from "uuid";
import { hidePluginWindow } from "./utils";
import io from "socket.io-client";

let userId: string;
let videoTransferFileName: string | undefined;
let mediaRecorder: MediaRecorder;

/**
 * Socket.IOクライアントインスタンス
 * 環境変数VITE_SOCKET_URLに指定されたURLに接続
 */
const socket = io(import.meta.env.VITE_SOCKET_URL);

/**
 * 画面録画を開始する
 * @param onSources - 録画ソース情報
 * @param onSources.screen - 画面キャプチャのソースID
 * @param onSources.audio - オーディオのソースID
 * @param onSources.id - ユーザーID
 */
export const startRecording = (onSources: {
  screen: string;
  audio: string;
  id: string;
}) => {
  hidePluginWindow(true);
  videoTransferFileName = `${uuid()}-${onSources.id.slice(0, 8)}.webm`;
  mediaRecorder.start(1000);
};

/**
 * 録画停止のトリガー
 * MediaRecorderのstopメソッドを呼び出す
 */
export const onStopRecording = () => {
  mediaRecorder.stop();
};

/**
 * 録画停止時の処理
 * プラグインウィンドウを表示し、サーバーにビデオ処理をリクエスト
 */
const handleRecordingStop = () => {
  hidePluginWindow(false);
  socket.emit("process-video", {
    filename: videoTransferFileName,
    userId,
  });
};

/**
 * 録画データが利用可能になった時の処理
 * @param e - Blobイベント
 */
export const onDataAvailable = (e: BlobEvent) => {
  socket.emit("video-chunks", {
    chunks: e.data,
    filename: videoTransferFileName,
  });
};

/**
 * 録画ソースを選択し、メディアストリームを設定する
 * @param onSources - 録画ソース情報
 * @param onSources.screen - 画面キャプチャのソースID
 * @param onSources.audio - オーディオのソースID
 * @param onSources.id - ユーザーID
 * @param onSources.preset - ビデオ品質プリセット ("HD" or "SD")
 * @param videoElement - ビデオ表示用のReact参照
 *
 * この関数は以下の処理を行います:
 * 1. 画面キャプチャとオーディオのメディアストリームを取得
 * 2. ビデオ要素にストリームを設定し再生
 * 3. 画面とオーディオのストリームを結合
 * 4. 既存のMediaRecorderがあれば停止
 * 5. 新しいMediaRecorderインスタンスを作成
 * 6. データ利用可能時と停止時のイベントハンドラを設定
 *
 * @throws メディアデバイスの取得に失敗した場合、エラーをコンソールに出力
 */
export const selectSources = async (
  onSources: {
    screen: string;
    audio: string;
    id: string;
    preset: "HD" | "SD";
  },
  videoElement: React.RefObject<HTMLVideoElement>
) => {
  if (onSources && onSources.screen && onSources.audio && onSources.id) {
    // 画面キャプチャの制約条件を設定
    const constraints: any = {
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: "desktop",
          chromeMediaSourceId: onSources?.screen,
          minWidth: onSources?.preset === "HD" ? 1920 : 1280,
          maxWidth: onSources?.preset === "HD" ? 1920 : 1280,
          minHeight: onSources?.preset === "HD" ? 1080 : 720,
          maxHeight: onSources?.preset === "HD" ? 1080 : 720,
          frameRate: 30,
        },
      },
    };

    // ユーザーIDを設定
    userId = onSources.id;

    try {
      // 画面キャプチャのストリームを取得
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // オーディオストリームを取得
      const audioStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: {
          deviceId: { exact: onSources.audio },
        },
      });

      // ビデオ要素にストリームを設定し再生
      if (videoElement && videoElement.current) {
        videoElement.current.srcObject = stream;
        await videoElement.current.play();
      }

      // 画面とオーディオのストリームを結合
      const combinedStream = new MediaStream([
        ...stream.getTracks(),
        ...audioStream.getTracks(),
      ]);

      // 既存のMediaRecorderがあれば停止
      if (mediaRecorder) {
        mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      }

      // 新しいMediaRecorderインスタンスを作成
      mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: "video/webm; codecs=vp9",
      });

      // データ利用可能時と停止時のイベントハンドラを設定
      mediaRecorder.ondataavailable = onDataAvailable;
      mediaRecorder.onstop = handleRecordingStop;
    } catch (error) {
      console.error(error);
    }
  }
};
