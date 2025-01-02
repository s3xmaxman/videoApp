import { v4 as uuid } from "uuid";
import { hidePluginWindow } from "./utils";
import io from "socket.io-client";

let userId: string;
let videoTransferFileName: string | undefined;
let mediaRecorder: MediaRecorder;

export const startRecording = (onSources: {
  screen: string;
  audio: string;
  id: string;
}) => {
  hidePluginWindow(true);
  videoTransferFileName = `${uuid()}-${onSources.id.slice(0, 8)}.webm`;
  mediaRecorder.start(1000);
};

export const onStopRecording = () => {
  mediaRecorder.stop();
};

export const onDataAvailable = (event: BlobEvent) => {};

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

    userId = onSources.id;

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const audioStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: {
          deviceId: { exact: onSources.audio },
        },
      });

      if (videoElement && videoElement.current) {
        videoElement.current.srcObject = stream;
        await videoElement.current.play();
      }

      const combinedStream = new MediaStream([
        ...stream.getTracks(),
        ...audioStream.getTracks(),
      ]);

      if (mediaRecorder) {
        mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      }

      mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: "video/webm; codecs=vp9",
      });
    } catch (error) {}
  }
};
