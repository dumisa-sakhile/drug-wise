import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";

export const Route = createFileRoute("/terms")({
  component: Terms,
});

function Terms() {
  const sections = [
    {
      title: "1. Acceptance of Terms",
      content:
        "By accessing or using the DrugWise platform, you agree to be bound by these Terms of Service (\"Terms\"). If you do not agree, please do not use our services.",
    },
    {
      title: "2. Description of Service",
      content:
        "DrugWise provides an AI-powered pharmacovigilance platform that analyzes medical data to detect adverse drug reactions, offering real-time alerts and personalized medication recommendations. The service may include wearable devices and subscription-based features, subject to pricing outlined in our pricing section.",
    },
    {
      title: "3. User Responsibilities",
      content:
        "You agree to provide accurate and complete information when using our platform, including health data for accurate analysis. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.",
    },
    {
      title: "4. Data Privacy and Security",
      content:
        "We collect and process health data, including unstructured medical texts and patient feedback, in accordance with applicable data protection laws. Your data is used solely for providing and improving our pharmacovigilance services. Refer to our Privacy Policy for details.",
    },
    {
      title: "5. Limitations of Service",
      content:
        "Our platform is designed to enhance medication safety but does not replace professional medical advice. We are not liable for any adverse drug events resulting from misuse or reliance on our services without consulting a healthcare professional.",
    },
    {
      title: "6. Subscription and Hardware",
      content:
        "Some features require a subscription or hardware purchase, similar to models like Compass ($99, $14-$19/month) or Plaud ($152.10, $80.60-$240/year). We reserve the right to modify pricing with prior notice.",
    },
    {
      title: "7. Intellectual Property",
      content:
        "All content, including AI algorithms and software, is owned by DrugWise. You may not reproduce, distribute, or modify our content without permission.",
    },
    {
      title: "8. Termination",
      content:
        "We may suspend or terminate your access if you violate these Terms or misuse the platform. You may terminate your account at any time by contacting support.",
    },
    {
      title: "9. Governing Law",
      content:
        "These Terms are governed by the laws of South Africa. Any disputes will be resolved in the courts of Johannesburg.",
    },
    {
      title: "10. Contact Us",
      content: "For questions about these Terms, contact us.",
    },
  ];

  return (
    <>
      <title>DrugWise - Terms</title>
      <motion.div
        className="min-h-screen bg-inherit text-gray-200 bg-grid-pattern py-12 px-6"
        initial={{ opacity: 0, y: 50 }}
        animate={{
          opacity: 1,
          y: 0,
          transition: { type: "spring", stiffness: 100, damping: 20 },
        }}
        transition={{ duration: 0.8 }}>
        <div className="max-w-4xl mx-auto">
          <motion.h1
            className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-red-400 to-orange-600 bg-clip-text text-transparent text-center mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}>
            Terms of Service
          </motion.h1>
          <motion.div
            className="text-gray-300 text-base sm:text-lg space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}>
            {sections.map((section, index) => (
              <motion.section
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.1, duration: 0.5 }}>
                <h2 className="text-2xl font-semibold text-white mb-3">
                  {section.title}
                </h2>
                <p>{section.content}</p>
              </motion.section>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}