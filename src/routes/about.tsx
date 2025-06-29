import { createFileRoute } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import { Users, Server, Globe, Layers, Database } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/about")({
  component: About,
});

function About() {
  const { scrollY } = useScroll();
  const yOffset = useTransform(scrollY, [0, 600], [0, -50]); // Subtle parallax effect
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

  // Utility function to truncate text after a complete sentence
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    const truncated = text.slice(0, maxLength);
    const lastPunctuationIndex = Math.max(
      truncated.lastIndexOf("."),
      truncated.lastIndexOf("!"),
      truncated.lastIndexOf("?")
    );
    return lastPunctuationIndex !== -1
      ? truncated.slice(0, lastPunctuationIndex + 1) + "..."
      : truncated + "...";
  };

  // Variants for staggering animation
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

  return (
    <div className="min-h-screen bg-[#141414] text-gray-200 bg-grid-pattern relative">
      {/* Hero Section */}
      <motion.section
        className="max-w-6xl mx-auto py-16 px-6 text-center relative"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}>
        <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />
        <div className="relative z-10">
          <motion.p
            className="text-base sm:text-lg text-[#d1d5db] mb-6 max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}>
            We are a health-tech startup whose core business is developing and
            maintaining state-of-the-art AI-integrated clinical software
            services and pharmacovigilance tracking and monitoring systems.
          </motion.p>
        </div>
      </motion.section>

      {/* AI Hardware Competitor Analysis */}
      <motion.section
        className="max-w-6xl mx-auto py-12 px-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}>
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-8 text-center">
          AI Hardware Competitor Analysis
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <motion.div
            className="relative group bg-gradient-to-br from-[#1a1a1a]/90 to-[#2a2a2a]/70 backdrop-blur-lg border border-[#ffffff1a] p-4 rounded-xl overflow-hidden hover:scale-95 transition cursor-pointer duration-500"
            variants={itemVariants}
            onClick={() =>
              handleLearnMore({
                title: "Compass",
                fullDescription:
                  "The Compass wearable sells for $99. With the purchase, users receive 10 hours of free recording each month. For usage exceeding 10 hours per month, an unlimited usage plan is available. This plan costs $14 per month when billed yearly or $19 per month when billed monthly.",
              })
            }>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-transparent opacity-50 transition-opacity duration-500 group-hover:animate-gradient-move" />
            <div className="absolute inset-0 border-2 border-transparent rounded-xl animate-shiny-border" />
            <h2 className="text-lg font-bold text-white mb-1">Compass</h2>
            <p className="text-[#d1d5db] text-sm">
              {truncateText(
                "The Compass wearable sells for $99. With the purchase, users receive 10 hours of free recording each month. For usage exceeding 10 hours per month, an unlimited usage plan is available. This plan costs $14 per month when billed yearly or $19 per month when billed monthly.",
                100
              )}
            </p>
          </motion.div>

          <motion.div
            className="relative group bg-gradient-to-br from-[#1a1a1a]/90 to-[#2a2a2a]/70 backdrop-blur-lg border border-[#ffffff1a] p-4 rounded-xl overflow-hidden hover:scale-95 transition cursor-pointer duration-500"
            variants={itemVariants}
            onClick={() =>
              handleLearnMore({
                title: "Plaud",
                fullDescription:
                  "The Plaud wearable AI is priced slightly higher, selling for $152.10 at a sale price, down from its usual price of $169. It offers a free tier that provides 300 minutes (5 hours) of recording per month. However, this free plan does not allow conversations with your transcripts or using the app to chat with the transcriptions. Additional features require a premium subscription, enhancing functionality with advanced transcription and analysis tools.",
              })
            }>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-transparent opacity-50 transition-opacity duration-500 group-hover:animate-gradient-move" />
            <div className="absolute inset-0 border-2 border-transparent rounded-xl animate-shiny-border" />
            <h2 className="text-lg font-bold text-white mb-1">Plaud</h2>
            <p className="text-[#d1d5db] text-sm">
              {truncateText(
                "The Plaud wearable AI is priced slightly higher, selling for $152.10 at a sale price, down from its usual price of $169. It offers a free tier that provides 300 minutes (5 hours) of recording per month. However, this free plan does not allow conversations with your transcripts or using the app to chat with the transcriptions. Additional features require a premium subscription, enhancing functionality with advanced transcription and analysis tools.",
                100
              )}
            </p>
          </motion.div>

          <motion.div
            className="relative group bg-gradient-to-br from-[#1a1a1a]/90 to-[#2a2a2a]/70 backdrop-blur-lg border border-[#ffffff1a] p-4 rounded-xl overflow-hidden hover:scale-95 transition cursor-pointer duration-500"
            variants={itemVariants}
            onClick={() =>
              handleLearnMore({
                title: "Bee",
                fullDescription:
                  "The Bee device is presented as the least expensive option among the dedicated wearables, costing only about $50. Like other models, the Bee has a subscription plan called Bee Premium. This costs $12 per month, offering unlimited recording and advanced analytics, making it a cost-effective choice for users seeking reliable performance on a budget.",
              })
            }>
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/30 to-transparent opacity-50 transition-opacity duration-500 group-hover:animate-gradient-move" />
            <div className="absolute inset-0 border-2 border-transparent rounded-xl animate-shiny-border" />
            <h2 className="text-lg font-bold text-white mb-1">Bee</h2>
            <p className="text-[#d1d5db] text-sm">
              {truncateText(
                "The Bee device is presented as the least expensive option among the dedicated wearables, costing only about $50. Like other models, the Bee has a subscription plan called Bee Premium. This costs $12 per month, offering unlimited recording and advanced analytics, making it a cost-effective choice for users seeking reliable performance on a budget.",
                100
              )}
            </p>
          </motion.div>

          <motion.div
            className="relative group bg-gradient-to-br from-[#1a1a1a]/90 to-[#2a2a2a]/70 backdrop-blur-lg border border-[#ffffff1a] p-4 rounded-xl overflow-hidden hover:scale-95 transition cursor-pointer duration-500"
            variants={itemVariants}
            onClick={() =>
              handleLearnMore({
                title: "Limitless Pendant",
                fullDescription:
                  "The Limitless pendant has a higher entry price. It costs $199 for just the pendant. Alternatively, a bundle including the pendant with an unlimited plan is available for $399. If you purchase only the pendant for $199, you receive 20 hours of recording per month for free, with additional hours available through a subscription model tailored to heavy users.",
              })
            }>
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/30 to-transparent opacity-50 transition-opacity duration-500 group-hover:animate-gradient-move" />
            <div className="absolute inset-0 border-2 border-transparent rounded-xl animate-shiny-border" />
            <h2 className="text-lg font-bold text-white mb-1">
              Limitless Pendant
            </h2>
            <p className="text-[#d1d5db] text-sm">
              {truncateText(
                "The Limitless pendant has a higher entry price. It costs $199 for just the pendant. Alternatively, a bundle including the pendant with an unlimited plan is available for $399. If you purchase only the pendant for $199, you receive 20 hours of recording per month for free, with additional hours available through a subscription model tailored to heavy users.",
                100
              )}
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Technology and Capabilities */}
      <motion.section
        className="max-w-6xl mx-auto py-12 px-6"
        style={{ y: yOffset }}
        initial="hidden"
        animate="visible"
        variants={containerVariants}>
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-8 text-center">
          Technology and Capabilities
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <motion.div
            className="relative group bg-gradient-to-br from-[#1a1a1a]/90 to-[#2a2a2a]/70 backdrop-blur-lg border border-[#ffffff1a] p-4 rounded-xl overflow-hidden hover:scale-95 transition cursor-pointer duration-500"
            variants={itemVariants}
            onClick={() =>
              handleLearnMore({
                title: "AI-Integrated Software",
                fullDescription:
                  "Our AI-integrated clinical software assists healthcare professionals in tasks such as patient diagnosis, treatment planning, and comprehensive data analysis, significantly improving efficiency and accuracy in medical decision-making processes. It leverages advanced machine learning models to provide real-time insights and predictive analytics, tailored to individual patient needs.",
              })
            }>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-transparent opacity-50 transition-opacity duration-500 group-hover:animate-gradient-move" />
            <div className="absolute inset-0 border-2 border-transparent rounded-xl animate-shiny-border" />
            <Users className="h-6 w-6 text-blue-400 mb-1" />
            <h2 className="text-lg font-bold text-white mb-1">AI Software</h2>
            <p className="text-[#d1d5db] text-sm">
              {truncateText(
                "Our AI-integrated clinical software assists healthcare professionals in tasks such as patient diagnosis, treatment planning, and comprehensive data analysis, significantly improving efficiency and accuracy in medical decision-making processes. It leverages advanced machine learning models to provide real-time insights and predictive analytics, tailored to individual patient needs.",
                100
              )}
            </p>
          </motion.div>

          <motion.div
            className="relative group bg-gradient-to-br from-[#1a1a1a]/90 to-[#2a2a2a]/70 backdrop-blur-lg border border-[#ffffff1a] p-4 rounded-xl overflow-hidden hover:scale-95 transition cursor-pointer duration-500"
            variants={itemVariants}
            onClick={() =>
              handleLearnMore({
                title: "Data Analysis",
                fullDescription:
                  "We analyze extensive datasets of health-related information, including patient health records, clinical studies, and real-time feedback from both patients and healthcare professionals, enabling thorough monitoring and the identification of critical health patterns. Our system employs advanced statistical models and AI algorithms to detect trends and anomalies, supporting proactive healthcare interventions.",
              })
            }>
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/30 to-transparent opacity-50 transition-opacity duration-500 group-hover:animate-gradient-move" />
            <div className="absolute inset-0 border-2 border-transparent rounded-xl animate-shiny-border" />
            <Server className="h-6 w-6 text-green-400 mb-1" />
            <h2 className="text-lg font-bold text-white mb-1">Data Analysis</h2>
            <p className="text-[#d1d5db] text-sm">
              {truncateText(
                "We analyze extensive datasets of health-related information, including patient health records, clinical studies, and real-time feedback from both patients and healthcare professionals, enabling thorough monitoring and the identification of critical health patterns. Our system employs advanced statistical models and AI algorithms to detect trends and anomalies, supporting proactive healthcare interventions.",
                100
              )}
            </p>
          </motion.div>

          <motion.div
            className="relative group bg-gradient-to-br from-[#1a1a1a]/90 to-[#2a2a2a]/70 backdrop-blur-lg border border-[#ffffff1a] p-4 rounded-xl overflow-hidden hover:scale-95 transition cursor-pointer duration-500"
            variants={itemVariants}
            onClick={() =>
              handleLearnMore({
                title: "Natural Language Processing",
                fullDescription:
                  "Our Natural Language Processing technology enables computers to analyze, understand, and derive meaningful insights from human language, particularly by extracting valuable information from unstructured medical notes and reports to support clinical decision-making. This includes sentiment analysis, entity recognition, and context-aware interpretation to enhance diagnostic accuracy.",
              })
            }>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-transparent opacity-50 transition-opacity duration-500 group-hover:animate-gradient-move" />
            <div className="absolute inset-0 border-2 border-transparent rounded-xl animate-shiny-border" />
            <Globe className="h-6 w-6 text-purple-400 mb-1" />
            <h2 className="text-lg font-bold text-white mb-1">NLP</h2>
            <p className="text-[#d1d5db] text-sm">
              {truncateText(
                "Our Natural Language Processing technology enables computers to analyze, understand, and derive meaningful insights from human language, particularly by extracting valuable information from unstructured medical notes and reports to support clinical decision-making. This includes sentiment analysis, entity recognition, and context-aware interpretation to enhance diagnostic accuracy.",
                100
              )}
            </p>
          </motion.div>

          <motion.div
            className="relative group bg-gradient-to-br from-[#1a1a1a]/90 to-[#2a2a2a]/70 backdrop-blur-lg border border-[#ffffff1a] p-4 rounded-xl overflow-hidden hover:scale-95 transition cursor-pointer duration-500"
            variants={itemVariants}
            onClick={() =>
              handleLearnMore({
                title: "Adverse Event Tracking",
                fullDescription:
                  "Our systems are specifically designed to systematically collect and analyze detailed reports of suspected adverse drug reactions, providing a robust framework for conducting thorough investigations into their potential causes and impacts. This includes real-time alerts and comprehensive reporting to regulatory bodies for improved drug safety.",
              })
            }>
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500/30 to-transparent opacity-50 transition-opacity duration-500 group-hover:animate-gradient-move" />
            <div className="absolute inset-0 border-2 border-transparent rounded-xl animate-shiny-border" />
            <Layers className="h-6 w-6 text-teal-400 mb-1" />
            <h2 className="text-lg font-bold text-white mb-1">
              Event Tracking
            </h2>
            <p className="text-[#d1d5db] text-sm">
              {truncateText(
                "Our systems are specifically designed to systematically collect and analyze detailed reports of suspected adverse drug reactions, providing a robust framework for conducting thorough investigations into their potential causes and impacts. This includes real-time alerts and comprehensive reporting to regulatory bodies for improved drug safety.",
                100
              )}
            </p>
          </motion.div>

          <motion.div
            className="relative group bg-gradient-to-br from-[#1a1a1a]/90 to-[#2a2a2a]/70 backdrop-blur-lg border border-[#ffffff1a] p-4 rounded-xl overflow-hidden hover:scale-95 transition cursor-pointer duration-500"
            variants={itemVariants}
            onClick={() =>
              handleLearnMore({
                title: "Research Support",
                fullDescription:
                  "This data is further utilized to refine our existing systems and to build comprehensive datasets that support ongoing vaccination research, contributing to advancements in drug discovery and the development of safer medical treatments. Our research tools facilitate collaboration with global health organizations to accelerate innovation.",
              })
            }>
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/30 to-transparent opacity-50 transition-opacity duration-500 group-hover:animate-gradient-move" />
            <div className="absolute inset-0 border-2 border-transparent rounded-xl animate-shiny-border" />
            <Database className="h-6 w-6 text-red-400 mb-1" />
            <h2 className="text-lg font-bold text-white mb-1">
              Research Support
            </h2>
            <p className="text-[#d1d5db] text-sm">
              {truncateText(
                "This data is further utilized to refine our existing systems and to build comprehensive datasets that support ongoing vaccination research, contributing to advancements in drug discovery and the development of safer medical treatments. Our research tools facilitate collaboration with global health organizations to accelerate innovation.",
                100
              )}
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Data Integration and Impact */}
      <motion.section
        className="max-w-6xl mx-auto py-12 px-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}>
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-8 text-center">
          Data Integration and Impact
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <motion.div
            className="relative group bg-gradient-to-br from-[#1a1a1a]/90 to-[#2a2a2a]/70 backdrop-blur-lg border border-[#ffffff1a] p-4 rounded-xl overflow-hidden hover:scale-95 transition cursor-pointer duration-500"
            variants={itemVariants}
            onClick={() =>
              handleLearnMore({
                title: "Multi-Source Data",
                fullDescription:
                  "DrugWise integrates safety information by utilizing data from multiple sources, including patient-reported symptoms and recovery tracking post-medication intake, detailed clinical notes from healthcare providers, and comprehensive reports from regulatory agencies and drug manufacturers. This holistic approach ensures a complete view of drug safety profiles.",
              })
            }>
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/30 to-transparent opacity-50 transition-opacity duration-500 group-hover:animate-gradient-move" />
            <div className="absolute inset-0 border-2 border-transparent rounded-xl animate-shiny-border" />
            <Globe className="h-6 w-6 text-indigo-400 mb-1" />
            <h2 className="text-lg font-bold text-white mb-1">
              Multi-Source Data
            </h2>
            <p className="text-[#d1d5db] text-sm">
              {truncateText(
                "DrugWise integrates safety information by utilizing data from multiple sources, including patient-reported symptoms and recovery tracking post-medication intake, detailed clinical notes from healthcare providers, and comprehensive reports from regulatory agencies and drug manufacturers. This holistic approach ensures a complete view of drug safety profiles.",
                100
              )}
            </p>
          </motion.div>

          <motion.div
            className="relative group bg-gradient-to-br from-[#1a1a1a]/90 to-[#2a2a2a]/70 backdrop-blur-lg border border-[#ffffff1a] p-4 rounded-xl overflow-hidden hover:scale-95 transition cursor-pointer duration-500"
            variants={itemVariants}
            onClick={() =>
              handleLearnMore({
                title: "Vaccination Research",
                fullDescription:
                  "Our work in vaccination research involves studying vaccines to improve their development, effectiveness, and safety profiles, often leveraging collected data to identify potential side effects and to enhance vaccine design for better public health outcomes. We collaborate with health experts to ensure rapid response to emerging health threats.",
              })
            }>
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/30 to-transparent opacity-50 transition-opacity duration-500 group-hover:animate-gradient-move" />
            <div className="absolute inset-0 border-2 border-transparent rounded-xl animate-shiny-border" />
            <Layers className="h-6 w-6 text-yellow-400 mb-1" />
            <h2 className="text-lg font-bold text-white mb-1">
              Vaccination Research
            </h2>
            <p className="text-[#d1d5db] text-sm">
              {truncateText(
                "Our work in vaccination research involves studying vaccines to improve their development, effectiveness, and safety profiles, often leveraging collected data to identify potential side effects and to enhance vaccine design for better public health outcomes. We collaborate with health experts to ensure rapid response to emerging health threats.",
                100
              )}
            </p>
          </motion.div>

          <motion.div
            className="relative group bg-gradient-to-br from-[#1a1a1a]/90 to-[#2a2a2a]/70 backdrop-blur-lg border border-[#ffffff1a] p-4 rounded-xl overflow-hidden hover:scale-95 transition cursor-pointer duration-500"
            variants={itemVariants}
            onClick={() =>
              handleLearnMore({
                title: "Public Health",
                fullDescription:
                  "This initiative refers to the science and practice of protecting and improving the health of communities through targeted education, the implementation of effective health policies, and ongoing research aimed at preventing disease and promoting safe and healthy practices across populations. Our efforts focus on reducing health disparities and improving access to care.",
              })
            }>
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500/30 to-transparent opacity-50 transition-opacity duration-500 group-hover:animate-gradient-move" />
            <div className="absolute inset-0 border-2 border-transparent rounded-xl animate-shiny-border" />
            <Users className="h-6 w-6 text-pink-400 mb-1" />
            <h2 className="text-lg font-bold text-white mb-1">Public Health</h2>
            <p className="text-[#d1d5db] text-sm">
              {truncateText(
                "This initiative refers to the science and practice of protecting and improving the health of communities through targeted education, the implementation of effective health policies, and ongoing research aimed at preventing disease and promoting safe and healthy practices across populations. Our efforts focus on reducing health disparities and improving access to care.",
                100
              )}
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Technical Challenges and Solutions */}
      <motion.section
        className="max-w-6xl mx-auto py-12 px-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}>
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-8 text-center">
          Technical Challenges and Solutions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <motion.div
            className="relative group bg-gradient-to-br from-[#1a1a1a]/90 to-[#2a2a2a]/70 backdrop-blur-lg border border-[#ffffff1a] p-4 rounded-xl overflow-hidden hover:scale-95 transition cursor-pointer duration-500"
            variants={itemVariants}
            onClick={() =>
              handleLearnMore({
                title: "Recording Reliability",
                fullDescription:
                  "One of the primary challenges is ensuring the reliable capture of audio data and making the processed information readily accessible to users. This issue was notably evident with the Compass device, which failed to function properly, resulting in the app screen becoming stuck in a loading state indefinitely. Our solution includes a robust pipeline for seamless processing and data access.",
              })
            }>
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/30 to-transparent opacity-50 transition-opacity duration-500 group-hover:animate-gradient-move" />
            <div className="absolute inset-0 border-2 border-transparent rounded-xl animate-shiny-border" />
            <Server className="h-6 w-6 text-indigo-400 mb-1" />
            <h2 className="text-lg font-bold text-white mb-1">
              Recording Reliability
            </h2>
            <p className="text-[#d1d5db] text-sm">
              {truncateText(
                "One of the primary challenges is ensuring the reliable capture of audio data and making the processed information readily accessible to users. This issue was notably evident with the Compass device, which failed to function properly, resulting in the app screen becoming stuck in a loading state indefinitely. Our solution includes a robust pipeline for seamless processing and data access.",
                100
              )}
            </p>
          </motion.div>

          <motion.div
            className="relative group bg-gradient-to-br from-[#1a1a1a]/90 to-[#2a2a2a]/70 backdrop-blur-lg border border-[#ffffff1a] p-4 rounded-xl overflow-hidden hover:scale-95 transition cursor-pointer duration-500"
            variants={itemVariants}
            onClick={() =>
              handleLearnMore({
                title: "Battery Life",
                fullDescription:
                  "Another significant challenge is the inconsistent battery performance of wearable devices, often requiring frequent recharging to maintain functionality. For instance, the Limitless Pendant was observed to last approximately one day, necessitating nightly charging to remain operational. Our optimized power management extends battery life significantly.",
              })
            }>
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/30 to-transparent opacity-50 transition-opacity duration-500 group-hover:animate-gradient-move" />
            <div className="absolute inset-0 border-2 border-transparent rounded-xl animate-shiny-border" />
            <Globe className="h-6 w-6 text-yellow-400 mb-1" />
            <h2 className="text-lg font-bold text-white mb-1">Battery Life</h2>
            <p className="text-[#d1d5db] text-sm">
              {truncateText(
                "Another significant challenge is the inconsistent battery performance of wearable devices, often requiring frequent recharging to maintain functionality. For instance, the Limitless Pendant was observed to last approximately one day, necessitating nightly charging to remain operational. Our optimized power management extends battery life significantly.",
                100
              )}
            </p>
          </motion.div>

          <motion.div
            className="relative group bg-gradient-to-br from-[#1a1a1a]/90 to-[#2a2a2a]/70 backdrop-blur-lg border border-[#ffffff1a] p-4 rounded-xl overflow-hidden hover:scale-95 transition cursor-pointer duration-500"
            variants={itemVariants}
            onClick={() =>
              handleLearnMore({
                title: "Application Stability",
                fullDescription:
                  "Problems with the stability of mobile applications and the backend AI processing systems have been a recurring issue. A notable example is the Compass app, which experienced a critical failure state where it became stuck in a loading loop, rendering it unusable. We enhance stability with rigorous testing and regular updates.",
              })
            }>
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500/30 to-transparent opacity-50 transition-opacity duration-500 group-hover:animate-gradient-move" />
            <div className="absolute inset-0 border-2 border-transparent rounded-xl animate-shiny-border" />
            <Layers className="h-6 w-6 text-pink-400 mb-1" />
            <h2 className="text-lg font-bold text-white mb-1">App Stability</h2>
            <p className="text-[#d1d5db] text-sm">
              {truncateText(
                "Problems with the stability of mobile applications and the backend AI processing systems have been a recurring issue. A notable example is the Compass app, which experienced a critical failure state where it became stuck in a loading loop, rendering it unusable. We enhance stability with rigorous testing and regular updates.",
                100
              )}
            </p>
          </motion.div>

          <motion.div
            className="relative group bg-gradient-to-br from-[#1a1a1a]/90 to-[#2a2a2a]/70 backdrop-blur-lg border border-[#ffffff1a] p-4 rounded-xl overflow-hidden hover:scale-95 transition cursor-pointer duration-500"
            variants={itemVariants}
            onClick={() =>
              handleLearnMore({
                title: "Audio Capture",
                fullDescription:
                  "Capturing clean and clear audio in real-world environments with significant background noise has proven to be challenging, negatively impacting both the playback quality and the accuracy of AI interpretation of the recorded data. We use advanced directional audio capture and noise filtering to improve quality.",
              })
            }>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-transparent opacity-50 transition-opacity duration-500 group-hover:animate-gradient-move" />
            <div className="absolute inset-0 border-2 border-transparent rounded-xl animate-shiny-border" />
            <Database className="h-6 w-6 text-blue-400 mb-1" />
            <h2 className="text-lg font-bold text-white mb-1">Audio Capture</h2>
            <p className="text-[#d1d5db] text-sm">
              {truncateText(
                "Capturing clean and clear audio in real-world environments with significant background noise has proven to be challenging, negatively impacting both the playback quality and the accuracy of AI interpretation of the recorded data. We use advanced directional audio capture and noise filtering to improve quality.",
                100
              )}
            </p>
          </motion.div>

          <motion.div
            className="relative group bg-gradient-to-br from-[#1a1a1a]/90 to-[#2a2a2a]/70 backdrop-blur-lg border border-[#ffffff1a] p-4 rounded-xl overflow-hidden hover:scale-95 transition cursor-pointer duration-500"
            variants={itemVariants}
            onClick={() =>
              handleLearnMore({
                title: "Design Usability",
                fullDescription:
                  "The physical form factor and design choices of wearable devices have created usability barriers, such as accidental recordings and difficulties in determining the device's operational state, which have frustrated users. Our redesign includes an intuitive form factor and clear feedback indicators.",
              })
            }>
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/30 to-transparent opacity-50 transition-opacity duration-500 group-hover:animate-gradient-move" />
            <div className="absolute inset-0 border-2 border-transparent rounded-xl animate-shiny-border" />
            <Users className="h-6 w-6 text-green-400 mb-1" />
            <h2 className="text-lg font-bold text-white mb-1">
              Design Usability
            </h2>
            <p className="text-[#d1d5db] text-sm">
              {truncateText(
                "The physical form factor and design choices of wearable devices have created usability barriers, such as accidental recordings and difficulties in determining the device's operational state, which have frustrated users. Our redesign includes an intuitive form factor and clear feedback indicators.",
                100
              )}
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Commended Features */}
      <motion.section
        className="max-w-6xl mx-auto py-12 px-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}>
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-8 text-center">
          Commended Features
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <motion.div
            className="relative group bg-gradient-to-br from-[#1a1a1a]/90 to-[#2a2a2a]/70 backdrop-blur-lg border border-[#ffffff1a] p-4 rounded-xl overflow-hidden hover:scale-95 transition cursor-pointer duration-500"
            variants={itemVariants}
            onClick={() =>
              handleLearnMore({
                title: "Plaud AI",
                fullDescription:
                  "The Plaud AI device has been commended for its variety of wearable accessories, which offer users flexibility, and for its ability to record audio effectively during testing, with the companion application successfully pulling in notes for review and analysis. Users appreciate its seamless integration with daily workflows.",
              })
            }>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-transparent opacity-50 transition-opacity duration-500 group-hover:animate-gradient-move" />
            <div className="absolute inset-0 border-2 border-transparent rounded-xl animate-shiny-border" />
            <Layers className="h-6 w-6 text-purple-400 mb-1" />
            <h2 className="text-lg font-bold text-white mb-1">Plaud AI</h2>
            <p className="text-[#d1d5db] text-sm">
              {truncateText(
                "The Plaud AI device has been commended for its variety of wearable accessories, which offer users flexibility, and for its ability to record audio effectively during testing, with the companion application successfully pulling in notes for review and analysis. Users appreciate its seamless integration with daily workflows.",
                100
              )}
            </p>
          </motion.div>

          <motion.div
            className="relative group bg-gradient-to-br from-[#1a1a1a]/90 to-[#2a2a2a]/70 backdrop-blur-lg border border-[#ffffff1a] p-4 rounded-xl overflow-hidden hover:scale-95 transition cursor-pointer duration-500"
            variants={itemVariants}
            onClick={() =>
              handleLearnMore({
                title: "Bee",
                fullDescription:
                  "The Bee device stands out as the least expensive option among dedicated wearables, offering the best battery life by recording continuously for two days, and features a nice, clean application interface with a range of useful functionalities that enhance user experience. Its affordability makes it widely accessible.",
              })
            }>
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500/30 to-transparent opacity-50 transition-opacity duration-500 group-hover:animate-gradient-move" />
            <div className="absolute inset-0 border-2 border-transparent rounded-xl animate-shiny-border" />
            <Server className="h-6 w-6 text-teal-400 mb-1" />
            <h2 className="text-lg font-bold text-white mb-1">Bee</h2>
            <p className="text-[#d1d5db] text-sm">
              {truncateText(
                "The Bee device stands out as the least expensive option among dedicated wearables, offering the best battery life by recording continuously for two days, and features a nice, clean application interface with a range of useful functionalities that enhance user experience. Its affordability makes it widely accessible.",
                100
              )}
            </p>
          </motion.div>

          <motion.div
            className="relative group bg-gradient-to-br from-[#1a1a1a]/90 to-[#2a2a2a]/70 backdrop-blur-lg border border-[#ffffff1a] p-4 rounded-xl overflow-hidden hover:scale-95 transition cursor-pointer duration-500"
            variants={itemVariants}
            onClick={() =>
              handleLearnMore({
                title: "Limitless Pendant",
                fullDescription:
                  "The Limitless Pendant is appreciated for its decent application, which includes practical features such as swiping to view different dates, a calendar view for easy navigation, and a speaker button that allows users to play back recorded audio conveniently. Its user-friendly design appeals to a broad audience.",
              })
            }>
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/30 to-transparent opacity-50 transition-opacity duration-500 group-hover:animate-gradient-move" />
            <div className="absolute inset-0 border-2 border-transparent rounded-xl animate-shiny-border" />
            <Database className="h-6 w-6 text-red-400 mb-1" />
            <h2 className="text-lg font-bold text-white mb-1">
              Limitless Pendant
            </h2>
            <p className="text-[#d1d5db] text-sm">
              {truncateText(
                "The Limitless Pendant is appreciated for its decent application, which includes practical features such as swiping to view different dates, a calendar view for easy navigation, and a speaker button that allows users to play back recorded audio conveniently. Its user-friendly design appeals to a broad audience.",
                100
              )}
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
              className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300">
              Close
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default About;