import { RootState } from "../../services/store";

export const getModalStatus = (state: RootState) => state.modal.isModalVisible;
export const getModalType = (state: RootState) => state.modal.modalType;
export const getModalUserId = (state: RootState) => state.modal.modalUserId;
export const getExternalData = (state: RootState) => state.modal.externalData;