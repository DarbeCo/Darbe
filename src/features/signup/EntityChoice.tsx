import { DarbeButton } from "../../components/buttons/DarbeButton";

import styles from "./styles/signUpPage.module.css";

interface EntityChoiceProps {
  onClick: (evt: React.MouseEvent<HTMLButtonElement>) => void;
}

export const EntityChoice = ({ onClick }: EntityChoiceProps) => {
  return (
    <div className={styles.entityChoiceButtons}>
      <DarbeButton
        buttonText="Individual"
        onClick={onClick}
        darbeButtonType="signUpButton"
        startingIconPath="/svgs/common/individualSimpleIcon.svg"
        endingIconPath="/svgs/common/goForwardIcon.svg"
      />
      <DarbeButton
        buttonText="Non-Profit"
        onClick={onClick}
        darbeButtonType="signUpButton"
        startingIconPath="/svgs/common/nonProfitSimpleIcon.svg"
        endingIconPath="/svgs/common/goForwardIcon.svg"
      />
      <DarbeButton
        buttonText="Organization"
        onClick={onClick}
        darbeButtonType="signUpButton"
        startingIconPath="/svgs/common/organizationSimpleIcon.svg"
        endingIconPath="/svgs/common/goForwardIcon.svg"
      />
    </div>
  );
};
