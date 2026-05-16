import { DarbeAvatar } from "../avatars/DarbeAvatar";
import { MessagingIcon } from "../messaging/MessaginIcon";
import { SearchInput } from "./SearchInput";
import { DARBE_SEARCH, DEFAULT_FILTER, FilterType, SearchType } from "./types";
import useScreenWidthHook from "../../utils/commonHooks/UseScreenWidth";
import { useLocation } from "react-router-dom";
import { ROSTER_ROUTE } from "../../routes/route.constants";

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
  const location = useLocation();
  const placeholderText = placeholder || DARBE_SEARCH;
  const filterToUse = filter || DEFAULT_FILTER;
  const displayAvatar = showAvatar ?? !isTabletMode;
  const shouldHideGlobalDarbeSearch =
    placeholderText === DARBE_SEARCH &&
    location.pathname.startsWith(ROSTER_ROUTE) &&
    new URLSearchParams(location.search).get("view") === "createRoster";

  if (shouldHideGlobalDarbeSearch) {
    return null;
  }

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
