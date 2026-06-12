const getMatchViewedStorageKey = (userId: string) =>
  `darbe:viewedMatches:${userId}`;

export const getViewedMatchIds = (userId: string) => {
  if (!userId || typeof window === "undefined") return [];

  try {
    const storedValue = window.localStorage.getItem(
      getMatchViewedStorageKey(userId)
    );

    if (!storedValue) return [];

    const parsedValue = JSON.parse(storedValue);

    return Array.isArray(parsedValue)
      ? parsedValue.filter((matchId): matchId is string =>
          typeof matchId === "string"
        )
      : [];
  } catch {
    return [];
  }
};

export const markMatchIdsViewed = (userId: string, matchIds: string[]) => {
  if (!userId || typeof window === "undefined") return;

  window.localStorage.setItem(
    getMatchViewedStorageKey(userId),
    JSON.stringify(Array.from(new Set(matchIds)))
  );
};
