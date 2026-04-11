import { PostUserInfo } from "./user.api.types";

export interface NewCommentBody {
  postId: string;
  userId: string;
  commentText: string;
}

export interface NewReplyBody extends Omit<NewCommentBody, "postId"> {
  commentId: string;
  userId: string;
}

export interface CommentResponse extends Omit<NewCommentBody, "userId"> {
  id: string;
  userId: PostUserInfo;
  createdAt: string;
  commentLikes: string[];
  replies: string[];
  replyCount: number;
  likeCount: number;
  isChildComment: boolean;
}
