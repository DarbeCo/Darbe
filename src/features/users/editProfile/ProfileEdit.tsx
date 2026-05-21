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
import { runProfileEditAutosave } from "./profileEditAutosave";

import styles from "./styles/profileEdit.module.css";

const EDIT_SECTION_TITLES: Record<string, string> = {
  [EDIT_SECTIONS.causes]: "Edit Causes",
  [EDIT_SECTIONS.availability]: "Edit Availability",
  [EDIT_SECTIONS.organizations]: "Edit Organizations",
  [EDIT_SECTIONS.profile]: "Edit Profile",
  [EDIT_SECTIONS.entityProfile]: "Edit Profile",
  [EDIT_SECTIONS.donors]: "Edit Supporters",
  [EDIT_SECTIONS.staff]: "Edit Staff",
  [EDIT_SECTIONS.values]: "Edit Values",
  [EDIT_SECTIONS.programs]: "Edit Programs",
  [EDIT_SECTIONS.documents]: "Edit Documents",
  [EDIT_SECTIONS.activity]: "Edit Activity",
};

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
  const editHeaderTitle = EDIT_SECTION_TITLES[section] ?? "Edit About";

  const handleGoBack = async () => {
    const didAutosave = await runProfileEditAutosave();

    if (!didAutosave) {
      return;
    }

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

  const handleExitEdit = async () => {
    const didAutosave = await runProfileEditAutosave();

    if (!didAutosave) {
      return;
    }

    navigate(`${PROFILE_ROUTE}/${userId}`);
  };

  return (
    <div className={styles.profileEdit}>
      <div
        className={`${styles.profileEditFrame} ${
          isTallEditStep ? styles.profileEditFrameTall : ""
        }`}
      >
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
