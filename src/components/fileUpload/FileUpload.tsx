import { IconButton } from "@mui/material";
import { CustomSvgs } from "../customSvgs/CustomSvgs";
import { useRef } from "react";

interface FileUploadProps {
  handleFileUploads: (files: File[]) => void;
}

export const FileUpload = ({ handleFileUploads }: FileUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const files = evt.target.files;
    if (files && files.length > 0) {
      handleFileUploads(Array.from(files));
    }
  };

  return (
    <IconButton onClick={handleClick}>
      <input
        type="file"
        multiple
        accept=".jpg,.png"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      <CustomSvgs altText="Upload file" svgPath="/svgs/common/cameraIcon.svg" />
    </IconButton>
  );
};
