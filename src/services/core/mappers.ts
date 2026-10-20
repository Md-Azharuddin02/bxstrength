import { User } from "../../types";
import { STORAGE_KEYS, SEED_USERS, getItem, setItem } from "./storage";

export const decodeHtmlEntities = (text: string): string => {
  if (!text || typeof text !== "string") return "";
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/");
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
