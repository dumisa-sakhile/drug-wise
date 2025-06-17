import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const Route = createFileRoute("/about")({
  component: About,
});

function About() {
  // Chart data for market analysis
  const chartData = {
    labels: ["Africa Digital Health Market", "South Africa Share"],
    datasets: [
      {
        label: "Market Size (USD Billion)",
        data: [3.8, 3.8 * 0.333],
        backgroundColor: "rgba(59, 130, 246, 0.6)", // Blue accent
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: "#e5e7eb", // Light gray for text
        },
      },
      title: {
        display: true,
        text: "African Digital Health Market (2025)",
        color: "#e5e7eb",
        font: { size: 16 },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Market Size (USD Billion)",
          color: "#e5e7eb",
        },
        ticks: { color: "#e5e7eb" },
        grid: { color: "rgba(255, 255, 255, 0.1)" }, // Subtle grid lines
      },
      x: {
        title: {
          display: true,
          text: "Region",
          color: "#e5e7eb",
        },
        ticks: { color: "#e5e7eb" },
        grid: { display: false }, // No vertical grid lines
      },
    },
  };

  return (
    <div className="min-h-screen bg-[#141414] text-gray-200">
      {/* Header Section */}
      <motion.header
        className="py-16 px-6 text-center border-b border-[#2d3748]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}>
        <motion.h1
          className="text-3xl sm:text-4xl font-bold text-white mb-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}>
          About DrugWise
        </motion.h1>
        <motion.p
          className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}>
          DrugWise is revolutionizing medication safety in Africa with
          AI-powered tools to prevent adverse drug interactions, reduce
          healthcare costs, and enhance patient outcomes.
        </motion.p>
      </motion.header>

      {/* Main Content */}
      <motion.section
        className="max-w-4xl mx-auto py-12 px-6 space-y-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}>
        {/* Problem Section */}
        <motion.div
          className="bg-[#1f2937] p-6 rounded-lg shadow-sm border border-[#2d3748]"
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}>
          <h2 className="text-xl font-semibold text-white mb-3">
            The Challenge
          </h2>
          <p className="text-gray-400">
            Patients with chronic conditions or high hospitalization risks face
            significant dangers from adverse drug interactions. These
            preventable issues drive up healthcare costs, with hospital stays in
            South Africa averaging R4000 per night, and increase the risk of
            severe outcomes, including death. The absence of real-time,
            user-friendly tools exacerbates these challenges.
          </p>
        </motion.div>

        {/* Solution Section */}
        <motion.div
          className="bg-[#1f2937] p-6 rounded-lg shadow-sm border border-[#2d3748]"
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true }}>
          <h2 className="text-xl font-semibold text-white mb-3">
            Our Solution
          </h2>
          <ul className="list-disc list-inside text-gray-400 space-y-2">
            <li>
              Real-time alerts for harmful drug-food and drug-drug interactions.
            </li>
            <li>Comprehensive medication tracking to identify hidden risks.</li>
            <li>
              Personalized drug recommendations based on patient profiles.
            </li>
            <li>Patient-friendly interface addressing food sensitivities.</li>
          </ul>
          <p className="text-gray-400 mt-4">
            DrugWise provides intuitive, AI-driven tools to empower patients and
            healthcare providers, ensuring safer medication management.
          </p>
        </motion.div>

        {/* Market Opportunity Section */}
        <motion.div
          className="bg-[#1f2937] p-6 rounded-lg shadow-sm border border-[#2d3748]"
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}>
          <h2 className="text-xl font-semibold text-white mb-3">
            Market Opportunity
          </h2>
          <p className="text-gray-400 mb-4">
            The African digital health market, valued at $3.8 billion, is
            growing at a 23.4% CAGR, with South Africa holding a 33.3% share.
            DrugWise is well-positioned to capture this opportunity by
            delivering innovative medication management solutions.
          </p>
          <div className="max-w-xl mx-auto">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </motion.div>

        {/* Financing Section */}
        <motion.div
          className="bg-[#1f2937] p-6 rounded-lg shadow-sm border border-[#2d3748]"
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          viewport={{ once: true }}>
          <h2 className="text-xl font-semibold text-white mb-3">Financing</h2>
          <p className="text-gray-400 mb-4">
            DrugWise has secured R25,000 in non-dilutive funding via the Hult
            Prize. We anticipate generating R12 million in revenue by selling
            10,000 units in the first year. To scale nationwide, we are raising
            R1 million for device manufacturing and pilot distribution in South
            Africa.
          </p>
          <Link to="/pricing">
            <motion.button
              className="bg-[#3b82f6] text-white font-medium px-5 py-2 rounded-md hover:bg-[#2563eb] transition"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}>
              Support Our Mission
            </motion.button>
          </Link>
        </motion.div>

        {/* Accomplishments Section */}
        <motion.div
          className="bg-[#1f2937] p-6 rounded-lg shadow-sm border border-[#2d3748]"
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}>
          <h2 className="text-xl font-semibold text-white mb-3">
            Accomplishments
          </h2>
          <p className="text-gray-400">
            DrugWise was awarded First Runner-Up in the Hult Prize On Campus
            Competition at the University of Witwatersrand, celebrated for its
            innovative approach and potential for global impact in enhancing
            medication safety.
          </p>
        </motion.div>

        {/* Roadmap Section */}
        <motion.div
          className="bg-[#1f2937] p-6 rounded-lg shadow-sm border border-[#2d3748]"
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          viewport={{ once: true }}>
          <h2 className="text-xl font-semibold text-white mb-3">Our Roadmap</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-white">2025: Launch</h3>
              <p className="text-gray-400">
                Introduce DrugWise’s AI-powered platform to the South African
                market, focusing on patient safety and accessibility.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-white">
                2025: Partnerships
              </h3>
              <p className="text-gray-400">
                Form strategic partnerships with insurance companies to
                integrate DrugWise into healthcare systems, amplifying our reach
                and impact.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.section>
    </div>
  );
}

export default About;
