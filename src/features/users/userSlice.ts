import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Availability } from "../../services/types/availability.types";
import {
  FriendRequestState,
  ProfileFriendState,
  ProfileFollowState,
} from "../friends/types";
import {
  EducationState,
  EmergencyContactState,
  EntityInternalDetailsState,
  JobExperienceState,
  LicenseState,
  MilitaryServiceState,
  OrganizationState,
  SimpleUserState,
  SkillState,
  VolunteerExperienceState,
} from "./userProfiles/types";

export interface UserState {
  id: string;
  email: string;
  fullName: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  causes: string[];
  userType: string;
  zip: string;
  city: string;
  availability?: Availability;
  ein?: string;
  nonprofitName?: string;
  organizationName?: string;
  profilePicture?: string;
  coverPhoto?: string;
}

export interface EntityProfileState {
  organizationName: string;
  nonprofitName: string;
  parentEntity?: SimpleUserState;
  address?: string;
  ein?: string;
  nonprofitType?: string;
  phoneNumber?: string;
  website?: string;
  motto?: string;
  mission?: string;
  values?: string;
  aboutUs?: string;
  programs?: string;
  associatedEntity?: SimpleUserState;
}

// TODO: This is messy, figure out a nicer structure once we stop adding scope
export interface DarbeProfileSharedState extends Partial<EntityProfileState> {
  friends: ProfileFriendState[];
  followers: ProfileFollowState[];
  following: ProfileFollowState[];
  user: Partial<UserState>;
  volunteerHours: number;
  aboutMe?: string;
  volunteerReason?: string;
  tagLine?: string;
  title?: string;
  gender?: string;
  race?: string;
  city?: string;
  state?: string;
  emergencyContact: EmergencyContactState;
  phoneNumber: string;
  allergies: string;
  volunteerExperiences?: VolunteerExperienceState[];
  jobExperiences?: JobExperienceState[];
  education?: EducationState[];
  militaryService?: MilitaryServiceState[];
  licenses?: LicenseState[];
  skills?: SkillState[];
  organizations?: OrganizationState[];
  entityDetails?: EntityInternalDetailsState;
}

interface UserResponse {
  user: UserState | null;
  userProfile: DarbeProfileSharedState | undefined;
  sentFriendRequests: FriendRequestState[] | undefined;
  receivedFriendRequests: FriendRequestState[] | undefined;
}

const initialState: UserResponse = {
  user: null,
  userProfile: undefined,
  sentFriendRequests: undefined,
  receivedFriendRequests: undefined,
};

const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserState>) => {
      state.user = action.payload;
    },
    clearUser: () => {
      return initialState;
    },
    setUserProfile: (
      state,
      action: PayloadAction<DarbeProfileSharedState | undefined>
    ) => {
      const profile = action.payload;
      state.userProfile = profile;
    },
    setSentFriendRequests: (
      state,
      action: PayloadAction<FriendRequestState[] | undefined>
    ) => {
      state.sentFriendRequests = action.payload;
    },
    setReceivedFriendRequests: (
      state,
      action: PayloadAction<FriendRequestState[] | undefined>
    ) => {
      state.receivedFriendRequests = action.payload;
    },
    clearUserProfile: (state) => {
      state.userProfile = undefined;
    },
    removeReceivedFriendRequest: (state, action: PayloadAction<string>) => {
      state.receivedFriendRequests = state.receivedFriendRequests?.filter(
        (request) => request.requesterId.id !== action.payload
      );
    },
    removeFriend: (state, action: PayloadAction<string>) => {
      if (state.userProfile?.friends) {
        state.userProfile.friends = state.userProfile.friends.filter(
          (friend: ProfileFriendState) => friend.id !== action.payload
        );
      }
    },
    updateUserOrganizations: (state, action: PayloadAction<OrganizationState[]>) => {
      if (state.userProfile) {
        state.userProfile.organizations = action.payload
      }
    },
    updateUserSkills: (state, action: PayloadAction<SkillState[]>) => {
     if (state.userProfile) {
      state.userProfile.skills = action.payload;
    }
    },
    updateUserLicenses: (state, action: PayloadAction<LicenseState[]>) => {
      if (state.userProfile) {
        state.userProfile.licenses = action.payload;
      }
    },
    updateUserCauses: (state, action: PayloadAction<string[]>) => {
      if (state.user) {
        state.user.causes = action.payload
      }
    },
    updateUserAvailability: (state, action: PayloadAction<Availability | undefined>) => {
      if (state.user && state.userProfile) {
        state.user.availability = action.payload
        state.userProfile.user.availability = action.payload
      }
    },
  },
});

export const {
  setUser,
  clearUser,
  setUserProfile,
  clearUserProfile,
  setReceivedFriendRequests,
  setSentFriendRequests,
  removeReceivedFriendRequest,
  removeFriend,
  updateUserOrganizations,
  updateUserSkills,
  updateUserLicenses,
  updateUserCauses,
  updateUserAvailability
} = userSlice.actions;
export default userSlice.reducer;
