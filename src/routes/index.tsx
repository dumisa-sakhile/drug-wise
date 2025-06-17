import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import teamData from "@/data/team";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const teamMembers = teamData();

  return (
    <div className="min-h-screen bg-inherit text-gray-200 bg-grid-pattern">
      {/* Hero Section */}
      <motion.section
        className="max-w-6xl mx-auto py-10 px-6 text-center relative"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}>
        <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />
        <div className="relative z-10">
          <motion.div
            className="inline-flex items-center bg-yellow-500 text-black text-sm font-semibold px-3 py-1 rounded-full mb-6"
            initial={{ scale: 1, opacity: 1 }}
            animate={{
              scale: [1, 1.05, 1],
              opacity: [1, 0.9, 1],
              boxShadow:
                "0 0 10px rgba(245, 158, 11, 0.7), 0 0 20px rgba(245, 158, 11, 0.5)",
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse",
            }}
            whileHover={{
              backgroundColor: "#facc15",
              boxShadow: "0 0 15px rgba(250, 204, 21, 0.9)",
            }}>
            * POWERED BY AI *
          </motion.div>
          <motion.h1
            className="text-5xl sm:text-6xl font-bold text-white mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}>
            Safest Medication Management with DrugWise
          </motion.h1>
          <motion.p
            className="text-lg sm:text-xl text-gray-300 mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}>
            Protect patients from costly hospital stays (R4000/night) caused by
            adverse drug interactions with real-time insights.
          </motion.p>
          <motion.div
            className="flex flex-row justify-center gap-3 md:gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}>
            <Link to="/pricing">
              <motion.button
                className="bg-white text-black font-semibold px-5 py-2.5 text-base md:px-6 md:py-3 w-full md:w-auto rounded-lg hover:opacity-90 transition"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}>
                Get Started
              </motion.button>
            </Link>
            <Link to="/model" className="hidden md:block">
              <motion.button
                className="bg-transparent border border-white text-white font-semibold px-6 py-3 text-base rounded-lg hover:bg-gray-700 transition"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}>
                See Model
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* Bento Grids */}
      <motion.section
        className="max-w-6xl mx-auto py-12 px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0, duration: 0.8 }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 *:cursor-crosshair">
          {/* Problem */}
          <motion.div
            className="bg-blue-900 p-6 rounded-lg hover:bg-blue-800 transition-all duration-300"
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            whileHover={{
              boxShadow:
                "0 0 10px rgba(30, 144, 255, 0.7), 0 0 20px rgba(30, 144, 255, 0.5)",
            }}>
            <h2 className="text-xl font-semibold text-white mb-2">
              Our Vision
            </h2>
            <p className="text-gray-300">
              To become Africa’s leading digital health platform,
              revolutionizing how people take medication by making drug safety
              intuitive, accessible, and personalized for every patient.
            </p>
          </motion.div>

          {/* Solution */}
          <motion.div
            className="bg-green-900 p-6 rounded-lg hover:bg-green-800 transition-all duration-300"
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            whileHover={{
              boxShadow:
                "0 0 10px rgba(34, 197, 94, 0.7), 0 0 20px rgba(34, 197, 94, 0.5)",
            }}>
            <h2 className="text-xl font-semibold text-white mb-2">
              Our Solution
            </h2>
            <p className="text-gray-300">
              Real-time alerts for harmful drug/food combinations, comprehensive
              medication tracking, and personalized drug recommendations.
            </p>
          </motion.div>

          {/* Market */}
          <motion.div
            className="bg-orange-900 p-6 rounded-lg hover:bg-orange-800 transition-all duration-300"
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
            whileHover={{
              boxShadow:
                "0 0 10px rgba(249, 115, 22, 0.7), 0 0 20px rgba(249, 115, 22, 0.5)",
            }}>
            <h2 className="text-xl font-semibold text-white mb-2">
              Market Opportunity
            </h2>
            <p className="text-gray-300">
              $3.8B African digital health market, 33.3% South Africa share,
              with a 23.4% CAGR.
            </p>
          </motion.div>

          {/* Team */}
          <motion.div
            className="bg-purple-900 p-6 rounded-lg hover:bg-purple-800 transition-all duration-300"
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            viewport={{ once: true }}
            whileHover={{
              boxShadow:
                "0 0 10px rgba(147, 51, 234, 0.7), 0 0 20px rgba(147, 51, 234, 0.5)",
            }}>
            <h2 className="text-xl font-semibold text-white mb-2">
              Our Mission
            </h2>
            <p className="text-gray-300">
              To empower individuals and healthcare providers with real-time,
              personalized medication management solutions that reduce harmful
              drug interactions, improve health outcomes, and lower healthcare
              costs.
            </p>
          </motion.div>

          {/* Financing */}
          <motion.div
            className="bg-teal-900 p-6 rounded-lg hover:bg-teal-800 transition-all duration-300"
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            viewport={{ once: true }}
            whileHover={{
              boxShadow:
                "0 0 10px rgba(6, 182, 212, 0.7), 0 0 20px rgba(6, 182, 212, 0.5)",
            }}>
            <h2 className="text-xl font-semibold text-white mb-2">Financing</h2>
            <p className="text-gray-300">
              Raised R25,000, project R12M revenue, seeking R1M for nationwide
              launch.
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Dedicated Team Section */}
      <motion.section
        className="max-w-6xl mx-auto py-12 px-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}>
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-8">
          Our Team
        </h2>
        <div className="flex flex-wrap justify-center gap-6">
          {teamMembers.map((member, index) => (
            <motion.div
              key={member.name}
              className="flex flex-col items-center"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.2, duration: 0.5 }}>
              <motion.div
                className="w-24 h-24 bg-white rounded-full overflow-hidden flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.3 }}>
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
              </motion.div>
              <motion.p
                className="mt-3 text-lg font-semibold text-white"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.2 + 0.3, duration: 0.5 }}>
                {member.name}
              </motion.p>
              <motion.p
                className="text-sm text-gray-400"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.2 + 0.4, duration: 0.5 }}>
                {member.role}
              </motion.p>
              <motion.p
                className="text-sm text-gray-200"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.2 + 0.4, duration: 0.5 }}>
                {member.expertise}
              </motion.p>
            </motion.div>
          ))}
        </div>
      </motion.section>
    </div>
  );
}

export default App;
