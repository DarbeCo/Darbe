import { AddCircleTwoTone, CancelTwoTone } from "@mui/icons-material"
import { UserAvatars } from "../../components/avatars/UserAvatars"
import { FriendRequestState } from "./types"
import styles from "./styles/friendRequests.module.css";
import { useCallback, useState } from "react";
import { useDeleteFriendRequestMutation, useAcceptFriendRequestMutation } from "../../services/api/endpoints/friends/friends.api";
import { ConfirmDialog } from "../../components/confirmDialog/ConfirmDialog";



const FriendsCard = ({ friendRequest}: { friendRequest: FriendRequestState }) => {
    const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

    const [deleteFriendRequest] =
        useDeleteFriendRequestMutation();
    
    const [acceptFriendRequest] = useAcceptFriendRequestMutation()
    const requesterName = friendRequest.requesterId.fullName || "this friend request";

    const handleDenyFriendRequest = useCallback(async () => {
        try {
            await deleteFriendRequest(friendRequest.requesterId.id)
            setShowRemoveConfirm(false);
        } catch (err) {
            console.log(err, 'Error deleting incoming friend request')
        }
    }, [deleteFriendRequest, friendRequest.requesterId.id])

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
                 onClick={() => setShowRemoveConfirm(true)}/>
            </div>
            {showRemoveConfirm && (
                <ConfirmDialog
                    title={`Remove request from ${requesterName}?`}
                    message="This will deny the friend request."
                    confirmLabel="Remove"
                    onConfirm={handleDenyFriendRequest}
                    onCancel={() => setShowRemoveConfirm(false)}
                />
            )}
        </div>
    )
}

export default FriendsCard
