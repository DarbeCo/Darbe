import { useState } from "react";
import { useSelector } from "react-redux";
import { CircularProgress } from "@mui/material";

import { Inputs } from "../inputs/Inputs";
import { DarbeButton } from "../buttons/DarbeButton";
import { DarbeAvatar } from "../avatars/DarbeAvatar";
import { selectUser } from "../../features/users/selectors";
import { DarbeComms } from "../darbeComms/DarbeComms";
import {
  useSubmitCommentMutation,
  useSubmitReplyMutation,
} from "../../services/api/endpoints/comments/comments.api";

import styles from "./styles/createComment.module.css";

interface CreateCommentProps {
  postId?: string;
  commentId?: string;
}

export const CreateComment = ({ postId, commentId }: CreateCommentProps) => {
  const { user } = useSelector(selectUser);
  const [commentText, setCommentText] = useState("");

  const [submitComment, { isLoading, isSuccess, isError }] =
    useSubmitCommentMutation();
  const [
    submitReply,
    {
      isLoading: replyIsLoading,
      isSuccess: replyIsSuccess,
      isError: replyIsError,
    },
  ] = useSubmitReplyMutation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCommentText(e.target.value);
  };

  const submitsComment = async (userId: string, postId: string) => {
    try {
      const newComment = {
        userId: userId,
        postId,
        commentText,
      };

      await submitComment(newComment).unwrap();
    } catch (error) {
      console.error("Error submitting comment", error);
    }
  };

  const submitsReply = async (userId: string, commentId: string) => {
    try {
      const newReply = {
        userId: userId,
        commentId,
        commentText,
      };

      await submitReply(newReply).unwrap();
    } catch (error) {
      console.error("Error submitting reply", error);
    }
  };

  const handleSubmitComment = async () => {
    try {
      if (!user) {
        throw new Error("User not found");
      }

      if (commentId) {
        await submitsReply(user.id, commentId);
      }
      if (postId) {
        await submitsComment(user.id, postId);
      }

      setCommentText("");
    } catch (error) {
      console.error("Error submitting comment", error);
    }
  };

  const error = isError || replyIsError;
  const success = isSuccess || replyIsSuccess;
  const loadingSubmission = isLoading || replyIsLoading;

  return (
    <div className={styles.createCommentContainer}>
      <div className={styles.commentEntryArea}>
        <DarbeAvatar />
        <Inputs
          label=""
          value={commentText}
          darbeInputType="textAreaInput"
          handleChange={handleChange}
          name="createComment"
          placeholder="Write a comment..."
          isTextArea
        />
      </div>
      <div className={styles.darbeCommentActions}>
        {(error || success) && (
          <DarbeComms
            isSuccess={success}
            isError={error}
            contentType="comment"
          />
        )}
        {loadingSubmission && <CircularProgress />}
        <DarbeButton
          buttonText="Comment"
          darbeButtonType="postButton"
          onClick={handleSubmitComment}
          isDisabled={commentText?.length === 0}
        />
      </div>
    </div>
  );
};
