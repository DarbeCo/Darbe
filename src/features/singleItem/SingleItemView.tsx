import { useLocation } from "react-router-dom";

import { RenderSingleDonation } from "./itemTypes/RenderSingleDonation";
import { RenderSingleEvent } from "./itemTypes/RenderSingleEvent";
import { RenderSinglePost } from "./itemTypes/RenderSinglePost";
import { DarbeComms } from "../../components/darbeComms/DarbeComms";
import { selectCurrentUserId } from "../users/selectors";
import { useAppSelector } from "../../services/hooks";
import { RenderSingleComment } from "./itemTypes/RenderSingleComment";

import styles from "./styles/singleItems.module.css";

interface SingleItemViewProps {
  itemType: "POST" | "EVENT" | "DONATION" | "COMMENT";
}

export const SingleItemView = ({ itemType }: SingleItemViewProps) => {
  const location = useLocation();
  const match = location.pathname.match(/\/(posts|donations|events)\/([^/]+)/);
  const itemId = match ? match[2] : null;
  const userId = useAppSelector(selectCurrentUserId);

  if (!itemId || !userId) {
    return <DarbeComms isError isSuccess={false} contentType="generic" />;
  }

  return (
    <div className={styles.singleItemView}>
      {itemType === "POST" && (
        <RenderSinglePost postId={itemId} userId={userId} />
      )}
      {itemType === "EVENT" && (
        <RenderSingleEvent eventId={itemId} userId={userId} />
      )}
      {itemType === "DONATION" && (
        <RenderSingleDonation donationId={itemId} userId={userId} />
      )}
      {itemType === "COMMENT" && (
        <RenderSingleComment commentId={itemId} userId={userId} />
      )}
    </div>
  );
};
