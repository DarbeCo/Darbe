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
  const open = Boolean(anchorEl);

  const [deletePost] = useDeletePostMutation();
  const [deleteComment] = useDeleteCommentMutation();
  const [deleteEvent] = useDeleteEventMutation();
  const [deleteMessagesThread] = useDeleteMessagesThreadMutation();

  const location = useLocation();
  const history = useNavigate();

  const handleDelete = () => {
    if (itemCategory === ITEM_CATEGORIES.POST) {
      deletePost(itemId);

      const inSinglePostView = location.pathname.includes("post");

      if (inSinglePostView) {
        history(HOME_ROUTE);
      }
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
    </>
  );
};
