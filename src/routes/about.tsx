import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import teamData from "@/data/team";

export const Route = createFileRoute("/about")({
  component: About,
});

function About() {
  const teamMembers = teamData();

  return (
    <div className="min-h-[450px] bg-[#141414] text-gray-200 bg-grid-pattern relative">
      {/* Hero Section */}
      <motion.section
        className="max-w-6xl mx-auto py-16 px-6 text-center relative"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}>
        <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />
        <div className="relative z-10">
          <motion.h1
            className="text-3xl sm:text-4xl font-bold text-white mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}>
            About Us
          </motion.h1>
          <motion.p
            className="text-base sm:text-lg text-[#d1d5db] mb-6 max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}>
            We are a health-tech startup dedicated to revolutionizing medication
            safety across Africa.{" "}
            <span className="font-bold text-white">Our vision</span>  is to become
            Africa’s leading platform for personalized medication safety,
            empowering individuals to take control of their health through
            real-time, AI-powered drug interaction prevention.{" "}
            <span className="font-bold text-white">Our mission </span>
            is to revolutionize how medication is managed by delivering smart,
            user-friendly tools that provide real-time alerts, personalized drug
            recommendations, and complete medication oversight—reducing
            preventable adverse reactions and improving health outcomes across
            the continent.
          </motion.p>
        </div>
      </motion.section>

      {/* Dedicated Team Section */}
      <motion.section
        className="max-w-6xl -mt-14 mx-auto py-12 px-6 text-center"
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
