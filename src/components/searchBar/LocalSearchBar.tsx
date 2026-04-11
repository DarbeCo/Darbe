import { Input } from "@mui/material";

import { CustomSvgs } from "../customSvgs/CustomSvgs";

import styles from "./styles/searchBar.module.css";

interface LocalSearchBarProps {
  placeholder: string;
  onChange: (value: string) => void;
}

/**
 * Use this when wanting to filter a collection of results that don't require a fetch call
 */
export const LocalSearchBar = ({
  placeholder,
  onChange,
}: LocalSearchBarProps) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;

    onChange(value);
  };

  return (
    <div className={styles.searchInputArea}>
      <Input
        disableUnderline
        fullWidth
        onChange={handleChange}
        startAdornment={
          <CustomSvgs
            variant="small"
            svgPath="/svgs/common/searchIcon.svg"
            altText="search icon"
          />
        }
        className={styles.searchInputBar}
        placeholder={placeholder}
      />
    </div>
  );
};
