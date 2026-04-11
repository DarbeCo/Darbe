import { Card, Container } from "@mui/material";
import { FriendRequests } from "./friendRequests";
import styles from "./styles/friendRequests.module.css";
import CurrentFriends from "./CurrentFriends";
import { useSelector } from "react-redux";
import { selectUser } from "../users/selectors";
import PendingFriendRequests from "./PendingRequests";

export const FriendsList = () => {
  const { user } = useSelector(selectUser);

  return (
    <Container>
      <Card className={styles.friendsListCard}>
        <FriendRequests />
        <PendingFriendRequests />
        <CurrentFriends user={user} />
      </Card>
    </Container>
  );
};
