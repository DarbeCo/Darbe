import { NewPostBody } from "../../../../components/createPost/types";
import { PostUserInfo } from "./user.api.types";

export interface PostReponse extends Omit<NewPostBody, "posterId"> {
  id: string;
  comments: string[];
  likes: string[];
  likeCount: number;
  commentCount: number;
  createdAt: string;
  posterId: PostUserInfo;
}
