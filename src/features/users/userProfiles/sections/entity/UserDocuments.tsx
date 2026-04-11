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
}

export const UserDocuments = ({ canEdit, documents }: UserDocumentsProps) => {
  const financialDocuments = documents?.filter(
    (doc) => doc.documentCategory === "financial"
  );
  const reports990 = documents?.filter((doc) => doc.documentCategory === "990");
  const auditReports = documents?.filter(
    (doc) => doc.documentCategory === "audit"
  );

  const navigate = useNavigate();
  const handleEdit = () => {
    navigate(`${EDIT_PROFILE_ROUTE}?section=${EDIT_SECTIONS.documents}`);
  };

  const handleOpenDocument = (url: string) => {
    // open in a new window with the url
    window.open(url, "_blank");
  };

  const hasNoDocuments =
    !financialDocuments?.length && !reports990?.length && !auditReports?.length;

  const financialsRender = (
    <>
      {financialDocuments && financialDocuments.length > 0 && (
        <div className={styles.entityDocumentsRow}>
          <Typography variant="sectionTitle" textToDisplay="Financials" />
          <div className={styles.entityDocumentRowList}>
            {financialDocuments?.map((doc) => (
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
        </div>
      )}
    </>
  );
  const reports990Render = (
    <>
      {reports990 && reports990.length > 0 && (
        <div className={styles.entityDocumentsRow}>
          <Typography variant="sectionTitle" textToDisplay="Reports 990" />
          <div className={styles.entityDocumentRowList}>
            {reports990?.map((doc) => (
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
        </div>
      )}
    </>
  );
  const auditsRender = (
    <>
      {auditReports && auditReports.length > 0 && (
        <div className={styles.entityDocumentsRow}>
          <Typography variant="sectionTitle" textToDisplay="Audit Reports" />
          <div className={styles.entityDocumentRowList}>
            {auditReports?.map((doc) => (
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
        </div>
      )}
    </>
  );

  return (
    <div className={styles.entityDocuments}>
      <div className={styles.entityDetailsHeader}>
        <Typography
          variant="sectionTitle"
          textToDisplay="Documents"
          extraClass="paddingLeft"
        />
        {canEdit && <EditProfileIcon onClick={handleEdit} />}
      </div>
      {hasNoDocuments && (
        <Typography
          variant="blueTextSmall"
          textToDisplay="No documents available"
        />
      )}
      {financialsRender}
      {reports990Render}
      {auditsRender}
    </div>
  );
};
