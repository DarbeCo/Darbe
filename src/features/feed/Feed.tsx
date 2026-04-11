import { useEffect } from "react";
import { CircularProgress } from "@mui/material";

import { DarbeComms } from "../../components/darbeComms/DarbeComms";
import { FeedCard } from "../../components/feedCard/FeedCard";
import { useGetUserFeedQuery } from "../../services/api/endpoints/feed/feed.api";
import { useGetUserProfileQuery } from "../../services/api/endpoints/profiles/profiles.api";
import { useAppDispatch, useAppSelector } from "../../services/hooks";
import { selectCurrentUserId } from "../users/selectors";
import { setUserProfile } from "../users/userSlice";

import styles from "./styles/feed.module.css";

export const Feed = () => {
  const dispatch = useAppDispatch();
  const { data, error, isLoading } = useGetUserFeedQuery(undefined, {
    pollingInterval: 10000,
    skipPollingIfUnfocused: true,
  });
  const userId = useAppSelector(selectCurrentUserId);

  // Front load the userInformation so we can access messages quickly
  const { data: userInformation, isLoading: userInfoLoading } =
    useGetUserProfileQuery(userId, { skip: !userId });

  useEffect(() => {
    if (!userInformation) {
      return;
    }
    dispatch(setUserProfile(userInformation));
  }, [dispatch, userInformation]);

  const stillLoading = isLoading || userInfoLoading;

  return (
    <div className={styles.feed}>
      {stillLoading && <CircularProgress />}
      {error && (
        <DarbeComms isError={!!error} isSuccess={!!data} contentType="feed" />
      )}
      {data &&
        data.map((post) => (
          <FeedCard key={post.id} postInfo={post} userId={userId} />
        ))}
    </div>
  );
};
