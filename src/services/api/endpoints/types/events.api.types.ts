import { EmergencyContactState } from "../../../../features/users/userProfiles/types";
import { Cause } from "../../../types/cause.types";
import { SimpleUserInfo } from "./user.api.types";

type EventAddressSchema = {
  locationName: string;
  streetName: string;
  city: string;
  zipCode: string;
};

type EventRequirementsSchema = {
  supplies: string;
  ageRestrictions: string;
  attire: string;
  liftRequirements: string;
};

type VolunteerImpactSchema = {
  individualImpact?: string;
  individualImpactPerHour?: string;
  groupImpact?: string;
  groupImpactPerHour?: string;
  isIndividualImpact?: boolean;
  isGroupImpact?: boolean;
};

interface ShortVolunteerImpact {
  hoursVolunteered: number;
  volunteerValue: number;
  eventsAttended: number;
}

interface Signups  {
  id: string;
  user: SimpleUserInfo;
  eventId: string;
  status: "volunteered" | "confirmed" | "passed"
  eventActionTimeStamp: string;
} 

export interface SimpleEventState {
  eventName: string;
  eventDate: string;
  startTime: number;
  endTime?: number;
}

export interface CreateEvent extends Omit<EventsState, "eventOwner" | "eventCoordinator"> {
  eventOwner: string;
  eventCoordinator: string;
}

export interface EventsState {
  eventName: string;
  eventDescription: string;
  eventDate: Date | string;
  startTime: number;
  endTime?: number;
  eventHoursNeeded?: string;
  maxVolunteerCount: number;
  isRepeating?: boolean;
  /** This is for internal events, aka not public outside the entity follower list or roster members */
  isFollowersOnly?: boolean;
  eventAddress: EventAddressSchema;
  eventParkingInfo: string;
  eventInternalLocation?: string;
  isIndoor?: boolean;
  isOutdoor?: boolean;
  eventRequirements: EventRequirementsSchema;
  eventCoverPhoto?: string;
  eventCoordinator:  SimpleUserInfo;
  eventOwner?: Omit<SimpleUserInfo, 'firstName' | 'lastName' | 'fullName'>;
  volunteerImpact: VolunteerImpactSchema;
  adultWaiver?: string;
  minorWaiver?: string;
  signups?: Signups[];
}

export interface ShortEventState {
  id: string;
  eventOwner: SimpleUserInfo;
  eventName: string;
  eventDate: string;
  startTime: number;
  endTime?: number;
  maxVolunteerCount: number;
  eventCoverPhoto?: string;
  eventDescription: string;
  volunteerImpact: Partial<VolunteerImpactSchema>;
  eventAddress: Partial<EventAddressSchema>;
  signups: Signups[];
}

export interface UserEventSignups {
  event: ShortEventState;
  signedUpUser: SimpleUserInfo;
  eventActionTimeStamp: string;
  status: "volunteered" | "confirmed" | "passed";
  signupCount: number;
}

export interface VolunteerMatch extends SimpleUserInfo {
  createdAt: string;
  causes: Cause[];
  emergencyContact: EmergencyContactState;
  volunteerSummary: ShortVolunteerImpact;
}
