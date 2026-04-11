import { useAppDispatch } from "../../../../services/hooks";

import { Typography } from "../../../../components/typography/Typography";
import { EditProfileIcon } from "./EditProfileIcon";
import { EDIT_SECTIONS } from "../constants";
import {
  showModal,
  setModalType,
} from "../../../../components/modal/modalSlice";

import styles from "../styles/userProfiles.module.css";
import { useGetUserActivityQuery } from "../../../../services/api/endpoints/users/userSearch.api";
import { CircularProgress } from "@mui/material";
import { RecentActivityCard } from "../../../../components/activity/RecentActivityCard";

interface UserRecentActivityProps {
  canEdit: boolean;
  userId: string;
}

export const UserRecentActivity = ({
  canEdit,
  userId,
}: UserRecentActivityProps) => {
  const dispatch = useAppDispatch();
  const handleEdit = () => {
    dispatch(setModalType(EDIT_SECTIONS.activity));
    dispatch(showModal());
  };

  const { data, isLoading } = useGetUserActivityQuery(userId);

  const hasRecentActivity = data && data.length > 0;

  return (
    <div className={styles.userRecentActivity}>
      <div className={styles.recentActivityHeader}>
        <Typography
          variant="sectionTitle"
          textToDisplay="Recent Activity"
          extraClass="paddingLeft"
        />
        {canEdit && <EditProfileIcon onClick={handleEdit} />}
      </div>
      <div className={styles.blockTextSection}>
        {isLoading && <CircularProgress />}
        {hasRecentActivity ? (
          <RecentActivityCard
            activity={data}
            userId={userId}
            disableExpander={canEdit}
            compactView
          />
        ) : (
          <Typography
            variant="grayText"
            textToDisplay="No recent activity has been found."
          />
        )}
      </div>
    </div>
  );
};
