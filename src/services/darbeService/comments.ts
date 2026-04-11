import type { CommentResponse } from "../api/endpoints/types/comments.api.types";
import type { PostUserInfo } from "../api/endpoints/types/user.api.types";
import { supabase } from "../supabase/client";
import { ensureUserId } from "./utils";
import { getProfilesByIds } from "./profiles";
import { createNotifications } from "./notifications";

type CommentRow = {
  id: string;
  post_id: string;
  user_id: string;
  comment_text: string;
  parent_comment_id: string | null;
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

const buildCommentResponses = async (
  comments: CommentRow[],
  options: { includeReplies?: boolean } = {}
): Promise<CommentResponse[]> => {
  if (!comments.length) return [];

  const includeReplies = options.includeReplies ?? true;
  const commentIds = comments.map((comment) => comment.id);
  const userIds = Array.from(new Set(comments.map((comment) => comment.user_id)));

  const [profiles, likesRes, repliesRes] = await Promise.all([
    getProfilesByIds(userIds),
    supabase
      .from("comment_likes")
      .select("comment_id, user_id")
      .in("comment_id", commentIds),
    includeReplies
      ? supabase
          .from("comments")
          .select("id, parent_comment_id")
          .in("parent_comment_id", commentIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (likesRes.error) throw likesRes.error;
  if (repliesRes.error) throw repliesRes.error;

  const profileMap = new Map(
    profiles.map((profile) => [profile.id, mapProfileToPostUserInfo(profile)])
  );

  const likesByComment = new Map<string, string[]>();
  (likesRes.data ?? []).forEach((row) => {
    const list = likesByComment.get(row.comment_id) ?? [];
    list.push(row.user_id);
    likesByComment.set(row.comment_id, list);
  });

  const repliesByComment = new Map<string, string[]>();
  (repliesRes.data ?? []).forEach((row) => {
    if (!row.parent_comment_id) return;
    const list = repliesByComment.get(row.parent_comment_id) ?? [];
    list.push(row.id);
    repliesByComment.set(row.parent_comment_id, list);
  });

  return comments.map((comment) => {
    const likes = likesByComment.get(comment.id) ?? [];
    const replies = includeReplies ? repliesByComment.get(comment.id) ?? [] : [];

    return {
      id: comment.id,
      postId: comment.post_id,
      commentText: comment.comment_text,
      userId: profileMap.get(comment.user_id) ?? mapProfileToPostUserInfo(),
      createdAt: comment.created_at,
      commentLikes: likes,
      replies,
      replyCount: replies.length,
      likeCount: likes.length,
      isChildComment: Boolean(comment.parent_comment_id),
    };
  });
};

export const getPostComments = async (postId: string): Promise<CommentResponse[]> => {
  const { data, error } = await supabase
    .from("comments")
    .select("id, post_id, user_id, comment_text, parent_comment_id, created_at")
    .eq("post_id", postId)
    .is("parent_comment_id", null)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return buildCommentResponses(data ?? []);
};

export const getCommentReplies = async (commentId: string): Promise<CommentResponse[]> => {
  const { data, error } = await supabase
    .from("comments")
    .select("id, post_id, user_id, comment_text, parent_comment_id, created_at")
    .eq("parent_comment_id", commentId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return buildCommentResponses(data ?? [], { includeReplies: false });
};

export const submitComment = async (commentBody: {
  postId: string;
  commentText: string;
}): Promise<CommentResponse> => {
  const userId = await ensureUserId();
  const { data, error } = await supabase
    .from("comments")
    .insert({
      post_id: commentBody.postId,
      user_id: userId,
      comment_text: commentBody.commentText,
    })
    .select("id, post_id, user_id, comment_text, parent_comment_id, created_at")
    .single();

  if (error || !data) throw error ?? new Error("Failed to create comment");

  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("poster_id")
    .eq("id", commentBody.postId)
    .single();
  if (postError) throw postError;

  if (post?.poster_id) {
    await createNotifications({
      recipientUserIds: [post.poster_id],
      senderUserId: userId,
      contentType: "comment",
      contentTypeId: data.id,
    });
  }

  const [response] = await buildCommentResponses([data], { includeReplies: false });
  return response;
};

export const submitReply = async (commentBody: {
  commentId: string;
  commentText: string;
}): Promise<CommentResponse> => {
  const userId = await ensureUserId();

  const { data: parent, error: parentError } = await supabase
    .from("comments")
    .select("post_id")
    .eq("id", commentBody.commentId)
    .single();

  if (parentError || !parent) throw parentError ?? new Error("Parent comment not found");

  const { data, error } = await supabase
    .from("comments")
    .insert({
      post_id: parent.post_id,
      user_id: userId,
      comment_text: commentBody.commentText,
      parent_comment_id: commentBody.commentId,
    })
    .select("id, post_id, user_id, comment_text, parent_comment_id, created_at")
    .single();

  if (error || !data) throw error ?? new Error("Failed to create reply");

  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("poster_id")
    .eq("id", parent.post_id)
    .single();
  if (postError) throw postError;

  if (post?.poster_id) {
    await createNotifications({
      recipientUserIds: [post.poster_id],
      senderUserId: userId,
      contentType: "comment",
      contentTypeId: data.id,
    });
  }

  const [response] = await buildCommentResponses([data], { includeReplies: false });
  return response;
};

export const toggleCommentLike = async (commentId: string): Promise<void> => {
  const userId = await ensureUserId();
  const { data: comment, error: commentError } = await supabase
    .from("comments")
    .select("user_id")
    .eq("id", commentId)
    .single();

  if (commentError || !comment) throw commentError ?? new Error("Comment not found");

  const { data: existingLike, error: fetchError } = await supabase
    .from("comment_likes")
    .select("comment_id, user_id")
    .match({ comment_id: commentId, user_id: userId })
    .maybeSingle();

  if (fetchError) throw fetchError;

  if (existingLike) {
    const { error } = await supabase
      .from("comment_likes")
      .delete()
      .match({ comment_id: commentId, user_id: userId });
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("comment_likes")
      .insert({ comment_id: commentId, user_id: userId });
    if (error) throw error;
  }

  await createNotifications({
    recipientUserIds: [comment.user_id],
    senderUserId: userId,
    contentType: "like",
    contentTypeId: commentId,
  });
};

export const deleteComment = async (commentId: string): Promise<void> => {
  const { error } = await supabase.rpc("delete_comment_and_replies", {
    target_comment_id: commentId,
  });
  if (error) throw error;
};

export const deleteReply = async (replyId: string): Promise<void> => {
  const { error } = await supabase.from("comments").delete().eq("id", replyId);
  if (error) throw error;
};
