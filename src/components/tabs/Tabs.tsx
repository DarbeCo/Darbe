import { splitStringndCapitalize } from "../../utils/CommonFunctions";
import { Typography } from "../typography/Typography";

import styles from "./styles/tabs.module.css";

interface TabsProps {
  tabs: string[];
  onChange: (tab: string) => void;
  activeTab?: string;
}

// TODO: Should we just wrap mui tabs?
export const Tabs = ({ tabs, onChange, activeTab }: TabsProps) => {
  return (
    <div className={styles.tabs}>
      {tabs.map((tab) => {
        const activeTabClass = activeTab === tab ? styles.activeTab : "";

        return (
          <Typography
            key={tab}
            variant="tabs"
            extraClass={activeTabClass}
            textToDisplay={splitStringndCapitalize(tab, true)}
            onClick={() => onChange(tab)}
          />
        );
      })}
    </div>
  );
};
