import { MenuItem } from "@mui/material";

export const NonprofitTypes = () => {
  const nonprofitTypes = [
    "501(c)(1) – Corporations Organized under Act of Congress (Federal Credit Unions)",
    "501(c)(2) – Title Holding Corporation",
    "501(c)(3) – Religious, Educational, Charitable, Scientific, Literary",
    "501(c)(4) – Civic Leagues, Social Welfare, Local Associations of Employees",
    "501(c)(5) – Labor, Agricultural, and Horticultural",
    "501(c)(6) – Business Leagues, Chambers of Commerce, Real Estate Boards",
    "501(c)(7) – Social and Recreational Clubs",
    "501(c)(8) – Fraternal Beneficiary Societies and Associations",
    "501(c)(9) – Voluntary Employees Beneficiary Associations",
    "501(c)(10) – Domestic Fraternal Societies and Associations",
    "501(c)(11) – Teachers' Retirement Fund Associations",
    "501(c)(12) – Benevolent Life Insurance Associations",
    "501(c)(13) – Cemetery Companies",
    "501(c)(14) – State-Chartered Credit Unions, Mutual Reserve Funds",
    "501(c)(15) – Mutual Insurance Companies or Associations",
    "501(c)(16) – Cooperative Organizations to Finance Crop Operations",
    "501(c)(17) – Supplemental Unemployment Benefit Trusts",
    "501(c)(18) – Employee Funded Pension Trusts",
    "501(c)(19) – Past or Present Members of the Armed Forces",
    "501(c)(21) – Black Lung Benefit Trusts",
    "501(c)(22) – Withdrawal Liability Payment Funds",
    "501(c)(23) – Veterans' Organization (created before 1880)",
    "501(c)(25) – Title Holding or Trusts with Multiple Parent Corporations",
    "501(c)(26) – State-Sponsored Organizations Providing Health Coverage",
    "501(c)(27) – Workers' Compensation Reinsurance Organizations",
    "501(c)(28) – National Railroad Retirement Investment Trusts",
    "501(c)(29) – CO-OP Health Insurance Issuers",
    "501(d) – Religious and Apostolic Associations",
    "501(e) – Cooperative Hospital Service Organizations",
    "501(f) – Operating Educational Organizations",
  ];

  return nonprofitTypes.map((type) => (
    <MenuItem
      key={type}
      value={type}
      sx={{
        fontSize: "16px",
        fontWeight: "400",
        lineHeight: "19px",
        letterSpacing: "0em",
        color: "#717070",
      }}
    >
      {type}
    </MenuItem>
  ));
};
