import { MenuItem } from "@mui/material";

export const Years = () => {
  const currentYear = new Date().getFullYear();
  const years = [];

  for (let i = currentYear; i >= currentYear - 100; i--) {
    years.push(i);
  }

  const yearsOptions = years.map((year) => {
    const yearString = year.toString();

    return (
      <MenuItem
        key={yearString}
        value={yearString}
        sx={{
          fontSize: "16px",
          fontWeight: "400",
          lineHeight: "19px",
          letterSpacing: "0em",
        }}
      >
        {yearString}
      </MenuItem>
    );
  });

  return yearsOptions;
};
