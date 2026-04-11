import { CardHeader, CardContent } from "@mui/material";
import { useGetFriendRequestsQuery } from "../../services/api/endpoints/friends/friends.api";
import { useMemo } from "react";
import FriendsCard from "./FriendCard";
import styles from "./styles/friendRequests.module.css";

export const FriendRequests = () => {
  const { data: friendRequests = [], isLoading: friendRequestsLoading } =
    useGetFriendRequestsQuery();

  const allFriendRequests = useMemo(
    () => (!friendRequestsLoading ? friendRequests : []),
    [friendRequests, friendRequestsLoading]
  );

  return (
    <div className={styles.friendCardHeaderContentDivWrapper}>
      <CardHeader
        title={"Friend Requests"}
        className={styles.friendRequestCardHeader}
      />
      <CardContent className={styles.friendRequestCardContent}>
        {allFriendRequests.map((el, index) => (
          <FriendsCard
            key={`${el.receiverId}_${index}_${el.requesterId.id}`}
            friendRequest={el}
          />
        ))}
      </CardContent>
    </div>
  );
};
