import { useState } from "react";
import { CircularProgress } from "@mui/material";

import { selectCurrentUserId } from "../../features/users/selectors";
import { Inputs } from "../inputs/Inputs";
import { useGetFriendsQuery } from "../../services/api/endpoints/friends/friends.api";
import { useAppSelector } from "../../services/hooks";
import { UserAvatars } from "../avatars/UserAvatars";

import styles from "./styles/friends.module.css";

interface FriendListDisplayProps {
  onClick: (friendId: string) => void;
}

// TODO: Optimize
export const FriendListDisplay = ({ onClick }: FriendListDisplayProps) => {
  const [searchFilter, setSearchFilter] = useState<string>("");
  const userId = useAppSelector(selectCurrentUserId);
  const { data, isLoading } = useGetFriendsQuery(userId);

  const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    setSearchFilter(evt.target.value);
  };

  return (
    <div className={styles.friendListDisplay}>
      {isLoading && <CircularProgress />}
      <Inputs
        label=""
        placeholder="Search for friends"
        darbeInputType="standardInput"
        name="searchFilter"
        handleChange={handleChange}
      />
      <div className={styles.friendListDisplayArea}>
        {data
          ?.filter((friend) =>
            friend.fullName.toLowerCase().includes(searchFilter.toLowerCase())
          )
          .map((friend) => (
            <UserAvatars
              key={friend.id}
              onClick={() => onClick(friend.id)}
              userId={friend.id}
              fullName={friend.fullName}
              profilePicture={friend.profilePicture}
            />
          ))}
      </div>
    </div>
  );
};
