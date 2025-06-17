import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-inherit text-gray-200 bg-grid-pattern">
      {/* Hero Section */}
      <motion.section
        className="max-w-6xl mx-auto py-16 px-6 text-center relative"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}>
        <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />
        <div className="relative z-10">
          <motion.h1
            className="text-5xl sm:text-6xl font-bold text-white mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}>
            About DrugWise
          </motion.h1>
          <motion.p
            className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}>
            We're revolutionizing how people take medication—safer, smarter, and
            personalized—starting in Africa.
          </motion.p>
        </div>
      </motion.section>

      {/* Core Sections */}
      <motion.section
        className="max-w-6xl mx-auto py-12 px-6 grid grid-cols-1 sm:grid-cols-2 gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0, duration: 0.8 }}>
        {/* Mission */}
        <div className="bg-purple-900 p-6 rounded-lg hover:bg-purple-800 transition-all">
          <h2 className="text-2xl font-semibold text-white mb-2">
            Our Mission
          </h2>
          <p className="text-gray-300">
            To empower individuals and healthcare providers with real-time,
            personalized medication management that reduces harmful drug
            interactions and lowers healthcare costs.
          </p>
        </div>

        {/* Vision */}
        <div className="bg-blue-900 p-6 rounded-lg hover:bg-blue-800 transition-all">
          <h2 className="text-2xl font-semibold text-white mb-2">Our Vision</h2>
          <p className="text-gray-300">
            To become Africa’s leading digital health platform, making drug
            safety intuitive and personalized for everyone.
          </p>
        </div>

        {/* Why It Matters */}
        <div className="bg-red-900 p-6 rounded-lg hover:bg-red-800 transition-all">
          <h2 className="text-2xl font-semibold text-white mb-2">
            Why DrugWise?
          </h2>
          <p className="text-gray-300">
            Millions suffer due to adverse drug interactions. With rising
            chronic care costs, personalization and real-time alerts aren’t
            luxuries—they’re necessities.
          </p>
        </div>

        {/* What We Offer */}
        <div className="bg-green-900 p-6 rounded-lg hover:bg-green-800 transition-all">
          <h2 className="text-2xl font-semibold text-white mb-2">
            What We Offer
          </h2>
          <ul className="list-disc pl-5 text-gray-300 space-y-2">
            <li>Real-time drug & food interaction alerts</li>
            <li>AI-driven drug recommendations</li>
            <li>Comprehensive medication tracking</li>
          </ul>
        </div>
      </motion.section>

      {/* Market & Strategy */}
      <motion.section
        className="max-w-6xl mx-auto py-12 px-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}>
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
          Market & Impact
        </h2>
        <p className="text-lg text-gray-300 max-w-3xl mx-auto mb-6">
          Africa’s $3.8B digital health market is growing at 23.4% CAGR. South
          Africa alone holds 33.3% of that. DrugWise is uniquely positioned with
          a first-of-its-kind patient-focused solution.
        </p>
        <p className="text-gray-400 text-sm">
          Our launch plan: Partner with insurers, gyms, doctors, and wellness
          communities. Scale nationwide in 2025, expand continent-wide in 2026.
        </p>
      </motion.section>

      {/* Funding Section */}
      <motion.section
        className="max-w-6xl mx-auto py-12 px-6 grid grid-cols-1 sm:grid-cols-2 gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.8 }}>
        <div className="bg-yellow-900 p-6 rounded-lg hover:bg-yellow-800 transition-all">
          <h2 className="text-2xl font-semibold text-white mb-2">Funding</h2>
          <p className="text-gray-300">
            Raised R25,000 via Hult Prize. Projecting R12M in first-year
            revenue. Now raising R1M for national rollout.
          </p>
        </div>

        <div className="bg-teal-900 p-6 rounded-lg hover:bg-teal-800 transition-all">
          <h2 className="text-2xl font-semibold text-white mb-2">
            Revenue Model
          </h2>
          <ul className="list-disc pl-5 text-gray-300 space-y-2">
            <li>60% profit margin on hardware sales</li>
            <li>Monthly subscription for AI services</li>
          </ul>
        </div>
      </motion.section>

      
    </div>
  );
}

export default AboutPage;
