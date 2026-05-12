import { CardContent, CardHeader } from "@mui/material";
import { useMemo } from "react";
import { useGetSentFriendRequestsQuery } from "../../services/api/endpoints/friends/friends.api";

import styles from "./styles/currentFriends.module.css";
import PendingFriends from "./PendingFriends";
import { PendingFriendRequestState } from "./types";

const getPendingRequestName = (request: PendingFriendRequestState) =>
  request.receiverId.fullName ||
  `${request.receiverId.firstName ?? ""} ${
    request.receiverId.lastName ?? ""
  }`.trim();

const PendingFriendRequests = () => {
  const { data: pendingRequests = [] } = useGetSentFriendRequestsQuery();
  const sortedPendingRequests = useMemo(
    () =>
      [...pendingRequests].sort((firstRequest, secondRequest) =>
        getPendingRequestName(firstRequest).localeCompare(
          getPendingRequestName(secondRequest),
          undefined,
          { sensitivity: "base" }
        )
      ),
    [pendingRequests]
  );
  const pendingCount = pendingRequests.length;

  return (
    <div>
      <CardHeader
        title={`Pending Requests (${pendingCount})`}
        className={styles.friendCardHeader}
      />
      <CardContent className={styles.currentFriendCardContent}>
        {sortedPendingRequests.map((el) => (
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
