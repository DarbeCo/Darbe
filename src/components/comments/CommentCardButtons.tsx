import { useState } from "react";
import { IconButton } from "@mui/material";
import { useSelector } from "react-redux";

import { CustomSvgs } from "../customSvgs/CustomSvgs";
import { formatDateTime } from "../../utils/CommonFunctions";
import { DATE_CONSTANTS } from "../../utils/CommonConstants";
import { selectUser } from "../../features/users/selectors";
import { useSubmitCommentLikeMutation } from "../../services/api/endpoints/comments/comments.api";

import styles from "./styles/comments.module.css";

interface CommentCardButtonsProps {
  likes: string[];
  commentId: string;
  likeCount: number;
  createdAt: string;
  openReplies?: () => void;
  isChild?: boolean;
}

export const CommentCardButtons = ({
  likes,
  commentId,
  likeCount,
  createdAt,
  openReplies,
  isChild,
}: CommentCardButtonsProps) => {
  const { user } = useSelector(selectUser);

  if (!user?.id) {
    return null;
  }

  const [isLiked, setIsLiked] = useState(likes.includes(user.id));
  const [totalLikes, setTotalLikes] = useState(likeCount);
  const [submitCommentLike] = useSubmitCommentLikeMutation();
  const formattedDate = formatDateTime(createdAt, DATE_CONSTANTS.N_TIME_AGO);

  const handleReplies = () => {
    if (!isChild) {
      openReplies?.();
    }
  };

  const handleLike = async () => {
    if (isLiked) {
      await submitCommentLike(commentId);
      setTotalLikes((prevCount) => prevCount - 1);
      setIsLiked(!isLiked);
    } else {
      await submitCommentLike(commentId);
      setTotalLikes((prevCount) => prevCount + 1);
      setIsLiked(!isLiked);
    }
  };

  return (
    <div className={styles.commentCardButtons}>
      <div className={styles.commentLikesArea}>
        <IconButton onClick={handleLike}>
          <span className={styles.cardButtonText}>
            {isLiked ? "Unlike" : "Like"}
          </span>
        </IconButton>
        {likeCount > 0 && (
          <div className={styles.likeCount}>
            <CustomSvgs
              altText="like icon"
              svgPath="/svgs/common/likePostIcon.svg"
              variant="tiny"
            />
            <span className={styles.commentStat}>{totalLikes}</span>
          </div>
        )}
      </div>
      {!isChild && (
        <>
          <span className={styles.cardButtonDot}> &#x2022; </span>
          <div>
            <IconButton onClick={handleReplies}>
              <span className={styles.cardButtonText}>Reply</span>
            </IconButton>
          </div>
        </>
      )}
      <span className={styles.cardButtonDot}> &#x2022; </span>
      <div>
        <span className={styles.cardButtonDate}>{formattedDate}</span>
      </div>
    </div>
  );
};
