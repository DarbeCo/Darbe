import { supabase } from "../supabase/client";
import type { SimpleUserInfo } from "../api/endpoints/types/user.api.types";
import { ensureUserId } from "./utils";
import { mapProfileToSimpleUserInfo } from "./profiles";

export const ALLOWED_EVENT_PHOTO_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MAX_EVENT_PHOTO_BYTES = 10 * 1024 * 1024;

export interface EventPhoto {
  id: string;
  eventId: string;
  uploadedBy: string;
  storagePath: string;
  url: string;
  createdAt: string;
  uploader?: SimpleUserInfo;
}

export interface EntityEventPhotoSummary {
  eventId: string;
  eventName: string;
  eventDate: string;
  photoCount: number;
  coverPhotoUrl?: string;
}

const getPublicUrl = (storagePath: string): string => {
  const { data } = supabase.storage
    .from("event-photos")
    .getPublicUrl(storagePath);
  return data.publicUrl;
};

const fetchUploadersByIds = async (
  ids: string[]
): Promise<Map<string, SimpleUserInfo>> => {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  if (!uniqueIds.length) return new Map();

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, first_name, last_name, nonprofit_name, organization_name, profile_picture_url, user_type"
    )
    .in("id", uniqueIds);

  if (error) throw error;

  return new Map(
    (data ?? []).map((profile) => [profile.id, mapProfileToSimpleUserInfo(profile)])
  );
};

export const uploadEventPhoto = async (
  eventId: string,
  file: File
): Promise<EventPhoto> => {
  if (
    !ALLOWED_EVENT_PHOTO_MIME_TYPES.includes(
      file.type as (typeof ALLOWED_EVENT_PHOTO_MIME_TYPES)[number]
    )
  ) {
    throw new Error("Only JPEG, PNG, or WebP images are allowed");
  }

  if (file.size > MAX_EVENT_PHOTO_BYTES) {
    throw new Error("Photo must be 10 MB or smaller");
  }

  const userId = await ensureUserId();
  const storagePath = `${eventId}/${crypto.randomUUID()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("event-photos")
    .upload(storagePath, file, { contentType: file.type });

  if (uploadError) throw uploadError;

  const { data: inserted, error: insertError } = await supabase
    .from("event_photos")
    .insert({
      event_id: eventId,
      uploaded_by: userId,
      storage_path: storagePath,
    })
    .select("id, event_id, uploaded_by, storage_path, created_at")
    .single();

  if (insertError || !inserted) {
    await supabase.storage.from("event-photos").remove([storagePath]);
    throw insertError ?? new Error("Failed to record photo");
  }

  const uploaderMap = await fetchUploadersByIds([inserted.uploaded_by]);

  return {
    id: inserted.id,
    eventId: inserted.event_id,
    uploadedBy: inserted.uploaded_by,
    storagePath: inserted.storage_path,
    url: getPublicUrl(inserted.storage_path),
    createdAt: inserted.created_at,
    uploader: uploaderMap.get(inserted.uploaded_by),
  };
};

export const getEventPhotos = async (
  eventId: string
): Promise<EventPhoto[]> => {
  const { data, error } = await supabase
    .from("event_photos")
    .select("id, event_id, uploaded_by, storage_path, created_at")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  const uploaderMap = await fetchUploadersByIds(
    (data ?? []).map((row) => row.uploaded_by)
  );

  return (data ?? []).map((row) => ({
    id: row.id,
    eventId: row.event_id,
    uploadedBy: row.uploaded_by,
    storagePath: row.storage_path,
    url: getPublicUrl(row.storage_path),
    createdAt: row.created_at,
    uploader: uploaderMap.get(row.uploaded_by),
  }));
};

export const getEntityEventPhotoSummaries = async (
  entityId: string
): Promise<EntityEventPhotoSummary[]> => {
  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("id, event_name, event_date, event_cover_photo_url")
    .eq("event_owner_id", entityId);

  if (eventsError) throw eventsError;

  const eventIds = (events ?? []).map((event) => event.id);
  if (!eventIds.length) return [];

  const { data: photos, error: photosError } = await supabase
    .from("event_photos")
    .select("event_id")
    .in("event_id", eventIds);

  if (photosError) throw photosError;

  const photoCountByEventId = new Map<string, number>();
  (photos ?? []).forEach((photo) => {
    photoCountByEventId.set(
      photo.event_id,
      (photoCountByEventId.get(photo.event_id) ?? 0) + 1
    );
  });

  return (events ?? [])
    .map((event) => ({
      eventId: event.id,
      eventName: event.event_name ?? "",
      eventDate: event.event_date ?? "",
      photoCount: photoCountByEventId.get(event.id) ?? 0,
      coverPhotoUrl: event.event_cover_photo_url ?? undefined,
    }))
    .sort((a, b) =>
      a.eventName.localeCompare(b.eventName, undefined, { sensitivity: "base" })
    );
};

export const getIndividualEventPhotoSummaries = async (
  userId: string
): Promise<EntityEventPhotoSummary[]> => {
  const { data: signups, error: signupsError } = await supabase
    .from("event_signups")
    .select("event_id, status")
    .eq("user_id", userId)
    .in("status", ["volunteered", "confirmed", "approved", "no_show"]);

  if (signupsError) throw signupsError;

  const eventIds = Array.from(
    new Set(
      (signups ?? [])
        .map((signup) => signup.event_id)
        .filter((eventId): eventId is string => Boolean(eventId))
    )
  );
  if (!eventIds.length) return [];

  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("id, event_name, event_date, event_cover_photo_url")
    .in("id", eventIds);

  if (eventsError) throw eventsError;

  const { data: photos, error: photosError } = await supabase
    .from("event_photos")
    .select("event_id")
    .in("event_id", eventIds);

  if (photosError) throw photosError;

  const photoCountByEventId = new Map<string, number>();
  (photos ?? []).forEach((photo) => {
    photoCountByEventId.set(
      photo.event_id,
      (photoCountByEventId.get(photo.event_id) ?? 0) + 1
    );
  });

  return (events ?? [])
    .map((event) => ({
      eventId: event.id,
      eventName: event.event_name ?? "",
      eventDate: event.event_date ?? "",
      photoCount: photoCountByEventId.get(event.id) ?? 0,
      coverPhotoUrl: event.event_cover_photo_url ?? undefined,
    }))
    .sort((a, b) =>
      a.eventName.localeCompare(b.eventName, undefined, { sensitivity: "base" })
    );
};

export const canUploadEventPhotos = async (
  eventId: string
): Promise<boolean> => {
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id;
  if (!userId) return false;

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("event_owner_id, event_coordinator_id")
    .eq("id", eventId)
    .maybeSingle();

  if (eventError || !event) return false;

  if (
    event.event_owner_id === userId ||
    event.event_coordinator_id === userId
  ) {
    return true;
  }

  const { data: signup } = await supabase
    .from("event_signups")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  return Boolean(signup);
};
