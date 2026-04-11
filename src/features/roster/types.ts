import { SimpleUserInfo } from "../../services/api/endpoints/types/user.api.types";

export type RosterMember = {
  user: SimpleUserInfo;
  isAdmin: boolean;
};