import { JSX } from "react";
import { MenuItem } from "@mui/material";

import { splitStringndCapitalize } from "../../../utils/CommonFunctions";

export const MilitaryBranches = () => {
  const militaryBranchOptions: JSX.Element[] = [
    "army",
    "airForce",
    "navy",
    "marines",
    "coastGuard",
    "spaceForce",
  ].map((option) => {
    return (
      <MenuItem
        key={option}
        value={option}
        sx={{
          fontSize: "16px",
          fontWeight: "400",
          lineHeight: "19px",
          letterSpacing: "0em",
          color: "#717070",
        }}
      >
        {splitStringndCapitalize(option, true)}
      </MenuItem>
    );
  });

  return militaryBranchOptions;
};
