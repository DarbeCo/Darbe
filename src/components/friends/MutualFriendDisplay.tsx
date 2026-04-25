import { useGetMutualFriendsQuery } from "../../services/api/endpoints/friends/friends.api";
import { UserAvatars } from "../avatars/UserAvatars";

import styles from "./styles/friends.module.css";

interface MutualFriendDisplayProps {
  userId: string;
}

export const MutualFriendDisplay = ({ userId }: MutualFriendDisplayProps) => {
  const { data: mutualFriends } = useGetMutualFriendsQuery(userId);
  const hasMutualFriends = mutualFriends && mutualFriends?.length > 0;

  return (
    <div className={styles.mutualFriendsContainer}>
      <div className={styles.mutualFriendsScrollArea}>
        {!hasMutualFriends && (
          <div className={styles.noMutualFriends}>No mutual friends</div>
        )}
        {hasMutualFriends &&
          mutualFriends.map((friend) => (
            <div key={friend.id} className={styles.mutualFriendCard}>
              <UserAvatars
                userId={friend.id}
                profilePicture={friend.profilePicture}
                fullName={friend.fullName}
              />
            </div>
          ))}
      </div>
    </div>
  );
};
