import { useState } from "react";

import { ClosingIcon } from "../../../../../components/closingIcon/ClosingIcon";
import { DarbeButton } from "../../../../../components/buttons/DarbeButton";
import { FilePreviews } from "../../../../../components/fileUpload/FilePreviews";
import { FileUpload } from "../../../../../components/fileUpload/FileUpload";
import { convertFileToBase64 } from "../../../../../utils/CommonFunctions";
import { Typography } from "../../../../../components/typography/Typography";
import { useUpdateUserProfileMutation } from "../../../../../services/api/endpoints/profiles/profiles.api";

import styles from "./styles/subSections.module.css";

// TODO: Rename file, lowercase I after P in PictureModal
interface PictureModalProps {
  closeModal: () => void;
  userId: string;
  isCoverPhoto?: boolean;
}

export const PictureModal = ({
  closeModal,
  userId,
  isCoverPhoto,
}: PictureModalProps) => {
  const [uploadedPicture, setUploadedPicture] = useState<File | undefined>(
    undefined
  );
  const [updateUserProfile, { isError }] = useUpdateUserProfileMutation();

  const handleFileUploads = (file: File[]) => {
    setUploadedPicture(file[0]);
  };

  const handleSubmitPicture = async () => {
    try {
      const base64File = uploadedPicture
        ? await convertFileToBase64(uploadedPicture)
        : undefined;

      const category = isCoverPhoto ? "coverPhoto" : "profilePicture";

      const payload = {
        user: {
          id: userId,
          [category]: base64File,
        },
      };
      // todo send files to api
      await updateUserProfile(payload).unwrap();

      closeModal();
    } catch (error) {
      console.error("Error submitting post", error);
    }
  };

  const handleRemovingImage = () => {
    setUploadedPicture(undefined);
  };

  return (
    <div className={styles.modalContainer}>
      <div className={styles.modalContent}>
        <div className={styles.modalContentHeader}>
          <ClosingIcon onClick={closeModal} horizontalPlacement="right" />
          <span className={styles.modalHeaderText}>Add Picture</span>
        </div>
        <div className={styles.modalContentForm}>
          {isError && (
            <Typography
              textToDisplay={
                "Error uploading picture! Please try a different one"
              }
              variant="boldTextSmall"
            />
          )}
          <FilePreviews
            nonPostMode
            isCoverPhoto={isCoverPhoto}
            uploadedFiles={uploadedPicture ? [uploadedPicture] : []}
            handleRemovingImage={handleRemovingImage}
          />
        </div>
        <div className={styles.modalContentFooter}>
          {!uploadedPicture && (
            <FileUpload handleFileUploads={handleFileUploads} />
          )}
          {uploadedPicture && (
            <>
              <DarbeButton
                buttonText="Save"
                darbeButtonType="saveButton"
                onClick={handleSubmitPicture}
              />
              <DarbeButton
                buttonText="Delete"
                darbeButtonType="dangerButton"
                onClick={handleRemovingImage}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
