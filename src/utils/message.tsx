import { db } from "@/config/firebase";
import { addDoc, collection, Timestamp } from "firebase/firestore";

export async function sendWelcomeMessage(recipientId: string): Promise<void> {
  try {
    await addDoc(collection(db, "messages"), {
      senderId: "system",
      senderName: "DrugWise Team",
      recipientId,
      subject: "Welcome to DrugWise!",
      content: `Hello and welcome to DrugWise!

We're thrilled to have you join our community. Here's what you can do:
- View and manage your medications
- Set up personalized reminders
- Access health resources
- Contact our support team

If you have any questions, don't hesitate to reach out.

Best regards,
The DrugWise Team`,
      sentAt: Timestamp.now(),
      isRead: false,
    });
  } catch (error) {
    console.error("Failed to send welcome message:", error);
    throw new Error("Failed to send welcome message");
  }
}
