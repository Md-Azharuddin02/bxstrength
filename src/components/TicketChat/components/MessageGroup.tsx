import React from 'react';
import { formatTime, type ChatItem } from '../utils/grouping';
import { Avatar, RoleTag } from './SenderBadge';
import { bubbleBase, bubbleCorners, mineBubble, theirBubble } from './bubbleStyles';

type Group = Extract<ChatItem, { kind: 'group' }>;

const MessageGroupView = ({ group }: { group: Group }) => {
  const { mine, messages } = group;
  const last = messages[messages.length - 1];
  return (
    <div className={`flex items-end gap-2 ${mine ? 'justify-end' : ''}`}>
      {!mine && <Avatar name={group.senderName} role={group.senderRole} />}
      <div className={`flex flex-col gap-0.5 min-w-0 max-w-[75%] ${mine ? 'items-end' : 'items-start'}`}>
        {!mine && (
          <div className="flex items-center gap-1.5 mb-0.5 pl-1 text-[11px]">
            <span className="font-semibold text-zinc-300">{group.senderName}</span>
            <RoleTag role={group.senderRole} />
          </div>
        )}
        {messages.map((m, i) => (
          <p
            key={m.id}
            title={new Date(m.createdAt).toLocaleString()}
            className={`${bubbleBase} ${mine ? mineBubble : theirBubble} ${bubbleCorners(mine, i, messages.length)}`}
          >
            {m.text}
          </p>
        ))}
        <time dateTime={last.createdAt} className="mt-0.5 px-1 text-[10px] text-zinc-500 tabular-nums">
          {formatTime(last.createdAt)}
        </time>
      </div>
    </div>
  );
};

// Groups are rebuilt on every new message, but messages never change once sent: a group only
// needs to re-render when it gains a message (or the viewer changes), so a long thread redraws one group, not all.
export const MessageGroup = React.memo(MessageGroupView, (a, b) => a.group.messages.length === b.group.messages.length && a.group.mine === b.group.mine);
