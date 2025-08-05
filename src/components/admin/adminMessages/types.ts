import { Timestamp } from "firebase/firestore";

export interface AppUser {
  id: string;
  uid: string;
  name: string;
  surname: string;
  email: string;
  isAdmin: boolean;
  joinedAt: Timestamp;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  subject: string;
  content: string;
  sentAt: Timestamp;
  isRead: boolean;
  isWelcomeMessage: boolean;
}
