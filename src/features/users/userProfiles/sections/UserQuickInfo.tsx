import { AttachMoney } from "@mui/icons-material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Cause } from "../../../../services/types/cause.types";
import { formatPhoneNumber } from "../../../../utils/formUtils/formUtils";
import { useGetVolunteerValuePerHourQuery } from "../../../../services/api/endpoints/impact/impact.api";
import { HIERARCHY_ROUTE } from "../../../../routes/route.constants";

import styles from "../styles/userProfiles.module.css";

interface UserQuickInfoProps {
  canEdit: boolean;
  isMobile: boolean;
  volunteerHours?: number;
  tagLine?: string;
  city?: string;
  zipCode?: string;
  email?: string;
  fullName?: string;
  organizationName?: string;
  nonprofitName?: string;
  ein?: string;
  website?: string;
  nonprofitType?: string;
  contactNumber?: string;
  state?: string;
  userType?: string;
  parentEntityName?: string;
  associatedEntityName?: string;
  friendCount?: number;
  causesCount?: number;
  mutualCauses?: number;
  mutualFriends?: number;
  mutualCausePreviews?: Cause[];
  mutualFriendPreviews?: ProfileFriendState[];
  userId?: string;
  friends?: ProfileFriendState[];
  causes?: string[];
  isEntity?: boolean;
}

const getExternalWebsiteUrl = (website?: string) => {
  const trimmedWebsite = website?.trim();
  if (!trimmedWebsite) return undefined;

  return /^https?:\/\//i.test(trimmedWebsite)
    ? trimmedWebsite
    : `https://${trimmedWebsite}`;
};

const formatCurrency = (value: number) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// TODO: too big, split into smaller components
export const UserQuickInfo = ({
  canEdit,
  isMobile,
  volunteerHours,
  tagLine,
  city,
  zipCode,
  email,
  fullName,
  organizationName,
  nonprofitName,
  ein,
  website,
  nonprofitType,
  contactNumber,
  state,
  userType,
  parentEntityName,
  associatedEntityName,
  friendCount,
  causesCount,
  mutualCauses,
  mutualFriends,
  mutualCausePreviews,
  mutualFriendPreviews,
  userId,
  friends,
  causes,
  isEntity,
}: UserQuickInfoProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { data: volunteerValuePerHour = 33.59 } =
    useGetVolunteerValuePerHourQuery();
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const formattedContactNumber = formatPhoneNumber(contactNumber);
  const websiteUrl = getExternalWebsiteUrl(website);
  const handleEditProfile = () => {
    if (isEntity) {
      dispatch(setModalType(EDIT_SECTIONS.entityProfile));
    } else {
      dispatch(setModalType(EDIT_SECTIONS.profile));
    }

    dispatch(showModal());
  };
  const handleContactClick = () => {
    setIsContactDialogOpen(true);
  };
  const handleHierarchyClick = () => {
    if (!userId) return;

    navigate(`${HIERARCHY_ROUTE}/${userId}`);
  };

  const isFullStateName = state?.length && state?.length > 2;
  const stateDisplay = isFullStateName
    ? state
    : getUserStateFromZip(zipCode)?.state;
  const monetaryVolunteerValue = volunteerHours
    ? volunteerHours * volunteerValuePerHour
    : 0;
  const formattedVolunteerHours = Number.isInteger(volunteerHours ?? 0)
    ? `${volunteerHours ?? 0}`
    : (volunteerHours ?? 0).toFixed(1);
  const entityName = organizationName || nonprofitName;
  const isOrganizationProfile = userType === "organization";
  const locationDisplay = [city, stateDisplay].filter(Boolean).join(", ");
  const userClassOverride = isEntity
    ? styles.entityQuickInfoGroupsNonMobile
    : styles.userQuickInfoOverride;
  const organizationDetails = [associatedEntityName].filter(Boolean);

  const entityDetailsDisplay = entityName ? (
    <div className={styles.userQuickInfoGroupsEntity}>
      {!isOrganizationProfile && (
        <>
          <Typography
            variant="blueTextSmall"
            textToDisplay={`EIN ID: ${ein ? ein : "Unknown"}`}
          />
          <Typography
            variant="blueTextSmall"
            textToDisplay={
              nonprofitType ? `Type: ${nonprofitType}` : "Type: Unknown"
            }
          />
          <Typography
            variant="blueTextSmall"
            textToDisplay={
              formattedContactNumber
                ? `Phone #: ${formattedContactNumber}`
                : "Phone #: Unknown"
            }
          />
        </>
      )}
      {isOrganizationProfile &&
        (organizationDetails.length ? (
          organizationDetails.map((detail) => (
            <Typography
              key={detail}
              variant="blueTextSmall"
              textToDisplay={detail}
            />
          ))
        ) : (
          <Typography
            variant="blueTextSmall"
            textToDisplay="Organization details unavailable"
          />
        ))}
      <button
        type="button"
        className={styles.entityDetailsLinkButton}
        onClick={handleHierarchyClick}
      >
        Hierarchy
      </button>
    </div>
  ) : null;

  const userInfoDisplay = (
    <>
      <div className={styles.userQuickInfoSummary}>
        <div className={styles.userQuickInfoGroupsSections}>
          <div className={styles.userQuickInfoGroups}>
            <CustomSvgs
              svgPath="/svgs/common/timerIcon.svg"
              altText="Volunteer Icon"
              variant="tiny"
            />
            <Typography
              variant="informational"
              textToDisplay={`${formattedVolunteerHours} Hours`}
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
              textToDisplay={`$${formatCurrency(monetaryVolunteerValue)} Volunteer Value`}
            />
          </div>
        </div>
        {!isOrganizationProfile && (
          <div className={styles.userQuickInfoGroups}>
            <CustomSvgs
              svgPath="/svgs/common/locationIcon.svg"
              altText="Location Icon"
              variant="tiny"
            />
            <Typography
              variant="locationSmall"
              textToDisplay={locationDisplay}
            />
          </div>
        )}
          {isEntity && isOrganizationProfile && (
            <div className={styles.entityQuickActions}>
              <button
                type="button"
                className={styles.entityContactButton}
                onClick={handleContactClick}
              >
                Contact Us
              </button>
            </div>
          )}
        </div>
      {(!isEntity || isMobile) && entityDetailsDisplay}
    </>
  );

  return (
    <div
      className={`${styles.userHeader} ${
        !isMobile && isEntity ? styles.entityUserHeader : ""
      }`.trim()}
    >
      <div className={styles.userHeaderSection}>
        <div className={styles.userHeaderTitle}>
          <Typography
            variant="nameHeader"
            textToDisplay={fullName || entityName}
            extraClass="paddingLeft"
          />
          {canEdit && !isEntity && <EditProfileIcon onClick={handleEditProfile} />}
        </div>
        {isEntity && parentEntityName && (
          <Typography
            variant="tagline"
            textToDisplay={`${parentEntityName}`}
            extraClass={styles.parentOrganizationName}
          />
        )}
        <Typography
          variant="tagline"
          textToDisplay={tagLine}
          extraClass="paddingLeft"
        />
        {!isMobile && isEntity && userInfoDisplay}
      </div>
      {!isMobile && isEntity && entityDetailsDisplay}
      {!isMobile && isEntity && canEdit && (
        <EditProfileIcon
          className={styles.entityHeaderEditIcon}
          onClick={handleEditProfile}
        />
      )}
      {isMobile && userInfoDisplay}
      {!isMobile && !isEntity && (
        <div className={userClassOverride}>
          {userInfoDisplay}
          <div className={styles.userQuickFriendsCauses}>
            <UserProfileButtons
              canEdit={canEdit}
              userId={userId}
              friendCount={friendCount ?? 0}
              causesCount={causesCount ?? 0}
              mutualCauses={mutualCauses ?? 0}
              mutualFriends={mutualFriends ?? 0}
              mutualCausePreviews={mutualCausePreviews}
              mutualFriendPreviews={mutualFriendPreviews}
              friends={friends}
              causes={causes}
            />
          </div>
        </div>
      )}
      {isContactDialogOpen && (
        <div
          className={styles.entityContactDialogOverlay}
          onClick={() => setIsContactDialogOpen(false)}
        >
          <div
            className={styles.entityContactDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="entity-contact-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.entityContactDialogHeader}>
              <h2 id="entity-contact-dialog-title">Contact Us</h2>
              <button
                type="button"
                onClick={() => setIsContactDialogOpen(false)}
                aria-label="Close contact dialog"
              >
                x
              </button>
            </div>
            <dl className={styles.entityContactDialogDetails}>
              <div>
                <dt>Email</dt>
                <dd>
                  {email ? (
                    <a href={`mailto:${email}`}>
                      {email}
                    </a>
                  ) : (
                    "Unknown"
                  )}
                </dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>
                  {formattedContactNumber ? (
                    <a href={`tel:${formattedContactNumber}`}>
                      {formattedContactNumber}
                    </a>
                  ) : (
                    "Unknown"
                  )}
                </dd>
              </div>
              <div>
                <dt>Website</dt>
                <dd>
                  {websiteUrl ? (
                    <a
                      href={websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {website}
                    </a>
                  ) : (
                    "Unknown"
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
};
