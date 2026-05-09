import type {
  GetMessageThreadParams,
  MessageState,
  MessageThreadsState,
  NewMessage,
  SingleMessageThreadState,
} from "../api/endpoints/types/messages.api.types";
import type { SimpleUserInfo } from "../api/endpoints/types/user.api.types";
import { supabase } from "../supabase/client";
import { ensureUserId } from "./utils";
import { getProfilesByIds, mapProfileToSimpleUserInfo } from "./profiles";

const mapMessageRow = (row: {
  sender_id: string;
  receiver_id: string;
  message: string;
  is_read: boolean;
  date_sent: string;
}): MessageState => ({
  senderId: row.sender_id,
  receiverId: row.receiver_id,
  message: row.message,
  isRead: row.is_read,
  dateSent: row.date_sent,
});

const getThreadIdsWithUser = async (friendId: string): Promise<string[]> => {
  const userId = await ensureUserId();
  const { data: myThreads, error } = await supabase
    .from("message_thread_participants")
    .select("thread_id")
    .eq("user_id", userId);

  if (error) throw error;

  const threadIds = (myThreads ?? []).map((row) => row.thread_id);
  if (!threadIds.length) return [];

  const { data: shared, error: sharedError } = await supabase
    .from("message_thread_participants")
    .select("thread_id")
    .eq("user_id", friendId)
    .in("thread_id", threadIds);

  if (sharedError) throw sharedError;

  return Array.from(new Set((shared ?? []).map((row) => row.thread_id)));
};

export const getMessages = async (): Promise<MessageThreadsState[]> => {
  const userId = await ensureUserId();
  const { data: threadRows, error } = await supabase
    .from("message_thread_participants")
    .select("thread_id")
    .eq("user_id", userId);

  if (error) throw error;

  const threadIds = Array.from(new Set((threadRows ?? []).map((row) => row.thread_id)));
  if (!threadIds.length) return [];

  const [participantsRes, messagesRes] = await Promise.all([
    supabase
      .from("message_thread_participants")
      .select("thread_id, user_id")
      .in("thread_id", threadIds),
    supabase
      .from("messages")
      .select("thread_id, sender_id, receiver_id, message, is_read, date_sent")
      .in("thread_id", threadIds)
      .order("date_sent", { ascending: true }),
  ]);

  if (participantsRes.error) throw participantsRes.error;
  if (messagesRes.error) throw messagesRes.error;

  const participantRows = participantsRes.data ?? [];
  const participantIds = Array.from(
    new Set(participantRows.map((row) => row.user_id))
  );
  const profiles = await getProfilesByIds(participantIds);
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));

  const participantsByThread = new Map<string, SimpleUserInfo[]>();
  participantRows.forEach((row) => {
    const list = participantsByThread.get(row.thread_id) ?? [];
    const profile = profileMap.get(row.user_id);
    if (profile) {
      list.push(mapProfileToSimpleUserInfo(profile));
      participantsByThread.set(row.thread_id, list);
    }
  });

  const messagesByThread = new Map<string, MessageState[]>();
  (messagesRes.data ?? []).forEach((row) => {
    const list = messagesByThread.get(row.thread_id) ?? [];
    list.push(mapMessageRow(row));
    messagesByThread.set(row.thread_id, list);
  });

  const mergedThreadsByFriend = new Map<string, MessageThreadsState>();

  threadIds.forEach((threadId) => {
    const participants = participantsByThread.get(threadId) ?? [];
    const friend = participants.find((participant) => participant.id !== userId);

    if (!friend) {
      return;
    }

    const messages = messagesByThread.get(threadId) ?? [];
    const existingThread = mergedThreadsByFriend.get(friend.id);
    const mergedMessages = [...(existingThread?.messages ?? []), ...messages].sort(
      (firstMessage, secondMessage) =>
        new Date(firstMessage.dateSent).getTime() -
        new Date(secondMessage.dateSent).getTime()
    );
    const lastMessage = mergedMessages.length
      ? mergedMessages[mergedMessages.length - 1]
      : null;

    mergedThreadsByFriend.set(friend.id, {
      id: existingThread?.id ?? threadId,
      lastMessage,
      messages: mergedMessages,
      participants: existingThread?.participants.length
        ? existingThread.participants
        : participants,
    });
  });

  return Array.from(mergedThreadsByFriend.values()).sort((firstThread, secondThread) => {
    const firstTime = firstThread.lastMessage
      ? new Date(firstThread.lastMessage.dateSent).getTime()
      : 0;
    const secondTime = secondThread.lastMessage
      ? new Date(secondThread.lastMessage.dateSent).getTime()
      : 0;

    return secondTime - firstTime;
  });
};

export const createMessage = async (
  message: NewMessage
): Promise<MessageState> => {
  const { data, error } = await supabase.rpc("send_message", {
    target_receiver_id: message.receiverId,
    message_body: message.message,
  });

  const sentMessage = data?.[0];

  if (error || !sentMessage) {
    throw error ?? new Error("Failed to create message");
  }

  return mapMessageRow(sentMessage);
};

export const markMessageAsRead = async (messageId: string): Promise<MessageState> => {
  const { data, error } = await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("id", messageId)
    .select("sender_id, receiver_id, message, is_read, date_sent")
    .single();

  if (error || !data) throw error ?? new Error("Failed to update message");

  return mapMessageRow(data);
};

export const getMessageThread = async (
  params: GetMessageThreadParams
): Promise<SingleMessageThreadState> => {
  const friendId = params.friendId;
  const threadIds = await getThreadIdsWithUser(friendId);

  if (!threadIds.length) {
    return { id: "", messages: [], participants: [] };
  }

  const [participantsRes, messagesRes] = await Promise.all([
    supabase
      .from("message_thread_participants")
      .select("user_id")
      .in("thread_id", threadIds),
    supabase
      .from("messages")
      .select("sender_id, receiver_id, message, is_read, date_sent")
      .in("thread_id", threadIds)
      .order("date_sent", { ascending: true }),
  ]);

  if (participantsRes.error) throw participantsRes.error;
  if (messagesRes.error) throw messagesRes.error;

  const participantIds = Array.from(
    new Set((participantsRes.data ?? []).map((row) => row.user_id))
  );
  const profiles = await getProfilesByIds(participantIds);
  const participants = profiles.map(mapProfileToSimpleUserInfo);
  const messages = (messagesRes.data ?? []).map(mapMessageRow);

  return { id: threadIds[0], messages, participants };
};

export const deleteMessagesThread = async (threadId: string): Promise<void> => {
  const { error } = await supabase.from("message_threads").delete().eq("id", threadId);
  if (error) throw error;
};
