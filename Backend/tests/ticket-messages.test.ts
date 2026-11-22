import test from 'node:test';
import assert from 'node:assert/strict';
import { ticketsStore } from '../src/models/ticket.ts';
import { createTicketMessage, listTicketMessages } from '../src/controllers/ticketMessageController.ts';

const call = async (fn: any, user: any, params: any, body: any = {}, query: any = {}) => {
  let status = 200, json: any;
  const res: any = { status(c: number) { status = c; return res; }, json(j: any) { json = j; return res; } };
  await fn({ user, params, body, query }, res);
  return { status, json };
};

test('customer and staff chat on one ticket; strangers are blocked', async () => {
  ticketsStore.push({ id: 'T1', userId: 'u1', userName: 'A', userEmail: 'a@x.com', subject: 's', category: 'General', priority: 'medium', description: 'd', status: 'open', createdAt: '', updatedAt: '' });
  const owner = { id: 'u1', email: 'a@x.com', role: 'client', name: 'A' };
  const agent = { id: 's1', email: 's@x.com', role: 'customer_support', name: 'Sam' };
  const stranger = { id: 'u2', email: 'b@x.com', role: 'client', name: 'B' };

  assert.equal((await call(createTicketMessage, owner, { id: 'T1' }, { text: 'hi' })).status, 201);
  assert.equal((await call(createTicketMessage, agent, { id: 'T1' }, { text: 'hello' })).json.senderRole, 'agent');
  assert.equal((await call(listTicketMessages, owner, { id: 'T1' })).json.length, 2);
  assert.equal((await call(listTicketMessages, stranger, { id: 'T1' })).status, 403);
  assert.equal((await call(createTicketMessage, owner, { id: 'T1' }, { text: '  ' })).status, 400);
  assert.equal((await call(createTicketMessage, agent, { id: 'nope' }, { text: 'x' })).status, 404);
});

test('after= returns only newer messages and rejects a bad timestamp', async () => {
  ticketsStore.push({ id: 'T2', userId: 'u1', userName: 'A', userEmail: 'a@x.com', subject: 's', category: 'General', priority: 'medium', description: 'd', status: 'open', createdAt: '', updatedAt: '' });
  const owner = { id: 'u1', email: 'a@x.com', role: 'client', name: 'A' };
  const first = (await call(createTicketMessage, owner, { id: 'T2' }, { text: 'one' })).json;
  await new Promise(r => setTimeout(r, 5));
  await call(createTicketMessage, owner, { id: 'T2' }, { text: 'two' });

  const since = await call(listTicketMessages, owner, { id: 'T2' }, {}, { after: new Date(Date.parse(first.createdAt) + 1).toISOString() });
  assert.deepEqual(since.json.map((m: any) => m.text), ['two']);
  assert.equal((await call(listTicketMessages, owner, { id: 'T2' }, {}, { after: first.createdAt })).json.length, 2); // inclusive
  assert.equal((await call(listTicketMessages, owner, { id: 'T2' }, {}, { after: 'nope' })).status, 400);
});
