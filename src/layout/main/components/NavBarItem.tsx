import { IconButton } from "@mui/material";
import { CustomSvgs } from "../../../components/customSvgs/CustomSvgs";

import styles from "../styles/mainPage.module.css";

interface NavBarItemProps {
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  svgPath: string;
  altText: string;
  text: string;
  isBlue: boolean;
  count?: number;
  showZeroCount?: boolean;
  variant?: "small" | "large" | "default";
}

export const NavBarItem = ({
  onClick,
  svgPath,
  altText,
  text,
  isBlue,
  count,
  showZeroCount = false,
  variant,
}: NavBarItemProps) => {
  const menuItemTextStyle = isBlue
    ? styles.navBarItemTextSelected
    : styles.navBarItemText;
  const menuItemIconStyle = isBlue ? styles.navBarItemIconSelected : "";
  const variantSize = variant ?? "small";
  const shouldShowCount =
    typeof count === "number" && (showZeroCount || count > 0);

  return (
    <IconButton onClick={onClick} className={styles.navBarMenuItem}>
      <CustomSvgs
        svgPath={svgPath}
        altText={altText}
        variant={variantSize}
        extraClass={menuItemIconStyle}
      />
      <span className={styles.navBarItemLabel}>
        <span className={menuItemTextStyle}>{text}</span>
        {shouldShowCount && (
          <span className={styles.navBarItemCount}>{count}</span>
        )}
      </span>
    </IconButton>
  );
};
