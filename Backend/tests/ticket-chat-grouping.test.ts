import test from 'node:test';
import assert from 'node:assert/strict';
import { buildChatItems, dayLabel } from '../../src/components/TicketChat/utils/grouping.ts';

const msg = (id: string, senderId: string, createdAt: string) =>
  ({ id, senderId, senderName: senderId, senderRole: 'customer' as const, text: id, createdAt });

test('groups consecutive messages per sender and splits by day and 5-minute gaps', () => {
  const now = new Date('2026-11-18T23:30:00');
  const items = buildChatItems([
    msg('a', 'u1', '2026-11-17T10:00:00'),
    msg('b', 'u1', '2026-11-18T23:19:00'),
    msg('c', 'u1', '2026-11-18T23:20:00'), 
    msg('d', 'me', '2026-11-18T23:21:00'),
    msg('e', 'me', '2026-11-18T23:29:00'), 
  ], 'me', now);

  assert.deepEqual(items.map(i => (i.kind === 'day' ? i.label : i.messages.map(m => m.id).join(''))), ['Yesterday', 'a', 'Today', 'bc', 'd', 'e']);
  assert.equal(items.filter(i => i.kind === 'group' && i.mine).length, 2);
  assert.equal(dayLabel(new Date('2026-11-18T01:00:00'), now), 'Today');
});
