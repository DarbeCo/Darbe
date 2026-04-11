import { SerializedError } from "@reduxjs/toolkit";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { SearchResultState } from "../../services/api/endpoints/types/search.api.types";
import { UserAvatars } from "../avatars/UserAvatars";
import { getUserStateFromZip } from "../../utils/CommonFunctions";
import { Typography } from "../typography/Typography";

import styles from "./styles/searchBar.module.css";

interface SearchResultsProps {
  error: FetchBaseQueryError | SerializedError | undefined;
  isLoading: boolean;
  data?: SearchResultState[];
  searchText?: string;
  onClick?: (userId: string) => void;
}

export const SearchResults = ({
  data,
  error,
  isLoading,
  searchText,
  onClick,
}: SearchResultsProps) => {
  if (data?.length === 0 || !data) {
    return null;
  }

  const handleClick = (userId: string) => {
    if (onClick) {
      onClick(userId);
    }
  };

  return (
    <div className={styles.searchResults}>
      {isLoading && <h1>Loading...</h1>}
      {error && <h1>Error...</h1>}
      {searchText &&
        data?.map((result) => {
          const state = getUserStateFromZip(result.zip);
          const nameToDisplay =
            result.fullName ||
            result.nonprofitName ||
            result.organizationName ||
            result.rosterName;
          const searchResultProfilePicture = result.profilePicture || "";

          return (
            <div
              key={result.id}
              className={styles.searchResultItem}
              onClick={() => handleClick(result.id)}
            >
              <UserAvatars
                profilePicture={searchResultProfilePicture}
                userId={result.id}
              />
              <div
                className={styles.searchResultInfo}
                onClick={() => handleClick(result.id)}
              >
                <Typography
                  variant="sectionTitle"
                  textToDisplay={nameToDisplay}
                />
                <Typography
                  variant="informational"
                  textToDisplay={`${result.city}, ${state?.st}`}
                />
              </div>
            </div>
          );
        })}
    </div>
  );
};
