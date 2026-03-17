const trimTrailingSlash = (value = "") => value.replace(/\/+$/, "");

const defaultApiBaseUrl = import.meta.env.DEV ? "http://localhost:3000" : "";

const resolveBrowserSafeApiBaseUrl = (configuredValue) => {
  const normalizedValue = trimTrailingSlash(configuredValue);

  if (!normalizedValue || typeof window === "undefined") {
    return normalizedValue;
  }

  if (normalizedValue.startsWith("/")) {
    return normalizedValue;
  }

  try {
    const configuredUrl = new URL(normalizedValue, window.location.origin);
    const isHttpsPage = window.location.protocol === "https:";
    const isSameHost = configuredUrl.host === window.location.host;

    if (isHttpsPage && configuredUrl.protocol === "http:" && isSameHost) {
      return trimTrailingSlash(
        `${window.location.origin}${configuredUrl.pathname}`,
      );
    }

    return trimTrailingSlash(configuredUrl.toString());
  } catch {
    return normalizedValue;
  }
};

export const API_BASE_URL = resolveBrowserSafeApiBaseUrl(
  import.meta.env.VITE_API_BASE_URL || defaultApiBaseUrl,
);

export const buildApiUrl = (path = "") => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};
