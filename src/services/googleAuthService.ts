
const metaEnv = (import.meta as any).env || {};
export const GOOGLE_CLIENT_ID =
  metaEnv.VITE_GOOGLE_CLIENT_ID ||
  metaEnv.GOOGLE_CLIENT_ID ||
  "171654929533-cdbccjk0peqhhpsqjckhhio2l1l4485n.apps.googleusercontent.com";

export interface GoogleUserProfile {
  email: string;
  name: string;
  picture?: string;
  sub: string;
}

// Decode Google JWT Credential Token
export const decodeGoogleJwt = (token: string): GoogleUserProfile | null => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    const parsed = JSON.parse(jsonPayload);
    return {
      email: parsed.email,
      name: parsed.name || parsed.email.split("@")[0],
      picture: parsed.picture,
      sub: parsed.sub,
    };
  } catch (e) {
    console.error("Failed to decode Google JWT token:", e);
    return null;
  }
};

// Initialize Google GIS script
export const loadGoogleGsiScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if ((window as any).google?.accounts) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });
};


export const promptGoogleAccountSelect = (): Promise<string | null> => {
  return new Promise((resolve) => {
    if (!GOOGLE_CLIENT_ID || !(window as any).google?.accounts?.oauth2) {
      resolve(null);
      return;
    }

    try {
      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope:
          "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
        callback: (response: any) => {
          resolve(response?.error ? null : response?.access_token || null);
        },
      });
      client.requestAccessToken({ prompt: "select_account" });
    } catch (err) {
      console.warn("Error in promptGoogleAccountSelect:", err);
      resolve(null);
    }
  });
};
