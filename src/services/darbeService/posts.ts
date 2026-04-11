import type { PostReponse } from "../api/endpoints/types/posts.api.types";
import { supabase } from "../supabase/client";
import { ensureUserId } from "./utils";
import { getProfilesByIds } from "./profiles";
import type { PostUserInfo } from "../api/endpoints/types/user.api.types";
import { createNotifications } from "./notifications";

type PostRow = {
  id: string;
  poster_id: string;
  post_text: string;
  created_at: string;
};

const mapProfileToPostUserInfo = (profile?: {
  id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  user_type?: string | null;
  organization_name?: string | null;
  nonprofit_name?: string | null;
  profile_picture_url?: string | null;
}): PostUserInfo => ({
  id: profile?.id ?? "",
  fullName:
    profile?.full_name ??
    `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim(),
  userType: profile?.user_type ?? "individual",
  organizationName: profile?.organization_name ?? undefined,
  nonprofitName: profile?.nonprofit_name ?? undefined,
  profilePicture: profile?.profile_picture_url ?? undefined,
});

const buildPostResponses = async (posts: PostRow[]): Promise<PostReponse[]> => {
  if (!posts.length) return [];

  const postIds = posts.map((post) => post.id);
  const posterIds = Array.from(new Set(posts.map((post) => post.poster_id)));

  const [profiles, filesRes, likesRes, commentsRes] = await Promise.all([
    getProfilesByIds(posterIds),
    supabase
      .from("post_files")
      .select("post_id, file_url")
      .in("post_id", postIds),
    supabase
      .from("post_likes")
      .select("post_id, user_id")
      .in("post_id", postIds),
    supabase
      .from("comments")
      .select("id, post_id")
      .in("post_id", postIds)
      .is("parent_comment_id", null),
  ]);

  if (filesRes.error) throw filesRes.error;
  if (likesRes.error) throw likesRes.error;
  if (commentsRes.error) throw commentsRes.error;

  const profileMap = new Map(
    profiles.map((profile) => [profile.id, mapProfileToPostUserInfo(profile)])
  );

  const filesByPost = new Map<string, string[]>();
  (filesRes.data ?? []).forEach((row) => {
    const list = filesByPost.get(row.post_id) ?? [];
    list.push(row.file_url);
    filesByPost.set(row.post_id, list);
  });

  const likesByPost = new Map<string, string[]>();
  (likesRes.data ?? []).forEach((row) => {
    const list = likesByPost.get(row.post_id) ?? [];
    list.push(row.user_id);
    likesByPost.set(row.post_id, list);
  });

  const commentsByPost = new Map<string, string[]>();
  (commentsRes.data ?? []).forEach((row) => {
    const list = commentsByPost.get(row.post_id) ?? [];
    list.push(row.id);
    commentsByPost.set(row.post_id, list);
  });

  return posts.map((post) => {
    const files = filesByPost.get(post.id) ?? [];
    const likes = likesByPost.get(post.id) ?? [];
    const comments = commentsByPost.get(post.id) ?? [];

    return {
      id: post.id,
      postText: post.post_text,
      files: files.length ? files : null,
      likes,
      comments,
      likeCount: likes.length,
      commentCount: comments.length,
      createdAt: post.created_at,
      posterId: profileMap.get(post.poster_id) ?? mapProfileToPostUserInfo(),
    };
  });
};

export const submitPost = async (postBody: {
  postText: string;
  files: string[] | null;
}): Promise<PostReponse> => {
  const userId = await ensureUserId();
  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      poster_id: userId,
      post_text: postBody.postText,
    })
    .select("id, poster_id, post_text, created_at")
    .single();

  if (error || !post) throw error ?? new Error("Failed to create post");

  const files = (postBody.files ?? []).filter((file) => file);
  if (files.length) {
    const { error: fileError } = await supabase.from("post_files").insert(
      files.map((file_url) => ({
        post_id: post.id,
        file_url,
      }))
    );

    if (fileError) throw fileError;
  }

  const { data: friendsData } = await supabase.rpc("get_user_friends", {
    target_user_id: userId,
  });
  const friendIds = (friendsData ?? []).map((row) => row.friend_id);
  if (friendIds.length) {
    await createNotifications({
      recipientUserIds: friendIds,
      senderUserId: userId,
      contentType: "post",
      contentTypeId: post.id,
    });
  }

  const [response] = await buildPostResponses([post]);
  return response;
};

export const getUserPosts = async (userId: string): Promise<PostReponse[]> => {
  const { data, error } = await supabase
    .from("posts")
    .select("id, poster_id, post_text, created_at")
    .eq("poster_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return buildPostResponses(data ?? []);
};

export const getPostsByUserIds = async (userIds: string[]): Promise<PostReponse[]> => {
  if (!userIds.length) return [];
  const { data, error } = await supabase
    .from("posts")
    .select("id, poster_id, post_text, created_at")
    .in("poster_id", userIds)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return buildPostResponses(data ?? []);
};

export const getPost = async (postId: string): Promise<PostReponse> => {
  const { data, error } = await supabase
    .from("posts")
    .select("id, poster_id, post_text, created_at")
    .eq("id", postId)
    .single();

  if (error || !data) throw error ?? new Error("Post not found");

  const [response] = await buildPostResponses([data]);
  return response;
};

export const deletePost = async (postId: string): Promise<void> => {
  const { error } = await supabase.rpc("delete_post_and_dependencies", {
    target_post_id: postId,
  });
  if (error) throw error;
};

export const togglePostLike = async (postId: string): Promise<void> => {
  const userId = await ensureUserId();

  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("poster_id")
    .eq("id", postId)
    .single();
  if (postError || !post) throw postError ?? new Error("Post not found");

  const { data: existingLike, error: fetchError } = await supabase
    .from("post_likes")
    .select("post_id, user_id")
    .match({ post_id: postId, user_id: userId })
    .maybeSingle();

  if (fetchError) throw fetchError;

  if (existingLike) {
    const { error } = await supabase
      .from("post_likes")
      .delete()
      .match({ post_id: postId, user_id: userId });
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("post_likes")
      .insert({ post_id: postId, user_id: userId });
    if (error) throw error;
  }

  await createNotifications({
    recipientUserIds: [post.poster_id],
    senderUserId: userId,
    contentType: "like",
    contentTypeId: postId,
  });
};
