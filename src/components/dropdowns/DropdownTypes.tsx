import { Days } from "./dropdownTypes/Days";
import { Months } from "./dropdownTypes/Months";
import { Years } from "./dropdownTypes/Years";
import { Hours } from "./dropdownTypes/Hours";
import { Genders } from "./dropdownTypes/Genders";
import { MilitaryStatus } from "./dropdownTypes/MilitaryStatus";
import { DropdownOptions } from "./types";

interface DropdownTypesProps {
  type: DropdownOptions;
}

export const DropdownTypes = ({ type }: DropdownTypesProps) => {
  switch (type) {
    case "days":
      return Days;
    case "months":
      return Months;
    case "years":
      return Years;
    case "hours":
      return Hours;
    case "genders":
      return Genders;
    case "militaryStatus":
      return MilitaryStatus;
  }
};
