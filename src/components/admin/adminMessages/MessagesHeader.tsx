import { motion } from "framer-motion";

function MessagesHeader() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}>
      <title>DrugWise - Admin Message Center</title>
      <motion.h1
        className="text-3xl font-semibold mb-8 text-center sm:text-left bg-gradient-to-r from-green-400 to-lime-400 bg-clip-text text-transparent"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}>
        Message Center
      </motion.h1>
      <motion.p
        className="text-gray-400 mb-8 font-light"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}>
        Send messages to users and view your sent messages.
      </motion.p>
    </motion.div>
  );
}

export default MessagesHeader;
