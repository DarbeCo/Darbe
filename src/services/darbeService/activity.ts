import type { UserActivity } from "../api/endpoints/types/activity.api.types";
import { supabase } from "../supabase/client";
import { getProfilesByIds, mapProfileToSimpleUserInfo } from "./profiles";

export const getUserActivity = async (userId: string): Promise<UserActivity[]> => {
  const [postsRes, commentsRes] = await Promise.all([
    supabase
      .from("posts")
      .select("id, post_text, created_at")
      .eq("poster_id", userId),
    supabase
      .from("comments")
      .select("id, comment_text, created_at")
      .eq("user_id", userId),
  ]);

  if (postsRes.error) throw postsRes.error;
  if (commentsRes.error) throw commentsRes.error;

  const posts = postsRes.data ?? [];
  const comments = commentsRes.data ?? [];
  const postIds = posts.map((post) => post.id);
  const commentIds = comments.map((comment) => comment.id);

  const [
    postLikesRes,
    postCommentsRes,
    commentLikesRes,
    repliesRes,
    postFilesRes,
  ] = await Promise.all([
    postIds.length
      ? supabase
          .from("post_likes")
          .select("post_id")
          .in("post_id", postIds)
      : Promise.resolve({ data: [], error: null }),
    postIds.length
      ? supabase
          .from("comments")
          .select("post_id")
          .in("post_id", postIds)
          .is("parent_comment_id", null)
      : Promise.resolve({ data: [], error: null }),
    commentIds.length
      ? supabase
          .from("comment_likes")
          .select("comment_id")
          .in("comment_id", commentIds)
      : Promise.resolve({ data: [], error: null }),
    commentIds.length
      ? supabase
          .from("comments")
          .select("parent_comment_id")
          .in("parent_comment_id", commentIds)
      : Promise.resolve({ data: [], error: null }),
    postIds.length
      ? supabase
          .from("post_files")
          .select("post_id, file_url")
          .in("post_id", postIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (postLikesRes.error) throw postLikesRes.error;
  if (postCommentsRes.error) throw postCommentsRes.error;
  if (commentLikesRes.error) throw commentLikesRes.error;
  if (repliesRes.error) throw repliesRes.error;
  if (postFilesRes.error) throw postFilesRes.error;

  const postLikeCounts = new Map<string, number>();
  (postLikesRes.data ?? []).forEach((row) => {
    postLikeCounts.set(row.post_id, (postLikeCounts.get(row.post_id) ?? 0) + 1);
  });

  const postCommentCounts = new Map<string, number>();
  (postCommentsRes.data ?? []).forEach((row) => {
    postCommentCounts.set(
      row.post_id,
      (postCommentCounts.get(row.post_id) ?? 0) + 1
    );
  });

  const commentLikeCounts = new Map<string, number>();
  (commentLikesRes.data ?? []).forEach((row) => {
    commentLikeCounts.set(
      row.comment_id,
      (commentLikeCounts.get(row.comment_id) ?? 0) + 1
    );
  });

  const replyCounts = new Map<string, number>();
  (repliesRes.data ?? []).forEach((row) => {
    if (!row.parent_comment_id) return;
    replyCounts.set(
      row.parent_comment_id,
      (replyCounts.get(row.parent_comment_id) ?? 0) + 1
    );
  });

  const filesByPost = new Map<string, string[]>();
  (postFilesRes.data ?? []).forEach((row) => {
    const list = filesByPost.get(row.post_id) ?? [];
    list.push(row.file_url);
    filesByPost.set(row.post_id, list);
  });

  const profile = (await getProfilesByIds([userId]))[0];
  const simpleUser = profile
    ? mapProfileToSimpleUserInfo(profile)
    : {
        id: userId,
        fullName: "",
        firstName: "",
        lastName: "",
        nonprofitName: undefined,
        organizationName: undefined,
        profilePicture: undefined,
        userType: undefined,
      };

  const activity: UserActivity[] = [
    ...posts.map((post) => ({
      id: post.id,
      contentType: "post",
      postText: post.post_text,
      files: filesByPost.get(post.id) ?? null,
      likeCount: postLikeCounts.get(post.id) ?? 0,
      commentCount: postCommentCounts.get(post.id) ?? 0,
      createdAt: post.created_at,
      posterId: simpleUser,
      userId: simpleUser,
    })),
    ...comments.map((comment) => ({
      id: comment.id,
      contentType: "comment",
      commentText: comment.comment_text,
      likeCount: commentLikeCounts.get(comment.id) ?? 0,
      replyCount: replyCounts.get(comment.id) ?? 0,
      createdAt: comment.created_at,
      posterId: simpleUser,
      userId: simpleUser,
    })),
  ];

  activity.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return activity;
};
