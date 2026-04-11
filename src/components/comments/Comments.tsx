import { useState } from "react";

import { CreateComment } from "../createComment/CreateComment";
import { CommentCard } from "./CommentCard";
import { DarbeButton } from "../buttons/DarbeButton";
import {
  useGetCommentRepliesQuery,
  useGetPostCommentsQuery,
} from "../../services/api/endpoints/comments/comments.api";

import styles from "./styles/comments.module.css";

interface CommentsProps {
  userId: string;
  comments?: string[];
  commentId?: string;
  postId?: string;
}

export const Comments = ({ userId, commentId, postId }: CommentsProps) => {
  const [visibleComments, setVisibleComments] = useState(5);

  const loadMoreComments = (totalComments: number) => {
    setVisibleComments((prev) => Math.min(prev + 5, totalComments));
  };

  if (postId) {
    const { data: postComments } = useGetPostCommentsQuery(postId);

    const renderPostComments = postComments && postComments.length > 0;

    return (
      <div className={styles.feedCardCommentSection}>
        {renderPostComments &&
          postComments
            .slice(0, visibleComments)
            .map((comment) => (
              <CommentCard key={comment.id} comment={comment} postId={postId} userId={userId} />
            ))}
        {postComments && visibleComments < postComments.length && (
          <DarbeButton
            buttonText="Show More"
            darbeButtonType="showMore"
            onClick={() => loadMoreComments(postComments.length)}
          />
        )}
        <CreateComment postId={postId} />
      </div>
    );
  }

  if (commentId) {
    const { data: childComments } = useGetCommentRepliesQuery(commentId);
    const renderChildComments = childComments && childComments.length > 0;

    return (
      <div className={styles.feedCardCommentSection}>
        {renderChildComments &&
          childComments
            .slice(0, visibleComments)
            .map((comment) => (
              <CommentCard key={comment.id} comment={comment} userId={userId} />
            ))}
        {childComments && visibleComments < childComments.length && (
          <DarbeButton
            buttonText="Show More"
            darbeButtonType="showMore"
            onClick={() => loadMoreComments(childComments.length)}
          />
        )}
        <CreateComment commentId={commentId} />
      </div>
    );
  }
};
