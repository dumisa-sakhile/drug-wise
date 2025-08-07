import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import type { FormEvent } from "react";
import { Send, MessageSquarePlus, Bot, ArrowLeft } from "lucide-react";
import { auth, db } from "@/config/firebase";
import { doc, getDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import male from "/male.jpg?url";
import female from "/female.jpg?url";

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
  const [input, setInput] = useState<string>(
    () => sessionStorage.getItem("inputText") || ""
  );
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
    sessionStorage.removeItem("inputText");
    setShowDynamicSuggestions(false);
  };

  const handleSuggestionClick = (s: string) => {
    addMessage("user", s);
    simulateAIResponse(s);
    setInput("");
    sessionStorage.removeItem("inputText");
    setShowDynamicSuggestions(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    sessionStorage.setItem("inputText", value);
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

  const handleBack = () => {
    window.history.back();
  };

  return (
    <div className="font-light max-w-5xl mx-auto md:px-4 py-8 pt-16 md:pt-8 min-h-screen text-gray-100 bg-zinc-950">
      <title>DrugWise - WiseBot</title>
      {/* Mobile Back Button */}
      <motion.button
        onClick={handleBack}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="md:hidden fixed top-4 left-4 z-30 flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-gray-300 transition-all duration-200 shadow-md font-light">
        <ArrowLeft className="w-4 h-4 text-lime-400" />
        Back
      </motion.button>

      {messages.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-4 max-w-5xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10">
            <motion.h1
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: 0.2,
                duration: 0.5,
                type: "spring",
                stiffness: 150,
              }}
              className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-400 to-lime-400 bg-clip-text text-transparent mb-3">
              Welcome to WiseBot
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-sm text-gray-400 max-w-md mx-auto font-light">
              Delve into profound perspectives, participate in enriching
              dialogues, and discover fresh opportunities with WiseBot.
            </motion.p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6, staggerChildren: 0.1 }}
            className="flex flex-wrap justify-center gap-3 w-full max-w-2xl">
            {INITIAL_SUGGESTIONS.slice(0, 5).map((s, index) => (
              <motion.button
                key={s}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSuggestionClick(s)}
                className="flex items-center gap-2 px-5 py-2.5 text-sm rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-gray-300 transition-all duration-200 shadow-md font-light">
                <MessageSquarePlus className="w-4 h-4 text-lime-400" />
                <span>{s}</span>
              </motion.button>
            ))}
          </motion.div>
        </div>
      ) : (
        <main className="flex-1 px-4 py-6 max-w-5xl mx-auto w-full">
          <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-center sm:text-left bg-gradient-to-r from-green-400 to-lime-400 bg-clip-text text-transparent">
            WiseBot Chat
          </h1>
          <div className="space-y-6 pb-40">
            <AnimatePresence>
              {messages.map(({ id, sender, text, timestamp }) => (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${
                    sender === "user" ? "justify-end" : "justify-start"
                  }`}>
                  <div
                    className={`flex ${
                      sender === "user" ? "flex-row-reverse" : ""
                    } gap-3 max-w-[85%]`}>
                    <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border-2 border-zinc-800">
                      {sender === "user" ? (
                        <img
                          src={avatarUrl || male}
                          alt="User avatar"
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full w-full bg-zinc-900 rounded-full border border-zinc-800">
                          <Bot className="w-5 h-5 text-lime-400 animate-pulse" />
                        </div>
                      )}
                    </div>
                    <div
                      className={`px-4 py-3 text-sm rounded-lg shadow-md transition-colors duration-200 ${
                        sender === "user"
                          ? "bg-gradient-to-r from-green-500 to-lime-500 text-gray-900 rounded-br-none"
                          : "bg-zinc-900 text-gray-100 rounded-bl-none border border-zinc-800"
                      }`}>
                      <p className="font-light">{text}</p>
                      <p
                        className={`text-xs mt-1 font-light ${
                          sender === "user" ? "text-gray-700" : "text-gray-400"
                        }`}>
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
              <div className="flex gap-3 items-center">
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-zinc-900 border border-zinc-800">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="w-5 h-5 border-2 border-gray-400 border-t-lime-500 rounded-full"
                  />
                </div>
                <span className="text-gray-400 font-light text-sm">
                  WiseBot is thinking...
                </span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </main>
      )}
      <div className="fixed bottom-0 left-0 right-0 p-4 z-20 md:ml-[296px] bg-zinc-950/70 backdrop-blur-md">
        <div className="max-w-5xl mx-auto">
          <AnimatePresence>
            {showDynamicSuggestions && messages.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
                className="mb-4 overflow-x-auto scrollbar-hide">
                <div className="flex gap-3">
                  {filteredSuggestions.map((s, index) => (
                    <motion.button
                      key={s}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSuggestionClick(s)}
                      className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 text-sm rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-gray-300 whitespace-nowrap transition-all duration-200 shadow-md font-light">
                      <MessageSquarePlus className="w-4 h-4 text-lime-400" />
                      <span>{s}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <MessageSquarePlus className="w-5 h-5 text-gray-500" />
            </div>
            <motion.input
              ref={inputRef}
              type="text"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-10 pr-14 py-2.5 text-base text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-lime-500 transition-all duration-200 font-light"
              placeholder={
                isLoading ? "WiseBot is thinking..." : "Message WiseBot..."
              }
              value={input}
              onChange={handleInputChange}
              disabled={isLoading}
              whileFocus={{ scale: 1.01 }}
            />
            <motion.button
              type="submit"
              disabled={isLoading || !input.trim()}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className={`absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                isLoading || !input.trim()
                  ? "bg-zinc-800 text-gray-500"
                  : "bg-gradient-to-r from-green-500 to-lime-500 text-gray-900 hover:from-green-600 hover:to-lime-600"
              }`}>
              <Send className="w-5 h-5" />
            </motion.button>
          </form>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="text-center text-gray-100 text-xs mt-2 font-light">
            WiseBot may generate inaccurate information like any other AI, and
            is not intended to diagnose, treat, cure, or prevent any disease.
            Model: WiseBot AI - Beta Version
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default Model;
