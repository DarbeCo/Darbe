import { MenuItem } from "@mui/material";
import { splitStringndCapitalize } from "../../utils/CommonFunctions";

interface MiniMenuItemsProps {
  onClick: (route: string) => void;
  routeName: string;
}

export const MiniMenuItems = ({ onClick, routeName }: MiniMenuItemsProps) => {
  return (
    <MenuItem onClick={() => onClick(routeName)}>
      {splitStringndCapitalize(routeName, true)}
    </MenuItem>
  );
};
