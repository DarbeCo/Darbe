import { useNavigate } from "react-router-dom";
import { UserAvatars } from "../avatars/UserAvatars";
import { PROFILE_ROUTE } from "../../routes/route.constants";
import { useAppDispatch } from "../../services/hooks";
import { hideModal } from "../modal/modalSlice";

interface SimpleFriendListDisplayProps {
  externalData: any;
}

export const SimpleFriendListDisplay = ({
  externalData,
}: SimpleFriendListDisplayProps) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const handleFriendRedirect = (friendId: string) => {
    navigate(`${PROFILE_ROUTE}/${friendId}`);
    dispatch(hideModal());
  };
  return (
    <div>
      {externalData.map((friend: any) => (
        <div key={friend.id}>
          <UserAvatars
            userId={friend.id}
            profilePicture={friend.profilePicture}
            fullName={friend.fullName}
            onClick={() => handleFriendRedirect(friend.id)}
          />
        </div>
      ))}
    </div>
  );
};
