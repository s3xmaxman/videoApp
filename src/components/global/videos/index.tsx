import { getAllUserVideos } from "@/actions/workspace";
import { useQueryData } from "@/hooks/useQueryData";
import { VideosProps } from "@/types/index.type";
import React from "react";

type Props = {
  folderId: string;
  videosKey: string;
  workSpaceId: string;
};

const Videos = ({ folderId, videosKey, workSpaceId }: Props) => {
  const { data: videoData } = useQueryData([videosKey], () =>
    getAllUserVideos(folderId)
  );

  const { status: videosStatus, data: videos } = videoData as VideosProps;

  return <div>Videos</div>;
};

export default Videos;
