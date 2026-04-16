import { useEffect, useMemo, useState } from "react";
import { CircularProgress } from "@mui/material";
import { Individualcause } from "./IndividualCause";
import { Cause } from "../../services/types/cause.types";
import {
  capitalizeFirstLetter,
  capitalizeHyphenatedString,
} from "../../utils/CommonFunctions";
import { useGetCausesQuery } from "../../services/api/endpoints/causes/causes.api";

import styles from "./styles/causesStyles.module.css";

interface CausesProps {
  onChange: (evt: React.MouseEvent<HTMLButtonElement>) => void;
  isIndividual: boolean;
  nonUserType?: string;
  editMode?: boolean;
  currentUserCauses?: string[];
}

export const Causes = ({
  onChange,
  isIndividual,
  nonUserType,
  editMode,
  currentUserCauses,
}: CausesProps) => {
  const { data: causes, isLoading } = useGetCausesQuery();

  // Initially empty
  const [userSelectedCauses, setUserSelectedCauses] = useState<Cause[]>([]);

  // Once causes is loaded, update userSelectedCauses
  useEffect(() => {
    if (causes && currentUserCauses && editMode) {
      const selected = causes.filter(
        (cause) =>
          currentUserCauses.includes(cause.name) ||
          currentUserCauses.includes(cause.id)
      );
      setUserSelectedCauses(selected);
    }
  }, [causes, currentUserCauses, editMode]);

  const updateSelectedCauses = (evt: React.MouseEvent<HTMLButtonElement>) => {
    onChange(evt);

    const { textContent } = evt.target as HTMLButtonElement;
    if (!textContent) return;

    const cause = causes?.find((cause) => cause.name === textContent);
    if (!cause) return;

    setUserSelectedCauses((prevState) => {
      const isAlreadySelected = prevState.some(
        (selectedCause) => selectedCause.name === cause.name
      );

      if (!isIndividual && !isAlreadySelected && prevState.length >= 2) {
        // If isIndividual is false and we already have 2 causes, do nothing
        return prevState;
      }

      if (isAlreadySelected) {
        return prevState.filter(
          (selectedCause) => selectedCause.name !== cause.name
        );
      } else {
        return [...prevState, cause];
      }
    });
  };

  const getNonUserText = useMemo(() => {
    if (nonUserType) {
      return nonUserType === "organization"
        ? capitalizeFirstLetter(nonUserType)
        : capitalizeHyphenatedString(nonUserType);
    }
  }, [nonUserType]);

  const entityText = getNonUserText;

  const shouldCauseBeDisabled = (cause: Cause) => {
    if (!isIndividual && userSelectedCauses.length >= 2) {
      return !userSelectedCauses.some(
        (selectedCause) => selectedCause.id === cause.id
      );
    }
    return false;
  };

  return (
    <div className={styles.causesDisplay}>
      {isLoading ? (
        <CircularProgress />
      ) : (
        <>
          {isIndividual && !editMode && (
            <span className={styles.causesTitle}>
              Select The Causes You Are Passionate About{" "}
            </span>
          )}
          {!isIndividual && !editMode && (
            <span className={styles.causesTitle}>
              Select <span className={styles.blueText}>2 Causes</span> Your{" "}
              {entityText} Supports
            </span>
          )}
          {causes && (
            <div className={styles.causesContainer}>
            {causes.map((cause) => {
              const disableCause = shouldCauseBeDisabled(cause);
              const { id, ...causeProps } = cause;
              return (
                  <Individualcause
                    key={id}
                    id={id}
                    disabled={disableCause}
                    {...causeProps}
                    isBlue={userSelectedCauses.some(
                      (selectedCause) => selectedCause.id === cause.id
                    )}
                    onClick={updateSelectedCauses}
                  />
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};
