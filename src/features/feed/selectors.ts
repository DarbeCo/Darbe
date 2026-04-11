import { RootState } from "../../services/store";

export const selectAllPosts = (state: RootState) => state.feed.posts;
