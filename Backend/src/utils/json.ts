// A text column gives a JSON string, but a jsonb column has already been parsed by the database driver.
export const parseJsonList = (value: unknown): any[] => {
  if (typeof value === 'string') return value ? JSON.parse(value) : [];
  return Array.isArray(value) ? value : [];
};
