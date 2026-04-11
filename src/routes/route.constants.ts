// Base routes, no userIds
export const NOTIFICATIONS_ROUTE = "/home/notifications";
export const LOGIN_ROUTE = "/login";
export const LOGOUT_ROUTE = "/logout";
export const FRIENDS_ROUTE = "/home/friends";
export const HOME_ROUTE = "/home";
export const PRIVACY_ROUTE = "/home/privacy";
export const MESSAGING_ROUTE = "/home/messaging";
export const PROFILE_ROUTE = "/home/profile";
export const HELP_ROUTE = "/home/help";
export const EVENTS_ROUTE = "/home/events";
export const EDIT_PROFILE_ROUTE = "/home/profile_edit";
export const ROSTER_ROUTE = "/home/roster";
export const CREATE_EVENT_ROUTE = "/home/post_a_need";
export const MATCH_ROUTE = "/home/match";
export const ABOUT_DARBE_ROUTE = "/home/about";
export const CONTACT_DARBE_ROUTE = "/home/contact";
export const HELP_DARBE_ROUTE = "/home/help";
export const IMPACT_ROUTE = "/home/impact";
export const ANNUAL_ROUTE = "/home/annual";
export const POST_A_NEED = "/home/post_a_need";
export const POST_A_DONATION = "/home/post_a_donation";
export const COOKIE_NAME = "token";

// Routes with userIds
export const NEW_MESSAGE_ROUTE = (userId: string) =>
  `/home/messaging/${userId}/new`;
export const FRIEND_MESSAGE_ROUTE = (friendId: string) =>
  `/home/messaging/${friendId}/chat`;
export const SINGLE_POST_ROUTE = (postId: string) => `/home/post/${postId}`;
export const SINGLE_COMMENT_ROUTE = (commentId: string) => `/home/comment/${commentId}`;
