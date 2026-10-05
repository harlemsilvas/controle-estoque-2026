import { buildApiUrl } from "../config/apiBaseUrl";
export async function authenticatedFetch(url, options = {}) {
  const apiRoot = new URL(buildApiUrl("/"), window.location.origin);
  const target = new URL(url, window.location.origin);
  if (target.origin !== apiRoot.origin) throw new Error("Destino de API não autorizado.");
  const headers = new Headers(options.headers);
  const token = localStorage.getItem("token");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(url, { ...options, headers });
  if (response.status === 401) window.dispatchEvent(new Event("auth:expired"));
  return response;
}
