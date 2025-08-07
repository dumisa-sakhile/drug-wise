import { motion } from "framer-motion";

interface ViewToggleProps {
  view: "compose" | "sent";
  setView: (view: "compose" | "sent") => void;
}

function ViewToggle({ view, setView }: ViewToggleProps) {
  return (
    <motion.div
      className="flex gap-4 mb-8"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.1 } },
      }}>
      <motion.button
        className={`px-4 py-2 rounded-xl font-light ${
          view === "compose"
            ? "bg-gradient-to-r from-green-500 to-lime-500 text-gray-900"
            : "bg-zinc-800/10 text-gray-400 hover:bg-zinc-800"
        } transition-all duration-200`}
        onClick={() => setView("compose")}
        variants={{
          hidden: { opacity: 0, scale: 0.95 },
          visible: { opacity: 1, scale: 1 },
        }}
        transition={{ duration: 0.4 }}>
        Compose
      </motion.button>
      <motion.button
        className={`px-4 py-2 rounded-xl font-light ${
          view === "sent"
            ? "bg-gradient-to-r from-green-500 to-lime-500 text-gray-900"
            : "bg-zinc-800/10 text-gray-400 hover:bg-zinc-800"
        } transition-all duration-200`}
        onClick={() => setView("sent")}
        variants={{
          hidden: { opacity: 0, scale: 0.95 },
          visible: { opacity: 1, scale: 1 },
        }}
        transition={{ duration: 0.4 }}>
        Sent Messages
      </motion.button>
    </motion.div>
  );
}

export default ViewToggle;
