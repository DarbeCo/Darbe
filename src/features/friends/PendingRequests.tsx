import { CardContent, CardHeader } from "@mui/material";
import { useGetSentFriendRequestsQuery } from "../../services/api/endpoints/friends/friends.api";

import styles from "./styles/currentFriends.module.css";
import PendingFriends from "./PendingFriends";

const PendingFriendRequests = () => {
  const { data: pendingRequests = [] } = useGetSentFriendRequestsQuery();

  return (
    <div>
      <CardHeader
        title={`Pending Requests`}
        className={styles.friendCardHeader}
      />
      <CardContent className={styles.currentFriendCardContent}>
        {pendingRequests.map((el) => (
          <PendingFriends
            key={el.receiverId.id}
            friendRequest={el}
          />
        ))}
      </CardContent>
    </div>
  );
};

export default PendingFriendRequests;
