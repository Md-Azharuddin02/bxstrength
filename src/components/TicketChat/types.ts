export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'customer' | 'agent';
  text: string;
  createdAt: string;
}

export interface PendingMessage {
  tempId: string;
  text: string;
  status: 'sending' | 'failed';
  createdAt: string;
}

export const MAX_MESSAGE_LENGTH = 2000;
