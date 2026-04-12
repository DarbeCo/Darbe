import { UserActivity } from "../../services/api/endpoints/types/activity.api.types";
import { CustomSvgs } from "../customSvgs/CustomSvgs";
import { ITEM_CATEGORIES } from "../miniMenu/constants";
import { Typography } from "../typography/Typography";
import { VerticalMore } from "../verticalMore/VerticalMore";

import styles from "./styles/activity.module.css";

interface RenderActivityContentProps {
  item: UserActivity;
  contentType: string;
  canEdit: boolean;
  compactView?: boolean;
}

// TODO: Refresh on deletion, but don't make new component if possible
export const RenderActivityContent = ({
  item,
  contentType,
  canEdit,
  compactView,
}: RenderActivityContentProps) => {
  // TODO: Util function?
  const determineCommentPlurality = () => {
    if (contentType === "post") {
      return item.commentCount === 1 ? "comment" : "comments";
    }
    if (contentType === "comment") {
      return item.replyCount === 1 ? "reply" : "replies";
    }
  };

  // TODO: Utils function?
  const determinePluralLikes = () => {
    return item.likeCount === 1 ? "like" : "likes";
  };

  const postActivityCard = (
    <div className={styles.postActivityCard}>
      <div className={styles.activityContent}>
        <Typography variant="text" textToDisplay={item.postText} />
        {!compactView && (
          <VerticalMore
            itemId={item.id}
            itemCategory={ITEM_CATEGORIES.POST}
            canEdit={canEdit}
          />
        )}
      </div>
      {item.files && item.files.length > 0 && (
        <div className={styles.activityImageWrapper}>
          <img
            src={item.files[0]}
            alt="post attachment"
            className={styles.activityImage}
          />
          {item.files.length > 1 && (
            <span className={styles.activityImageCount}>
              +{item.files.length - 1}
            </span>
          )}
        </div>
      )}
      <div className={styles.activityFooter}>
        <div className={styles.activityFooterLikes}>
          <CustomSvgs
            svgPath="/svgs/common/likePostIcon.svg"
            altText="post like icon"
            variant="small"
          />
          <Typography
            variant="grayText"
            textToDisplay={`${item.likeCount} ${determinePluralLikes()}`}
          />
        </div>
        <div className={styles.activityFooterCommentCount}>
          <Typography
            variant="grayText"
            textToDisplay={`${
              item.commentCount
            } ${determineCommentPlurality()}`}
          />
        </div>
      </div>
    </div>
  );

  const commentActivityCard = (
    <div className={styles.commentActivityCard}>
      <div className={styles.activityContent}>
        <Typography variant="text" textToDisplay={item.commentText} />
        {!compactView && (
          <VerticalMore
            itemId={item.id}
            itemCategory={ITEM_CATEGORIES.COMMENT}
            canEdit={canEdit}
          />
        )}
      </div>
      <div className={styles.activityFooter}>
        <div className={styles.activityFooterLikes}>
          <CustomSvgs
            svgPath="/svgs/common/likePostIcon.svg"
            altText="post like icon"
            variant="small"
          />
          <Typography
            variant="grayText"
            textToDisplay={`${item.likeCount} ${determinePluralLikes()}`}
          />
        </div>
        <div className={styles.activityFooterCommentCount}>
          <Typography
            variant="grayText"
            textToDisplay={`${item.replyCount} ${determineCommentPlurality()}`}
          />
        </div>
      </div>
    </div>
  );

  return <>{contentType === "post" ? postActivityCard : commentActivityCard}</>;
};
