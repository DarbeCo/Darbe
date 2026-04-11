import { createSlice } from "@reduxjs/toolkit";
import { EDIT_SECTIONS } from "../../features/users/userProfiles/constants";

export const MODAL_TYPE = {
  ...EDIT_SECTIONS,
  createPost: "createPost",
  mutualFriends: "mutualFriends",
  mutualCauses: "mutualCauses",
  profileCauses: "profileCauses",
  profileFriends: "profileFriends",
  editRoster: "editRoster",
}

const initialState = {
  isModalVisible: false,
  modalType: MODAL_TYPE.createPost,
  modalUserId: "",
  externalData: undefined
};

const modalSlice = createSlice({
  name: "modal",
  initialState,
  reducers: {
    showModal: (state) => {
      state.isModalVisible = true;
    },
    hideModal: (state) => {
      state.isModalVisible = false;
    },
    setModalType: (state, action) => {
      state.modalType = action.payload;
    },
    setModalUserId: (state, action) => {
      state.modalUserId = action.payload;
    },
    setExternalData: (state, action) => {
      state.externalData = action.payload;
    },
  },
});

export const { showModal, hideModal, setModalType, setModalUserId, setExternalData } = modalSlice.actions;

export default modalSlice.reducer;
