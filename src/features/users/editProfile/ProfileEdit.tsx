import { useNavigate, useSearchParams } from "react-router-dom";
import { IconButton } from "@mui/material";

import { ClosingIcon } from "../../../components/closingIcon/ClosingIcon";
import { CustomSvgs } from "../../../components/customSvgs/CustomSvgs";
import { EDIT_PROFILE_ROUTE, PROFILE_ROUTE } from "../../../routes/route.constants";
import { useAppSelector } from "../../../services/hooks";
import { selectCurrentUserId, selectUser } from "../selectors";
import { UserEditSections } from "./UserEditSections";
import { EntityEditSections } from "./EntityEditSections";
import { EDIT_SECTIONS } from "../userProfiles/constants";

import styles from "./styles/profileEdit.module.css";

export const ProfileEdit = () => {
  const navigate = useNavigate();
  const userId = useAppSelector(selectCurrentUserId);
  const { user } = useAppSelector(selectUser);
  const [editParams] = useSearchParams();
  const section = editParams.get("section") ?? "";
  const isEntityProfile = user?.userType !== "individual";
  const shouldShowBackButton =
    isEntityProfile || section !== EDIT_SECTIONS.about;
  const isTallEditStep = !isEntityProfile && section === EDIT_SECTIONS.background;
  const shouldUseInlineOrganizationHeader = section === EDIT_SECTIONS.organizations;
  const editHeaderTitle =
    section === EDIT_SECTIONS.causes
      ? "Edit Causes"
      : section === EDIT_SECTIONS.availability
        ? "Edit Availability"
        : section === EDIT_SECTIONS.organizations
          ? "Edit Organizations"
          : "Edit About";

  const handleGoBack = () => {
    if (!isEntityProfile) {
      if (section === EDIT_SECTIONS.background) {
        navigate(`${EDIT_PROFILE_ROUTE}?section=${EDIT_SECTIONS.about}`);
        return;
      }

      if (section === EDIT_SECTIONS.military) {
        navigate(`${EDIT_PROFILE_ROUTE}?section=${EDIT_SECTIONS.background}`);
        return;
      }

      if (section === EDIT_SECTIONS.qualifications) {
        navigate(`${EDIT_PROFILE_ROUTE}?section=${EDIT_SECTIONS.military}`);
        return;
      }
    }

    navigate(-1);
  };

  const handleExitEdit = () => {
    navigate(`${PROFILE_ROUTE}/${userId}`);
  };

  return (
    <div className={styles.profileEdit}>
      <div
        className={`${styles.profileEditFrame} ${
          isTallEditStep ? styles.profileEditFrameTall : ""
        }`}
      >
        {!shouldUseInlineOrganizationHeader && (
          <div
            className={`${styles.profileEditHeader} ${
              !shouldShowBackButton ? styles.profileEditHeaderNoBack : ""
            }`}
          >
            <div className={styles.backIconContainer}>
              {shouldShowBackButton && (
                <IconButton onClick={handleGoBack}>
                  <CustomSvgs
                    svgPath="/svgs/common/goBackIcon.svg"
                    altText="Go back"
                  />
                </IconButton>
              )}
            </div>
            <div className={styles.headerTitleContainer}>
              <span className={styles.profileEditHeaderTitle}>
                {editHeaderTitle}
              </span>
            </div>
            <div className={styles.closeIconContainer}>
              <ClosingIcon useNoSx onClick={handleExitEdit} />
            </div>
          </div>
        )}
        {!isEntityProfile && (
          <UserEditSections section={section} userId={userId} />
        )}
        {isEntityProfile && (
          <EntityEditSections
            section={section}
            entityType={user?.userType}
            userId={userId}
          />
        )}
      </div>
    </div>
  );
};
