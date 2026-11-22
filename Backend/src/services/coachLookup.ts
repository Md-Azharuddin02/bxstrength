import { dbPool } from '../config/db.ts';

// Coach email by user id, falling back to a case-insensitive name match. '' when nothing matches.
export const findCoachEmail = async (id?: string | null, name?: string | null): Promise<string> => {
  if (!dbPool) return '';
  const lookup = async (sql: string, value: string) => {
    try {
      return (await dbPool!.query(sql, [value])).rows[0]?.email || '';
    } catch {
      return '';
    }
  };
  const byId = id ? await lookup('SELECT email FROM users WHERE id = $1', id) : '';
  if (byId || !name) return byId;
  return lookup('SELECT email FROM users WHERE LOWER(name) = LOWER($1)', name);
};
