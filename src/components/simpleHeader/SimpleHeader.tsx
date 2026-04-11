import { IconButton } from "@mui/material";
import { useNavigate } from "react-router-dom";

import { HOME_ROUTE } from "../../routes/route.constants";
import { CustomSvgs } from "../customSvgs/CustomSvgs";
import { ClosingIcon } from "../closingIcon/ClosingIcon";
import { Typography, TypographyVariants } from "../typography/Typography";

import styles from "./simpleHeader.module.css";

interface SimpleHeaderProps {
  headerText: string;
  textVariant?: TypographyVariants;
}

/**
 * A Simple header component that displays the header text, and provides a back button and an exit button.
 */
export const SimpleHeader = ({
  headerText,
  textVariant,
}: SimpleHeaderProps) => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleExit = () => {
    navigate(`${HOME_ROUTE}`);
  };

  const variantToUse = textVariant ? textVariant : "sectionTitle";

  return (
    <div className={styles.simpleHeader}>
      <IconButton onClick={handleGoBack}>
        <CustomSvgs svgPath="/svgs/common/goBackIcon.svg" altText="Go back" />
      </IconButton>
      <Typography variant={variantToUse} textToDisplay={headerText} />
      <ClosingIcon useNoSx onClick={handleExit} />
    </div>
  );
};
