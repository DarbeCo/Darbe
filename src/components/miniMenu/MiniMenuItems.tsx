import { MenuItem } from "@mui/material";
import { splitStringndCapitalize } from "../../utils/CommonFunctions";
import styles from "./styles/miniMenu.module.css";

interface MiniMenuItemsProps {
  onClick: (route: string) => void;
  routeName: string;
}

export const MiniMenuItems = ({ onClick, routeName }: MiniMenuItemsProps) => {
  return (
    <MenuItem
      className={styles.menuItem}
      onClick={() => onClick(routeName)}
    >
      {splitStringndCapitalize(routeName, true)}
    </MenuItem>
  );
};
