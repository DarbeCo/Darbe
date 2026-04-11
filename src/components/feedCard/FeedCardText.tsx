import { useState } from "react";
import { Typography } from "@mui/material";
import styles from "./styles/feedCard.module.css";

interface FeedCardTextProps {
  postText: string;
}

const MAX_LENGTH = 100;

export const FeedCardText = ({ postText }: FeedCardTextProps) => {
  const [expanded, setExpanded] = useState(false);

  const shouldTruncate = postText.length > MAX_LENGTH;
  const displayedText =
    !expanded && shouldTruncate
      ? postText.slice(0, MAX_LENGTH) + "..."
      : postText;

  const handleReadMore = () => {
    setExpanded(true);
  };

  return (
    <div className={styles.postContent}>
      <Typography paragraph className={styles.postText}>
        {displayedText}
      </Typography>
      {!expanded && shouldTruncate && (
        <Typography
          variant="body2"
          className={"paddingLeft"}
          onClick={handleReadMore}
          style={{ cursor: "pointer" }}
        >
          Read more
        </Typography>
      )}
    </div>
  );
};
