import { UserActivity } from "../../services/api/endpoints/types/activity.api.types";
import { UserAvatars } from "../avatars/UserAvatars";
import { Typography } from "../typography/Typography";
import { NTimeAgo } from "../../utils/CommonDateFormats";
import { RenderActivityContent } from "./RenderActivityContent";
import Expander from "../expander/Expander";

import styles from "./styles/activity.module.css";

interface RecentActivityCardProps {
  activity: UserActivity[] | undefined;
  userId: string;
  compactView?: boolean;
  disableExpander?: boolean;
}

export const RecentActivityCard = ({
  activity,
  userId,
  compactView,
  disableExpander = false,
}: RecentActivityCardProps) => {
  const iterableActivity = activity && activity?.length > 0;

  return (
    <div className={styles.activityContainer}>
      {!compactView && <Typography variant="header" textToDisplay="Activity" />}
      {iterableActivity ? (
        <Expander
          elementsToShow={3}
          buttonText="Show More"
          disabled={disableExpander}
        >
          {activity.map((item) => {
            const contentType = item.contentType;
            let canEdit;

            if (contentType === "post") {
            }
            canEdit =
              item?.userId?.id === userId || item?.posterId?.id === userId;
            const text = item.contentType === "post" ? "posted" : "commented";
            const dateFormatted = new Date(item.createdAt);
            const isIndividualProfile =
              item?.userId?.userType === "individual" ||
              item?.posterId?.userType === "individual";
            const userActivityIndividualName =
              item?.userId?.fullName || item?.posterId?.fullName;
            const userActivityEntityName =
              item?.userId?.nonprofitName ||
              item?.posterId?.nonprofitName ||
              item?.posterId?.organizationName ||
              item?.userId?.organizationName;
            const profilePictureToUse =
              item?.userId?.profilePicture || item?.posterId?.profilePicture;
            const nameToUse = isIndividualProfile
              ? userActivityIndividualName
              : userActivityEntityName;

            return (
              <div key={item.id} className={styles.entityType}>
                <div className={styles.activityHeader}>
                  <UserAvatars profilePicture={profilePictureToUse} />
                  <Typography
                    variant="grayText"
                    extraClass="paddingLeft"
                    textToDisplay={`${nameToUse} ${text} ${NTimeAgo(
                      dateFormatted
                    )}`}
                  />
                </div>
                <RenderActivityContent
                  item={item}
                  contentType={item.contentType}
                  canEdit={canEdit}
                  compactView={compactView}
                />
              </div>
            );
          })}
        </Expander>
      ) : (
        <div className={styles.noActivity}>
          <Typography
            variant="text"
            textToDisplay={`No activity found for this user yet!`}
          />
        </div>
      )}
    </div>
  );
};
