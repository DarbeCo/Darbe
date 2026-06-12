import { useNavigate } from "react-router-dom";
import { Typography } from "../../../../../components/typography/Typography";
import { EditProfileIcon } from "../EditProfileIcon";
import { EDIT_PROFILE_ROUTE } from "../../../../../routes/route.constants";
import { EDIT_SECTIONS } from "../../constants";
import { EntityDocument } from "../../../../../services/api/endpoints/types/user.api.types";

import styles from "./styles/entityDetails.module.css";

interface UserDocumentsProps {
  canEdit: boolean;
  documents?: EntityDocument[];
  nonprofitType?: string;
}

export const UserDocuments = ({ canEdit, documents, nonprofitType }: UserDocumentsProps) => {
  const financialDocuments = documents?.filter(
    (doc) => doc.documentCategory === "financial"
  );

  const navigate = useNavigate();
  const handleEdit = () => {
    navigate(`${EDIT_PROFILE_ROUTE}?section=${EDIT_SECTIONS.documents}`);
  };

  const handleOpenDocument = (url: string) => {
    // open in a new window with the url
    window.open(url, "_blank");
  };

  return (
    <div className={styles.entityDocuments}>
      <div className={styles.entityDetailsHeader}>
        <Typography
          variant="sectionTitle"
          textToDisplay={`Non Profit type: ${nonprofitType}`}
          extraClass="paddingLeft"
        />
        {canEdit && <EditProfileIcon onClick={handleEdit} />}
      </div>
      {nonprofitType && (
        <Typography
          variant="blueTextSmall"
          extraClass="paddingLeft"
        />
      )}
      {!financialDocuments?.length && (
        <Typography
          variant="blueTextSmall"
          textToDisplay="No Non Profit documents available"
          extraClass="paddingLeft"
        />
      )}
      {financialDocuments && financialDocuments.length > 0 && (
        <div className={styles.entityDocumentRowList}>
          {financialDocuments.map((doc) => (
            <div key={doc.id} className={styles.entityDocumentEntry}>
              <Typography
                variant="blueTextSmall"
                textToDisplay={doc.fileName}
                truncationLength={7}
                onClick={() => handleOpenDocument(doc.url)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
