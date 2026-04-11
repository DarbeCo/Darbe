export const DARBE_SEARCH = "| Search Darbe";
export const MESSAGES_SEARCH = "| Search Messages";
export const ROSTER_SEARCH = "| Search Roster";
export const FRIENDS_SEARCH = "| Search Friends";
export const EVENTS_SEARCH = "| Search Events";

export const ROSTER_FILTER = "roster";
export const EVENTS_FILTER = "events";
export const FRIENDS_FILTER = "friends";
export const MESSAGES_FILTER = "messages";
export const DEFAULT_FILTER = "all";

export type SearchType =
  | typeof DARBE_SEARCH
  | typeof MESSAGES_SEARCH
  | typeof ROSTER_SEARCH
  | typeof FRIENDS_SEARCH
  | typeof EVENTS_SEARCH;

export type FilterType =
  | typeof ROSTER_FILTER
  | typeof EVENTS_FILTER
  | typeof FRIENDS_FILTER
  | typeof MESSAGES_FILTER
  | typeof DEFAULT_FILTER;
