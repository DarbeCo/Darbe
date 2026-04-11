import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { PostReponse } from "../../services/api/endpoints/types/posts.api.types";

interface FeedState {
  posts: PostReponse[];
}

const initialState: FeedState = {
  posts: [],
};

const feedSlice = createSlice({
  name: "feed",
  initialState,
  reducers: {
    setPosts: (state, action: PayloadAction<PostReponse[]>) => {
      state.posts = action.payload;
    },
    addPost: (state, action: PayloadAction<PostReponse>) => {
      state.posts.push(action.payload);
    },
    removePost: (state, action: PayloadAction<number>) => {
      state.posts.splice(action.payload, 1);
    },
  },
});

export const { setPosts, addPost, removePost } = feedSlice.actions;

export default feedSlice.reducer;
