// import CommentCard from "../comment-card";
import { useQueryData } from "@/hooks/useQueryData";
import { getVideoComments } from "@/actions/user";
import { VideoCommentProps } from "@/types/index.type";

type Props = {
  author: string;
  videoId: string;
};

const Activities = ({ author, videoId }: Props) => {
  const { data } = useQueryData(["video-comments"], () =>
    getVideoComments(videoId)
  );

  const { data: comments } = data as VideoCommentProps;

  return <div>Activities</div>;
};

export default Activities;
