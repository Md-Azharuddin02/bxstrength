// Sent together, one failure rolls back every statement in the batch. Run separately so the rest still apply.
export const runSetupStatements = async (
  db: { query: (sql: string) => Promise<unknown> },
  sql: string,
): Promise<number> => {
  let failed = 0;
  for (const statement of sql.split(/;\s*\n/).map((s) => s.trim()).filter(Boolean)) {
    try {
      await db.query(statement);
    } catch (err: any) {
      failed++;
      console.error(`[DB SETUP] ${err?.message} <= ${statement.replace(/\s+/g, ' ').slice(0, 100)}`);
    }
  }
  return failed;
};
