import { useState, useEffect } from "react";
import debounce from "lodash.debounce";

import { useGetSearchResultsQuery } from "../../services/api/endpoints/search/search.api";

const useDebouncedSearch = (input: string, searchFilter?: string) => {
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

  return { data, error, isLoading };
};

export default useDebouncedSearch;
