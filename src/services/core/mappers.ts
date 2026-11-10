import { User } from "../../types";
import { STORAGE_KEYS, SEED_USERS, getItem, setItem } from "./storage";

export const decodeHtmlEntities = (text: string): string => {
  if (!text || typeof text !== "string") return "";
  let decoded = text;
  // Multi-pass recursive decode for &amp;amp; -> &amp; -> &
  while (/&(amp|lt|gt|quot|#x27|#39|#x2F|#47);/i.test(decoded)) {
    const next = decoded
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/&#x2F;/g, "/")
      .replace(/&#47;/g, "/");
    if (next === decoded) break;
    decoded = next;
  }
  return decoded;
};

export const dicebearAvatar = (seed: string) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;

export function toUser(raw: any, overrides: Partial<User> = {}): User {
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    role: raw.role,
    phone: raw.phone || "",
    contactMethods: Array.isArray(raw.contactMethods)
      ? raw.contactMethods
      : typeof raw.contact_methods === "string" && raw.contact_methods
        ? raw.contact_methods.split(",").filter(Boolean)
        : undefined,
    whatsappNumber: raw.whatsapp_number || raw.whatsappNumber || undefined,
    avatarUrl: raw.avatar_url || raw.avatarUrl || dicebearAvatar(raw.name),
    isVerified: raw.is_verified !== undefined ? Boolean(raw.is_verified) : true,
    status: raw.status || "active",
    createdAt: raw.created_at || new Date().toISOString(),
    ...overrides,
  };
}

export function upsertUser(user: User): void {
  const users = getItem<User[]>(STORAGE_KEYS.USERS, SEED_USERS);
  const idx = users.findIndex(
    (u) => u.email.toLowerCase() === user.email.toLowerCase(),
  );
  if (idx !== -1) users[idx] = user;
  else users.push(user);
  setItem(STORAGE_KEYS.USERS, users);
}

export const formatMeetingUrl = (rawLink?: string | null): string => {
  if (!rawLink || typeof rawLink !== "string") return "";
  const decoded = decodeHtmlEntities(rawLink).trim();
  if (!decoded) return "";
  if (/^https?:\/\//i.test(decoded)) return decoded;
  return `https://${decoded}`;
};
