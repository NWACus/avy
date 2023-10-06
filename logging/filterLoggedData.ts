// Sometimes we're sending very large data params like base64-encoded images.
// Let's not log those, eh?
export const filterLoggedData = (params: unknown): unknown => {
  if (!params || (typeof params !== 'object' && typeof params !== 'string')) {
    return params;
  }

  if (typeof params === 'string') {
    return params.length > 100 ? params.substring(0, 100) + '...' : params;
  }

  if (Array.isArray(params)) {
    return params.map(filterLoggedData);
  }

  return Object.fromEntries(Object.entries(params).map(([k, v]) => [k, filterLoggedData(v)]));
};
