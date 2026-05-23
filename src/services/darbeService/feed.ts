import type { PostReponse } from "../api/endpoints/types/posts.api.types";
import { supabase } from "../supabase/client";
import { ensureUserId } from "./utils";
import { getPostsByUserIds, togglePostLike } from "./posts";

export const getUserFeed = async (): Promise<PostReponse[]> => {
  const userId = await ensureUserId();
  const [
    friendsRes,
    followingRes,
    userOrganizationsRes,
    rosterMembershipsRes,
  ] = await Promise.all([
    supabase.rpc("get_user_friends", {
      target_user_id: userId,
    }),
    supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", userId),
    supabase
      .from("user_organizations")
      .select("parent_organization_id")
      .eq("user_id", userId),
    supabase
      .from("roster_members")
      .select("roster_id")
      .eq("user_id", userId),
  ]);

  if (friendsRes.error) throw friendsRes.error;
  if (followingRes.error) throw followingRes.error;
  if (userOrganizationsRes.error) throw userOrganizationsRes.error;
  if (rosterMembershipsRes.error) throw rosterMembershipsRes.error;

  const rosterIds = Array.from(
    new Set((rosterMembershipsRes.data ?? []).map((row) => row.roster_id))
  );
  const { data: rosterRows, error: rosterRowsError } = rosterIds.length
    ? await supabase
        .from("rosters")
        .select("roster_owner_id")
        .in("id", rosterIds)
    : { data: [], error: null };

  if (rosterRowsError) throw rosterRowsError;

  const friendIds = (friendsRes.data ?? []).map((row) => row.friend_id);
  const followingIds = (followingRes.data ?? []).map((row) => row.following_id);
  const organizationIds = (userOrganizationsRes.data ?? [])
    .map((row) => row.parent_organization_id)
    .filter((id): id is string => Boolean(id));
  const rosterOwnerIds = (rosterRows ?? []).map((row) => row.roster_owner_id);

  const userIds = Array.from(
    new Set([
      userId,
      ...friendIds,
      ...followingIds,
      ...organizationIds,
      ...rosterOwnerIds,
    ])
  );

  return getPostsByUserIds(userIds);
};

export const submitPostLike = async (postId: string): Promise<void> => {
  await togglePostLike(postId);
};
