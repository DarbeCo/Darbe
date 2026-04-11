import type {
  FriendRequestState,
  PendingFriendRequestState,
  ProfileFollowState,
  ProfileFriendState,
  SuggestedFriendState,
} from "../../features/friends/types";
import { supabase } from "../supabase/client";
import { ensureUserId } from "./utils";
import { getProfilesByIds, mapProfileToFollow, mapProfileToFriend } from "./profiles";
import { createNotifications } from "./notifications";

const mapProfileToSuggestedFriend = (profile: {
  id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  profile_picture_url: string | null;
  city: string | null;
  zip: string | null;
}): SuggestedFriendState => ({
  id: profile.id,
  fullName:
    profile.full_name ??
    `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim(),
  profilePicture: profile.profile_picture_url ?? "",
  firstName: profile.first_name ?? "",
  lastName: profile.last_name ?? "",
  city: profile.city ?? "",
  zip: profile.zip ?? "",
});

const uniqueIds = (ids: string[]) => Array.from(new Set(ids));

const fallbackFriendProfile = (id: string): ProfileFriendState =>
  mapProfileToFriend({
    id,
    full_name: "",
    first_name: "",
    last_name: "",
    profile_picture_url: null,
    nonprofit_name: null,
    organization_name: null,
    city: null,
    zip: null,
  });

export const getFriendRequests = async (): Promise<FriendRequestState[]> => {
  const userId = await ensureUserId();
  const { data, error } = await supabase
    .from("friend_requests")
    .select("id, requester_id, receiver_id, request_type, status")
    .eq("receiver_id", userId)
    .eq("request_type", "friend")
    .eq("status", "pending");

  if (error) throw error;

  const requesterIds = uniqueIds((data ?? []).map((row) => row.requester_id));
  const requesterProfiles = await getProfilesByIds(requesterIds);
  const requesterMap = new Map(
    requesterProfiles.map((profile) => [profile.id, mapProfileToFriend(profile)])
  );

  return (data ?? []).map((row) => ({
    receiverId: row.receiver_id,
    requestType: row.request_type,
    requesterId:
      requesterMap.get(row.requester_id) ?? fallbackFriendProfile(row.requester_id),
  }));
};

export const getSentFriendRequests = async (): Promise<PendingFriendRequestState[]> => {
  const userId = await ensureUserId();
  const { data, error } = await supabase
    .from("friend_requests")
    .select("id, requester_id, receiver_id, request_type, status")
    .eq("requester_id", userId)
    .eq("request_type", "friend")
    .eq("status", "pending");

  if (error) throw error;

  const receiverIds = uniqueIds((data ?? []).map((row) => row.receiver_id));
  const profiles = await getProfilesByIds(uniqueIds([userId, ...receiverIds]));
  const profileMap = new Map(
    profiles.map((profile) => [profile.id, mapProfileToFriend(profile)])
  );

  const requesterProfile = profileMap.get(userId) ?? fallbackFriendProfile(userId);

  return (data ?? []).map((row) => ({
    receiverId:
      profileMap.get(row.receiver_id) ?? fallbackFriendProfile(row.receiver_id),
    requestType: row.request_type,
    requesterId: requesterProfile,
  }));
};

export const sendFriendRequest = async (friendId: string): Promise<void> => {
  const userId = await ensureUserId();
  const { data, error } = await supabase.from("friend_requests").upsert(
    {
      requester_id: userId,
      receiver_id: friendId,
      request_type: "friend",
      status: "pending",
    },
    { onConflict: "requester_id,receiver_id,request_type" }
  )
  .select("id")
  .single();

  if (error) throw error;

  await createNotifications({
    recipientUserIds: [friendId],
    senderUserId: userId,
    contentType: "friendRequest",
    contentTypeId: data?.id ?? friendId,
  });
};

export const deleteFriendRequest = async (friendId: string): Promise<void> => {
  const userId = await ensureUserId();
  const { error } = await supabase
    .from("friend_requests")
    .delete()
    .or(
      `and(requester_id.eq.${userId},receiver_id.eq.${friendId},request_type.eq.friend),and(requester_id.eq.${friendId},receiver_id.eq.${userId},request_type.eq.friend)`
    );

  if (error) throw error;
};

export const acceptFriendRequest = async (friendId: string): Promise<void> => {
  const userId = await ensureUserId();

  const { error: friendshipError } = await supabase.from("friendships").upsert([
    { user_id: userId, friend_id: friendId },
    { user_id: friendId, friend_id: userId },
  ]);

  if (friendshipError) throw friendshipError;

  const { data: updatedRequest, error: updateError } = await supabase
    .from("friend_requests")
    .update({ status: "accepted" })
    .select("id")
    .or(
      `and(requester_id.eq.${friendId},receiver_id.eq.${userId},request_type.eq.friend),and(requester_id.eq.${userId},receiver_id.eq.${friendId},request_type.eq.friend)`
    );

  if (updateError) throw updateError;

  const requestId = updatedRequest?.[0]?.id ?? friendId;

  await createNotifications({
    recipientUserIds: [friendId],
    senderUserId: userId,
    contentType: "acceptedFriendRequest",
    contentTypeId: requestId,
  });
};

export const denyFriendRequest = async (friendId: string): Promise<void> => {
  const userId = await ensureUserId();
  const { error } = await supabase
    .from("friend_requests")
    .update({ status: "denied" })
    .match({
      requester_id: friendId,
      receiver_id: userId,
      request_type: "friend",
    });

  if (error) throw error;
};

export const deleteFriend = async (friendId: string): Promise<void> => {
  const userId = await ensureUserId();
  const { error } = await supabase
    .from("friendships")
    .delete()
    .or(
      `and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`
    );

  if (error) throw error;
};

export const followEntity = async (entityId: string): Promise<void> => {
  const userId = await ensureUserId();
  const { error: followError } = await supabase.from("follows").upsert({
    follower_id: userId,
    following_id: entityId,
  });

  if (followError) throw followError;

  const { data, error: requestError } = await supabase.from("friend_requests").upsert(
    {
      requester_id: userId,
      receiver_id: entityId,
      request_type: "follow",
      status: "accepted",
    },
    { onConflict: "requester_id,receiver_id,request_type" }
  )
  .select("id")
  .single();

  if (requestError) throw requestError;

  await createNotifications({
    recipientUserIds: [entityId],
    senderUserId: userId,
    contentType: "follow",
    contentTypeId: data?.id ?? entityId,
  });
};

export const getUserFollowers = async (userId: string): Promise<ProfileFollowState[]> => {
  const { data, error } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("following_id", userId);

  if (error) throw error;

  const followerIds = uniqueIds((data ?? []).map((row) => row.follower_id));
  const followerProfiles = await getProfilesByIds(followerIds);

  return followerProfiles.map(mapProfileToFollow);
};

export const getFriends = async (userId: string): Promise<ProfileFriendState[]> => {
  const { data, error } = await supabase.rpc("get_user_friends", {
    target_user_id: userId,
  });

  if (error) throw error;

  const friendIds = uniqueIds((data ?? []).map((row) => row.friend_id));
  const friendProfiles = await getProfilesByIds(friendIds);

  return friendProfiles.map(mapProfileToFriend);
};

export const getMutualFriends = async (userId: string): Promise<ProfileFriendState[]> => {
  const { data, error } = await supabase.rpc("get_mutual_friends", {
    target_user_id: userId,
  });

  if (error) throw error;

  const friendIds = uniqueIds((data ?? []).map((row) => row.friend_id));
  const friendProfiles = await getProfilesByIds(friendIds);

  return friendProfiles.map(mapProfileToFriend);
};

export const getSuggestedFriends = async (
  filterIds?: string[]
): Promise<SuggestedFriendState[]> => {
  const userId = await ensureUserId();
  const { data: friendIdsData, error: friendIdsError } = await supabase.rpc(
    "get_user_friends",
    { target_user_id: userId }
  );

  if (friendIdsError) throw friendIdsError;

  const friendIds = (friendIdsData ?? []).map((row) => row.friend_id);
  const excludeIds = new Set([userId, ...(filterIds ?? []), ...friendIds]);

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, first_name, last_name, profile_picture_url, city, zip, user_type"
    )
    .eq("user_type", "individual");

  if (error) throw error;

  return (data ?? [])
    .filter((profile) => !excludeIds.has(profile.id))
    .map(mapProfileToSuggestedFriend);
};
