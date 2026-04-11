import { createSlice } from "@reduxjs/toolkit";
import { UserState } from "../../features/users/userSlice";

// Define your initial state
interface SearchBarState {
  error: string | null;
  searchResults: UserState[];
}

const initialState: SearchBarState = {
  error: null,
  searchResults: [],
};

const searchBarSlice = createSlice({
  name: "searchBar",
  initialState,
  reducers: {
    setSearchTerm: (state, action) => {
      state.searchResults = action.payload;
    },
  },
});

// Export the actions and reducer
export const { setSearchTerm } = searchBarSlice.actions;
export default searchBarSlice.reducer;
