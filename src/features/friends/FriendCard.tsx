import { AddCircleTwoTone, CancelTwoTone } from "@mui/icons-material"
import { UserAvatars } from "../../components/avatars/UserAvatars"
import { FriendRequestState } from "./types"
import styles from "./styles/friendRequests.module.css";
import { useCallback } from "react";
import { useDeleteFriendRequestMutation, useAcceptFriendRequestMutation } from "../../services/api/endpoints/friends/friends.api";



const FriendsCard = ({ friendRequest}: { friendRequest: FriendRequestState }) => {

    const [deleteFriendRequest] =
        useDeleteFriendRequestMutation();
    
    const [acceptFriendRequest] = useAcceptFriendRequestMutation()

    const handleDenyFriendRequest = useCallback(async () => {
        try {
            await deleteFriendRequest(friendRequest.requesterId.id)
        } catch (err) {
            console.log(err, 'Error deleting incoming friend request')
        }
    }, [deleteFriendRequest])

    const handleAcceptFriendRequest = useCallback(async () => {
        try {
            await acceptFriendRequest(friendRequest.requesterId.id)
        } catch (err) {
            console.log(err, 'Error accepting friend request')
        }
    }, [])

    return (
        <div className={styles.friendCardContentDiv}>
            <div >
                <div style={{ maxWidth: '350px'}}>
                    <UserAvatars
                        key={friendRequest.receiverId}
                        profilePicture={friendRequest.requesterId.profilePicture}
                        fullName={friendRequest.requesterId.fullName}
                        onClick={() => console.log(friendRequest)}
                        city={friendRequest.requesterId.city}
                        zip={friendRequest.requesterId.zip}
                    />
                </div>
            </div>
            <div className={styles.friendRequestsButton}>
               <AddCircleTwoTone
                    className={styles.acceptFriendRequestIcon}
                    onClick={handleAcceptFriendRequest}
                />
                <CancelTwoTone
                className={styles.denyFriendRequestIcon}
                 onClick={handleDenyFriendRequest}/>
            </div>
        </div>
    )
}

export default FriendsCard
