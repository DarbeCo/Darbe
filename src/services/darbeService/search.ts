import type { SearchResultState } from "../api/endpoints/types/search.api.types";
import { supabase } from "../supabase/client";
import { ensureUserId } from "./utils";

const mapProfileToSearchResult = (profile: any): SearchResultState => ({
  id: profile.id,
  firstName: profile.first_name ?? "",
  lastName: profile.last_name ?? "",
  fullName: profile.full_name ?? "",
  profilePicture: profile.profile_picture_url ?? undefined,
  nonprofitName: profile.nonprofit_name ?? undefined,
  organizationName: profile.organization_name ?? undefined,
  city: profile.city ?? undefined,
  zip: profile.zip ?? undefined,
});

const parseSearchInput = (input: string): { filter: string; term: string } => {
  if (!input.includes("?")) {
    return { filter: "all", term: input };
  }

  const [filter, queryString] = input.split("?");
  const params = new URLSearchParams(queryString);
  const term = params.get(filter) ?? "";
  return { filter, term };
};

const searchProfiles = async (term: string, ids?: string[]) => {
  if (!term.trim()) return [] as SearchResultState[];

  let query = supabase
    .from("profiles")
    .select(
      "id, first_name, last_name, full_name, profile_picture_url, nonprofit_name, organization_name, city, zip"
    )
    .or(
      `first_name.ilike.%${term}%,last_name.ilike.%${term}%,full_name.ilike.%${term}%,organization_name.ilike.%${term}%,nonprofit_name.ilike.%${term}%`
    );

  if (ids && ids.length) {
    query = query.in("id", ids);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map(mapProfileToSearchResult);
};

export const getSearchResults = async (input: string): Promise<SearchResultState[]> => {
  const { filter, term } = parseSearchInput(input);

  if (!term || term.trim().length === 0) return [];

  if (filter === "friends") {
    const userId = await ensureUserId();
    const { data: friendRows, error } = await supabase.rpc("get_user_friends", {
      target_user_id: userId,
    });

    if (error) throw error;

    const friendIds = (friendRows ?? []).map((row) => row.friend_id);
    return searchProfiles(term, friendIds);
  }

  // Future filters: roster, events, messages
  if (filter === "roster" || filter === "events" || filter === "messages") {
    return [];
  }

  return searchProfiles(term);
};
