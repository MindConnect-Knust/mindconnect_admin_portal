/** Builds a query string, dropping empty values. `http.get` takes a path only. */
export const withQuery = (path, params = {}) => {
  const search = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
  ).toString();
  return search ? `${path}?${search}` : path;
};
