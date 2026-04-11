import { UserState } from "../../../../features/users/userSlice";

export interface AuthResponse {
  message: string;
  token: string;
  user: UserState;
}

export interface PostUserInfo {
  id: string;
  fullName?: string;
  userType: string;
  organizationName?: string;
  nonprofitName?: string;
  profilePicture?: string;
}
// TODO: Merge PostUserInfo and SimpleUserInfo?
export interface SimpleUserInfo {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  nonprofitName?: string;
  organizationName?: string;
  profilePicture?: string;
  userType?: string;
}

export interface SimpleEntityInfo {
  id: string
  organizationName?: string;
  nonprofitName?: string;
  profilePicture?: string;
  userType?: string;
}

export interface EntityDocument {
  documentCategory: string;
  id: string;
  user: SimpleUserInfo;
  fileName: string;
  fileType: string;
  url: string;
  uploadedAt: string;
}
