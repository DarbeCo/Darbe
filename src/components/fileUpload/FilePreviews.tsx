import { IconButton } from "@mui/material";

import { CustomSvgs } from "../customSvgs/CustomSvgs";

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
    : styles.filePreview;

  const imageClassNames = determinePictureStyles();
  const imageId = determinePictureId();

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
              onClick={() => handleRemovingImage(index)}
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
    </div>
  );
};
