import { Cause } from "../../../types/cause.types";
import { SimpleEntityInfo, SimpleUserInfo } from "./user.api.types";

export interface RosterAdminPermissions {
  canEditAssignedRoster: boolean;
  canAssignVolunteerCoordinators: boolean;
  canEditInternalEvents: boolean;
  canEditExternalEvents: boolean;
}


export interface RosterMember {
  user: SimpleUserInfo;
  isAdmin: boolean;
  adminPermissions?: RosterAdminPermissions;
  memberSince?: string;
  causes?: Cause[];
  volunteerSummary?: {
    hoursVolunteered: number;
    volunteerValue: number;
    eventsAttended: number;
  };
}

export interface Roster {
  rosterOwner: SimpleEntityInfo
  rosterName: string
  members: RosterMember[]
  id: string;
  createdAt: string;
}

export interface NewRoster {
  rosterOwner: string;
  rosterName: string;
  members: string[];
}

export interface EntityDonorsAndStaff {
  donors: SimpleUserInfo[];
  staff: SimpleUserInfo[];
}

export interface EligibleRosterMembers {
  eligibleDonors: SimpleUserInfo[];
  eligibleStaff: SimpleUserInfo[];
}

export interface RosterEventAdminEntityAccess {
  entityId: string;
  canEditInternalEvents: boolean;
  canEditExternalEvents: boolean;
  entityName?: string;
  profilePicture?: string;
  userType?: string;
}
