import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { Bot } from "lucide-react";
import { auth, db } from "@/config/firebase";
import { doc, getDoc } from "firebase/firestore";

export const Route = createFileRoute("/dashboard/model")({
  component: Model,
});

interface ChatMessage {
  id: number;
  sender: "user" | "ai";
  text: string;
  timestamp: Date;
}

function Model() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const messageIdRef = useRef(0);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch current user name from Firestore
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserName(`${data.name} ${data.surname}`);
          } else {
            setUserName("User");
          }
        } catch {
          setUserName("User");
        }
      } else {
        setUserName(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Initial greeting from WiseBot
  useEffect(() => {
    addMessage(
      "ai",
      "Hello! I'm WiseBot, your AI assistant. How can I help you today?"
    );
  }, []);

  const addMessage = (sender: "user" | "ai", text: string) => {
    messageIdRef.current += 1;
    setMessages((msgs) => [
      ...msgs,
      { id: messageIdRef.current, sender, text, timestamp: new Date() },
    ]);
  };

  const simulateAIResponse = (userMessage: string) => {
    setIsLoading(true);
    setTimeout(() => {
      let aiReply = "I'm still learning. Could you please rephrase?";
      const lower = userMessage.toLowerCase();
      if (lower.includes("hello"))
        aiReply = "Hello! How can I assist you today?";
      else if (lower.includes("help"))
        aiReply = "Sure, I am here to help! What do you need?";
      else if (lower.includes("weather"))
        aiReply = "I don't have weather data yet.";
      addMessage("ai", aiReply);
      setIsLoading(false);
    }, 1500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    addMessage("user", input.trim());
    simulateAIResponse(input.trim());
    setInput("");
  };

  const formatTimestamp = (date: Date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex flex-col max-w-3xl mx-auto h-[80vh] bg-[#131313] rounded-lg border border-[#333333] p-4 text-white">
      <h1 className="text-xl font-bold mb-4 roboto-condensed-bold">
        WiseBot Chat
      </h1>

      <div className="flex-1 overflow-y-auto mb-4 px-2 space-y-4">
        {messages.length === 0 && (
          <p className="text-[#666] roboto-condensed-light">
            Start the conversation by typing below.
          </p>
        )}
        {messages.map(({ id, sender, text, timestamp }) => {
          const isUser = sender === "user";
          return (
            <div
              key={id}
              className={`flex items-start max-w-[75%] ${
                isUser ? "ml-auto flex-row-reverse" : "mr-auto"
              }`}>
              <div className="flex flex-col items-center mr-3 ml-3">
                {isUser ? (
                  <>
                    {/* Show user initials */}
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold roboto-condensed-bold">
                      {userName
                        ? userName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                        : "U"}
                    </div>
                    <span className="text-xs roboto-condensed-light mt-1 text-blue-400">
                      {userName || "You"}
                    </span>
                  </>
                ) : (
                  <>
                    <Bot className="w-8 h-8 text-gray-400" />
                    <span className="text-xs roboto-condensed-light mt-1 text-gray-400">
                      WiseBot
                    </span>
                  </>
                )}
              </div>
              <div
                className={`px-4 py-2 rounded-lg roboto-condensed-light whitespace-pre-wrap ${
                  isUser ? "bg-blue-600 text-white" : "bg-[#1A1A1A] text-white"
                }`}>
                <p>{text}</p>
                <span className="block text-xs mt-1 text-[#999] text-right">
                  {formatTimestamp(timestamp)}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          className="flex-1 bg-[#1A1A1A] rounded px-3 py-2 text-white roboto-condensed-light focus:outline-none"
          placeholder={
            isLoading ? "WiseBot is typing..." : "Type your message..."
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
          autoFocus
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded roboto-condensed-bold disabled:opacity-50">
          Send
        </button>
      </form>
    </div>
  );
}

export default Model;
