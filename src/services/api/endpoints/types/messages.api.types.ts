import { SimpleUserInfo } from "./user.api.types";

export interface MessageState {
  senderId: string;
  receiverId: string;
  message: string;
  isRead: boolean;
  dateSent: string;
}

export type GetMessageThreadParams = {
  friendId: string;
};

export interface NewMessage {
  receiverId: string;
  message: string;
}

export interface MessageThreadsState {
  id: string;
  lastMessage: MessageState | null;
  messages: MessageState[];
  participants: SimpleUserInfo[];
}

export type SingleMessageThreadState = Omit<MessageThreadsState, "lastMessage">;
