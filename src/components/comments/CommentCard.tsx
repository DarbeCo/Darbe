import { useState } from "react";
import { CommentResponse } from "../../services/api/endpoints/types/comments.api.types";
import { getUserDisplayName } from "../../utils/CommonFunctions";
import { VerticalMore } from "../verticalMore/VerticalMore";
import { CommentCardButtons } from "./CommentCardButtons";
import { Comments } from "./Comments";
import { ITEM_CATEGORIES } from "../miniMenu/constants";
import { UserAvatars } from "../avatars/UserAvatars";

import styles from "./styles/comments.module.css";

interface CommentCardProps {
  comment: CommentResponse;
  userId: string;
  postId?: string;
}

export const CommentCard = ({ userId, comment }: CommentCardProps) => {
  const nameToShow = getUserDisplayName(comment.userId);
  const [repliesOpen, setRepliesOpen] = useState(false);

  const canEdit = comment.userId?.id === userId;

  const handleOpenReplies = () => {
    setRepliesOpen((prev) => !prev);
  };

  return (
    <div className={styles.commentCard}>
      <UserAvatars profilePicture={comment.userId?.profilePicture} />
      <div className={styles.commentCardArea}>
        <div className={styles.commentCardContainer}>
          <div className={styles.commentCardHeader}>
            <span className={styles.commentCardUserName}>{nameToShow}</span>
            {canEdit && (
              <VerticalMore
                itemCategory={ITEM_CATEGORIES.COMMENT}
                itemId={comment.id}
                canEdit={canEdit}
              />
            )}
          </div>
          <span className={styles.commentCardText}>{comment.commentText}</span>
        </div>
        <CommentCardButtons
          openReplies={handleOpenReplies}
          likes={comment.commentLikes}
          commentId={comment.id}
          likeCount={comment.likeCount}
          createdAt={comment.createdAt}
          isChild={comment.isChildComment}
        />
        {repliesOpen && <Comments commentId={comment.id} userId={userId} />}
      </div>
    </div>
  );
};
