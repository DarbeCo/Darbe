export type DropdownOptions =
  | "hours"
  | "months"
  | "days"
  | "years"
  | "genders"
  | "militaryStatus"

export const DropdownSx = {
  border: "1px solid #D8D8D8",
  minWidth: "92px",
  width: "100%",
  height: "44px",
  borderRadius: "4px",
  fontSize: "14px",
  "@media (min-width: 1260px)": {
    fontSize: "16px",
  },
};
