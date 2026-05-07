import { useEffect, useRef, useState } from "react";
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
  const [isResultsOpen, setIsResultsOpen] = useState(false);
  const searchInputRef = useRef<HTMLDivElement | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
    setIsResultsOpen(true);
  };

  const { data, error, isLoading } = useDebouncedSearch(
    searchInput,
    searchFilter
  );

  const handleClick = (userId: string) => {
    setSearchInput("");
    setIsResultsOpen(false);
    navigate(`${PROFILE_ROUTE}/${userId}`);
  };

  useEffect(() => {
    if (!isResultsOpen) {
      return;
    }

    const handleClickAway = (event: MouseEvent) => {
      if (
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setIsResultsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickAway);

    return () => document.removeEventListener("mousedown", handleClickAway);
  }, [isResultsOpen]);

  return (
    <div className={styles.searchInputArea} ref={searchInputRef}>
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
        value={searchInput}
      />
      {isResultsOpen && searchInput.trim().length >= 3 && (
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
