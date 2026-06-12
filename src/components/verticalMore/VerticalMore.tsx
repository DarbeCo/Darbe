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
  const [deleteConfirmCategory, setDeleteConfirmCategory] = useState<
    string | null
  >(null);
  const open = Boolean(anchorEl);

  const [deletePost, { isLoading: isDeletingPost }] = useDeletePostMutation();
  const [deleteComment] = useDeleteCommentMutation();
  const [deleteEvent] = useDeleteEventMutation();
  const [deleteMessagesThread] = useDeleteMessagesThreadMutation();

  const location = useLocation();
  const history = useNavigate();

  const getDeleteItemName = () => {
    if (deleteConfirmCategory === ITEM_CATEGORIES.POST) return "this post";
    if (deleteConfirmCategory === ITEM_CATEGORIES.COMMENT) return "this comment";
    if (deleteConfirmCategory === ITEM_CATEGORIES.EVENT) return "this event";
    if (deleteConfirmCategory === ITEM_CATEGORIES.MESSAGES) {
      return "this message thread";
    }

    return "this item";
  };

  const isDeleting =
    deleteConfirmCategory === ITEM_CATEGORIES.POST ? isDeletingPost : false;

  const handleConfirmDelete = async () => {
    try {
      if (deleteConfirmCategory === ITEM_CATEGORIES.POST) {
        await deletePost(itemId).unwrap();

        const inSinglePostView = location.pathname.includes("post");

        if (inSinglePostView) {
          history(HOME_ROUTE);
        }
      }
      if (deleteConfirmCategory === ITEM_CATEGORIES.COMMENT) {
        await deleteComment(itemId).unwrap();
      }
      if (deleteConfirmCategory === ITEM_CATEGORIES.EVENT) {
        await deleteEvent(itemId).unwrap();

        const inSingleEventView = location.pathname.includes("event");

        if (inSingleEventView) {
          history(HOME_ROUTE);
        }
      }
      if (deleteConfirmCategory === ITEM_CATEGORIES.MESSAGES) {
        await deleteMessagesThread(itemId).unwrap();
      }

      setDeleteConfirmCategory(null);
    } catch (error) {
      console.error("Error deleting item", error);
    }
  };

  const handleDelete = () => {
    setAnchorEl(null);

    setDeleteConfirmCategory(itemCategory);
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
      {deleteConfirmCategory ? (
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
              Are you sure you want to delete {getDeleteItemName()}?
            </h2>
            <div className={styles.deletePostActions}>
              <button
                type="button"
                className={styles.deletePostYesButton}
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                Yes
              </button>
              <button
                type="button"
                className={styles.deletePostCancelButton}
                onClick={() => setDeleteConfirmCategory(null)}
                disabled={isDeleting}
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
