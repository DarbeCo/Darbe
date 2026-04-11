import { Typography } from "../typography/Typography";

import styles from "./simpleHeader.module.css";

interface SimpleSubHeaderProps {
  headerText: string;
  variants?: "formHeader";
}

export const SimpleSubHeader = ({
  headerText,
  variants,
}: SimpleSubHeaderProps) => {
  const stylesVariant = variants ? styles[variants] : styles.formHeader;

  return (
    <div className={stylesVariant}>
      <Typography
        variant="whiteBoldText"
        textToDisplay={headerText}
        extraClass="paddingLeft"
      />
    </div>
  );
};
