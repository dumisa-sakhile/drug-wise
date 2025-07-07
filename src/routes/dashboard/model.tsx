import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { Bot, SendHorizonal } from "lucide-react";
import { auth, db } from "@/config/firebase";
import { doc, getDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

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
  const inputRef = useRef<HTMLInputElement>(null);

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
    if (messages.length === 0 && !isLoading) {
      addMessage(
        "ai",
        "Hello! I'm WiseBot, your AI assistant. How can I help you today?"
      );
    }
    // eslint-disable-next-line
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
      if (lower.includes("hello") || lower.includes("hi")) {
        aiReply = "Hello! How can I assist you today?";
      } else if (lower.includes("help")) {
        aiReply = "Sure, I am here to help! What do you need?";
      } else if (lower.includes("weather")) {
        aiReply = "I don't have weather data yet.";
      } else if (
        lower.includes("who are you") ||
        lower.includes("what is your name")
      ) {
        aiReply = "I am WiseBot, an AI assistant designed to help you.";
      } else if (lower.includes("thank you") || lower.includes("thanks")) {
        aiReply = "You're welcome! Is there anything else I can do for you?";
      } else if (lower.includes("time") || lower.includes("date")) {
        const now = new Date("2025-07-07T01:22:21 SAST");
        aiReply = `The current time is ${now.toLocaleTimeString("en-ZA", {
          hour: "2-digit",
          minute: "2-digit",
        })} on ${now.toLocaleDateString("en-ZA", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}.`;
      } else if (
        lower.includes("location") ||
        lower.includes("where are you")
      ) {
        aiReply =
          "I am a large language model, trained by Google, operating from a digital realm. My current operational location is Pretoria, Gauteng, South Africa.";
      }
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

    // Restore focus to input after sending
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const formatTimestamp = (date: Date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // Glassmorphism and color utility classes
  const glassBg =
    "bg-[rgba(36,36,36,0.7)] backdrop-blur-md border border-[rgba(255,255,255,0.08)]";
  const userBubble = "bg-[rgba(51,51,51,0.85)] text-white";
  const aiBubble = "bg-[rgba(19,19,19,0.85)] text-gray-100";

  return (
    <>
      <title>DrugWise - WiseBot Chat</title>
      <div
        className={`flex flex-col w-full h-screen sm:max-w-5xl sm:h-[90vh] mx-auto ${glassBg} rounded-none sm:rounded-2xl text-gray-100 overflow-hidden shadow-2xl`}
        role="main"
        aria-label="WiseBot chat interface">
        <h1 className="text-2xl roboto-condensed-bold pt-6 px-6 sm:p-6 text-center sm:text-left flex-shrink-0 border-b border-[rgba(255,255,255,0.08)]">
          WiseBot Chat
        </h1>

        {/* Main chat messages area */}
        <div
          className={`flex-1 overflow-y-auto px-4 py-4 sm:px-6 space-y-4 custom-scrollbar pb-32`}
          aria-live="polite"
          aria-label="Chat messages">
          {messages.length === 0 && (
            <p className="text-slate-400 roboto-condensed-light text-center py-8 px-4">
              Hello there! I'm WiseBot, your AI assistant. Type a message below
              to start our conversation.
            </p>
          )}
          <AnimatePresence>
            {messages.map(({ id, sender, text, timestamp }) => {
              const isUser = sender === "user";
              return (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`flex items-end max-w-[90%] sm:max-w-[80%] ${
                    isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                  }`}>
                  {/* Avatar/Name Section */}
                  <div
                    className={`flex flex-col items-center flex-shrink-0 ${
                      isUser ? "ml-2 sm:ml-3" : "mr-2 sm:mr-3"
                    }`}
                    aria-hidden="true">
                    {isUser ? (
                      <>
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#242424] flex items-center justify-center text-white text-sm sm:text-base roboto-condensed-bold shadow-md border border-[rgba(255,255,255,0.08)]">
                          {userName
                            ? userName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                            : "U"}
                        </div>
                        <span className="text-xs roboto-condensed-light mt-1 text-blue-400 text-center hidden sm:block">
                          {userName?.split(" ")[0] || "You"}
                        </span>
                      </>
                    ) : (
                      <>
                        <Bot className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400 shadow-md" />
                        <span className="text-xs roboto-condensed-light mt-1 text-slate-400 text-center hidden sm:block">
                          WiseBot
                        </span>
                      </>
                    )}
                  </div>
                  {/* Message Bubble */}
                  <div
                    className={`px-4 py-2 roboto-condensed-light whitespace-pre-wrap break-words relative shadow-md rounded-t-xl pr-16 ${
                      isUser
                        ? `${userBubble} rounded-bl-xl`
                        : `${aiBubble} rounded-br-xl`
                    }`}
                    tabIndex={0}
                    aria-label={`${isUser ? userName || "You" : "WiseBot"}: ${text}`}>
                    <p className="roboto-condensed-light text-base">{text}</p>
                    <span className="absolute bottom-1 right-2 text-xs text-white opacity-70 roboto-condensed-light">
                      {formatTimestamp(timestamp)}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {isLoading && (
            <div className="flex items-end mr-auto max-w-[90%] sm:max-w-[80%]">
              <div className="flex flex-col items-center flex-shrink-0 mr-2 sm:mr-3">
                <Bot className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
                <span className="text-xs roboto-condensed-light mt-1 text-slate-400 text-center hidden sm:block">
                  WiseBot
                </span>
              </div>
              <div
                className={`px-4 py-2 rounded-t-xl rounded-br-xl ${aiBubble} roboto-condensed-light shadow-md`}>
                <div
                  className="flex space-x-1 py-1"
                  aria-label="WiseBot is typing"
                  role="status">
                  <span
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce-slow"
                    style={{ animationDelay: "0s" }}></span>
                  <span
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce-slow"
                    style={{ animationDelay: "0.2s" }}></span>
                  <span
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce-slow"
                    style={{ animationDelay: "0.4s" }}></span>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Fixed input form at the very bottom of the viewport */}
        <form
          onSubmit={handleSubmit}
          className={`
      fixed bottom-4 z-20
      left-0 right-0
      sm:left-1/2 sm:right-auto sm:w-[600px] sm:max-w-full sm:transform sm:-translate-x-1/2
      p-4 shadow-2xl
      bg-[rgba(36,36,36,0.7)] backdrop-blur-md border border-[rgba(255,255,255,0.08)]
      rounded-full
      hidden md:flex  items-center
      mx-4 sm:mx-0
    `}
          role="search"
          aria-label="Type your message">
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-[rgba(19,19,19,0.85)] rounded-full pl-5 pr-16 py-3 text-gray-100 roboto-condensed-light focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400 text-base sm:text-lg transition-shadow"
            placeholder={
              isLoading ? "WiseBot is typing..." : "Type your message..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            aria-label="Type your message"
            autoFocus
            tabIndex={0}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-6 top-1/2 -translate-y-1/2 p-2.5 sm:p-3.5 bg-blue-600 hover:bg-blue-700 rounded-full text-white disabled:opacity-50 transition-all duration-200 flex items-center justify-center hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Send message"
            tabIndex={0}>
            <SendHorizonal className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </form>
      </div>

      <form
        onSubmit={handleSubmit}
        className={`
      fixed bottom-4 z-20
      left-0 right-0
      sm:left-1/2 sm:right-auto sm:w-[600px] sm:max-w-full sm:transform sm:-translate-x-1/2
      p-4 shadow-2xl
      bg-[rgba(36,36,36,0.7)] backdrop-blur-md border border-[rgba(255,255,255,0.08)]
      rounded-full
      flex md:hidden items-center
      mx-4 sm:mx-0
    `}
        role="search"
        aria-label="Type your message">
        <input
          ref={inputRef}
          type="text"
          className="flex-1 bg-[rgba(19,19,19,0.85)] rounded-full pl-5 pr-16 py-3 text-gray-100 roboto-condensed-light focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400 text-base sm:text-lg transition-shadow"
          placeholder={
            isLoading ? "WiseBot is typing..." : "Type your message..."
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
          aria-label="Type your message"
          autoFocus
          tabIndex={0}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="absolute right-6 top-1/2 -translate-y-1/2 p-2.5 sm:p-3.5 bg-blue-600 hover:bg-blue-700 rounded-full text-white disabled:opacity-50 transition-all duration-200 flex items-center justify-center hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Send message"
          tabIndex={0}>
          <SendHorizonal className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </form>
    </>
  );
}

export default Model;