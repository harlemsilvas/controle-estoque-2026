const trimTrailingSlash = (value = "") => value.replace(/\/+$/, "");

const defaultApiBaseUrl = import.meta.env.DEV
  ? "http://localhost:3000"
  : "http://localhost:4300";

export const API_BASE_URL = trimTrailingSlash(
  import.meta.env.VITE_API_BASE_URL || defaultApiBaseUrl,
);

export const buildApiUrl = (path = "") => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};
