import React, { useState } from "react";
import { Divider, Menu } from "@mui/material";

import { CustomSvgs } from "../customSvgs/CustomSvgs";
import { pluralize } from "../../utils/CommonFunctions";
import { DarbeButton } from "../buttons/DarbeButton";
import { useSelector } from "react-redux";
import { selectUser } from "../../features/users/selectors";
import { useSubmitLikeMutation } from "../../services/api/endpoints/feed/feed.api";

import styles from "./styles/feedCard.module.css";
import { MiniMenuItems } from "../miniMenu/MiniMenuItems";
import { useModal } from "../../utils/commonHooks/UseModal";

interface FeedCardButtonsProps {
  likeCount: number;
  commentCount: number;
  likes: string[];
  postId: string;
  openComments?: () => void;
}

export const FeedCardButtons = ({
  likeCount,
  commentCount,
  likes,
  postId,
  openComments,
}: FeedCardButtonsProps) => {
  const { user } = useSelector(selectUser);

  if (!user?.id) {
    return null;
  }
  const [isLiked, setIsLiked] = useState(likes.includes(user.id));
  const [totalLikes, setTotalLikes] = useState(likeCount);
  const [submitLike] = useSubmitLikeMutation();
  const { isVisible: isShareMenuVisible, hide, toggle } = useModal();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleLike = async () => {
    if (isLiked) {
      await submitLike(postId);
      setTotalLikes((prevCount) => prevCount - 1);
      setIsLiked(!isLiked);
    } else {
      await submitLike(postId);
      setTotalLikes((prevCount) => prevCount + 1);
      setIsLiked(!isLiked);
    }
  };

  const handleComment = () => {
    openComments?.();
  };

  const handleShare = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    toggle();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(
      `${window.location.origin}/home/posts/${postId}`
    );
    hide();
  };

  return (
    <div className={styles.postButtons}>
      <div className={styles.postStats}>
        <div className={styles.likeCount}>
          <CustomSvgs
            altText="like icon"
            svgPath="/svgs/common/likePostIcon.svg"
            variant="small"
          />
          <span className={styles.postStat}>{totalLikes}</span>
        </div>
        <span className={styles.postStat}>
          {`${commentCount} ${pluralize(commentCount, "Comment", "s")}`}
        </span>
      </div>
      <Divider orientation="horizontal" className={styles.divider} />
      <div className={styles.postActions}>
        <DarbeButton
          onClick={handleLike}
          buttonText={isLiked ? "Unlike" : "Like"}
          startingIconPath="/svgs/common/addLikeIcon.svg"
          darbeButtonType="postActionButton"
        />
        <DarbeButton
          onClick={handleComment}
          buttonText="Comment"
          startingIconPath="/svgs/common/addCommentIcon.svg"
          darbeButtonType="postActionButton"
        />
        <DarbeButton
          onClick={handleShare}
          buttonText="Share"
          startingIconPath="/svgs/common/addShareIcon.svg"
          darbeButtonType="postActionButton"
        />
        {isShareMenuVisible && (
          <Menu
            id="entity-creation-options"
            anchorEl={anchorEl}
            open={isShareMenuVisible}
            onClose={hide}
            MenuListProps={{ "aria-labelledby": "basic-button" }}
          >
            <MiniMenuItems onClick={handleCopyLink} routeName="copyLink" />
          </Menu>
        )}
      </div>
    </div>
  );
};
