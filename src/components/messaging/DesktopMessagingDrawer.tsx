import { useMemo, useRef, useState } from "react";
import {
  Avatar,
  CircularProgress,
  IconButton,
  InputBase,
} from "@mui/material";
import {
  CameraAltOutlined,
  Close,
  ExpandMore,
  CreateOutlined,
} from "@mui/icons-material";

import {
  useCreateMessageMutation,
  useGetMessagesQuery,
  useGetMessageThreadQuery,
} from "../../services/api/endpoints/messages/messages.api";
import {
  selectCurrentFriends,
  selectCurrentUserId,
} from "../../features/users/selectors";
import { ProfileFriendState } from "../../features/friends/types";
import { useAppSelector } from "../../services/hooks";
import { DefaultTime } from "../../utils/CommonDateFormats";
import { assetUrl } from "../../utils/assetUrl";
import { Typography } from "../typography/Typography";
import { convertFileToBase64 } from "../../utils/CommonFunctions";
import {
  createImageMessagePayload,
  getImageMessageSrc,
  getMessagePreviewText,
  isImageMessage,
} from "./messageUtils";

import styles from "./styles/desktopMessagingDrawer.module.css";

type ThreadSummary = {
  id: string;
  friendId: string;
  fullName: string;
  profilePicture?: string;
  lastMessage: string;
  dateSent: string;
  unreadCount: number;
};

const getDisplayName = (participant: {
  fullName?: string;
  nonprofitName?: string;
  organizationName?: string;
}) => {
  return (
    participant.fullName ||
    participant.nonprofitName ||
    participant.organizationName ||
    "Unknown User"
  );
};

const MessageThreadPopup = ({
  currentUserId,
  thread,
  onClose,
}: {
  currentUserId: string;
  thread: ThreadSummary;
  onClose: () => void;
}) => {
  const { data: messageThread, isLoading } = useGetMessageThreadQuery(
    { friendId: thread.friendId },
    {
      pollingInterval: 3000,
      skipPollingIfUnfocused: true,
    }
  );
  const [draftMessage, setDraftMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const [sendMessage, { isLoading: isSending }] = useCreateMessageMutation();
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleSend = async () => {
    const nextMessage = draftMessage.trim();
    if (!nextMessage && !selectedImage) {
      return;
    }

    try {
      if (nextMessage) {
        await sendMessage({
          receiverId: thread.friendId,
          message: nextMessage,
        }).unwrap();
      }

      if (selectedImage) {
        await sendMessage({
          receiverId: thread.friendId,
          message: createImageMessagePayload(selectedImage),
        }).unwrap();
      }

      setDraftMessage("");
      setSelectedImage("");
    } catch (error) {
      console.error(error);
    }
  };

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

  return (
    <div className={styles.chatPopup}>
      <div className={styles.chatHeader}>
        <div className={styles.chatHeaderIdentity}>
          <Avatar
            src={thread.profilePicture ? assetUrl(thread.profilePicture) : undefined}
            alt={thread.fullName}
            className={styles.threadAvatar}
          />
          <span className={styles.chatHeaderName}>{thread.fullName}</span>
        </div>
        <div className={styles.chatHeaderActions}>
          <IconButton size="small" onClick={onClose}>
            <Close fontSize="small" />
          </IconButton>
        </div>
      </div>

      <div className={styles.chatMessages}>
        {isLoading && (
          <div className={styles.chatLoading}>
            <CircularProgress size={22} />
          </div>
        )}
        {messageThread?.messages?.map((message, index) => {
          const isMine = message.senderId === currentUserId;
          const timeSent = DefaultTime(new Date(message.dateSent));
          const isPhotoMessage = isImageMessage(message.message);
          return (
            <div
              key={`${message.dateSent}-${index}`}
              className={
                isMine ? styles.outgoingMessageRow : styles.incomingMessageRow
              }
            >
              {!isMine && (
                <Avatar
                  src={
                    thread.profilePicture ? assetUrl(thread.profilePicture) : undefined
                  }
                  alt={thread.fullName}
                  className={styles.chatAvatar}
                />
              )}
              <div
                className={
                  isMine ? styles.outgoingMessageBubble : styles.incomingMessageBubble
                }
              >
                {isPhotoMessage ? (
                  <img
                    src={getImageMessageSrc(message.message)}
                    alt="Message attachment"
                    className={styles.chatImage}
                  />
                ) : (
                  <span>{message.message}</span>
                )}
                <small>{timeSent}</small>
              </div>
            </div>
          );
        })}
      </div>

      {selectedImage && (
        <div className={styles.chatAttachmentPreview}>
          <img
            src={selectedImage}
            alt="Selected attachment"
            className={styles.chatAttachmentImage}
          />
          <button
            type="button"
            className={styles.chatAttachmentRemove}
            onClick={() => setSelectedImage("")}
          >
            Remove
          </button>
        </div>
      )}

      <div className={styles.chatComposer}>
        <button
          type="button"
          className={styles.chatComposerIconButton}
          onClick={() => imageInputRef.current?.click()}
        >
          <CameraAltOutlined className={styles.chatComposerIcon} fontSize="small" />
        </button>
        <InputBase
          value={draftMessage}
          onChange={(event) => setDraftMessage(event.target.value)}
          placeholder="Write a message..."
          className={styles.chatComposerInput}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void handleSend();
            }
          }}
        />
        <button
          type="button"
          className={styles.chatSendButton}
          onClick={() => void handleSend()}
          disabled={(!draftMessage.trim() && !selectedImage) || isSending}
        >
          Send
        </button>
        <input
          ref={imageInputRef}
          type="file"
          accept=".jpg,.jpeg,.png"
          className={styles.hiddenImageInput}
          onChange={handleImageSelection}
        />
      </div>
    </div>
  );
};

const NewMessagePopup = ({
  friends,
  searchTerm,
  onSearchChange,
  onClose,
  onSelectFriend,
}: {
  friends: ProfileFriendState[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onClose: () => void;
  onSelectFriend: (friend: ProfileFriendState) => void;
}) => {
  const filteredFriends = friends.filter((friend) => {
    const displayName = getDisplayName(friend).toLowerCase();
    return !searchTerm.trim() || displayName.includes(searchTerm.trim().toLowerCase());
  });

  return (
    <div className={styles.chatPopup}>
      <div className={styles.chatHeader}>
        <div className={styles.composeHeaderTitle}>New Message</div>
        <div className={styles.chatHeaderActions}>
          <IconButton size="small" onClick={onClose}>
            <Close fontSize="small" />
          </IconButton>
        </div>
      </div>

      <div className={styles.composeBody}>
        <InputBase
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Type in a name or pick a name below.."
          className={styles.composeSearchInput}
        />

        <div className={styles.composeList}>
          {filteredFriends.length > 0 ? (
            filteredFriends.map((friend) => (
              <button
                type="button"
                key={friend.id}
                className={styles.composeRecipientRow}
                onClick={() => onSelectFriend(friend)}
              >
                <Avatar
                  src={
                    friend.profilePicture ? assetUrl(friend.profilePicture) : undefined
                  }
                  alt={getDisplayName(friend)}
                  className={styles.threadAvatar}
                />
                <div className={styles.composeRecipientBody}>
                  <span className={styles.threadName}>{getDisplayName(friend)}</span>
                  <span className={styles.composeRecipientSubtitle}>
                    {friend.organizationName ||
                      friend.nonprofitName ||
                      `${friend.city}, ${friend.zip}`}
                  </span>
                </div>
              </button>
            ))
          ) : (
            <div className={styles.drawerState}>
              <Typography
                variant="grayText"
                textToDisplay="No matching friends found"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const DesktopMessagingDrawer = () => {
  const currentUserId = useAppSelector(selectCurrentUserId);
  const currentFriends = useAppSelector(selectCurrentFriends);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [composeSearchTerm, setComposeSearchTerm] = useState("");
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [openThread, setOpenThread] = useState<ThreadSummary | null>(null);
  const { data: messageThreads = [], isLoading } = useGetMessagesQuery(undefined, {
    pollingInterval: 5000,
    skipPollingIfUnfocused: true,
  });

  const threads = useMemo<ThreadSummary[]>(() => {
    const summaries: ThreadSummary[] = [];

    messageThreads.forEach((thread) => {
        const participant = thread.participants.find(
          (item) => item.id !== currentUserId
        );
        if (!participant) {
          return;
        }

        const unreadCount = thread.messages.filter(
          (message) => message.senderId === participant.id && !message.isRead
        ).length;
        const lastMessage =
          thread.lastMessage?.message ||
          thread.messages[thread.messages.length - 1]?.message ||
          "No messages yet";
        const dateSent =
          thread.lastMessage?.dateSent ||
          thread.messages[thread.messages.length - 1]?.dateSent ||
          "";

        summaries.push({
          id: thread.id,
          friendId: participant.id,
          fullName: getDisplayName(participant),
          profilePicture: participant.profilePicture,
          lastMessage,
          dateSent,
          unreadCount,
        });
      });

    return summaries
      .filter((thread) => {
        const searchValue = searchTerm.trim().toLowerCase();
        if (!searchValue) {
          return true;
        }

        return (
          thread.fullName.toLowerCase().includes(searchValue) ||
          getMessagePreviewText(thread.lastMessage).toLowerCase().includes(searchValue)
        );
      });
  }, [currentUserId, messageThreads, searchTerm]);

  const handleOpenThread = (thread: ThreadSummary) => {
    setOpenThread(thread);
    setIsComposeOpen(false);
  };

  const handleOpenComposeThread = (friend: ProfileFriendState) => {
    const existingThread = threads.find((thread) => thread.friendId === friend.id);
    setOpenThread(
      existingThread ?? {
        id: `draft-${friend.id}`,
        friendId: friend.id,
        fullName: getDisplayName(friend),
        profilePicture: friend.profilePicture,
        lastMessage: "",
        dateSent: "",
        unreadCount: 0,
      }
    );
    setIsComposeOpen(false);
    setComposeSearchTerm("");
  };

  return (
    <>
      {isComposeOpen && (
        <NewMessagePopup
          friends={currentFriends}
          searchTerm={composeSearchTerm}
          onSearchChange={setComposeSearchTerm}
          onClose={() => {
            setIsComposeOpen(false);
            setComposeSearchTerm("");
          }}
          onSelectFriend={handleOpenComposeThread}
        />
      )}
      {openThread && currentUserId && (
        <MessageThreadPopup
          currentUserId={currentUserId}
          thread={openThread}
          onClose={() => setOpenThread(null)}
        />
      )}
      <div
        className={`${styles.drawerShell} ${
          isCollapsed ? styles.drawerShellCollapsed : ""
        }`}
      >
        <button
          type="button"
          className={styles.drawerHeader}
          onClick={() => setIsCollapsed((prev) => !prev)}
        >
          <span>Messages</span>
          <ExpandMore
            className={`${styles.drawerChevron} ${
              isCollapsed ? styles.drawerChevronCollapsed : ""
            }`}
          />
        </button>

        {!isCollapsed && (
          <>
            <div className={styles.drawerSearchRow}>
              <IconButton
                size="small"
                className={styles.composeButton}
                onClick={() => {
                  setIsComposeOpen(true);
                  setOpenThread(null);
                  setComposeSearchTerm("");
                }}
              >
                <CreateOutlined fontSize="small" />
              </IconButton>
              <InputBase
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search Messages"
                className={styles.drawerSearchInput}
              />
            </div>

            <div className={styles.drawerThreadList}>
              {isLoading ? (
                <div className={styles.drawerState}>
                  <CircularProgress size={22} />
                </div>
              ) : threads.length > 0 ? (
                threads.map((thread) => (
                  <button
                    type="button"
                    key={thread.id}
                    className={`${styles.threadRow} ${
                      openThread?.id === thread.id ? styles.threadRowActive : ""
                    }`}
                    onClick={() => handleOpenThread(thread)}
                  >
                    <Avatar
                      src={
                        thread.profilePicture
                          ? assetUrl(thread.profilePicture)
                          : undefined
                      }
                      alt={thread.fullName}
                      className={styles.threadAvatar}
                    />
                    <div className={styles.threadBody}>
                      <div className={styles.threadTopRow}>
                        <span className={styles.threadName}>{thread.fullName}</span>
                        <span className={styles.threadDate}>
                          {thread.dateSent
                            ? DefaultTime(new Date(thread.dateSent))
                            : ""}
                        </span>
                      </div>
                      <div className={styles.threadBottomRow}>
                        <span className={styles.threadSnippet}>
                          {getMessagePreviewText(thread.lastMessage)}
                        </span>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className={styles.drawerState}>
                  <Typography variant="grayText" textToDisplay="No messages yet" />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};
