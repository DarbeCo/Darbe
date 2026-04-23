import { EntityDocument } from "../../../services/api/endpoints/types/user.api.types";
export type VolunteerExperienceState = {
  entityName: string;
  startDate?: string | Date;
  endDate?: string | Date;
  totalHours: number;
  description?: string;
};

export type JobExperienceState = {
  jobTitle: string;
  entityName: string;
  startDate?: string | Date;
  endDate?: string | Date;
  description?: string;
  _id?: string;
};

export type EducationState = {
  schoolName: string;
  degree: string;
  startDate?: string | Date;
  endDate?: string | Date;
  description?: string;
  _id?: string;
};

export type MilitaryServiceState = {
  branch: string | undefined;
  startDate?: string | Date;
  endDate?: string | Date;
  rank: string;
  description?: string;
  status?: string;
  _id?: string;
};

export type LicenseState = {
  licenseName?: string;
  licenseIssuer?: string;
  issueDate?: string | Date;
  expirationDate?: string | Date;
  doesNotExpire?: boolean;
  description?: string;
  _id?: string;
};

export type SkillState = {
  skillName?: string;
  _id?: string;
};

export type SimpleOrganizationInfo = {
  id: string;
  organizationName: string;
};

export type OrganizationState = {
  organizationName?: string;
  position?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  description?: string;
  parentOrganization: SimpleOrganizationInfo | undefined;
  isChildOrganization?: boolean;
  _id?: string;
};

export type EmergencyContactState = {
  name?: string;
  phone?: string;
  relation?: string;
};

export type SimpleUserState = {
  id: string;
  fullName: string;
  profilePicture: string;
};

/** Staff, Donors, and Documents that only exist on entities */
export type EntityInternalDetailsState = {
  donorList: SimpleUserState[];
  staffList: SimpleUserState[];
  documents: EntityDocument[];
};
