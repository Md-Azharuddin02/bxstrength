// Shared by sent and pending bubbles so both look identical.
export const bubbleBase = 'w-fit max-w-full px-3 py-1.5 text-[13px] leading-snug whitespace-pre-wrap break-words rounded-2xl';
export const mineBubble = 'bg-[#CCFF00] text-black';
export const theirBubble = 'bg-zinc-800 text-zinc-100';

// Stacked bubbles from one sender get a tighter corner on the sender's side, like most chat apps.
// Full class names (not built from pieces) so Tailwind generates them.
const CORNERS = {
  mine: { first: 'rounded-br-md', middle: 'rounded-r-md', last: 'rounded-tr-md' },
  theirs: { first: 'rounded-bl-md', middle: 'rounded-l-md', last: 'rounded-tl-md' },
};

export function bubbleCorners(mine: boolean, index: number, count: number): string {
  if (count === 1) return '';
  const c = mine ? CORNERS.mine : CORNERS.theirs;
  return index === 0 ? c.first : index === count - 1 ? c.last : c.middle;
}
