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

const getOrCreateDefaultRoster = async (entityId: string): Promise<string> => {
  const { data: existingRoster, error: existingRosterError } = await supabase
    .from("rosters")
    .select("id")
    .eq("roster_owner_id", entityId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existingRosterError) throw existingRosterError;
  if (existingRoster?.id) return existingRoster.id;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("nonprofit_name, organization_name")
    .eq("id", entityId)
    .single();

  if (profileError || !profile) {
    throw profileError ?? new Error("Organization not found");
  }

  const rosterName = profile.nonprofit_name || profile.organization_name || "Default";
  const { data: newRoster, error: newRosterError } = await supabase
    .from("rosters")
    .insert({
      roster_owner_id: entityId,
      roster_name: `${rosterName}'s Default Roster`,
    })
    .select("id")
    .single();

  if (newRosterError || !newRoster) {
    throw newRosterError ?? new Error("Failed to create organization roster");
  }

  return newRoster.id;
};

export type OrgJoinRequestStatus = "none" | "pending" | "approved" | "denied";

export const getOrgJoinRequestStatus = async (
  entityId: string
): Promise<OrgJoinRequestStatus> => {
  const userId = await ensureUserId();

  const { data: rosters, error: rosterError } = await supabase
    .from("rosters")
    .select("id")
    .eq("roster_owner_id", entityId);

  if (rosterError) throw rosterError;

  const rosterIds = (rosters ?? []).map((roster) => roster.id);

  if (rosterIds.length) {
    const { data: membership, error: membershipError } = await supabase
      .from("roster_members")
      .select("user_id")
      .eq("user_id", userId)
      .in("roster_id", rosterIds)
      .limit(1)
      .maybeSingle();

    if (membershipError) throw membershipError;
    if (membership) return "approved";
  }

  const { data: request, error: requestError } = await supabase
    .from("friend_requests")
    .select("status")
    .eq("requester_id", userId)
    .eq("receiver_id", entityId)
    .eq("request_type", "join")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (requestError) throw requestError;

  if (request?.status === "pending") {
    return "pending";
  }

  return "none";
};

export const sendOrgJoinRequest = async (entityId: string): Promise<void> => {
  const userId = await ensureUserId();

  const currentStatus = await getOrgJoinRequestStatus(entityId);
  if (currentStatus === "pending" || currentStatus === "approved") {
    return;
  }

  const { data, error } = await supabase.from("friend_requests").upsert(
    {
      requester_id: userId,
      receiver_id: entityId,
      request_type: "join",
      status: "pending",
    },
    { onConflict: "requester_id,receiver_id,request_type" }
  )
  .select("id")
  .single();

  if (error) throw error;

  await createNotifications({
    recipientUserIds: [entityId],
    senderUserId: userId,
    contentType: "orgJoinRequest",
    contentTypeId: data?.id ?? entityId,
  });
};

export const acceptOrgJoinRequest = async (requestId: string): Promise<void> => {
  const entityId = await ensureUserId();
  const { data: request, error: requestError } = await supabase
    .from("friend_requests")
    .select("id, requester_id, receiver_id, request_type, status")
    .eq("id", requestId)
    .eq("receiver_id", entityId)
    .eq("request_type", "join")
    .single();

  if (requestError || !request) {
    throw requestError ?? new Error("Join request not found");
  }

  const rosterId = await getOrCreateDefaultRoster(entityId);
  const { error: memberError } = await supabase.from("roster_members").upsert({
    roster_id: rosterId,
    user_id: request.requester_id,
    is_admin: false,
  });

  if (memberError) throw memberError;

  const { error: updateError } = await supabase
    .from("friend_requests")
    .update({ status: "accepted" })
    .eq("id", requestId);

  if (updateError) throw updateError;

  const { error: notificationUpdateError } = await supabase
    .from("notifications")
    .update({ content_type: "acceptedOrgJoinRequest" })
    .eq("recipient_user_id", entityId)
    .eq("sender_user_id", request.requester_id)
    .eq("content_type", "orgJoinRequest")
    .eq("content_type_id", requestId);

  if (notificationUpdateError) throw notificationUpdateError;

  await createNotifications({
    recipientUserIds: [request.requester_id],
    senderUserId: entityId,
    contentType: "acceptedOrgJoinRequest",
    contentTypeId: requestId,
  });
};

export const denyOrgJoinRequest = async (requestId: string): Promise<void> => {
  const entityId = await ensureUserId();
  const { data: request, error: requestError } = await supabase
    .from("friend_requests")
    .select("id, requester_id, receiver_id, request_type")
    .eq("id", requestId)
    .eq("receiver_id", entityId)
    .eq("request_type", "join")
    .single();

  if (requestError || !request) {
    throw requestError ?? new Error("Join request not found");
  }

  const { error: updateError } = await supabase
    .from("friend_requests")
    .update({ status: "denied" })
    .eq("id", requestId);

  if (updateError) throw updateError;

  const { error: notificationUpdateError } = await supabase
    .from("notifications")
    .update({ content_type: "deniedOrgJoinRequest" })
    .eq("recipient_user_id", entityId)
    .eq("sender_user_id", request.requester_id)
    .eq("content_type", "orgJoinRequest")
    .eq("content_type_id", requestId);

  if (notificationUpdateError) throw notificationUpdateError;

  await createNotifications({
    recipientUserIds: [request.requester_id],
    senderUserId: entityId,
    contentType: "deniedOrgJoinRequest",
    contentTypeId: requestId,
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
  const { data, error } = await supabase
    .from("friendships")
    .select("friend_id, created_at")
    .eq("user_id", userId);

  if (error) throw error;

  const friendIds = uniqueIds((data ?? []).map((row) => row.friend_id));
  const friendProfiles = await getProfilesByIds(friendIds);
  const connectedAtByFriendId = new Map(
    (data ?? []).map((row) => [row.friend_id, row.created_at])
  );

  return friendProfiles.map((profile) => ({
    ...mapProfileToFriend(profile),
    connectedAt: connectedAtByFriendId.get(profile.id),
  }));
};

export const getMutualFriends = async (userId: string): Promise<ProfileFriendState[]> => {
  const currentUserId = await ensureUserId();

  if (currentUserId === userId) {
    return [];
  }

  const { data, error } = await supabase
    .from("friendships")
    .select("user_id, friend_id")
    .in("user_id", [currentUserId, userId]);

  if (error) throw error;

  const currentUserFriendIds = new Set(
    (data ?? [])
      .filter((row) => row.user_id === currentUserId)
      .map((row) => row.friend_id)
  );
  const targetUserFriendIds = new Set(
    (data ?? [])
      .filter((row) => row.user_id === userId)
      .map((row) => row.friend_id)
  );

  const friendIds = uniqueIds(
    [...currentUserFriendIds].filter(
      (friendId) =>
        targetUserFriendIds.has(friendId) &&
        friendId !== currentUserId &&
        friendId !== userId
    )
  );
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
