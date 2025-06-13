import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  

  return (
    <div className="min-h-screen bg-inherit text-gray-200 bg-grid-pattern">
   
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto py-16 px-6 text-center relative">
        <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center bg-yellow-500 text-black text-sm font-semibold px-3 py-1 rounded-full mb-6">
            * POWERED BY AI *
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-4">
            Safest Medication Management with DrugWise
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Protect patients from costly hospital stays (R4000/night) caused by
            adverse drug interactions with real-time insights.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/pricing">
              <button className="bg-white text-black font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition">
                Get Started
              </button>
            </Link>
            <Link to="/model">
              <button className="bg-transparent border border-white text-white font-semibold px-6 py-3 rounded-lg hover:bg-gray-700 transition">
                See Model
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Bento Grids */}
      <section className="max-w-6xl mx-auto py-12 px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 *:cursor-crosshair">
          {/* Problem */}
          <div className="bg-blue-900 p-6 rounded-lg glow-effect hover:scale-105 hover:brightness-110 transition-transform duration-300">
            <h2 className="text-xl font-semibold text-white mb-2">
              The Problem
            </h2>
            <p className="text-gray-300">
              Patients with chronic diseases face adverse drug interactions,
              leading to hospital stays costing ~R4000/night and avoidable
              claims.
            </p>
          </div>

          {/* Solution */}
          <div className="bg-green-900 p-6 rounded-lg glow-effect hover:scale-105 hover:brightness-110 transition-transform duration-300">
            <h2 className="text-xl font-semibold text-white mb-2">
              Our Solution
            </h2>
            <p className="text-gray-300">
              Real-time alerts for harmful drug/food combinations, comprehensive
              medication tracking, and personalized drug recommendations.
            </p>
          </div>

          {/* Market */}
          <div className="bg-orange-900 p-6 rounded-lg glow-effect hover:scale-105 hover:brightness-110 transition-transform duration-300">
            <h2 className="text-xl font-semibold text-white mb-2">
              Market Opportunity
            </h2>
            <p className="text-gray-300">
              $3.8B African digital health market, 33.3% South Africa share,
              with a 23.4% CAGR.
            </p>
          </div>

          {/* Team */}
          <div className="bg-purple-900 p-6 rounded-lg glow-effect hover:scale-105 hover:brightness-110 transition-transform duration-300">
            <h2 className="text-xl font-semibold text-white mb-2">Our Team</h2>
            <p className="text-gray-300">
              Led by Tahidso Meko (CEO, AI), Tebogo Phasha (CBO), Philani
              Dlamini (CIO), and Sakhile Dumisa (Developer).
            </p>
          </div>

          {/* Financing */}
          <div className="bg-teal-900 p-6 rounded-lg glow-effect hover:scale-105 hover:brightness-110 transition-transform duration-300">
            <h2 className="text-xl font-semibold text-white mb-2">Financing</h2>
            <p className="text-gray-300">
              Raised R25,000, project R12M revenue, seeking R1M for nationwide
              launch.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
