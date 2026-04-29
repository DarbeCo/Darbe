import { useState } from "react";
import { useSelector } from "react-redux";
import { CircularProgress } from "@mui/material";

import { Inputs } from "../inputs/Inputs";
import { DarbeButton } from "../buttons/DarbeButton";
import { FileUpload } from "../fileUpload/FileUpload";
import { selectUser } from "../../features/users/selectors";
import { NewPostBody } from "./types";
import { FilePreviews } from "../fileUpload/FilePreviews";
import { DarbeComms } from "../darbeComms/DarbeComms";
import { convertFileToBase64 } from "../../utils/CommonFunctions";
import { useSubmitPostMutation } from "../../services/api/endpoints/posts/posts.api";

import styles from "./styles/createPost.module.css";

interface CreatePostProps {
  handleSubmit: () => void;
  initialText?: string;
}

// TODO: Move the file uploads into a singular component for better DRY-ness across Darbe
export const CreatePost = ({ handleSubmit, initialText = "" }: CreatePostProps) => {
  const { user } = useSelector(selectUser);
  const [post, setPost] = useState(initialText);
  const [showShareConfirmation, setShowShareConfirmation] = useState(false);
  const [submitPost, { isLoading, isSuccess, isError }] =
    useSubmitPostMutation();
  const [uploadedFiles, setUploadedFiles] = useState<File[] | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPost(e.target.value);
  };

  const handleSubmitPost = async () => {
    try {
      const base64Files = uploadedFiles
        ? await Promise.all(
            uploadedFiles.map((file) => convertFileToBase64(file))
          )
        : [];

      const postBody: NewPostBody = {
        posterId: user?.id ?? "",
        postText: post,
        files: base64Files,
      };

      await submitPost(postBody).unwrap();

      if (initialText) {
        setShowShareConfirmation(true);
      }

      setTimeout(() => {
        handleSubmit();
      }, initialText ? 1400 : 500);
    } catch (error) {
      console.error("Error submitting post", error);
    }
  };

  const handleFileUploads = (files: File[]) => {
    setUploadedFiles(files);
  };

  const handleRemovingImage = (index: number) => {
    setUploadedFiles((state) => {
      if (state) {
        const newState = [...state];
        newState.splice(index, 1);
        return newState;
      }
      return null;
    });
  };

  return (
    <div className={styles.createPostContainer}>
      <Inputs
        label=""
        darbeInputType="textAreaInput"
        handleChange={handleChange}
        name="createPost"
        placeholder="Write something..."
        value={post}
        isTextArea
      />
      <FilePreviews
        uploadedFiles={uploadedFiles}
        handleRemovingImage={handleRemovingImage}
      />
      <div className={styles.darbePostActions}>
        <FileUpload handleFileUploads={handleFileUploads} />
        <DarbeButton
          buttonText="Post"
          darbeButtonType="postButton"
          onClick={handleSubmitPost}
          isDisabled={post.length === 0}
        />
      </div>
      {(isError || isSuccess) && (
        <DarbeComms
          isSuccess={isSuccess}
          isError={isError}
          contentType="post"
        />
      )}
      {showShareConfirmation && (
        <div className={styles.shareConfirmationDialog} role="status">
          <span className={styles.shareConfirmationIcon} aria-hidden="true" />
          <span>Event shared</span>
        </div>
      )}
      {isLoading && <CircularProgress />}
    </div>
  );
};
