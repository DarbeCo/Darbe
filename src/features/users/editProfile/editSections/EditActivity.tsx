import { CircularProgress } from "@mui/material";
import { useAppSelector } from "../../../../services/hooks";
import { selectCurrentUserId } from "../../selectors";
import { useGetUserActivityQuery } from "../../../../services/api/endpoints/users/userSearch.api";
import { RecentActivityCard } from "../../../../components/activity/RecentActivityCard";


import styles from "../styles/profileEdit.module.css";

export const EditActivity = () => {
  const userId = useAppSelector(selectCurrentUserId);
  const { data, isLoading } = useGetUserActivityQuery(userId);

  return (
    <div className={styles.profileEditContent}>
      {isLoading && <CircularProgress />}
      {!isLoading && <RecentActivityCard activity={data} userId={userId} />}
    </div>
  );
};
