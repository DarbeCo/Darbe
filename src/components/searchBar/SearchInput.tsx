import { useState } from "react";
import { Input } from "@mui/material";
import { useNavigate } from "react-router-dom";

import { PROFILE_ROUTE } from "../../routes/route.constants";
import { CustomSvgs } from "../customSvgs/CustomSvgs";
import { SearchResults } from "./SearchResults";
import useDebouncedSearch from "./hooks";

import styles from "./styles/searchBar.module.css";

interface SearchInputProps {
  placeholder: string;
  searchFilter?: string;
}

/**
 * SearchInput component that takes in a placeholder and searchFilter to narrow down search results
 */
export const SearchInput = ({
  placeholder,
  searchFilter,
}: SearchInputProps) => {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState<string>("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const { data, error, isLoading } = useDebouncedSearch(
    searchInput,
    searchFilter
  );

  const handleClick = (userId: string) => {
    setSearchInput("");
    navigate(`${PROFILE_ROUTE}/${userId}`);
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
      {searchInput && (
        <SearchResults
          data={data}
          error={error}
          isLoading={isLoading}
          searchText={searchInput}
          onClick={handleClick}
        />
      )}
    </div>
  );
};
