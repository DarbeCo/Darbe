import { IconButton } from "@mui/material";
import { CustomSvgs } from "../../../components/customSvgs/CustomSvgs";

import styles from "../styles/mainPage.module.css";

interface NavBarItemProps {
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  svgPath: string;
  altText: string;
  text: string;
  isBlue: boolean;
  variant?: "small" | "large" | "default";
}

export const NavBarItem = ({
  onClick,
  svgPath,
  altText,
  text,
  isBlue,
  variant,
}: NavBarItemProps) => {
  const menuItemTextStyle = isBlue
    ? styles.navBarItemTextSelected
    : styles.navBarItemText;
  const menuItemIconStyle = isBlue ? styles.navBarItemIconSelected : "";
  const variantSize = variant ?? "small";

  return (
    <IconButton onClick={onClick} className={styles.navBarMenuItem}>
      <CustomSvgs
        svgPath={svgPath}
        altText={altText}
        variant={variantSize}
        extraClass={menuItemIconStyle}
      />
      <span className={menuItemTextStyle}>{text}</span>
    </IconButton>
  );
};
