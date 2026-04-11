import { SimpleUserInfo } from "../../services/api/endpoints/types/user.api.types";

// TODO: This will need more TLC if we want to be more descriptive and linkable, MVP for now
export interface Notification {
  id: string;
  /** Properties of the user who triggered the notification */
  senderUserId: SimpleUserInfo;
  /** Properties of the user who is the recipient of the notification */
  recipientUserId: SimpleUserInfo;
  /** What kind of notification */
  contentType:
    | "like"
    | "comment"
    | "friendRequest"
    | "acceptedFriendRequest"
    | "acceptedFriendRequest"
    | "follow"
    | "post"
  /** Used in certain cases to send the user to that item */
  contentTypeId: string;
  createdAt: string;
  read: boolean;
}