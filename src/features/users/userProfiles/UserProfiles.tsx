import { useParams } from "react-router-dom";
import { useEffect, useMemo } from "react";

import { selectUser } from "../selectors";
import { useGetUserImpactQuery } from "../../../services/api/endpoints/impact/impact.api";
import { parseEventDateAsLocalDate } from "../../../utils/eventDateUtils";
import { CoverPhoto } from "./sections/CoverPhoto";
import { UserProfilePicture } from "./sections/UserProfilePicture";
import { UserQuickInfo } from "./sections/UserQuickInfo";
import { UserProfileButtons } from "./sections/UserProfileButtons";
import { UserProfileInformation } from "./sections/UserProfileInformation";
import { UserVolunteerImpacts } from "./sections/UserVolunteerImpacts";
import { UserRecentActivity } from "./sections/UserRecentActivity";
import { UserOrganizations } from "./sections/UserOrganizations";
import { FriendSuggestions } from "../../../components/friendSuggestions/FriendSuggestions";
import { UserProfileConnectionButtons } from "./sections/UserProfileConnectionButtons";
import useScreenWidthHook from "../../../utils/commonHooks/UseScreenWidth";
import {
  useGetFriendRequestsQuery,
  useGetMutualFriendsQuery,
  useGetSentFriendRequestsQuery,
  useLazyGetFriendsQuery,
  useLazyGetUserFollowersQuery,
} from "../../../services/api/endpoints/friends/friends.api";
import { setReceivedFriendRequests, setUserProfile } from "../userSlice";
import { useAppDispatch, useAppSelector } from "../../../services/hooks";
import { useLazyGetUserProfileQuery } from "../../../services/api/endpoints/profiles/profiles.api";
import { UserDonors } from "./sections/entity/UserDonors";
import { UserEntityStaff } from "./sections/entity/UserEntityStaff";
import { UserEntityProfileInformation } from "./sections/entity/UserEntityProfileInformation";
import { UserEventPhotos } from "./sections/entity/UserEventPhotos";
import { UserDocuments } from "./sections/entity/UserDocuments";

import styles from "./styles/userProfiles.module.css";

// TODO: This component sucks, split it
export const UserProfiles = () => {
  const dispatch = useAppDispatch();
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAppSelector(selectUser);
  const canEdit = user?.id === userId;

  // This loads the user profile information that we are looking at. Could be our own
  const [triggerUserProfile, { data: userInformation }] =
    useLazyGetUserProfileQuery();
  // This loads the current friends the user profile has. Could be our own
  const [triggerFriends, { data: currentFriends }] = useLazyGetFriendsQuery();
  // This loads the current following data of the user profile. Could be our own
  const [triggerFollowingData, { data: followingData }] =
    useLazyGetUserFollowersQuery();

  useEffect(() => {
    if (!userId) return;

    triggerUserProfile(userId);
    triggerFriends(userId);
    triggerFollowingData(userId);
  }, [userId, triggerUserProfile, triggerFriends]);

  const { data: userImpacts } = useGetUserImpactQuery(userId ?? "", {
    skip: !userId,
    refetchOnMountOrArgChange: true,
  });
  const totalVolunteerHours = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return (userImpacts ?? []).reduce((sum, impact) => {
      const eventYear = parseEventDateAsLocalDate(
        impact.event.eventDate
      ).getFullYear();
      return eventYear === currentYear
        ? sum + (impact.hoursVolunteered ?? 0)
        : sum;
    }, 0);
  }, [userImpacts]);

  // This gets the currently logged in user sent friend requests
  const { data: sentFriendRequests } = useGetSentFriendRequestsQuery();
  // This gets the currently logged in user received friend requests
  const { data: receivedFriendRequests } = useGetFriendRequestsQuery();
  const { data: mutualFriendsData } = useGetMutualFriendsQuery(userId ?? "", {
    skip: !userId || canEdit,
  });

  // save logged in user profile info for faster access/edit purposes
  useEffect(() => {
    if (!canEdit) return;

    if (receivedFriendRequests) {
      dispatch(setReceivedFriendRequests(receivedFriendRequests));
    }
    // If we can edit, we are looking at our own profile, so save it to redux
    // NB: This is probably going to be a bug?
    if (userInformation) {
      dispatch(setUserProfile(userInformation));
    }
  }, [canEdit, receivedFriendRequests, userInformation, dispatch]);

  const hasSentRequest = sentFriendRequests?.filter(
    (friendRequest) => friendRequest.receiverId.id === userId
  );
  const hasReceivedFriendRequestFromUser = receivedFriendRequests?.some(
    (friendRequest) => friendRequest.requesterId.id === userId
  );
  const isEntityProfile = userInformation?.user?.userType !== "individual";
  const isNonprofitProfile = userInformation?.user?.userType === "nonprofit";
  const currentFriendCount = currentFriends?.length || 0;
  const isFriend = currentFriends?.some((friend) => friend.id === user?.id);
  const isFollowing = followingData?.some(
    (follower) => follower.id === user?.id
  );
  const currentCausesCount = userInformation?.user?.causes?.length || 0;

  const mutualCauses = canEdit
    ? 0
    : userInformation?.user?.causes?.filter((cause) =>
        user?.causes?.includes(cause)
      )?.length;

  const mutualFriends = canEdit ? 0 : mutualFriendsData?.length ?? 0;

  const { isMobile, isDesktop } = useScreenWidthHook();

  const entityInformation = isEntityProfile
    ? {
        values: userInformation?.values,
        motto: userInformation?.motto,
        mission: userInformation?.mission,
        aboutUs: userInformation?.aboutUs,
        programs: userInformation?.programs,
      }
    : undefined;

  return (
    <div className={styles.userProfiles}>
      <div className={styles.userProfileHeader}>
        <div className={styles.photoContainer}>
          <CoverPhoto
            coverPhoto={userInformation?.user?.coverPhoto}
            canEdit={canEdit}
            userId={user?.id}
          />
          <UserProfilePicture
            profilePicture={userInformation?.user?.profilePicture}
            canEdit={canEdit}
            userId={user?.id}
          />
        </div>
        <UserQuickInfo
          canEdit={canEdit}
          volunteerHours={totalVolunteerHours}
          city={userInformation?.user?.city}
          zipCode={userInformation?.user?.zip}
          fullName={userInformation?.user?.fullName}
          organizationName={userInformation?.user?.organizationName}
          nonprofitName={userInformation?.user?.nonprofitName}
          ein={userInformation?.user?.ein}
          website={userInformation?.website}
          state={userInformation?.state}
          tagLine={userInformation?.tagLine}
          nonprofitType={userInformation?.nonprofitType}
          contactNumber={userInformation?.phoneNumber}
          address={userInformation?.address}
          isMobile={isMobile}
          userType={userInformation?.user?.userType}
          parentEntityName={userInformation?.parentEntity?.fullName}
          associatedEntityName={userInformation?.associatedEntity?.fullName}
          friendCount={currentFriendCount}
          causesCount={currentCausesCount}
          mutualCauses={mutualCauses}
          mutualFriends={mutualFriends}
          userId={userId}
          friends={currentFriends}
          causes={userInformation?.user?.causes}
          isEntity={isEntityProfile}
        />
        {!canEdit && userId && (
          <UserProfileConnectionButtons
            isFriend={isFriend}
            isEntityProfile={isEntityProfile}
            isFollowing={isFollowing}
            hasSentRequest={!!hasSentRequest?.length}
            userId={userId}
            hasReceivedRequestFromUser={hasReceivedFriendRequestFromUser}
          />
        )}
        {!isEntityProfile && isMobile && (
          <UserProfileButtons
            friendCount={currentFriendCount}
            friends={userInformation?.friends}
            causesCount={currentCausesCount}
            causes={userInformation?.user?.causes}
            canEdit={canEdit}
            mutualCauses={mutualCauses}
            mutualFriends={mutualFriends}
            userId={userId}
          />
        )}
      </div>
      {!isEntityProfile && userId && (
        <UserEventPhotos userId={userId} scope="individual" />
      )}
      {!isEntityProfile && (
        <UserProfileInformation
          userInformation={userInformation}
          canEdit={canEdit}
        />
      )}
      {isEntityProfile && userId && (
        <UserEventPhotos userId={userId} scope="entity" />
      )}
      {isEntityProfile && (
        <UserEntityProfileInformation
          entityInformation={entityInformation}
          canEdit={canEdit}
        />
      )}
      {!isEntityProfile && (
        <UserOrganizations
          organizations={userInformation?.organizations}
          canEdit={canEdit}
        />
      )}
      <UserVolunteerImpacts
        userId={userId}
        title={isEntityProfile ? "Our Impacts" : undefined}
      />
      {userId && <UserRecentActivity canEdit={canEdit} userId={userId} />}
      {isNonprofitProfile && (
        <UserDocuments
          canEdit={canEdit}
          documents={userInformation?.entityDetails?.documents}
        />
      )}
      {isEntityProfile && (
        <>
          <UserDonors
            canEdit={canEdit}
            donors={userInformation?.entityDetails?.donorList}
          />
          <UserEntityStaff
            canEdit={canEdit}
            staff={userInformation?.entityDetails?.staffList}
          />
        </>
      )}
      {!isDesktop && !isEntityProfile && <FriendSuggestions />}
    </div>
  );
};
