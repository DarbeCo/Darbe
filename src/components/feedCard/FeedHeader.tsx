import { useNavigate } from "react-router-dom";
import { UserAvatars } from "../avatars/UserAvatars";
import { ITEM_CATEGORIES } from "../miniMenu/constants";
import { VerticalMore } from "../verticalMore/VerticalMore";

import styles from "./styles/feedCard.module.css";
import { PROFILE_ROUTE } from "../../routes/route.constants";

interface FeedHeaderProps {
  postId: string;
  posterId: string;
  postedDate: string;
  posterName: string;
  canEditPost: boolean;
  profilePicture?: string;
}

export const FeedHeader = ({
  postId,
  posterId,
  postedDate,
  profilePicture,
  posterName,
  canEditPost,
}: FeedHeaderProps) => {
  const navigate = useNavigate();
  // TODO: I think we have a util for this?
  const postedDateString = new Date(postedDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleProfilePictureClick = () => {
    navigate(`${PROFILE_ROUTE}/${posterId}`);
  };

  return (
    <div className={styles.postHeader}>
      <UserAvatars
        userId={posterId}
        onClick={handleProfilePictureClick}
        profilePicture={profilePicture}
        fullName={posterName}
        timeStamp={postedDateString}
      />
      {canEditPost && (
        <VerticalMore
          itemId={postId}
          itemCategory={ITEM_CATEGORIES.POST}
          canEdit={canEditPost}
        />
      )}
    </div>
  );
};
