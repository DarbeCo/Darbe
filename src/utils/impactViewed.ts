const getImpactViewedStorageKey = (userId: string) =>
  `darbe:viewedImpacts:${userId}`;

export const getViewedImpactIds = (userId: string) => {
  if (!userId || typeof window === "undefined") return [];

  try {
    const storedValue = window.localStorage.getItem(
      getImpactViewedStorageKey(userId)
    );

    if (!storedValue) return [];

    const parsedValue = JSON.parse(storedValue);

    return Array.isArray(parsedValue)
      ? parsedValue.filter((impactId): impactId is string =>
          typeof impactId === "string"
        )
      : [];
  } catch {
    return [];
  }
};

export const markImpactIdsViewed = (userId: string, impactIds: string[]) => {
  if (!userId || typeof window === "undefined") return;

  window.localStorage.setItem(
    getImpactViewedStorageKey(userId),
    JSON.stringify(Array.from(new Set(impactIds)))
  );
};
