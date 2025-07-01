import { createFileRoute } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import { Users, Server, Globe, Layers, Database } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const { scrollY } = useScroll();
  const yOffset = useTransform(scrollY, [0, 600], [0, -50]);

  type LearnMoreItem = {
    title: string;
    fullDescription: string;
  };

  const [selectedItem, setSelectedItem] = useState<LearnMoreItem | null>(null);

  const handleLearnMore = (item: LearnMoreItem) => {
    setSelectedItem(item);
  };

  const closePopup = () => {
    setSelectedItem(null);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

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

  return (
    <div className="min-h-screen bg-inherit text-gray-200 bg-grid-pattern">
      {/* Hero Section */}
      <motion.section
        className="max-w-7xl mx-auto py-10 px-6 text-center relative"
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
        
        </div>
      </motion.section>

      {/* Grid Section */}
      <motion.section
        className="max-w-7xl -mt-10 mx-auto py-16 px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0, duration: 0.8 }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[minmax(12rem,1fr)] justify-items-center max-w-5xl mx-auto">
          {gridItems.map((item, index) => (
            <motion.div
              key={item.title}
              className={`relative group bg-gradient-to-br from-[#1a1a1a]/90 to-[#2a2a2a]/70 backdrop-blur-lg border border-[#ffffff1a] p-8 rounded-xl overflow-hidden hover:scale-95 transition cursor-crosshair duration-500 w-full min-h-64 ${item.span}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.2, duration: 0.5 }}
              viewport={{ once: true }}>
              <div
                className={`absolute inset-0 bg-gradient-to-r ${item.gradient} to-transparent opacity-50 animate-gradient-flow`}
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

      {/* Technology and Capabilities */}
      <motion.section
        className="max-w-7xl mx-auto py-16 px-6"
        style={{ y: yOffset }}
        initial="hidden"
        animate="visible"
        variants={containerVariants}>
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-8 text-center">
          Technology and Capabilities
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          <motion.div
            className="relative group bg-gradient-to-br from-[#1a1a1a]/90 to-[#2a2a2a]/70 backdrop-blur-lg border border-[#ffffff1a] p-6 rounded-xl overflow-hidden hover:scale-95 transition cursor-pointer duration-500 h-64"
            variants={itemVariants}
            onClick={() =>
              handleLearnMore({
                title: "AI-Integrated Software",
                fullDescription:
                  "Our AI-integrated clinical software assists healthcare professionals in tasks such as patient diagnosis, treatment planning, and comprehensive data analysis, significantly improving efficiency and accuracy in medical decision-making processes. It leverages advanced machine learning models to provide real-time insights and predictive analytics, tailored to individual patient needs.",
              })
            }>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-transparent opacity-50 animate-gradient-flow" />
            <div className="absolute inset-0 border-2 border-transparent rounded-xl animate-shiny-border" />
            <Users className="h-6 w-6 text-blue-400 mb-1" />
            <h2 className="text-lg font-bold text-white mb-1">AI Software</h2>
            <p className="text-[#d1d5db] text-sm">
              AI-driven clinical software enhances diagnosis, treatment
              planning, and data analysis for healthcare professionals,
              improving efficiency and patient outcomes.
            </p>
          </motion.div>

          <motion.div
            className="relative group bg-gradient-to-br from-[#1a1a1a]/90 to-[#2a2a2a]/70 backdrop-blur-lg border border-[#ffffff1a] p-6 rounded-xl overflow-hidden hover:scale-95 transition cursor-pointer duration-500 h-64"
            variants={itemVariants}
            onClick={() =>
              handleLearnMore({
                title: "Data Analysis",
                fullDescription:
                  "We analyze extensive datasets of health-related information, including patient health records, clinical studies, and real-time feedback from both patients and healthcare professionals, enabling thorough monitoring and the identification of critical health patterns. Our system employs advanced statistical models and AI algorithms to detect trends and anomalies, supporting proactive healthcare interventions.",
              })
            }>
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/30 to-transparent opacity-50 animate-gradient-flow" />
            <div className="absolute inset-0 border-2 border-transparent rounded-xl animate-shiny-border" />
            <Server className="h-6 w-6 text-green-400 mb-1" />
            <h2 className="text-lg font-bold text-white mb-1">Data Analysis</h2>
            <p className="text-[#d1d5db] text-sm">
              Analyzes health datasets, including patient records and clinical
              studies, to monitor trends and identify critical patterns for
              proactive healthcare.
            </p>
          </motion.div>

          <motion.div
            className="relative group bg-gradient-to-br from-[#1a1a1a]/90 to-[#2a2a2a]/70 backdrop-blur-lg border border-[#ffffff1a] p-6 rounded-xl overflow-hidden hover:scale-95 transition cursor-pointer duration-500 h-64"
            variants={itemVariants}
            onClick={() =>
              handleLearnMore({
                title: "Natural Language Processing",
                fullDescription:
                  "Our Natural Language Processing technology enables computers to analyze, understand, and derive meaningful insights from human language, particularly by extracting valuable information from unstructured medical notes and reports to support clinical decision-making. This includes sentiment analysis, entity recognition, and context-aware interpretation to enhance diagnostic accuracy.",
              })
            }>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-transparent opacity-50 animate-gradient-flow" />
            <div className="absolute inset-0 border-2 border-transparent rounded-xl animate-shiny-border" />
            <Globe className="h-6 w-6 text-purple-400 mb-1" />
            <h2 className="text-lg font-bold text-white mb-1">NLP</h2>
            <p className="text-[#d1d5db] text-sm">
              NLP extracts insights from medical notes to support clinical
              decisions with sentiment analysis and context-aware
              interpretation.
            </p>
          </motion.div>

          <motion.div
            className="relative group bg-gradient-to-br from-[#1a1a1a]/90 to-[#2a2a2a]/70 backdrop-blur-lg border border-[#ffffff1a] p-6 rounded-xl overflow-hidden hover:scale-95 transition cursor-pointer duration-500 h-64"
            variants={itemVariants}
            onClick={() =>
              handleLearnMore({
                title: "Adverse Event Tracking",
                fullDescription:
                  "Our systems are specifically designed to systematically collect and analyze detailed reports of suspected adverse drug reactions, providing a robust framework for conducting thorough investigations into their potential causes and impacts. This includes real-time alerts and comprehensive reporting to regulatory bodies for improved drug safety.",
              })
            }>
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500/30 to-transparent opacity-50 animate-gradient-flow" />
            <div className="absolute inset-0 border-2 border-transparent rounded-xl animate-shiny-border" />
            <Layers className="h-6 w-6 text-teal-400 mb-1" />
            <h2 className="text-lg font-bold text-white mb-1">
              Event Tracking
            </h2>
            <p className="text-[#d1d5db] text-sm">
              Collects and analyzes adverse drug reaction reports, providing
              real-time alerts and regulatory reporting for enhanced drug
              safety.
            </p>
          </motion.div>

          <motion.div
            className="relative group bg-gradient-to-br from-[#1a1a1a]/90 to-[#2a2a2a]/70 backdrop-blur-lg border border-[#ffffff1a] p-6 rounded-xl overflow-hidden hover:scale-95 transition cursor-pointer duration-500 h-64"
            variants={itemVariants}
            onClick={() =>
              handleLearnMore({
                title: "Research Support",
                fullDescription:
                  "This data is further utilized to refine our existing systems and to build comprehensive datasets that support ongoing vaccination research, contributing to advancements in drug discovery and the development of safer medical treatments. Our research tools facilitate collaboration with global health organizations to accelerate innovation.",
              })
            }>
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/30 to-transparent opacity-50 animate-gradient-flow" />
            <div className="absolute inset-0 border-2 border-transparent rounded-xl animate-shiny-border" />
            <Database className="h-6 w-6 text-red-400 mb-1" />
            <h2 className="text-lg font-bold text-white mb-1">
              Research Support
            </h2>
            <p className="text-[#d1d5db] text-sm">
              Supports vaccination research with comprehensive datasets, driving
              drug discovery and safer treatments through global health
              collaborations.
            </p>
          </motion.div>

          <motion.div
            className="relative group bg-gradient-to-br from-[#1a1a1a]/90 to-[#2a2a2a]/70 backdrop-blur-lg border border-[#ffffff1a] p-6 rounded-xl overflow-hidden hover:scale-95 transition cursor-pointer duration-500 h-64"
            variants={itemVariants}
            onClick={() =>
              handleLearnMore({
                title: "Multi-Source Data",
                fullDescription:
                  "DrugWise integrates safety information by utilizing data from multiple sources, including patient-reported symptoms and recovery tracking post-medication intake, detailed clinical notes from healthcare providers, and comprehensive reports from regulatory agencies and drug manufacturers. This holistic approach ensures a complete view of drug safety profiles.",
              })
            }>
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/30 to-transparent opacity-50 animate-gradient-flow" />
            <div className="absolute inset-0 border-2 border-transparent rounded-xl animate-shiny-border" />
            <Globe className="h-6 w-6 text-indigo-400 mb-1" />
            <h2 className="text-lg font-bold text-white mb-1">
              Multi-Source Data
            </h2>
            <p className="text-[#d1d5db] text-sm">
              Integrates patient symptoms, clinical notes, and regulatory
              reports for a comprehensive view of drug safety profiles.
            </p>
          </motion.div>

          <motion.div
            className="relative group bg-gradient-to-br from-[#1a1a1a]/90 to-[#2a2a2a]/70 backdrop-blur-lg border border-[#ffffff1a] p-6 rounded-xl overflow-hidden hover:scale-95 transition cursor-pointer duration-500 h-64"
            variants={itemVariants}
            onClick={() =>
              handleLearnMore({
                title: "Vaccination Research",
                fullDescription:
                  "Our work in vaccination research involves studying vaccines to improve their development, effectiveness, and safety profiles, often leveraging collected data to identify potential side effects and to enhance vaccine design for better public health outcomes. We collaborate with health experts to ensure rapid response to emerging health threats.",
              })
            }>
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/30 to-transparent opacity-50 animate-gradient-flow" />
            <div className="absolute inset-0 border-2 border-transparent rounded-xl animate-shiny-border" />
            <Layers className="h-6 w-6 text-yellow-400 mb-1" />
            <h2 className="text-lg font-bold text-white mb-1">
              Vaccination Research
            </h2>
            <p className="text-[#d1d5db] text-sm">
              Enhances vaccine development and safety through data-driven
              research and collaboration with health experts.
            </p>
          </motion.div>

          <motion.div
            className="relative group bg-gradient-to-br from-[#1a1a1a]/90 to-[#2a2a2a]/70 backdrop-blur-lg border border-[#ffffff1a] p-6 rounded-xl overflow-hidden hover:scale-95 transition cursor-pointer duration-500 h-64"
            variants={itemVariants}
            onClick={() =>
              handleLearnMore({
                title: "Public Health",
                fullDescription:
                  "This initiative refers to the science and practice of protecting and improving the health of communities through targeted education, the implementation of effective health policies, and ongoing research aimed at preventing disease and promoting safe and healthy practices across populations. Our efforts focus on reducing health disparities and improving access to care.",
              })
            }>
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500/30 to-transparent opacity-50 animate-gradient-flow" />
            <div className="absolute inset-0 border-2 border-transparent rounded-xl animate-shiny-border" />
            <Users className="h-6 w-6 text-pink-400 mb-1" />
            <h2 className="text-lg font-bold text-white mb-1">Public Health</h2>
            <p className="text-[#d1d5db] text-sm">
              Promotes community health through education, policies, and
              research to prevent disease and reduce health disparities.
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Popup */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur flex items-center justify-center z-50">
          <motion.div
            className="bg-[#1a1a1a]/90 p-6 rounded-lg max-w-md w-full text-white border border-[#ffffff1a] shadow-lg"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}>
            <h3 className="text-2xl font-bold mb-4">{selectedItem.title}</h3>
            <p className="text-[#d1d5db] text-base mb-4">
              {selectedItem.fullDescription}
            </p>
            <button
              onClick={closePopup}
              className="mt-4 w-full bg-lime-600 hover:bg-lime-700 text-black font-light py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300"
              style={{
                borderRadius: "8px",
              }}>
              Okay
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
