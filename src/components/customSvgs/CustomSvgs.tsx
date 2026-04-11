import { assetUrl } from "../../utils/assetUrl";
import styles from "./styles/customSvgStyles.module.css";

interface CustomSvgsProps {
  svgPath: string;
  altText: string;
  variant?: "default" | "small" | "large" | "noBounds" | "tiny";
  extraClass?: string;
}

export const CustomSvgs = ({
  svgPath,
  altText,
  variant,
  extraClass,
}: CustomSvgsProps) => {
  const styleVariants = {
    default: styles.svgMode,
    small: styles.smallSvgMode,
    large: styles.largeSvgMode,
    noBounds: styles.noBounds,
    tiny: styles.tinySvgMode,
  };
  const styleToUse = `${styleVariants[variant ?? "default"]} ${
    extraClass ?? ""
  }`;

  return (
    <img src={assetUrl(svgPath)} alt={altText} className={styleToUse} />
  );
};
