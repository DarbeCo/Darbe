import { AttachMoney } from "@mui/icons-material";
import { useAppDispatch } from "../../../../services/hooks";

import { EditProfileIcon } from "./EditProfileIcon";
import { UserProfileButtons } from "./UserProfileButtons";
import { getUserStateFromZip } from "../../../../utils/CommonFunctions";
import { Typography } from "../../../../components/typography/Typography";
import { CustomSvgs } from "../../../../components/customSvgs/CustomSvgs";
import { EDIT_SECTIONS } from "../constants";
import {
  showModal,
  setModalType,
} from "../../../../components/modal/modalSlice";
import { ProfileFriendState } from "../../../friends/types";

import styles from "../styles/userProfiles.module.css";

interface UserQuickInfoProps {
  canEdit: boolean;
  isMobile: boolean;
  volunteerHours?: number;
  tagLine?: string;
  city?: string;
  zipCode?: string;
  fullName?: string;
  organizationName?: string;
  nonprofitName?: string;
  ein?: string;
  website?: string;
  nonprofitType?: string;
  contactNumber?: string;
  state?: string;
  friendCount?: number;
  causesCount?: number;
  mutualCauses?: number;
  mutualFriends?: number;
  userId?: string;
  friends?: ProfileFriendState[];
  causes?: string[];
  isEntity?: boolean;
}

// TODO: too big, split into smaller components
export const UserQuickInfo = ({
  canEdit,
  isMobile,
  volunteerHours,
  tagLine,
  city,
  zipCode,
  fullName,
  organizationName,
  nonprofitName,
  ein,
  website,
  nonprofitType,
  contactNumber,
  state,
  friendCount,
  causesCount,
  mutualCauses,
  mutualFriends,
  userId,
  friends,
  causes,
  isEntity,
}: UserQuickInfoProps) => {
  const dispatch = useAppDispatch();
  const handleEditProfile = () => {
    if (isEntity) {
      dispatch(setModalType(EDIT_SECTIONS.entityProfile));
    } else {
      dispatch(setModalType(EDIT_SECTIONS.profile));
    }

    dispatch(showModal());
  };

  const isFullStateName = state?.length && state?.length > 2;
  const stateDisplay = isFullStateName
    ? state
    : getUserStateFromZip(zipCode)?.state;
  const monetaryVolunteerValue = volunteerHours
    ? Math.floor(volunteerHours * 33.49)
    : 0;
  const userClassOverride = isEntity
    ? styles.entityQuickInfoGroupsNonMobile
    : styles.userQuickInfoOverride;

  const userInfoDisplay = (
    <>
      <div>
        <div className={styles.userQuickInfoGroupsSections}>
          <div className={styles.userQuickInfoGroups}>
            <CustomSvgs
              svgPath="/svgs/common/timerIcon.svg"
              altText="Volunteer Icon"
              variant="tiny"
            />
            <Typography
              variant="informational"
              textToDisplay={`${volunteerHours} Hours`}
            />
          </div>
          <div className={styles.userQuickInfoGroups}>
            <AttachMoney
              sx={{
                height: "16px",
                width: "16px",
              }}
            />
            <Typography
              variant="informational"
              textToDisplay={`$${monetaryVolunteerValue} Volunteer Value`}
            />
          </div>
        </div>
        <div className={styles.userQuickInfoGroups}>
          <CustomSvgs
            svgPath="/svgs/common/locationIcon.svg"
            altText="Location Icon"
            variant="tiny"
          />
          <Typography
            variant="locationSmall"
            textToDisplay={`${city}, ${stateDisplay}`}
          />
        </div>
      </div>
      {(organizationName || nonprofitName) && (
        <div className={styles.userQuickInfoGroupsEntity}>
          <Typography
            variant="blueTextSmall"
            textToDisplay={`EIN ID: ${ein ? ein : "Unknown"}`}
            extraClass="paddingTop"
          />
          <Typography
            variant="blueTextSmall"
            textToDisplay={
              nonprofitType ? `Type: ${nonprofitType}` : "Type: Unknown"
            }
            extraClass="paddingTop"
          />
          <Typography
            variant="blueTextSmall"
            textToDisplay={
              contactNumber ? `Phone #: ${contactNumber}` : "Phone #: Unknown"
            }
            extraClass="paddingTop"
          />
          <a
            href={website ? website : "#"}
            target="_blank"
            className="paddingTop"
            rel="noopener noreferrer"
          >
            <Typography
              variant="blueTextSmall"
              textToDisplay={
                website ? `Website: ${website}` : "Website: Unknown"
              }
            />
          </a>
        </div>
      )}
    </>
  );

  return (
    <div className={styles.userHeader}>
      <div className={styles.userHeaderSection}>
        <div className={styles.userHeaderTitle}>
          <Typography
            variant="nameHeader"
            textToDisplay={fullName || organizationName || nonprofitName}
            extraClass="paddingLeft"
          />
          {canEdit && <EditProfileIcon onClick={handleEditProfile} />}
        </div>
        <Typography
          variant="tagline"
          textToDisplay={tagLine}
          extraClass="paddingLeft"
        />
      </div>
      {isMobile && userInfoDisplay}
      {!isMobile && (
        <div className={userClassOverride}>
          {userInfoDisplay}
          {!isEntity && (
            <div className={styles.userQuickFriendsCauses}>
              <UserProfileButtons
                canEdit={canEdit}
                userId={userId}
                friendCount={friendCount ?? 0}
                causesCount={causesCount ?? 0}
                mutualCauses={mutualCauses ?? 0}
                mutualFriends={mutualFriends ?? 0}
                friends={friends}
                causes={causes}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
