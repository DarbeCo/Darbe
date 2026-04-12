import { useGetMutualCausesQuery } from "../../services/api/endpoints/causes/causes.api";
import { DarbeButton } from "../buttons/DarbeButton";

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
    content = (
      <div className={styles.causesContainer}>
        {mutualCauses.map((cause) => (
          <DarbeButton
            key={cause.id}
            buttonText={cause.name}
            darbeButtonType="causesButtonBlue"
            isDisabled
          />
        ))}
      </div>
    );
  }

  return <div className={styles.mutualFriendsContainer}>{content}</div>;
};
