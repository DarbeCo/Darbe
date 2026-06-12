import { IconButton } from "@mui/material";
import { useState } from "react";

import { CustomSvgs } from "../customSvgs/CustomSvgs";
import { ConfirmDialog } from "../confirmDialog/ConfirmDialog";

import styles from "./styles/fileStyles.module.css";

interface FilePreviewsProps {
  uploadedFiles: File[] | null;
  handleRemovingImage: (index: number) => void;
  nonPostMode?: boolean;
  isCoverPhoto?: boolean;
  isEventPhoto?: boolean;
}

export const FilePreviews = ({
  uploadedFiles,
  handleRemovingImage,
  nonPostMode,
  isCoverPhoto,
  isEventPhoto,
}: FilePreviewsProps) => {
  const [fileToRemove, setFileToRemove] = useState<{
    file: File;
    index: number;
  } | null>(null);

  if (!uploadedFiles) {
    return null;
  }

  const determinePictureStyles = () => {
    if (isCoverPhoto) {
      return styles.coverPhotoPreview;
    }
    if (isEventPhoto) {
      return styles.eventPhotoPreview;
    }
    if (nonPostMode) {
      return styles.imagePreview;
    }
    return "";
  };

  const determinePictureId = () => {
    if (nonPostMode && isEventPhoto) {
      return styles.eventPhotoPreview;
    }
    return "";
  };

  const containerClassNames = nonPostMode
    ? styles.pictureImagePreview
    : styles.postFilePreviewItem;

  const imageClassNames = determinePictureStyles();
  const imageId = determinePictureId();
  const handleRemoveFile = () => {
    if (!fileToRemove) return;

    handleRemovingImage(fileToRemove.index);
    setFileToRemove(null);
  };

  return (
    <div className={styles.filePreview}>
      {Array.from(uploadedFiles).map((file: File, index) => (
        <div key={index} className={containerClassNames}>
          <img
            className={imageClassNames}
            id={imageId}
            src={URL.createObjectURL(file)}
            alt={`${file.name} preview`}
          />
          {!nonPostMode && (
            <IconButton
              className={styles.removeFileButton}
              onClick={() => setFileToRemove({ file, index })}
            >
              <CustomSvgs
                altText="delete file icon"
                variant="small"
                svgPath="/svgs/common/removeItemIcon.svg"
              />
            </IconButton>
          )}
        </div>
      ))}
      {fileToRemove && (
        <ConfirmDialog
          title={`Remove ${fileToRemove.file.name || "this file"}?`}
          confirmLabel="Remove"
          onConfirm={handleRemoveFile}
          onCancel={() => setFileToRemove(null)}
        />
      )}
    </div>
  );
};
