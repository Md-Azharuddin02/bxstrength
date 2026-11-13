import test from 'node:test';
import assert from 'node:assert/strict';
import { updateTicket } from '../src/controllers/ticketController.ts';
import { ticketsStore } from '../src/models/ticket.ts';

const call = async (id: string, body: any) => {
  let out: any;
  await updateTicket({ params: { id }, body, user: { email: 'cs@x.com', role: 'support' } }, { json: (v: any) => (out = v), status: () => ({ json: (v: any) => (out = v) }) });
  return out;
};

test('escalation saves priority, assignee and a server-stamped history entry', async () => {
  ticketsStore.length = 0;
  ticketsStore.push({ id: 'T-1', userId: 'u', userName: 'A', userEmail: 'a@x.com', subject: 's', category: 'General', priority: 'normal', description: 'd', status: 'open', createdAt: '', updatedAt: '' });
  await call('T-1', { priority: 'urgent', assignedAgent: 'Head Coach', escalation: { escalatedTo: 'Head Coach', reason: 'Client unhappy', escalatedBy: 'forged' } });
  const t = ticketsStore[0];
  assert.equal(t.priority, 'urgent');
  assert.equal(t.assignedAgent, 'Head Coach');
  assert.equal(t.escalationHistory?.length, 1);
  assert.match(t.escalationHistory![0].escalatedBy, /cs@x.com/);
});

test('invalid priority is ignored and escalation needs a reason', async () => {
  ticketsStore.length = 0;
  ticketsStore.push({ id: 'T-2', userId: 'u', userName: 'A', userEmail: 'a@x.com', subject: 's', category: 'General', priority: 'normal', description: 'd', status: 'open', createdAt: '', updatedAt: '' });
  await call('T-2', { priority: 'bogus', escalation: { reason: '  ' } });
  assert.equal(ticketsStore[0].priority, 'normal');
  assert.equal(ticketsStore[0].escalationHistory, undefined);
});
