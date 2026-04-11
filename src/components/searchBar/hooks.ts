import { useState, useEffect } from "react";
import debounce from "lodash.debounce";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { SerializedError } from "@reduxjs/toolkit";

import { useGetSearchResultsQuery } from "../../services/api/endpoints/search/search.api";
import type { SearchResultState } from "../../services/api/endpoints/types/search.api.types";

interface DebouncedSearchResult {
  data?: SearchResultState[];
  error: FetchBaseQueryError | SerializedError | undefined;
  isLoading: boolean;
}

const useDebouncedSearch = (
  input: string,
  searchFilter?: string
): DebouncedSearchResult => {
  const [debouncedInput, setDebouncedInput] = useState<string>("");

  useEffect(() => {
    const debouncedSetInput = debounce((value: string) => {
      setDebouncedInput(value);
    }, 900);

    if (input.length > 3) {
      debouncedSetInput(input);
    }

    return () => {
      debouncedSetInput.cancel();
    };
  }, [input]);

  const populatedInput = searchFilter
    ? `${searchFilter}?${searchFilter}=${debouncedInput}`
    : debouncedInput;

  const { data, error, isLoading } = useGetSearchResultsQuery(populatedInput);

  return {
    data,
    error: error as FetchBaseQueryError | SerializedError | undefined,
    isLoading,
  };
};

export default useDebouncedSearch;
