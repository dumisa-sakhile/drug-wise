import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";

export const Route = createFileRoute("/terms")({
  component: Terms,
});

function Terms() {
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
            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing or using the DrugWise platform, you agree to be
                bound by these Terms of Service ("Terms"). If you do not agree,
                please do not use our services.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">
                2. Description of Service
              </h2>
              <p>
                DrugWise provides an AI-powered pharmacovigilance platform that
                analyzes medical data to detect adverse drug reactions, offering
                real-time alerts and personalized medication recommendations.
                The service may include wearable devices and subscription-based
                features, subject to pricing outlined in our pricing section.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">
                3. User Responsibilities
              </h2>
              <p>
                You agree to provide accurate and complete information when
                using our platform, including health data for accurate analysis.
                You are responsible for maintaining the confidentiality of your
                account credentials and for all activities under your account.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">
                4. Data Privacy and Security
              </h2>
              <p>
                We collect and process health data, including unstructured
                medical texts and patient feedback, in accordance with
                applicable data protection laws. Your data is used solely for
                providing and improving our pharmacovigilance services. Refer to
                our Privacy Policy for details.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">
                5. Limitations of Service
              </h2>
              <p>
                Our platform is designed to enhance medication safety but does
                not replace professional medical advice. We are not liable for
                any adverse drug events resulting from misuse or reliance on our
                services without consulting a healthcare professional.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">
                6. Subscription and Hardware
              </h2>
              <p>
                Some features require a subscription or hardware purchase,
                similar to models like Compass ($99, $14-$19/month) or Plaud
                ($152.10, $80.60-$240/year). We reserve the right to modify
                pricing with prior notice.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">
                7. Intellectual Property
              </h2>
              <p>
                All content, including AI algorithms and software, is owned by
                DrugWise. You may not reproduce, distribute, or modify our
                content without permission.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">
                8. Termination
              </h2>
              <p>
                We may suspend or terminate your access if you violate these
                Terms or misuse the platform. You may terminate your account at
                any time by contacting support.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">
                9. Governing Law
              </h2>
              <p>
                These Terms are governed by the laws of South Africa. Any
                disputes will be resolved in the courts of Johannesburg.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">
                10. Contact Us
              </h2>
              <p>
                For questions about these Terms, contact us.
              </p>
            </section>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}

