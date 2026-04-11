import { CircularProgress } from "@mui/material";
import { FeedCard } from "../../../components/feedCard/FeedCard";
import { useGetPostQuery } from "../../../services/api/endpoints/posts/posts.api";

interface RenderSinglePostProps {
  userId: string;
  postId: string;
}

export const RenderSinglePost = ({ userId, postId }: RenderSinglePostProps) => {
  const { data: post, isLoading } = useGetPostQuery(postId);

  return (
    <>
      {isLoading && <CircularProgress />}
      {!isLoading && post && <FeedCard postInfo={post} userId={userId} />}
    </>
  );
};
