import React from 'react';
import { formatTime, type ChatItem } from '../utils/grouping';
import { Avatar, RoleTag } from './SenderBadge';
import { bubbleBase, mineBubble, theirBubble } from './bubbleStyles';

type Group = Extract<ChatItem, { kind: 'group' }>;

const MessageGroupView = ({ group }: { group: Group }) => {
  const name = group.senderName;
  const first = group.messages[0];
  return (
    <div className={`flex gap-2.5 ${group.mine ? 'flex-row-reverse' : ''}`}>
      {!group.mine && <Avatar name={name} role={group.senderRole} />}
      <div className={`flex flex-col gap-1 min-w-0 max-w-[78%] ${group.mine ? 'items-end' : 'items-start'}`}>
        <div className="flex items-center gap-2 text-[10px] text-zinc-500">
          <span className="font-bold text-zinc-300">{group.mine ? 'You' : name}</span>
          {!group.mine && <RoleTag role={group.senderRole} />}
          <time dateTime={first.createdAt}>{formatTime(first.createdAt)}</time>
        </div>
        {group.messages.map((m, i) => (
          <p
            key={m.id}
            title={new Date(m.createdAt).toLocaleString()}
            className={`${bubbleBase} ${group.mine ? mineBubble : theirBubble} ${i === 0 ? (group.mine ? 'rounded-tr-md' : 'rounded-tl-md') : ''}`}
          >
            {m.text}
          </p>
        ))}
      </div>
    </div>
  );
};

// Groups are rebuilt on every new message, but messages never change once sent: a group only
// needs to re-render when it gains a message (or the viewer changes), so a long thread redraws one group, not all.
export const MessageGroup = React.memo(MessageGroupView, (a, b) => a.group.messages.length === b.group.messages.length && a.group.mine === b.group.mine);
