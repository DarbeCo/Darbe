import { useState } from "react";
import { PostReponse } from "../../services/api/endpoints/types/posts.api.types";
import { FeedCardButtons } from "./FeedCardButtons";
import { FeedCardImages } from "./FeedCardImages";
import { FeedCardText } from "./FeedCardText";
import { FeedHeader } from "./FeedHeader";
import { Comments } from "../comments/Comments";

import styles from "./styles/feedCard.module.css";

interface FeedCardProps {
  postInfo: PostReponse;
  userId: string;
}

export const FeedCard = ({ postInfo, userId }: FeedCardProps) => {
  const {
    posterId: { id: posterId, profilePicture, fullName },
    createdAt,
    likeCount,
    commentCount,
    files,
    postText,
    likes,
    comments,
    id,
  } = postInfo;
  const canEditPost = userId === posterId;
  const [commentsOpen, setCommentsOpen] = useState(false);

  const handleOpenComments = () => {
    setCommentsOpen((prev) => !prev);
  };

  return (
    <div className={styles.feedCard}>
      <FeedHeader
        postId={id}
        posterId={posterId}
        postedDate={createdAt}
        profilePicture={profilePicture}
        posterName={fullName ?? ""}
        canEditPost={canEditPost}
      />
      <FeedCardText postText={postText} />
      <FeedCardImages files={files} />
      <FeedCardButtons
        likeCount={likeCount}
        commentCount={commentCount}
        likes={likes}
        postId={id}
        openComments={handleOpenComments}
      />
      {commentsOpen && <Comments comments={comments} postId={id} userId={userId} />}
    </div>
  );
};
