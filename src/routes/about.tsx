import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import teamData from "@/data/team"; // Corrected import to match common usage

export const Route = createFileRoute("/about")({
  component: About,
});

function About() {
  const teamMembers = teamData(); // Assuming teamData is a function that returns the array

  return (
    <div className="min-h-10  text-gray-200 relative overflow-hidden">
      {/* Background Gradients/Effects (consistent with landing page) */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
      </div>

      {/* Hero Section */}
      <motion.section
        className="relative z-10 max-w-7xl mx-auto pt-16 pb-16 px-6 text-center"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}>
        <motion.h1
          className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}>
          About Us
        </motion.h1>
        <motion.p
          className="text-lg sm:text-xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}>
          We are a health-tech startup dedicated to revolutionizing medication
          safety across Africa.{" "}
          <span className="font-bold text-white">Our vision</span> is to become
          Africa’s leading platform for personalized medication safety,
          empowering individuals to take control of their health through
          real-time, AI-powered drug interaction prevention.{" "}
          <span className="font-bold text-white">Our mission</span> is to
          revolutionize how medication is managed by delivering smart,
          user-friendly tools that provide real-time alerts, personalized drug
          recommendations, and complete medication oversight—reducing
          preventable adverse reactions and improving health outcomes across the
          continent.
        </motion.p>
      </motion.section>

      {/* Dedicated Team Section */}
      <motion.section
        className="max-w-7xl mx-auto py-16 px-6 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.8 }}>
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-12 text-center">
          Meet Our Dedicated Team
        </h2>
        <br />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 justify-items-center">
          {teamMembers.map((member, index) => (
            <motion.div
              key={member.name}
              className="flex flex-col items-center w-full max-w-xs"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.15 + 0.5, duration: 0.5 }}
              >
              <motion.div
                className="w-28 h-28 rounded-full overflow-hidden mb-4"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}>
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
              </motion.div>
              <p className="mt-3 text-xl font-bold text-white text-center">
                {member.name}
              </p>
              <p className="text-md text-blue-300 text-center">{member.role}</p>
              <p className="text-sm text-gray-400 text-center mt-1">
                {member.expertise}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.section>
    </div>
  );
}
