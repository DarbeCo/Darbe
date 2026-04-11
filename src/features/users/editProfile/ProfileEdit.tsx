import { useNavigate, useSearchParams } from "react-router-dom";
import { IconButton } from "@mui/material";

import { ClosingIcon } from "../../../components/closingIcon/ClosingIcon";
import { Typography } from "../../../components/typography/Typography";
import { CustomSvgs } from "../../../components/customSvgs/CustomSvgs";
import { HOME_ROUTE } from "../../../routes/route.constants";
import { useAppSelector } from "../../../services/hooks";
import { selectCurrentUserId, selectUser } from "../selectors";
import { UserEditSections } from "./UserEditSections";
import { EntityEditSections } from "./EntityEditSections";

import styles from "./styles/profileEdit.module.css";

export const ProfileEdit = () => {
  const navigate = useNavigate();
  const userId = useAppSelector(selectCurrentUserId);
  const { user } = useAppSelector(selectUser);
  const [editParams] = useSearchParams();
  const section = editParams.get("section") ?? "";
  const isEntityProfile = user?.userType !== "individual";

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleExitEdit = () => {
    navigate(`${HOME_ROUTE}`);
  };

  return (
    <div className={styles.profileEdit}>
      {/* Replace this div with SimpleHeader */}
      <div className={styles.profileEditHeader}>
        <IconButton onClick={handleGoBack}>
          <CustomSvgs svgPath="/svgs/common/goBackIcon.svg" altText="Go back" />
        </IconButton>
        <Typography
          variant="sectionTitle"
          textToDisplay={`Edit Profile Info`}
        />
        <ClosingIcon useNoSx onClick={handleExitEdit} />
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
  );
};
