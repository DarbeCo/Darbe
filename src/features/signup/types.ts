import { Availability } from "../../services/types/availability.types";
import { Dob } from "../../services/types/common.types";

export interface SignUpState {
  userType: string;
  email: string;
  password: string;
  city: string;
  zip: string;
  dob?: Dob;
  causes: string[];
  organizationName?: string;
  nonprofitName?: string;
  availability?: Availability;
  firstName?: string;
  lastName?: string;
  ein?: string;
}
