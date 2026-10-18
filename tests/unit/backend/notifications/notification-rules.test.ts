import { describe, it, expect } from 'vitest';

export interface NotificationItem {
  id: string;
  recipientId: string;
  title: string;
  isRead: boolean;
}

export function markNotificationRead(notif: NotificationItem, userId: string): NotificationItem {
  if (notif.recipientId !== userId) {
    throw new Error('Unauthorized: Cannot mark foreign notifications as read');
  }
  return { ...notif, isRead: true };
}

describe('Unit: Backend Notification Scoping Rules', () => {
  const notif: NotificationItem = {
    id: 'notif_1',
    recipientId: 'user_target_1',
    title: 'Your workout plan has been updated',
    isRead: false,
  };

  it('UT-NOTIF-01: Recipient can mark notification as read', () => {
    const updated = markNotificationRead(notif, 'user_target_1');
    expect(updated.isRead).toBe(true);
  });

  it('UT-NOTIF-02: Non-recipient cannot alter read status of foreign notification', () => {
    expect(() => markNotificationRead(notif, 'attacker_user_2')).toThrow(/Unauthorized/);
  });
});
