export const assetUrl = (path: string): string => {
  if (!path) return path;

  const baseUrl = import.meta.env.BASE_URL || "/";

  // Leave absolute URLs untouched.
  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(path)) {
    return path;
  }

  // Avoid double-prefixing if the base is already present.
  if (path.startsWith(baseUrl)) {
    return path;
  }

  if (path.startsWith("/")) {
    return `${baseUrl}${path.slice(1)}`;
  }

  return path;
};
