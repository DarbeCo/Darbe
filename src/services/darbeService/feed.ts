import type { PostReponse } from "../api/endpoints/types/posts.api.types";
import { supabase } from "../supabase/client";
import { ensureUserId } from "./utils";
import { getPostsByUserIds, togglePostLike } from "./posts";

export const getUserFeed = async (): Promise<PostReponse[]> => {
  const userId = await ensureUserId();
  const { data, error } = await supabase.rpc("get_user_friends", {
    target_user_id: userId,
  });

  if (error) throw error;

  const friendIds = (data ?? []).map((row) => row.friend_id);
  const userIds = [userId, ...friendIds];

  return getPostsByUserIds(userIds);
};

export const submitPostLike = async (postId: string): Promise<void> => {
  await togglePostLike(postId);
};
