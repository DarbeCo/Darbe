import { useState } from "react";
import { CircularProgress, IconButton } from "@mui/material";
import { Remove } from "@mui/icons-material";

import { DarbeButton } from "../../../../components/buttons/DarbeButton";
import { Typography } from "../../../../components/typography/Typography";
import {
  useDeleteDocumentMutation,
  useGetEntityDocumentsQuery,
  useUploadDocumentMutation,
} from "../../../../services/api/endpoints/profiles/profiles.api";
import { EntityDocumentUpload } from "../../../../services/api/endpoints/types/common.api.types";

import styles from "../styles/profileEdit.module.css";

export const EditEntityDocuments = () => {
  const [financialFile, setFinancialFile] =
    useState<EntityDocumentUpload | null>(null);
  const [nineNinetyFile, setNineNinetyFile] =
    useState<EntityDocumentUpload | null>(null);
  const [auditFile, setAuditFile] = useState<EntityDocumentUpload | null>(null);
  const { data: entityDocuments, isLoading } = useGetEntityDocumentsQuery();
  const financials = entityDocuments?.filter(
    (doc) => doc.documentCategory === "financial"
  );
  const nineNinetys = entityDocuments?.filter(
    (doc) => doc.documentCategory === "990"
  );
  const audits = entityDocuments?.filter(
    (doc) => doc.documentCategory === "audit"
  );
  const [uploadFile] = useUploadDocumentMutation();
  const [deleteFile] = useDeleteDocumentMutation();

  const handleSubmitFile = async (type: string) => {
    if (type === "financial" && financialFile) {
      await uploadFile(financialFile);
      setFinancialFile(null);
    } else if (type === "990" && nineNinetyFile) {
      await uploadFile(nineNinetyFile);
      setNineNinetyFile(null);
    } else if (type === "audit" && auditFile) {
      await uploadFile(auditFile);
      setAuditFile(null);
    }
  };

  const handleDeleteFile = (id: string) => {
    deleteFile(id);
  };

  // TODO: Uh, maybe use mui input? or a reusable component? Maybe combine with the photo upload, but may not work
  const handleUpload = (type: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"; // Accept common document and image formats

    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (type === "financial") {
        setFinancialFile({
          file,
          documentCategory: "financial",
        });
      } else if (type === "990") {
        setNineNinetyFile({
          file,
          documentCategory: "990",
        });
      } else if (type === "audit") {
        setAuditFile({
          file,
          documentCategory: "audit",
        });
      }
    };

    input.click();
  };

  return (
    <div className={styles.entityDocumentEdit}>
      <div className={styles.entityDocumentSection}>
        <Typography variant="sectionTitle" textToDisplay={"Financials"} />
        {isLoading && <CircularProgress />}
        <div className={styles.entityFileSection}>
          {financials?.map((doc) => (
            <div className={styles.documentRow} key={doc.id}>
              <a href={doc.url} className={styles.entityFileLink}>
                {doc.fileName}
              </a>
              <IconButton
                sx={{ backgroundColor: "white" }}
                onClick={() => handleDeleteFile(doc.id)}
              >
                <Remove sx={{ color: "#FF0000" }} />
              </IconButton>
            </div>
          ))}
        </div>
        <div className={styles.entityFileButtonSection}>
          <DarbeButton
            onClick={() => handleUpload("financial")}
            darbeButtonType="postButton"
            buttonText="Upload"
          />
          <Typography
            variant="blueTextNormal"
            textToDisplay={financialFile?.file.name}
          />
          <DarbeButton
            isDisabled={!financialFile}
            onClick={() => handleSubmitFile("financial")}
            darbeButtonType="nextButton"
            buttonText="Submit"
          />
        </div>
      </div>
      <div className={styles.entityDocumentSection}>
        <Typography variant="sectionTitle" textToDisplay={"990 Reports"} />
        <div className={styles.entityFileSection}>
          {nineNinetys?.map((doc) => (
            <div className={styles.rosterRow} key={doc.id}>
              <a href={doc.url} className={styles.entityFileLink}>
                {doc.fileName}
              </a>
              <IconButton
                sx={{ backgroundColor: "white" }}
                onClick={() => handleDeleteFile(doc.id)}
              >
                <Remove sx={{ color: "#FF0000" }} />
              </IconButton>
            </div>
          ))}
        </div>
        <div className={styles.entityFileButtonSection}>
          <DarbeButton
            onClick={() => handleUpload("990")}
            darbeButtonType="postButton"
            buttonText="Upload"
          />
          <Typography
            variant="blueTextNormal"
            textToDisplay={nineNinetyFile?.file.name}
          />
          <DarbeButton
            isDisabled={!nineNinetyFile}
            onClick={() => handleSubmitFile("990")}
            darbeButtonType="nextButton"
            buttonText="Submit"
          />
        </div>
      </div>
      <div className={styles.entityDocumentSection}>
        <Typography variant="sectionTitle" textToDisplay={"Audit Reports"} />
        <div className={styles.entityFileSection}>
          {audits?.map((doc) => (
            <div className={styles.rosterRow} key={doc.id}>
              <a href={doc.url} className={styles.entityFileLink}>
                {doc.fileName}
              </a>
              <IconButton
                sx={{ backgroundColor: "white" }}
                onClick={() => handleDeleteFile(doc.id)}
              >
                <Remove sx={{ color: "#FF0000" }} />
              </IconButton>
            </div>
          ))}
        </div>
        <div className={styles.entityFileButtonSection}>
          <DarbeButton
            onClick={() => handleUpload("audit")}
            darbeButtonType="postButton"
            buttonText="Upload"
          />
          <Typography
            variant="blueTextNormal"
            textToDisplay={auditFile?.file.name}
          />
          <DarbeButton
            isDisabled={!auditFile}
            onClick={() => handleSubmitFile("audit")}
            darbeButtonType="nextButton"
            buttonText="Submit"
          />
        </div>
      </div>
    </div>
  );
};
