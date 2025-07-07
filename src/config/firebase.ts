import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import type { User } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.MESSAGE_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

// Function to send welcome message for users who haven't received one
const sendWelcomeMessage = async (user: User) => {
  try {
    // Check if the user has already received a welcome message
    const messagesQuery = query(
      collection(db, "messages"),
      where("recipientId", "==", user.uid),
      where("isWelcomeMessage", "==", true)
    );
    const messageDocs = await getDocs(messagesQuery);

    if (messageDocs.empty) {
      // No welcome message exists, send one
      await addDoc(collection(db, "messages"), {
        content: `Welcome to the DrugWise platform, ${user.displayName || "User"}! We're excited to have you here.`,
        isRead: false,
        recipientId: user.uid,
        senderId: "system",
        senderName: "DrugWise Team",
        sentAt: serverTimestamp(),
        subject: "Welcome to DrugWise!",
        isWelcomeMessage: true,
      });
      console.log(`Welcome message sent to user: ${user.uid}`);
    } else {
      console.log(`User ${user.uid} already has a welcome message.`);
    }
  } catch (error) {
    console.error("Error sending welcome message:", error);
  }
};

// Listen for authentication state changes
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in, check and send welcome message if needed
    sendWelcomeMessage(user);
  }
});

export { app, auth, db };
