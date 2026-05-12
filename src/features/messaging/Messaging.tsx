import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowBack,
  CameraAlt,
  CreateOutlined,
  MoreHoriz,
  Search,
} from "@mui/icons-material";
import { Avatar, CircularProgress, InputBase } from "@mui/material";

import {
  useCreateMessageMutation,
  useGetMessagesQuery,
  useGetMessageThreadQuery,
} from "../../services/api/endpoints/messages/messages.api";
import {
  MessageState,
  MessageThreadsState,
} from "../../services/api/endpoints/types/messages.api.types";
import { SimpleUserInfo } from "../../services/api/endpoints/types/user.api.types";
import { useAppSelector } from "../../services/hooks";
import {
  selectCurrentFriends,
  selectCurrentUserId,
} from "../users/selectors";
import { ProfileFriendState } from "../friends/types";
import { MessageDate, MessageTime } from "../../utils/CommonDateFormats";
import { assetUrl } from "../../utils/assetUrl";
import { convertFileToBase64 } from "../../utils/CommonFunctions";
import {
  combineImageAndTextMessages,
  createImageMessagePayload,
  getImageMessageSrc,
  getMessageText,
  getMessagePreviewText,
  isImageMessage,
} from "../../components/messaging/messageUtils";
import useScreenWidthHook from "../../utils/commonHooks/UseScreenWidth";

import styles from "./styles/messaging.module.css";

type ThreadSummary = {
  id: string;
  friendId: string;
  fullName: string;
  profilePicture?: string;
  lastMessage: string;
  dateSent: string;
};

const getDisplayName = (participant?: SimpleUserInfo) =>
  participant?.fullName ||
  participant?.nonprofitName ||
  participant?.organizationName ||
  "Unknown User";

const getFriendDisplayName = (friend: ProfileFriendState) =>
  friend.fullName ||
  friend.nonprofitName ||
  friend.organizationName ||
  "Unknown User";

const formatThreadDate = (dateSent: string) => {
  if (!dateSent) {
    return "";
  }

  const date = new Date(dateSent);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "numeric",
    day: "2-digit",
  });
};

const isSameCalendarDay = (firstDate: Date, secondDate: Date) =>
  firstDate.getFullYear() === secondDate.getFullYear() &&
  firstDate.getMonth() === secondDate.getMonth() &&
  firstDate.getDate() === secondDate.getDate();

const getOtherParticipant = (
  thread: MessageThreadsState,
  currentUserId: string
) => thread.participants.find((participant) => participant.id !== currentUserId);

const buildThreadSummary = (
  thread: MessageThreadsState,
  currentUserId: string
): ThreadSummary | null => {
  const participant = getOtherParticipant(thread, currentUserId);

  if (!participant) {
    return null;
  }

  const combinedMessages = combineImageAndTextMessages(thread.messages);
  const lastMessage =
    combinedMessages.length
      ? combinedMessages[combinedMessages.length - 1]
      : thread.lastMessage;

  return {
    id: thread.id,
    friendId: participant.id,
    fullName: getDisplayName(participant),
    profilePicture: participant.profilePicture,
    lastMessage: lastMessage?.message || "No messages yet",
    dateSent: lastMessage?.dateSent || "",
  };
};

export const Messaging = () => {
  const currentUserId = useAppSelector(selectCurrentUserId);
  const currentFriends = useAppSelector(selectCurrentFriends) ?? [];
  const { isDesktop } = useScreenWidthHook();
  const { data: messageThreads = [], isLoading } = useGetMessagesQuery();
  const [selectedThreadId, setSelectedThreadId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [friendSearchTerm, setFriendSearchTerm] = useState("");
  const [isFriendPickerOpen, setIsFriendPickerOpen] = useState(false);
  const [isMobileConversationOpen, setIsMobileConversationOpen] =
    useState(false);
  const [draftThread, setDraftThread] = useState<ThreadSummary | null>(null);
  const [draftMessage, setDraftMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const composerTextAreaRef = useRef<HTMLTextAreaElement>(null);
  const [sendMessage, { isLoading: isSending }] = useCreateMessageMutation();

  const threadSummaries = useMemo(
    () =>
      messageThreads
        .map((thread) => buildThreadSummary(thread, currentUserId))
        .filter((thread): thread is ThreadSummary => Boolean(thread))
        .filter((thread) => {
          const searchValue = searchTerm.trim().toLowerCase();

          if (!searchValue) {
            return true;
          }

          return (
            thread.fullName.toLowerCase().includes(searchValue) ||
            getMessagePreviewText(thread.lastMessage)
              .toLowerCase()
              .includes(searchValue)
          );
        }),
    [currentUserId, messageThreads, searchTerm]
  );

  useEffect(() => {
    if (!isDesktop || selectedThreadId || !threadSummaries.length) {
      return;
    }

    setSelectedThreadId(threadSummaries[0].id);
  }, [isDesktop, selectedThreadId, threadSummaries]);

  useEffect(() => {
    if (!draftThread) {
      return;
    }

    const createdThread = threadSummaries.find(
      (thread) => thread.friendId === draftThread.friendId
    );

    if (!createdThread) {
      return;
    }

    setSelectedThreadId(createdThread.id);
    setDraftThread(null);
  }, [draftThread, threadSummaries]);

  const selectedThread =
    threadSummaries.find((thread) => thread.id === selectedThreadId) ||
    draftThread ||
    (isDesktop ? threadSummaries[0] : undefined);

  const threadSummaryByFriendId = useMemo(
    () =>
      new Map(
        threadSummaries.map((threadSummary) => [
          threadSummary.friendId,
          threadSummary,
        ])
      ),
    [threadSummaries]
  );

  const filteredMobileFriends = currentFriends.filter((friend) => {
    const searchValue = searchTerm.trim().toLowerCase();

    if (!searchValue) {
      return true;
    }

    const existingThread = threadSummaryByFriendId.get(friend.id);

    return (
      getFriendDisplayName(friend).toLowerCase().includes(searchValue) ||
      existingThread?.lastMessage.toLowerCase().includes(searchValue) ||
      friend.city?.toLowerCase().includes(searchValue) ||
      friend.zip?.toLowerCase().includes(searchValue)
    );
  });

  const filteredFriends = currentFriends.filter((friend) => {
    const searchValue = friendSearchTerm.trim().toLowerCase();

    if (!searchValue) {
      return true;
    }

    return (
      getFriendDisplayName(friend).toLowerCase().includes(searchValue) ||
      friend.city?.toLowerCase().includes(searchValue) ||
      friend.zip?.toLowerCase().includes(searchValue)
    );
  });

  const { data: messageThread, isLoading: isLoadingThread } =
    useGetMessageThreadQuery(
      { friendId: selectedThread?.friendId || "" },
      {
        pollingInterval: 2500,
        skip: !selectedThread?.friendId,
        skipPollingIfUnfocused: true,
      }
    );

  useEffect(() => {
    messageListRef.current?.scrollTo({
      top: messageListRef.current.scrollHeight,
    });
  }, [messageThread?.messages.length, selectedThread?.id]);

  useEffect(() => {
    const textarea = composerTextAreaRef.current;

    if (!textarea) {
      return;
    }

    const maxHeight = 57;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    textarea.style.overflowY =
      textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [draftMessage]);

  const handleImageSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    void (async () => {
      try {
        const base64File = await convertFileToBase64(file);
        setSelectedImage(base64File);
      } catch (error) {
        console.error(error);
      } finally {
        event.target.value = "";
      }
    })();
  };

  const handleSend = async () => {
    const text = draftMessage.trim();

    if ((!text && !selectedImage) || !selectedThread?.friendId || isSending) {
      return;
    }

    try {
      await sendMessage({
        receiverId: selectedThread.friendId,
        message: selectedImage
          ? createImageMessagePayload(selectedImage, text)
          : text,
      }).unwrap();

      setDraftMessage("");
      setSelectedImage("");
    } catch (error) {
      console.error(error);
    }
  };

  const handleOpenFriendPicker = () => {
    setIsFriendPickerOpen(true);
    setFriendSearchTerm("");
  };

  const handleSelectFriend = (friend: ProfileFriendState) => {
    const existingThread = threadSummaries.find(
      (thread) => thread.friendId === friend.id
    );

    if (existingThread) {
      setSelectedThreadId(existingThread.id);
      setDraftThread(null);
    } else {
      const nextDraftThread = {
        id: `draft-${friend.id}`,
        friendId: friend.id,
        fullName: getFriendDisplayName(friend),
        profilePicture: friend.profilePicture,
        lastMessage: "",
        dateSent: "",
      };
      setDraftThread(nextDraftThread);
      setSelectedThreadId(nextDraftThread.id);
    }

    setDraftMessage("");
    setSelectedImage("");
    setIsMobileConversationOpen(true);
    setIsFriendPickerOpen(false);
    setFriendSearchTerm("");
  };

  const handleBackToMobileFriends = () => {
    setIsMobileConversationOpen(false);
    setDraftMessage("");
    setSelectedImage("");
  };

  const renderDateDivider = (message: MessageState, index: number) => {
    const messages = combineImageAndTextMessages(messageThread?.messages ?? []);
    const previousMessage = messages[index - 1];

    return (
      !previousMessage ||
      !isSameCalendarDay(
        new Date(previousMessage.dateSent),
        new Date(message.dateSent)
      )
    );
  };

  const renderMessage = (message: MessageState, index: number) => {
    const isMine = message.senderId === currentUserId;
    const isPhoto = isImageMessage(message.message);
    const messageText = getMessageText(message.message);
    const imageSrc = getImageMessageSrc(message.message);

    return (
      <div key={`${message.dateSent}-${index}`}>
        {renderDateDivider(message, index) && (
          <div className={styles.messagingTodayDivider}>
            <span>{MessageDate(new Date(message.dateSent))}</span>
          </div>
        )}
        <div
          className={
            isMine ? styles.messagingMessageMine : styles.messagingMessageFriend
          }
        >
          {!isMine && (
            <Avatar
              src={
                selectedThread?.profilePicture
                  ? assetUrl(selectedThread.profilePicture)
                  : undefined
              }
              alt={selectedThread?.fullName}
              className={styles.messagingMessageAvatar}
            />
          )}
          <div className={styles.messagingBubbleArea}>
            <div className={styles.messagingBubble}>
              {messageText && <span>{messageText}</span>}
              {isPhoto && imageSrc && (
                <img
                  src={imageSrc}
                  alt="Message attachment"
                  className={styles.messagingMessageImage}
                />
              )}
            </div>
            <span className={styles.messagingTime}>
              {MessageTime(new Date(message.dateSent))}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderFriendSelectionRow = (friend: ProfileFriendState) => {
    const existingThread = threadSummaryByFriendId.get(friend.id);
    const nameToUse = getFriendDisplayName(friend);

    return (
      <button
        key={friend.id}
        type="button"
        className={styles.messagingThreadRow}
        onClick={() => handleSelectFriend(friend)}
      >
        <Avatar
          src={friend.profilePicture ? assetUrl(friend.profilePicture) : undefined}
          alt={nameToUse}
          className={styles.messagingThreadAvatar}
        />
        <div className={styles.messagingThreadText}>
          <div className={styles.messagingThreadTop}>
            <strong>{nameToUse}</strong>
            <span>{formatThreadDate(existingThread?.dateSent ?? "")}</span>
          </div>
          <p>{getMessagePreviewText(existingThread?.lastMessage || "Tap to message")}</p>
        </div>
      </button>
    );
  };

  return (
    <section className={styles.messagingV2Page}>
      <div
        className={`${styles.messagingConversation} ${
          !isDesktop && !isMobileConversationOpen
            ? styles.messagingMobileHidden
            : ""
        }`}
      >
        {selectedThread ? (
          <>
            <header className={styles.messagingConversationHeader}>
              <div className={styles.messagingConversationIdentity}>
                {!isDesktop && (
                  <button
                    type="button"
                    className={styles.messagingBackButton}
                    onClick={handleBackToMobileFriends}
                    aria-label="Back to friends"
                  >
                    <ArrowBack />
                  </button>
                )}
                <Avatar
                  src={
                    selectedThread.profilePicture
                      ? assetUrl(selectedThread.profilePicture)
                      : undefined
                  }
                  alt={selectedThread.fullName}
                  className={styles.messagingHeaderAvatar}
                />
                <h1>{selectedThread.fullName}</h1>
              </div>
              <button
                type="button"
                className={styles.messagingMoreButton}
                aria-label="Message options"
              >
                <MoreHoriz />
              </button>
            </header>
            <div className={styles.messagingMessages} ref={messageListRef}>
              {isLoadingThread && (
                <div className={styles.messagingState}>
                  <CircularProgress size={24} />
                </div>
              )}
              {combineImageAndTextMessages(
                messageThread?.messages ?? []
              ).map(renderMessage)}
            </div>
            {selectedImage && (
              <div className={styles.messagingAttachmentPreview}>
                <img src={selectedImage} alt="Selected attachment" />
                <button type="button" onClick={() => setSelectedImage("")}>
                  Remove
                </button>
              </div>
            )}
            <footer className={styles.messagingComposer}>
              <button
                type="button"
                className={styles.messagingCameraButton}
                onClick={() => imageInputRef.current?.click()}
                aria-label="Attach image"
              >
                <CameraAlt />
              </button>
              <textarea
                ref={composerTextAreaRef}
                value={draftMessage}
                onChange={(event) => setDraftMessage(event.target.value)}
                placeholder="Write a message..."
                className={styles.messagingComposerInput}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void handleSend();
                  }
                }}
              />
              <button
                type="button"
                className={styles.messagingSendButton}
                onClick={() => void handleSend()}
                disabled={(!draftMessage.trim() && !selectedImage) || isSending}
              >
                Send
              </button>
              <input
                ref={imageInputRef}
                type="file"
                accept=".jpg,.jpeg,.png"
                hidden
                onChange={handleImageSelection}
              />
            </footer>
          </>
        ) : (
          <div className={styles.messagingEmptyConversation}>
            {isLoading ? <CircularProgress size={24} /> : "Select a friend"}
          </div>
        )}
      </div>

      <aside
        className={`${styles.messagingThreadPanel} ${
          !isDesktop && isMobileConversationOpen
            ? styles.messagingMobileHidden
            : ""
        }`}
      >
        <header className={styles.messagingThreadHeader}>
          <h2>{isDesktop ? "Messages" : "Friends"}</h2>
        </header>
        <div className={styles.messagingSearchRow}>
          {isDesktop ? (
            <button
              type="button"
              className={styles.messagingComposeButton}
              aria-label="New message"
              onClick={handleOpenFriendPicker}
            >
              <CreateOutlined />
            </button>
          ) : (
            <span className={styles.messagingSearchSpacer} />
          )}
          <div className={styles.messagingSearchBox}>
            <Search />
            <InputBase
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={isDesktop ? "Search Messages" : "Search Friends"}
              className={styles.messagingSearchInput}
            />
          </div>
        </div>
        <div className={styles.messagingThreads}>
          {!isDesktop ? (
            <>
              {isLoading && (
                <div className={styles.messagingState}>
                  <CircularProgress size={24} />
                </div>
              )}
              {!isLoading && filteredMobileFriends.length === 0 && (
                <div className={styles.messagingState}>No friends found</div>
              )}
              {!isLoading && filteredMobileFriends.map(renderFriendSelectionRow)}
            </>
          ) : isFriendPickerOpen ? (
            <>
              <div className={styles.messagingFriendPickerHeader}>
                <strong>New Message</strong>
                <button
                  type="button"
                  onClick={() => setIsFriendPickerOpen(false)}
                >
                  Cancel
                </button>
              </div>
              <div className={styles.messagingFriendPickerSearch}>
                <Search />
                <InputBase
                  value={friendSearchTerm}
                  onChange={(event) => setFriendSearchTerm(event.target.value)}
                  placeholder="Type in a name"
                  className={styles.messagingSearchInput}
                />
              </div>
              {filteredFriends.length ? (
                filteredFriends.map((friend) => (
                  <button
                    type="button"
                    key={friend.id}
                    className={styles.messagingFriendRow}
                    onClick={() => handleSelectFriend(friend)}
                  >
                    <Avatar
                      src={
                        friend.profilePicture
                          ? assetUrl(friend.profilePicture)
                          : undefined
                      }
                      alt={getFriendDisplayName(friend)}
                      className={styles.messagingThreadAvatar}
                    />
                    <div className={styles.messagingThreadText}>
                      <div className={styles.messagingThreadTop}>
                        <strong>{getFriendDisplayName(friend)}</strong>
                      </div>
                      <p>
                        {friend.organizationName ||
                          friend.nonprofitName ||
                          `${friend.city}, ${friend.zip}`}
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <div className={styles.messagingState}>No friends found</div>
              )}
            </>
          ) : isLoading ? (
            <div className={styles.messagingState}>
              <CircularProgress size={24} />
            </div>
          ) : threadSummaries.length ? (
            threadSummaries.map((thread) => (
              <button
                type="button"
                key={thread.id}
                className={`${styles.messagingThreadRow} ${
                  selectedThread?.id === thread.id
                    ? styles.messagingThreadRowActive
                    : ""
                }`}
                onClick={() => setSelectedThreadId(thread.id)}
              >
                <Avatar
                  src={
                    thread.profilePicture ? assetUrl(thread.profilePicture) : undefined
                  }
                  alt={thread.fullName}
                  className={styles.messagingThreadAvatar}
                />
                <div className={styles.messagingThreadText}>
                  <div className={styles.messagingThreadTop}>
                    <strong>{thread.fullName}</strong>
                    <span>{formatThreadDate(thread.dateSent)}</span>
                  </div>
                  <p>{getMessagePreviewText(thread.lastMessage)}</p>
                </div>
              </button>
            ))
          ) : (
            <div className={styles.messagingState}>No messages</div>
          )}
        </div>
      </aside>
    </section>
  );
};
