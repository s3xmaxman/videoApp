"use client";
import { getPreviewVideo } from "@/actions/workspace";
import { useQueryData } from "@/hooks/useQueryData";
import { VideoProps } from "@/types/index.type";
import React from "react";

type Props = {
  videoId: string;
};

const VideoPreview = ({ videoId }: Props) => {
  const { data } = useQueryData(["preview-video"], () =>
    getPreviewVideo(videoId)
  );

  const { data: video, status, author } = data as VideoProps;

  return <div>VideoPreview</div>;
};

export default VideoPreview;
