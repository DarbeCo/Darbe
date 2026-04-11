import { SimpleEntityInfo, SimpleUserInfo } from "./user.api.types";



export interface RosterMember {
  user: SimpleUserInfo;
  isAdmin: boolean;
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