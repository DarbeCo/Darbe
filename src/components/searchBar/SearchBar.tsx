import { DarbeAvatar } from "../avatars/DarbeAvatar";
import { MessagingIcon } from "../messaging/MessaginIcon";
import { SearchInput } from "./SearchInput";
import { DARBE_SEARCH, DEFAULT_FILTER, FilterType, SearchType } from "./types";
import useScreenWidthHook from "../../utils/commonHooks/UseScreenWidth";

import styles from "./styles/searchBar.module.css";

interface SearchBarProps {
  showMessageIcon: boolean;
  showAvatar: boolean;
  isTabletMode?: boolean;
  placeholder?: SearchType;
  filter?: FilterType;
}

export const SearchBar = ({
  isTabletMode,
  filter,
  placeholder,
  showAvatar,
  showMessageIcon,
}: SearchBarProps) => {
  const { isDesktop } = useScreenWidthHook();
  const placeholderText = placeholder || DARBE_SEARCH;
  const filterToUse = filter || DEFAULT_FILTER;
  const displayAvatar = showAvatar ?? !isTabletMode;

  return (
    <div className={styles.searchBarContainer}>
      {!isDesktop && (
        <>
          {displayAvatar && <DarbeAvatar variant="small" />}
          <SearchInput
            placeholder={placeholderText}
            searchFilter={filterToUse}
          />
          {showMessageIcon && <MessagingIcon />}
        </>
      )}
      {isDesktop && (
        <>
          <SearchInput placeholder={DARBE_SEARCH} searchFilter={filterToUse} />
        </>
      )}
    </div>
  );
};
