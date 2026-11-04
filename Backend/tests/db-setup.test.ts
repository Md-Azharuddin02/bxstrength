import test from 'node:test';
import assert from 'node:assert/strict';
import { runSetupStatements } from '../src/config/dbSetup.ts';
import { parseJsonList } from '../src/utils/json.ts';

test('list columns read the same from text and jsonb', () => {
  assert.deepEqual(parseJsonList('[{"name":"Oats"}]'), [{ name: 'Oats' }]);
  assert.deepEqual(parseJsonList([{ name: 'Oats' }]), [{ name: 'Oats' }]);
  assert.deepEqual(parseJsonList(''), []);
  assert.deepEqual(parseJsonList(null), []);
});

test('one failing setup statement does not stop the others', async (t) => {
  t.mock.method(console, 'error', () => {});
  const ran: string[] = [];
  const db = {
    query: async (sql: string) => {
      ran.push(sql);
      if (sql.includes('bad')) throw new Error('boom');
    },
  };

  const failed = await runSetupStatements(db, `
    CREATE TABLE one (id INT);

    CREATE TABLE bad (id INT);
    CREATE TABLE two (
      id INT
    );
  `);

  assert.equal(failed, 1);
  assert.equal(ran.length, 3);
  assert.ok(ran[2].includes('two'));
});
