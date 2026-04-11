import { CardContent, CardHeader } from "@mui/material"
import { useGetFriendsQuery } from "../../services/api/endpoints/friends/friends.api"
import { useMemo } from "react"
import { skipToken } from "@reduxjs/toolkit/query";
import styles from './styles/currentFriends.module.css'
import { UserState } from "../users/userSlice";
import CurrentFriendsCard from "./CurrentFriendsCard";


const CurrentFriends = ({ user }: { user: UserState | null}) => {

    const {
        data: friends = []
    } = useGetFriendsQuery(user ? user.id : skipToken)

    const friendsLength = useMemo(() => friends.length, [friends])

    return (
        <div>
            <CardHeader title={`${friendsLength} Friends`} className={styles.friendCardHeader}/>
            <CardContent  className={styles.currentFriendCardContent}>
                {friends.map((el, idx) => (
                    <CurrentFriendsCard key={`${el.id}_${idx}_${el.zip}`}  friend={el}/>
                ))}
            </CardContent>
        </div>
    )
}

export default CurrentFriends