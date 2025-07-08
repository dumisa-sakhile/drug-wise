import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import type { FormEvent } from "react";
import { Send, MessageSquarePlus } from "lucide-react"; // Import Bot if it's still needed for AI avatar fallback
import { auth, db } from "@/config/firebase";
import { doc, getDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import male from "/male.jpg?url";
import female from "/female.jpg?url";
import logo from "../../logo.svg"; // Import the new logo

export const Route = createFileRoute("/dashboard/model")({ component: Model });

const INITIAL_SUGGESTIONS = [
  "What is pharmacovigilance?",
  "Tell me about adverse drug interactions.",
  "How does AI help in healthcare?",
  "What is unstructured medical text?",
  "How does WiseBot use NLP?",
  "Explain drug discovery.",
  "What are adverse drug events?",
  "Tell me about open-source medical databases.",
  "What is symptom and recovery tracking?",
  "Who are the AI hardware competitors?",
  "What is Compass's pricing model?",
  "Tell me about Plaud's battery life.",
  "What technical issues are observed in wearable AI products?",
  "What are the commended features of Bee?",
];

interface Message {
  id: number;
  sender: string;
  text: string;
  timestamp: Date;
}

function Model() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>(() => sessionStorage.getItem('inputText') || "");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showDynamicSuggestions, setShowDynamicSuggestions] =
    useState<boolean>(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);

  const messageIdRef = useRef<number>(0);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) return;
      const docSnap = await getDoc(doc(db, "users", user.uid));
      const data = docSnap.exists() ? docSnap.data() : {};
      if (user.photoURL) setAvatarUrl(user.photoURL);
      else if (data.photoURL) setAvatarUrl(data.photoURL);
      else if (data.gender === "female") setAvatarUrl(female);
      else setAvatarUrl(male);
    });
    return () => unsubscribe();
  }, []);

  const addMessage = (sender: string, text: string) => {
    messageIdRef.current += 1;
    setMessages((prev) => [
      ...prev,
      { id: messageIdRef.current, sender, text, timestamp: new Date() },
    ]);
  };

  const simulateAIResponse = (prompt: string) => {
    setIsLoading(true);
    setTimeout(() => {
      let response = "I'm still learning. Can you rephrase?";
      if (prompt.includes("pharmacovigilance")) {
        response =
          "Pharmacovigilance refers to the science and activities involved in detecting, assessing, understanding, and preventing adverse effects or other drug-related problems to ensure medication safety.";
      } else if (prompt.includes("adverse drug interactions")) {
        response =
          "Adverse drug-interactions occur when one drug affects the activity of another, when a drug interacts with food or other substances, potentially causing harmful effects.";
      } else if (prompt.includes("AI help in healthcare")) {
        response =
          "AI-Integrated clinical software services are computer programs that use artificial intelligence to assist healthcare professionals in tasks like patient diagnosis, treatment planning, or data analysis, improving efficiency and accuracy as well as administrative workflow automation.";
      } else if (prompt.includes("unstructured medical text")) {
        response =
          "Unstructured medical text refers to free-form, non-standardized data like doctor's notes, patient records, or medical reports that lack a predefined format, making it challenging to process without advanced tools like NLP.";
      } else if (prompt.includes("WiseBot use NLP")) {
        response =
          "Leveraging AI and ML (Natural Language Processing (NLP) and Deep Learning Techniques) we aim to develop preventive measures against adverse drug-interactions and identify patterns by extracting information from unstructured medical text for efficient adverse event identification and detection.";
      } else if (prompt.includes("drug discovery")) {
        response =
          "Drug discovery is the process of identifying and developing new medications to treat diseases, often involving extensive research and testing.";
      } else if (prompt.includes("adverse drug events")) {
        response =
          "Adverse drug events are incidents of harm or negative outcomes caused by medication use, including side effects or unexpected reactions that may not be fully documented or understood.";
      } else if (prompt.includes("open-source medical databases")) {
        response =
          "Open-source medical databases are publicly accessible collections of medical data, such as drug information or clinical studies, that can be freely used for research and analysis.";
      } else if (prompt.includes("symptom and recovery tracking")) {
        response =
          "Symptom and recovery tracking post-medication-intake involves monitoring and recording a patient's symptoms and health progress after taking a medication to assess its effectiveness and detect any adverse effects.";
      } else if (prompt.includes("AI hardware competitors")) {
        response =
          "AI hardware competitors discussed include Compass, Plaud, Bee, and Limitless Pendant.";
      } else if (prompt.includes("Compass's pricing model")) {
        response =
          "The Compass wearable sells for $99 and includes 10 hours of free recording each month. An unlimited usage plan is available for $14 per month when billed yearly or $19 per month when billed monthly.";
      } else if (prompt.includes("Plaud's battery life")) {
        response =
          "The provided text does not explicitly detail Plaud's battery life, but mentions it was prone to accidental recordings, which could exacerbate battery drain.";
      } else if (prompt.includes("technical issues")) {
        response =
          "Common technical problems in wearable AI products include core recording and data processing reliability, inconsistent and limited battery life, application and AI backend stability and accuracy issues, audio capture limitations, and physical design and usability issues.";
      } else if (prompt.includes("commended features of Bee")) {
        response =
          "The Bee device is noted as the least expensive option, has the 'best battery life' among tested devices, and a 'nice clean app' that summarizes recordings with features like key takeaways, atmosphere, and locations. Its monthly subscription fee for Bee Premium is considered reasonable.";
      }
      addMessage("ai", response);
      setIsLoading(false);
    }, 1300);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    addMessage("user", input);
    simulateAIResponse(input);
    setInput("");
    sessionStorage.removeItem('inputText'); // Clear session storage after sending
    setShowDynamicSuggestions(false); // Hide dynamic suggestions after sending
  };

  const handleSuggestionClick = (s: string) => {
    addMessage("user", s);
    simulateAIResponse(s);
    setInput(""); // Clear input after clicking suggestion
    sessionStorage.removeItem('inputText'); // Clear session storage after sending
    setShowDynamicSuggestions(false); // Hide dynamic suggestions
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    sessionStorage.setItem('inputText', value); // Save input text to session storage
    if (value.length > 0) {
      const filtered = INITIAL_SUGGESTIONS.filter((suggestion) =>
        suggestion.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowDynamicSuggestions(true);
    } else {
      setShowDynamicSuggestions(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col text-white font-light">
      

      {messages.length === 0 ? (
        // Hero Section with initial suggestions
        <div className="flex flex-1 flex-col items-center justify-center px-4 md:ml-[120px] max-w-4xl mx-auto w-full">
          <div className="text-center mb-10">
            <img
              src={logo}
              alt="WiseBot Logo"
              className="w-24 h-24 mx-auto mb-4"
            />
            <h1 className="text-5xl font-bold text-white mb-3">
              Welcome to WiseBot
            </h1>
            <p className="text-lg text-gray-300 max-w-md mx-auto">
              Delve into profound perspectives, participate in enriching
              dialogues, and discover fresh opportunities with WiseBot.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 w-full max-w-2xl">
            {INITIAL_SUGGESTIONS.slice(0, 5).map((s) => (
              <motion.button
                key={s}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSuggestionClick(s)}
                className="flex items-center gap-1 px-4 py-2 text-sm rounded-full bg-[#2A2A2A] hover:bg-[#3A3A3A] border border-gray-700 text-gray-200 transition-colors">
                <MessageSquarePlus className="w-4 h-4 text-blue-400" /> {s}
              </motion.button>
            ))}
          </div>
        </div>
      ) : (
        // Chat Section
        <main className="flex-1 px-4 py-6 max-w-3xl mx-auto w-full md:ml-[240px]">
          <div className="space-y-4 pb-40">
            <AnimatePresence>
              {messages.map(({ id, sender, text, timestamp }) => (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`flex ${sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`flex ${sender === "user" ? "flex-row-reverse" : ""} gap-2 max-w-[85%]`}>
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-[#303030] flex-shrink-0">
                      {sender === "user" ? (
                        <img
                          src={avatarUrl || male}
                          alt="avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <img
                            src={logo}
                            alt="WiseBot Logo"
                            className="w-5 h-5"
                          />{" "}
                          {/* Use logo for AI avatar */}
                        </div>
                      )}
                    </div>
                    <div
                      className={`px-4 py-3 text-sm rounded-2xl shadow ${
                        sender === "user"
                          ? "bg-[#303030] text-gray-100 rounded-br-none"
                          : "bg-[#2A2A2A] text-gray-200 rounded-bl-none"
                      }`}>
                      <p>{text}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {" "}
                        {/* Adjusted timestamp contrast */}
                        {timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <div className="flex gap-2 items-center">
                <div className="w-9 h-9 rounded-full bg-[#303030] flex items-center justify-center flex-shrink-0">
                  <img src={logo} alt="WiseBot Logo" className="w-5 h-5" />
                </div>
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150" />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-300" />
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        </main>
      )}

      <div className="fixed bottom-0 left-0 right-0 p-4 z-20 md:ml-[240px]">
        <div className="max-w-3xl mx-auto">
          {/* Dynamic Suggestions (on top of typing box, when typing and messages exist) */}
          {showDynamicSuggestions && messages.length > 0 && (
            <div className="mb-2 overflow-x-auto scrollbar-hide">
              <div className="flex gap-2 pb-2">
                {filteredSuggestions.map((s) => (
                  <motion.button
                    key={s}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSuggestionClick(s)}
                    className="flex-shrink-0 flex items-center gap-1 px-4 py-2 text-sm rounded-full bg-[#2A2A2A] hover:bg-[#3A3A3A] border border-gray-700 text-gray-200 whitespace-nowrap transition-colors">
                    <MessageSquarePlus className="w-4 h-4 text-blue-400" /> {s}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="relative flex items-center">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <MessageSquarePlus className="w-5 h-5 text-gray-500" />
            </div>
            <input
              ref={inputRef}
              type="text"
              className="w-full bg-[#303030] border border-[#444] rounded-full pl-12 pr-12 py-5 text-base text-white placeholder-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={
                isLoading ? "WiseBot is thinking..." : "Message WiseBot..."
              }
              value={input}
              onChange={handleInputChange}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9  text-white rounded-full flex items-center justify-center transition-colors">
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
        <div className="text-center backdrop-blur-md bg-black/30 text-white text-xs mt-2">
          {" "}
          {/* Adjusted contrast */}
          WiseBot may generate inaccurate information like any other AI, and is
          not intended to diagnose, treat, cure, or prevent any disease. Model:
          WiseBot AI - Beta Version
        </div>
      </div>
    </div>
  );
}

export default Model;