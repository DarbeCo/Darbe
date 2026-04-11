import { Alert } from "@mui/material";
import {
  ERROR_FETCHING_FEED,
  ERROR_SIGNING_UP,
  ERROR_SUBMITTING_COMMENT,
  ERROR_SUBMITTING_COMMENT_REPLY,
  ERROR_SUBMITTING_POST,
  ERROR_UPLOADING_FILE,
  SUCCESS_SIGNING_UP,
  SUCCESS_SUBMITTING_COMMENT,
  SUCCESS_SUBMITTING_POST,
  SUCCESS_SUBMITTING_REPLY,
  SUCCESS_UPLOADING_FILE,
  SUCCESS_FETCHING_FEED,
  ERROR_REMOVING_FRIEND_REQUEST,
  ERROR_REMOVING_FRIEND,
  SUCCES_REMOVING_FRIEND,
  GENERIC_ERROR,
  GENERIC_SUCCESS,
} from "./constants";

interface DarbeCommsProps {
  isSuccess: boolean;
  isError: boolean;
  contentType:
    | "post"
    | "comment"
    | "reply"
    | "signup"
    | "upload"
    | "feed"
    | "friendRequest"
    | "friend"
    | "generic";
}

export const DarbeComms = ({
  isSuccess,
  isError,
  contentType,
}: DarbeCommsProps) => {
  const messages = {
    error: {
      post: ERROR_SUBMITTING_POST,
      comment: ERROR_SUBMITTING_COMMENT,
      reply: ERROR_SUBMITTING_COMMENT_REPLY,
      signup: ERROR_SIGNING_UP,
      upload: ERROR_UPLOADING_FILE,
      feed: ERROR_FETCHING_FEED,
      friendRequest: ERROR_REMOVING_FRIEND_REQUEST,
      friend: ERROR_REMOVING_FRIEND,
      generic: GENERIC_ERROR,
    },
    success: {
      post: SUCCESS_SUBMITTING_POST,
      comment: SUCCESS_SUBMITTING_COMMENT,
      reply: SUCCESS_SUBMITTING_REPLY,
      signup: SUCCESS_SIGNING_UP,
      upload: SUCCESS_UPLOADING_FILE,
      feed: SUCCESS_FETCHING_FEED,
      friendRequest: ERROR_REMOVING_FRIEND_REQUEST,
      friend: SUCCES_REMOVING_FRIEND,
      generic: GENERIC_SUCCESS,
    },
  };

  const textToDisplay = messages[isSuccess ? "success" : "error"][contentType];
  const severity = isSuccess ? "success" : "error";

  return (
    <>
      {isSuccess ||
        (isError && <Alert severity={severity}>{textToDisplay}</Alert>)}
    </>
  );
};
