import { MenuItem } from "@mui/material";

export const States = () => {
  const states = [
    "AL", 
    "AK", 
    "AZ", 
    "AR", 
    "CA", 
    "CO", 
    "CT", 
    "DE", 
    "FL", 
    "GA", 
    "HI", 
    "ID", 
    "IL", 
    "IN", 
    "IA", 
    "KS", 
    "KY", 
    "LA", 
    "ME", 
    "MD", 
    "MA", 
    "MI", 
    "MN", 
    "MS", 
    "MO", 
    "MT", 
    "NE", 
    "NV", 
    "NH", 
    "NJ", 
    "NM", 
    "NY", 
    "NC", 
    "ND", 
    "OH", 
    "OK", 
    "OR", 
    "PA", 
    "RI", 
    "SC", 
    "SD", 
    "TN", 
    "TX", 
    "UT", 
    "VT", 
    "VA", 
    "WA", 
    "WV", 
    "WI", 
    "WY"
  ].map((state) => (
    <MenuItem
      key={state}
      value={state}
      sx={{
        fontSize: "16px",
        fontWeight: "400",
        lineHeight: "19px",
        color: "#263238",
      }}
    >
      {state}
    </MenuItem>
  ));

  return states;
};
