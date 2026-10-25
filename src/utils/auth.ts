export const normalizeRole = (role?: string) =>
    (role ?? "").toLowerCase().replace(/[_\s]/g, "");