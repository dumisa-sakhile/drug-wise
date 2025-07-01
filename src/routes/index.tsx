import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import teamData from "@/data/team";

export const Route = createFileRoute("/")({
  component: App,
});

const gridItems = [
  {
    title: "Data Integration",
    description:
      "Combines patient feedback, clinical notes, regulatory reports, and medical literature to enhance drug safety analysis and counter adverse reactions.",
    gradient: "from-purple-500/30",
    span: "lg:col-span-1 lg:row-span-1",
  },
  {
    title: "AI-Integrated Software",
    description:
      "Empowers healthcare professionals with AI-driven tools for accurate diagnosis, treatment planning, and real-time data analysis, improving patient outcomes.",
    gradient: "from-blue-500/30",
    span: "lg:col-span-1 lg:row-span-1",
  },
  {
    title: "Adverse Event Tracking",
    description:
      "Systematically collects and analyzes reports of adverse drug reactions, enabling rapid response to enhance medication safety and public health.",
    gradient: "from-teal-500/30",
    span: "lg:col-span-1 lg:row-span-1",
  },
];

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
            className="text-2xl md:text-5xl font-bold text-white mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}>
            Enhancing Your Recovery: Safer Medications, Better Health.
          </motion.h1>
          <motion.p
            className="text-lg sm:text-xl text-gray-300 mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}>
            Leverage AI and NLP to detect adverse drug reactions in real-time,
            reducing costly hospitalizations and enhancing patient safety.
          </motion.p>
          <motion.div
            className="flex flex-row justify-center gap-3 md:gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}>
            <Link
              to="/about"
              className="hidden md:block bg-lime-600 hover:bg-lime-700 text-black font-semibold py-2 px-4 rounded-full focus:outline-none focus:shadow-outline transition duration-300">
              Learn More
            </Link>
            <Link
              to="/auth"
              className="block md:hidden bg-lime-600 hover:bg-lime-700 text-black font-semibold py-2 px-4 rounded-full focus:outline-none focus:shadow-outline transition duration-300">
              Get Started
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* Grid Section */}
      <motion.section
        className="max-w-6xl mx-auto -mt-12 py-12 px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0, duration: 0.8 }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-[minmax(12rem,1fr)] justify-items-center max-w-4xl mx-auto">
          {gridItems.map((item, index) => (
            <motion.div
              key={item.title}
              className={`relative group bg-gradient-to-br from-[#1a1a1a]/90 to-[#2a2a2a]/70 backdrop-blur-lg border border-[#ffffff1a] p-6 rounded-xl overflow-hidden hover:scale-95 transition cursor-crosshair duration-500 w-full h-58 ${item.span}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.2, duration: 0.5 }}
              viewport={{ once: true }}>
              <div
                className={`absolute inset-0 bg-gradient-to-r ${item.gradient} to-transparent opacity-50 transition-opacity duration-500 group-hover:animate-gradient-move`}
              />
              <div className="absolute inset-0 border-2 border-transparent rounded-xl animate-shiny-border" />
              <h2 className="text-2xl font-bold text-white mb-3">
                {item.title}
              </h2>
              <p className="text-gray-300 text-sm">{item.description}</p>
            </motion.div>
          ))}
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