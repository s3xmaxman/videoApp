import { onStopRecording, selectSources, StartRecording } from "@/lib/recorder";
import { cn, videoRecordingTime } from "@/lib/utils";
import { Pause, Square } from "lucide-react";
import { Cast } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type SourceConfig = {
  screen: string;
  id: string;
  audio: string;
  preset: "HD" | "SD";
  plan: "PRO" | "FREE";
};

const StudioTray = () => {
  const initialTime = new Date();
  const videoElement = useRef<HTMLVideoElement | null>(null);

  const [preview, setPreview] = useState(false);
  const [onTimer, setOnTimer] = useState<string>("00:00:00");
  const [recoding, setRecording] = useState(false);
  const [count, setCount] = useState(0);
  const [onSources, setOnSources] = useState<SourceConfig | null>(null);

  return !onSources ? (
    <></>
  ) : (
    <div className="flex flex-col justify-end gap-y-5 h-screen ">
      <video
        autoPlay
        ref={videoElement}
        className={cn("w-6/12 self-end bg-white", !preview ? "hidden" : "")}
      />
      <div className="rounded-full flex justify-around items-center h-20 w-full border-2 bg-[#171717] draggable border-white/40">
        <div
          {...(onSources && {
            onClick: () => {
              setRecording(true);
              StartRecording(onSources);
            },
          })}
          className={cn(
            "non-draggable rounded-full cursor-pointer relative hover:opacity-80",
            recording ? "bg-red-500 w-6 h-6" : "bg-red-400 w-8 h-8"
          )}
        >
          {recording && (
            <span className="absolute -right-16 top-1/2 transform -translate-y-1/2 text-white">
              {onTimer}
            </span>
          )}
        </div>
        {!recording ? (
          <Pause
            className="non-draggable opacity-50"
            size={32}
            fill="white"
            stroke="none"
          />
        ) : (
          <Square
            className="non-draggable cursor-pointer hover:scale-110 transition transform duration-150"
            onClick={() => {
              setRecording(false);
              clearTime();
              onStopRecording();
            }}
            size={32}
            fill="white"
            stroke="white"
          />
        )}
        <Cast
          onClick={() => setPreview((prev) => !prev)}
          size={32}
          fill="white"
          className="cursor-pointer non-draggable hover:opacity-60"
          stroke="white"
        />
      </div>
    </div>
  );
};

export default StudioTray;
