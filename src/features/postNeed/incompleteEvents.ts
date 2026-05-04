import {
  CreateEvent,
  ShortEventState,
} from "../../services/api/endpoints/types/events.api.types";
import { UserState } from "../users/userSlice";

const STORAGE_KEY = "darbe:incomplete-post-need-events";

export interface IncompletePostNeedEvent {
  id: string;
  eventType: string;
  ownerId: string;
  coordinatorId?: string;
  data: CreateEvent;
  savedAt: string;
  missingFields: string[];
  owner: {
    id: string;
    fullName: string;
    firstName: string;
    lastName: string;
    userType?: string;
    organizationName?: string;
    nonprofitName?: string;
    profilePicture?: string;
  };
}

const safeReadDrafts = (): IncompletePostNeedEvent[] => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawDrafts = window.localStorage.getItem(STORAGE_KEY);

    if (!rawDrafts) {
      return [];
    }

    const parsedDrafts = JSON.parse(rawDrafts);

    return Array.isArray(parsedDrafts) ? parsedDrafts : [];
  } catch (error) {
    console.error("Unable to read incomplete events", error);
    return [];
  }
};

const safeWriteDrafts = (drafts: IncompletePostNeedEvent[]) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
};

export const createIncompleteEventId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `incomplete-event-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
};

export const getIncompletePostNeedEvents = () => safeReadDrafts();

export const getIncompletePostNeedEventsForUser = (userId: string) =>
  safeReadDrafts().filter(
    (draft) => draft.ownerId === userId || draft.coordinatorId === userId
  );

export const saveIncompletePostNeedEvent = (draft: IncompletePostNeedEvent) => {
  const drafts = safeReadDrafts();
  const draftIndex = drafts.findIndex(
    (savedDraft) => savedDraft.id === draft.id
  );

  if (draftIndex >= 0) {
    drafts[draftIndex] = draft;
  } else {
    drafts.push(draft);
  }

  safeWriteDrafts(drafts);
};

export const buildIncompleteEventOwner = (user: UserState | null | undefined) => ({
  id: user?.id || "",
  fullName:
    user?.fullName ||
    user?.organizationName ||
    user?.nonprofitName ||
    "Event Owner",
  firstName: user?.firstName || "",
  lastName: user?.lastName || "",
  userType: user?.userType,
  organizationName: user?.organizationName,
  nonprofitName: user?.nonprofitName,
  profilePicture: user?.profilePicture,
});

const formatDraftDate = (date: CreateEvent["eventDate"], fallback: string) => {
  if (date instanceof Date) {
    return date.toISOString().slice(0, 10);
  }

  if (typeof date !== "string" || !date.trim()) {
    return fallback;
  }

  const mmDdYyyyMatch = date.match(/^(\d{2})-(\d{2})-(\d{4})$/);

  if (mmDdYyyyMatch) {
    const [, month, day, year] = mmDdYyyyMatch;
    return `${year}-${month}-${day}`;
  }

  return date.split("T")[0];
};

export const incompletePostNeedEventToShortEvent = (
  draft: IncompletePostNeedEvent
): ShortEventState => ({
  id: draft.id,
  eventOwner: draft.owner,
  eventCoordinator: undefined,
  eventName: draft.data.eventName || "Untitled Event",
  eventDate: formatDraftDate(draft.data.eventDate, draft.savedAt),
  startTime: Number(draft.data.startTime) || 0,
  endTime: Number(draft.data.endTime) || undefined,
  maxVolunteerCount: Number(draft.data.maxVolunteerCount) || 0,
  eventCoverPhoto: draft.data.eventCoverPhoto,
  eventDescription: draft.data.eventDescription || "Incomplete event",
  volunteerImpact: draft.data.volunteerImpact || {},
  eventAddress: draft.data.eventAddress || {},
  signups: [],
});
