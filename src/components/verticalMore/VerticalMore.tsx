import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { IconButton, Menu, MenuItem } from "@mui/material";

import { CustomSvgs } from "../customSvgs/CustomSvgs";
import { ITEM_CATEGORIES } from "../miniMenu/constants";
import { useDeletePostMutation } from "../../services/api/endpoints/posts/posts.api";
import { useDeleteCommentMutation } from "../../services/api/endpoints/comments/comments.api";
import { useDeleteEventMutation } from "../../services/api/endpoints/events/events.api";
import { HOME_ROUTE } from "../../routes/route.constants";
import { useDeleteMessagesThreadMutation } from "../../services/api/endpoints/messages/messages.api";

import styles from "./verticalMore.module.css";

interface VerticalMoreProps {
  itemId: string;
  itemCategory: string;
  canEdit: boolean;
}

export const VerticalMore = ({
  itemId,
  itemCategory,
  canEdit,
}: VerticalMoreProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showPostDeleteConfirm, setShowPostDeleteConfirm] = useState(false);
  const open = Boolean(anchorEl);

  const [deletePost, { isLoading: isDeletingPost }] = useDeletePostMutation();
  const [deleteComment] = useDeleteCommentMutation();
  const [deleteEvent] = useDeleteEventMutation();
  const [deleteMessagesThread] = useDeleteMessagesThreadMutation();

  const location = useLocation();
  const history = useNavigate();

  const handleConfirmPostDelete = async () => {
    try {
      await deletePost(itemId).unwrap();
      setShowPostDeleteConfirm(false);

      const inSinglePostView = location.pathname.includes("post");

      if (inSinglePostView) {
        history(HOME_ROUTE);
      }
    } catch (error) {
      console.error("Error deleting post", error);
    }
  };

  const handleDelete = () => {
    setAnchorEl(null);

    if (itemCategory === ITEM_CATEGORIES.POST) {
      setShowPostDeleteConfirm(true);
      return;
    }
    if (itemCategory === ITEM_CATEGORIES.COMMENT) {
      deleteComment(itemId);
    }
    if (itemCategory === ITEM_CATEGORIES.EVENT) {
      deleteEvent(itemId);

      const inSingleEventView = location.pathname.includes("event");

      if (inSingleEventView) {
        history(HOME_ROUTE);
      }
    }
    if (itemCategory === ITEM_CATEGORIES.MESSAGES) {
      deleteMessagesThread(itemId);
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton onClick={handleClick}>
        <CustomSvgs
          altText="three dot menu"
          svgPath="/svgs/common/threeDotMenuIcon.svg"
          variant="tiny"
        />
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        {canEdit && <MenuItem onClick={handleDelete}>Delete</MenuItem>}
      </Menu>
      {showPostDeleteConfirm ? (
        <div className={styles.deletePostOverlay}>
          <div
            className={styles.deletePostDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`delete-post-dialog-title-${itemId}`}
          >
            <h2
              className={styles.deletePostTitle}
              id={`delete-post-dialog-title-${itemId}`}
            >
              Are you sure you want to delete?
            </h2>
            <div className={styles.deletePostActions}>
              <button
                type="button"
                className={styles.deletePostYesButton}
                onClick={handleConfirmPostDelete}
                disabled={isDeletingPost}
              >
                Yes
              </button>
              <button
                type="button"
                className={styles.deletePostCancelButton}
                onClick={() => setShowPostDeleteConfirm(false)}
                disabled={isDeletingPost}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};
