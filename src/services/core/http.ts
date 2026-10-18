import { getToken } from "./token";

const metaEnv = (import.meta as any).env || {};

export const CSRF_COOKIE = "bx_csrf";

export const getApiUrl = (path: string): string => {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  if (typeof window !== "undefined") {
    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    if (isLocal) {
      return `http://localhost:3001${cleanPath}`;
    }
  }

  const configured = metaEnv.VITE_API_URL || metaEnv.API_URL || "";
  if (configured) {
    return `${configured.replace(/\/$/, "")}${cleanPath}`;
  }

  return cleanPath;
};

export function readCookie(name: string): string {
  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : "";
}

let onUnauthorized: () => Promise<void> = async () => {};
export const setUnauthorizedHandler = (fn: () => Promise<void>) => {
  onUnauthorized = fn;
};

export async function apiFetch(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  const send = () =>
    fetch(url, {
      ...init,
      credentials: "include",
      headers: {
        ...(init.headers as Record<string, string>),
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      },
    });

  let res = await send();
  if (res.status === 401 && readCookie(CSRF_COOKIE)) {
    await onUnauthorized();
    if (getToken()) {
      res = await send();
    }
  }
  return res;
}
