import type { Notification } from "../../components/notification/types";
import { supabase } from "../supabase/client";
import { ensureUserId } from "./utils";
import { getProfilesByIds, mapProfileToSimpleUserInfo } from "./profiles";

type NotificationInsert = {
  recipientUserIds: string[];
  senderUserId?: string;
  contentType: Notification["contentType"];
  contentTypeId: string;
};

const fallbackSimpleUser = (id: string) => ({
  id,
  fullName: "",
  firstName: "",
  lastName: "",
  nonprofitName: undefined,
  organizationName: undefined,
  profilePicture: undefined,
  userType: undefined,
});

const mapNotification = (
  row: {
    id: string;
    recipient_user_id: string;
    sender_user_id: string;
    content_type: string;
    content_type_id: string;
    created_at: string;
    read: boolean;
  },
  senderProfile: any,
  recipientProfile: any
): Notification => ({
  id: row.id,
  senderUserId: senderProfile
    ? mapProfileToSimpleUserInfo(senderProfile)
    : fallbackSimpleUser(row.sender_user_id),
  recipientUserId: recipientProfile
    ? mapProfileToSimpleUserInfo(recipientProfile)
    : fallbackSimpleUser(row.recipient_user_id),
  contentType: row.content_type as Notification["contentType"],
  contentTypeId: row.content_type_id,
  createdAt: row.created_at,
  read: row.read,
});

export const createNotifications = async ({
  recipientUserIds,
  senderUserId,
  contentType,
  contentTypeId,
}: NotificationInsert): Promise<void> => {
  const senderId = senderUserId ?? (await ensureUserId());
  const recipients = recipientUserIds.filter((id) => id && id !== senderId);

  if (!recipients.length) return;

  const { error } = await supabase.from("notifications").insert(
    recipients.map((recipientUserId) => ({
      recipient_user_id: recipientUserId,
      sender_user_id: senderId,
      content_type: contentType,
      content_type_id: contentTypeId,
    }))
  );

  if (error) throw error;
};

export const getNotifications = async (userId?: string): Promise<Notification[]> => {
  const currentUserId = userId ?? (await ensureUserId());
  const { data, error } = await supabase
    .from("notifications")
    .select(
      "id, recipient_user_id, sender_user_id, content_type, content_type_id, created_at, read"
    )
    .eq("recipient_user_id", currentUserId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) throw error;

  const senderIds = Array.from(
    new Set((data ?? []).map((row) => row.sender_user_id))
  );

  const profiles = await getProfilesByIds([currentUserId, ...senderIds]);
  const profileMap = new Map(
    profiles.map((profile) => [profile.id, profile])
  );

  const recipientProfile = profileMap.get(currentUserId);

  return (data ?? []).map((row) =>
    mapNotification(
      row,
      profileMap.get(row.sender_user_id),
      recipientProfile
    )
  );
};

export const getNotificationCount = async (): Promise<number> => {
  const userId = await ensureUserId();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_user_id", userId)
    .eq("read", false);

  if (error) throw error;
  return count ?? 0;
};

export const markNotificationsRead = async (): Promise<void> => {
  const userId = await ensureUserId();
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("recipient_user_id", userId)
    .eq("read", false);

  if (error) throw error;
};
