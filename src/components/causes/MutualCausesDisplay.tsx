import { useGetMutualCausesQuery } from "../../services/api/endpoints/causes/causes.api";
import { DarbeButton } from "../buttons/DarbeButton";

import styles from "./styles/causesStyles.module.css";

interface MutualCausesDisplayProps {
  userId: string;
}

export const MutualCausesDisplay = ({ userId }: MutualCausesDisplayProps) => {
  const { data: mutualCauses } = useGetMutualCausesQuery(userId);
  const hasMutualCauses = mutualCauses && mutualCauses?.length > 0;

  return (
    <div className={styles.mutualCausesContainer}>
      <div className={styles.mutualCausesScrollArea}>
        {!hasMutualCauses && (
          <div className={styles.noMutualCauses}>No mutual causes</div>
        )}
        {hasMutualCauses && (
          <div className={styles.mutualCausesGrid}>
            {mutualCauses.map((cause) => (
              <DarbeButton
                key={cause.id}
                buttonText={cause.name}
                darbeButtonType="causesButtonBlue"
                isDisabled
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
