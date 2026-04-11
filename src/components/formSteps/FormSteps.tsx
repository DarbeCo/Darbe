import { assetUrl } from "../../utils/assetUrl";

interface FormStepsProps {
  step: string;
  formName: string;
  entityType: string;
}

export const FormSteps = ({ step, formName, entityType }: FormStepsProps) => {
  const constructedPath = assetUrl(
    `/svgs/forms/${entityType}/${formName}/${step}.svg`
  );
  return (
    <img
      src={constructedPath}
      alt={`${entityType} ${formName} form step ${step}`}
    />
  );
};
