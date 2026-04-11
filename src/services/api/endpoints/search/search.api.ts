import { darbeBaseApi } from "../darbe.api";
import { SearchResultState } from "../types/search.api.types";
import { getSearchResults } from "../../../darbeService";

const searchApi = darbeBaseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSearchResults: builder.query<SearchResultState[], string>({
      async queryFn(searchText) {
        try {
          const data = await getSearchResults(searchText);
          return { data };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              data: { message: (error as Error).message },
            },
          };
        }
      },
      providesTags: ["Search"],
    }),
  }),
});

export const { useGetSearchResultsQuery } = searchApi;
