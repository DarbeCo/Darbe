import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { IconButton } from "@mui/material";
import { useAppDispatch, useAppSelector } from "../../services/hooks";
import { createPortal } from "react-dom";
import { hideModal, MODAL_TYPE, setModalType } from "./modalSlice";
import {
  getExternalData,
  getModalStatus,
  getModalType,
  getModalUserId,
} from "./selectors";
import { ClosingIcon } from "../closingIcon/ClosingIcon";
import { CustomSvgs } from "../customSvgs/CustomSvgs";
import { CreatePost } from "../createPost/CreatePost";
import { EditProfileInfo } from "../../features/users/editProfile/editSections/EditProfileInfo";
import { EditAbout } from "../../features/users/editProfile/editSections/EditAbout";
import { EditAvailability } from "../../features/users/editProfile/editSections/EditAvailability";
import { EditBackground } from "../../features/users/editProfile/editSections/EditBackground";
import { EditCauses } from "../../features/users/editProfile/editSections/EditCauses";
import { EditFriends } from "../../features/users/editProfile/editSections/EditFriends";
import { EditMilitary } from "../../features/users/editProfile/editSections/EditMilitary";
import { EditOrganizations } from "../../features/users/editProfile/editSections/EditOrganizations";
import { EditQualifications } from "../../features/users/editProfile/editSections/EditQualifications";
import { EditActivity } from "../../features/users/editProfile/editSections/EditActivity";
import { MutualFriendDisplay } from "../friends/MutualFriendDisplay";
import { MutualCausesDisplay } from "../causes/MutualCausesDisplay";
import { SimpleFriendListDisplay } from "../friends/SimpleFriendListDisplay";
import { SimpleCauseDisplay } from "../causes/SimpleCauseDisplay";
import { SimpleRosterEdit } from "../roster/SimpleRosterEdit";
import { UserAvatars } from "../avatars/UserAvatars";
import { selectUser } from "../../features/users/selectors";

import styles from "./styles/modal.module.css";
import { SimpleCreateRoster } from "../roster/SimpleCreateNewRoster";
import { EditEntityProfileInfo } from "../../features/users/editProfile/editEntitySections/EditEntityProfileInfo";
import { EditEntityAbout } from "../../features/users/editProfile/editEntitySections/EditEntityAbout";
import { EditEntityValues } from "../../features/users/editProfile/editEntitySections/EditEntityValues";
import { EditEntityPrograms } from "../../features/users/editProfile/editEntitySections/EditEntityPrograms";

/**
 * Mainly used for the create a post pop up modal
 * If this needs to be incorporated in other views or with other items, we need to generalize this
 * TODO: This is getting too big with the switch statement and should be more of a wrapper around the content in the future
 * TODO: Merge this and generic modal
 */
export const Modal = () => {
  const currentUser = useAppSelector(selectUser).user;
  const isOpen = useSelector(getModalStatus);
  const modalType = useSelector(getModalType);
  const dispatch = useAppDispatch();
  const [modalContainer] = useState(() => document.createElement("div"));
  const modalUserId = useAppSelector(getModalUserId);
  const externalData = useAppSelector(getExternalData);

  useEffect(() => {
    document.body.appendChild(modalContainer);
    return () => {
      document.body.removeChild(modalContainer);
    };
  }, [modalContainer]);

  // Use a side effect to disable scrolling on the main page.
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    // On unmount or modal close, revert overflow to default
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  const closeModal = () => {
    dispatch(hideModal());
  };

  const handleSubmit = () => {
    closeModal();
  };

  const isProfileModal =
    modalType === MODAL_TYPE.profile ||
    modalType === MODAL_TYPE.about ||
    modalType === MODAL_TYPE.background ||
    modalType === MODAL_TYPE.military ||
    modalType === MODAL_TYPE.qualifications ||
    modalType === MODAL_TYPE.friends ||
    modalType === MODAL_TYPE.organizations ||
    modalType === MODAL_TYPE.activity ||
    modalType === MODAL_TYPE.causes ||
    modalType === MODAL_TYPE.availability;
  const profileBackTargets: Partial<Record<string, string>> = {
    [MODAL_TYPE.background]: MODAL_TYPE.about,
    [MODAL_TYPE.military]: MODAL_TYPE.background,
    [MODAL_TYPE.qualifications]: MODAL_TYPE.military,
  };
  const profileBackTarget = profileBackTargets[modalType];

  const handleProfileBack = () => {
    if (profileBackTarget) {
      dispatch(setModalType(profileBackTarget));
    }
  };

  // TODO: This is getting messy, use children instead of switch statement
  const modalContent = (
    <div className={styles.modalContainer}>
      <div
        className={`${styles.modalContent} ${
          isProfileModal ? styles.profileModalContent : ""
        }`.trim()}
      >
        <div
          className={`${styles.modalContentHeader} ${
            isProfileModal ? styles.profileModalHeader : ""
          }`.trim()}
        >
          <div className={isProfileModal ? styles.profileModalHeaderInner : ""}>
            {isProfileModal && (
              <div className={styles.profileModalHeaderSpacer}>
                {profileBackTarget && (
                  <IconButton onClick={handleProfileBack}>
                    <CustomSvgs
                      svgPath="/svgs/common/goBackIcon.svg"
                      altText="Go back"
                    />
                  </IconButton>
                )}
              </div>
            )}
            <div
              className={`${styles.modalHeaderText} ${
                isProfileModal ? styles.profileModalHeaderText : ""
              }`.trim()}
            >
              {(() => {
                switch (modalType) {
                  case MODAL_TYPE.profile:
                    return "Edit Profile";
                  case MODAL_TYPE.createPost:
                    return "Create Post";
                  case MODAL_TYPE.about:
                    return "Edit About";
                  case MODAL_TYPE.availability:
                    return "Edit Availability";
                  case MODAL_TYPE.background:
                    return "Edit About";
                  case MODAL_TYPE.causes:
                    return "Edit Causes";
                  case MODAL_TYPE.friends:
                    return "Edit Friends";
                  case MODAL_TYPE.military:
                    return "Edit Military";
                  case MODAL_TYPE.organizations:
                    return "Edit Organizations";
                  case MODAL_TYPE.qualifications:
                    return "Edit About";
                  case MODAL_TYPE.activity:
                    return "Edit Activity";
                  case MODAL_TYPE.mutualFriends:
                    return "Mutual Friends";
                  case MODAL_TYPE.mutualCauses:
                    return "Mutual Causes";
                  case MODAL_TYPE.profileCauses:
                    return "User Causes";
                  case MODAL_TYPE.profileFriends:
                    return "User Friends";
                  case MODAL_TYPE.editRoster:
                    return "Edit Roster";
                  case MODAL_TYPE.createRoster:
                    return "Create Roster";
                  case MODAL_TYPE.entityProfile:
                    return "Edit Profile";
                  case MODAL_TYPE.entityAbout:
                    return "Edit About";
                  case MODAL_TYPE.values:
                    return "Edit Values";
                  case MODAL_TYPE.programs:
                    return "Edit Programs";
                  default:
                    return null;
                }
              })()}
            </div>
            <div
              className={
                isProfileModal ? styles.profileModalCloseButton : undefined
              }
            >
              <ClosingIcon onClick={closeModal} useNoSx />
            </div>
          </div>
          {isProfileModal && <div className={styles.profileModalDivider} />}
        </div>
        {(() => {
          switch (modalType) {
            case MODAL_TYPE.profile:
              return <EditProfileInfo />;
            case MODAL_TYPE.entityProfile:
              return <EditEntityProfileInfo />;
            case MODAL_TYPE.entityAbout:
              return <EditEntityAbout />;
            case MODAL_TYPE.values:
              return <EditEntityValues />;
            case MODAL_TYPE.programs:
              return <EditEntityPrograms />;
            case MODAL_TYPE.createPost:
              return (
                // TODO: This should be its own component
                <div className={styles.createPostModalContent}>
                  <UserAvatars
                    fullName={currentUser?.fullName}
                    profilePicture={currentUser?.profilePicture}
                    organizationName={currentUser?.organizationName}
                  />
                  <CreatePost handleSubmit={handleSubmit} />
                </div>
              );
            case MODAL_TYPE.about:
              return <EditAbout />;
            case MODAL_TYPE.availability:
              return <EditAvailability />;
            case MODAL_TYPE.background:
              return <EditBackground />;
            case MODAL_TYPE.causes:
              return <EditCauses />;
            case MODAL_TYPE.friends:
              return <EditFriends />;
            case MODAL_TYPE.military:
              return <EditMilitary />;
            case MODAL_TYPE.organizations:
              return <EditOrganizations />;
            case MODAL_TYPE.qualifications:
              return <EditQualifications />;
            case MODAL_TYPE.activity:
              return <EditActivity />;
            case MODAL_TYPE.mutualFriends:
              return <MutualFriendDisplay userId={modalUserId} />;
            case MODAL_TYPE.mutualCauses:
              return <MutualCausesDisplay userId={modalUserId} />;
            case MODAL_TYPE.profileCauses:
              return (
                <SimpleCauseDisplay
                  externalData={externalData}
                  userId={modalUserId}
                  canEdit={modalUserId === currentUser?.id}
                />
              );
            case MODAL_TYPE.profileFriends:
              return <SimpleFriendListDisplay externalData={externalData} />;
            case MODAL_TYPE.editRoster:
              return <SimpleRosterEdit externalData={externalData} />;
            case MODAL_TYPE.createRoster:
              return <SimpleCreateRoster />;
            default:
              return null;
          }
        })()}
      </div>
    </div>
  );

  return <>{isOpen && createPortal(modalContent, modalContainer)}</>;
};
