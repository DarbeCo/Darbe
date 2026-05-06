import { useState, useEffect } from "react";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { SerializedError } from "@reduxjs/toolkit";

import { useGetSearchResultsQuery } from "../../services/api/endpoints/search/search.api";
import type { SearchResultState } from "../../services/api/endpoints/types/search.api.types";

interface DebouncedSearchResult {
  data?: SearchResultState[];
  error: FetchBaseQueryError | SerializedError | undefined;
  isLoading: boolean;
}

const SEARCH_DEBOUNCE_MS = 900;
const MIN_SEARCH_CHARACTERS = 3;

const useDebouncedSearch = (
  input: string,
  searchFilter?: string
): DebouncedSearchResult => {
  const [debouncedInput, setDebouncedInput] = useState<string>("");

  useEffect(() => {
    const trimmedInput = input.trim();

    if (trimmedInput.length < MIN_SEARCH_CHARACTERS) {
      setDebouncedInput("");
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setDebouncedInput(trimmedInput);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [input]);

  const populatedInput = searchFilter
    ? `${searchFilter}?${searchFilter}=${debouncedInput}`
    : debouncedInput;

  const { data, error, isLoading } = useGetSearchResultsQuery(populatedInput, {
    skip: debouncedInput.length < MIN_SEARCH_CHARACTERS,
  });

  return {
    data,
    error: error as FetchBaseQueryError | SerializedError | undefined,
    isLoading,
  };
};

export default useDebouncedSearch;
