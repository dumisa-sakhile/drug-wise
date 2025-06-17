"use client";

import { createFileRoute } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import { TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ChartConfig } from "@/components/ui/chart";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export const Route = createFileRoute("/about")({
  component: About,
});

const chartData = [
  { region: "Africa Market", value: 3.8 },
  { region: "South Africa", value: 3.8 * 0.333 },
];

const chartConfig = {
  value: {
    label: "Market Size (USD Billion)",
    color: "hsl(221, 83%, 53%)", // Matches #3b82f6
  },
  label: {
    color: "hsl(0, 0%, 100%)", // White for labels
  },
} satisfies ChartConfig;

function About() {
  const { scrollY } = useScroll();
  const yOffset = useTransform(scrollY, [0, 600], [0, -50]); // Subtle parallax effect

  return (
    <div className="min-h-screen bg-inherit text-gray-200 bg-grid-pattern">
      {/* Hero Section with Chart */}
      <motion.section
        className="max-w-6xl mx-auto py-12 px-6 text-center relative"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}>
        <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />
        <div className="relative z-10">
          <motion.h1
            className="text-4xl sm:text-5xl font-bold text-white mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}>
            About DrugWise
          </motion.h1>
          <motion.p
            className="text-base sm:text-lg text-gray-300 mb-6 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}>
            DrugWise leverages AI to enhance medication safety, preventing
            adverse drug interactions and reducing healthcare costs across
            Africa.
          </motion.p>
          <motion.div
            className="max-w-sm mx-auto"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}>
            <Card className="bg-[rgba(31,41,55,0.2)] border-[rgba(255,255,255,0.1)] backdrop-blur-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-white">
                  Digital Health Market
                </CardTitle>
                <CardDescription className="text-xs text-gray-400">
                  Africa vs. South Africa (2025)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={chartConfig}
                  className="h-[120px] w-full">
                  <BarChart
                    accessibilityLayer
                    data={chartData}
                    layout="vertical"
                    margin={{ right: 16, left: 0, top: 10, bottom: 10 }}>
                    <CartesianGrid
                      horizontal={false}
                      stroke="rgba(255,255,255,0.1)"
                    />
                    <YAxis
                      dataKey="region"
                      type="category"
                      tickLine={false}
                      tickMargin={8}
                      axisLine={false}
                      hide
                    />
                    <XAxis dataKey="value" type="number" hide />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent indicator="line" />}
                    />
                    <Bar
                      dataKey="value"
                      layout="vertical"
                      fill="hsl(221, 83%, 53%)"
                      radius={4}>
                      <LabelList
                        dataKey="region"
                        position="insideLeft"
                        offset={8}
                        className="fill-[--color-label]"
                        fontSize={10}
                      />
                      <LabelList
                        dataKey="value"
                        position="right"
                        offset={8}
                        className="fill-foreground"
                        fontSize={10}
                        formatter={(value: number) => value.toFixed(2)}
                      />
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </CardContent>
              <CardFooter className="flex-col items-start gap-1 text-xs">
                <div className="flex gap-1 leading-none font-medium text-gray-200">
                  23.4% CAGR <TrendingUp className="h-3 w-3" />
                </div>
                <div className="text-gray-400 leading-none">
                  Projected for 2025
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        className="max-w-6xl mx-auto py-12 px-6"
        style={{ y: yOffset }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0, duration: 0.8 }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 *:cursor-crosshair">
          {/* Problem */}
          <motion.div
            className="bg-blue-900 p-6 rounded-lg hover:bg-blue-800 transition-all duration-300"
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            whileHover={{
              boxShadow:
                "0 0 10px rgba(30, 144, 255, 0.7), 0 0 20px rgba(30, 144, 255, 0.5)",
            }}>
            <h2 className="text-lg font-semibold text-white mb-2">
              The Challenge
            </h2>
            <p className="text-gray-300 text-sm">
              Chronic disease patients face adverse drug interactions, leading
              to costly hospitalizations (R4000/night in South Africa) and
              higher mortality risks due to insufficient real-time detection
              tools.
            </p>
          </motion.div>

          {/* Solution */}
          <motion.div
            className="bg-green-900 p-6 rounded-lg hover:bg-green-800 transition-all duration-300"
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            whileHover={{
              boxShadow:
                "0 0 10px rgba(34, 197, 94, 0.7), 0 0 20px rgba(34, 197, 94, 0.5)",
            }}>
            <h2 className="text-lg font-semibold text-white mb-2">
              Our Approach
            </h2>
            <p className="text-gray-300 text-sm">
              DrugWise delivers real-time alerts for harmful drug-food and
              drug-drug interactions, comprehensive medication tracking, and
              personalized drug recommendations tailored to patient needs.
            </p>
          </motion.div>

          {/* Financing */}
          <motion.div
            className="bg-orange-900 p-6 rounded-lg hover:bg-orange-800 transition-all duration-300"
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
            whileHover={{
              boxShadow:
                "0 0 10px rgba(249, 115, 22, 0.7), 0 0 20px rgba(249, 115, 22, 0.5)",
            }}>
            <h2 className="text-lg font-semibold text-white mb-2">Financing</h2>
            <p className="text-gray-300 text-sm">
              Raised R25,000 through the Hult Prize, projecting R12M revenue
              from 10,000 units in year one, and seeking R1M for manufacturing
              and pilot distribution in South Africa.
            </p>
          </motion.div>

          {/* Accomplishments */}
          <motion.div
            className="bg-purple-900 p-6 rounded-lg hover:bg-purple-800 transition-all duration-300"
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            viewport={{ once: true }}
            whileHover={{
              boxShadow:
                "0 0 10px rgba(147, 51, 234, 0.7), 0 0 20px rgba(147, 51, 234, 0.5)",
            }}>
            <h2 className="text-lg font-semibold text-white mb-2">
              Achievements
            </h2>
            <p className="text-gray-300 text-sm">
              First Runner-Up in the Hult Prize On Campus Competition at the
              University of Witwatersrand, recognized for innovation,
              feasibility, and global impact potential.
            </p>
          </motion.div>

          {/* Roadmap */}
          <motion.div
            className="bg-teal-900 p-6 rounded-lg hover:bg-teal-800 transition-all duration-300"
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            viewport={{ once: true }}
            whileHover={{
              boxShadow:
                "0 0 10px rgba(6, 182, 212, 0.7), 0 0 20px rgba(6, 182, 212, 0.5)",
            }}>
            <h2 className="text-lg font-semibold text-white mb-2">Roadmap</h2>
            <p className="text-gray-300 text-sm">
              In 2025, DrugWise will launch its AI-powered platform in South
              Africa and partner with insurance companies to integrate into
              healthcare systems, enhancing patient safety.
            </p>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
}

export default About;
