import { useGetMutualCausesQuery } from "../../services/api/endpoints/causes/causes.api";

import styles from "./styles/causesStyles.module.css";

interface MutualCausesDisplayProps {
  userId: string;
}

export const MutualCausesDisplay = ({ userId }: MutualCausesDisplayProps) => {
  const { data: mutualCauses } = useGetMutualCausesQuery(userId);
  const hasMutualCauses = mutualCauses && mutualCauses?.length > 0;
  let content;

  if (!hasMutualCauses) {
    content = <div className={styles.noMutualFriends}>No mutual friends</div>;
  }
  if (hasMutualCauses) {
    content = mutualCauses.map((cause) => (
      <div key={cause} className={styles.mutualFriendCard}>
        {cause}
      </div>
    ));
  }

  return <div className={styles.mutualFriendsContainer}>{content}</div>;
};
