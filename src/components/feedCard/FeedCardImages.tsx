import { useState } from "react";
import { IconButton } from "@mui/material";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";

import styles from "./styles/feedCard.module.css";

interface FeedCardImagesProps {
  files: string[] | null;
}

export const FeedCardImages = ({ files }: FeedCardImagesProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!files || files.length === 0) return null;

  const handlePrevClick = () => {
    setCurrentIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : prevIndex));
  };

  const handleNextClick = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex < files.length - 1 ? prevIndex + 1 : prevIndex
    );
  };

  return (
    <div className={styles.postImages}>
      <img
        src={files[currentIndex]}
        alt="post image"
        className={styles.postImage}
      />
      {files.length > 1 && (
        <div className={styles.navigationButtons}>
          <IconButton onClick={handlePrevClick} disabled={currentIndex === 0}>
            <ChevronLeft />
          </IconButton>
          <IconButton
            onClick={handleNextClick}
            disabled={currentIndex === files.length - 1}
          >
            <ChevronRight />
          </IconButton>
        </div>
      )}
    </div>
  );
};
