import { SimpleUserInfo } from "./user.api.types";

export interface UserActivity {
    id: string;
    contentType: string;
    postText?: string;
    commentText?: string;
    likeCount?: number;
    commentCount?: number;
    replyCount?: number;
    createdAt: string;
    // TODO: Rename these two when the backend is renamed
    posterId: SimpleUserInfo
    // TODO: ^^ also this is comment owner, not poster
    userId: SimpleUserInfo
}