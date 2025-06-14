import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";

export const Route = createFileRoute("/terms")({
  component: Terms,
});

function Terms() {
  return (
    <>
      <title>Drug Wise - Terms</title>
      <motion.div
        className="w-full h-lvh flex items-center justify-center bg-inherit text-white"
        initial={{ opacity: 0, y: 50 }}
        animate={{
          opacity: 1,
          y: 0,
          transition: { type: "spring", stiffness: 100, damping: 20 },
        }}
        transition={{ duration: 0.8 }}>
        <motion.div
          className="text-center"
          initial={{ scale: 0.8, rotate: -5 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}>
          <motion.h1
            className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-yellow-400 to-orange-600 bg-clip-text text-transparent animate-pulse"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}>
            Terms
          </motion.h1>
          <motion.p
            className="text-lg sm:text-xl font-medium text-gray-300 mt-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}>
            Clear guidelines ahead!
          </motion.p>
          <motion.p
            className="text-md sm:text-lg font-light text-gray-400 mt-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}>
            Coming soon
          </motion.p>
        </motion.div>
      </motion.div>
    </>
  );
}
