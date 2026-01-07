"use client"

import { useState, useEffect } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import {
  Sparkles,
  Star,
  Rocket,
  ArrowRight,
  Eye,
  Globe,
  Clipboard,
  Calendar,
  FileCheck,
  ChevronDown,
  Zap,
  Shield,
  TrendingUp,
} from "lucide-react"

const fadeInScale = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
}

const FloatingElement = ({ children, delay = 0 }: any) => (
  <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, delay }}>
    {children}
  </motion.div>
)

const FloatingCard = ({ children, delay = 0 }: any) => (
  <motion.div
    animate={{
      y: [0, -15, 0],
      transition: { duration: 3.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay },
    }}
  >
    {children}
  </motion.div>
)

const AnimatedSideElement = ({ icon: Icon, delay = 0, side = "left" }: any) => (
  <motion.div
    animate={{
      y: [0, 20, 0],
      x: side === "left" ? [-10, 10, -10] : [10, -10, 10],
      rotate: [0, 5, -5, 0],
    }}
    transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY, delay }}
    className="absolute opacity-20 hover:opacity-40 transition-opacity"
  >
    <Icon className="w-12 h-12 text-blue-600" />
  </motion.div>
)

export function HeroSection() {
  const [mounted, setMounted] = useState(false)
  const { scrollYProgress } = useScroll()
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.3], [1, 0.95])

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <motion.section
      style={{ opacity, scale }}
      className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 overflow-hidden"
    >
      <div className="hidden lg:block absolute left-0 top-1/4 w-1/4 h-1/2 pointer-events-none">
        <AnimatedSideElement icon={Zap} delay={0} side="left" />
        <AnimatedSideElement icon={Shield} delay={0.3} side="left" />
        <AnimatedSideElement icon={Star} delay={0.6} side="left" />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, delay: 0.2 }}
          className="absolute top-1/3 left-10 w-32 h-32 bg-blue-400 rounded-full blur-3xl"
        />
      </div>

      <div className="hidden lg:block absolute right-0 top-1/4 w-1/4 h-1/2 pointer-events-none">
        <motion.div
          className="absolute top-20 right-10"
          animate={{ y: [0, -20, 0], rotate: [0, 360] }}
          transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY }}
        >
          <TrendingUp className="w-12 h-12 text-purple-600 opacity-20" />
        </motion.div>
        <AnimatedSideElement icon={Sparkles} delay={0.4} side="right" />
        <AnimatedSideElement icon={Globe} delay={0.1} side="right" />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.25, 0.1] }}
          transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY, delay: 0.5 }}
          className="absolute bottom-1/4 right-10 w-40 h-40 bg-purple-400 rounded-full blur-3xl"
        />
      </div>

      <div className="max-w-5xl text-center z-10">
        {/* Welcome Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 bg-white px-5 py-2 rounded-full border border-slate-200 shadow-sm mb-8 hover:shadow-md hover:scale-105 transition-all"
        >
          <Sparkles className="text-yellow-500 w-4 h-4" />
          <span className="text-sm font-semibold text-slate-700">Welcome to the Future of Quality Management</span>
          <Star className="text-yellow-500 w-3 h-3" />
        </motion.div>

        {/* Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl md:text-7xl font-black mb-6 leading-tight"
        >
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-black ">
            TGAF BatchFlow
          </span>
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed"
        >
          Enterprise batch management with training and audit workflows designed for quality-first organizations.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
        >
          <button
            onClick={() => (window.location.href = "/login")}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold flex items-center gap-2 justify-center hover:shadow-lg hover:scale-105 transition-all"
          >
            <Rocket size={18} />
            Get Started
            <ArrowRight size={18} />
          </button>

          <button
            onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
            className="px-8 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-bold flex items-center gap-2 justify-center hover:border-blue-400 hover:bg-blue-50 transition-all"
          >
            <Eye size={18} />
            Explore Features
            <Globe size={18} />
          </button>
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="grid md:grid-cols-3 gap-4"
        >
          {[
            { icon: Clipboard, title: "Batch Management" },
            { icon: Calendar, title: "Training Center" },
            { icon: FileCheck, title: "Audit Control" },
          ].map((item, i) => (
            <FloatingCard key={i} delay={i * 0.2}>
              <motion.div
                variants={fadeInScale}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.5 + i * 0.1 }}
                className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:scale-105 transition-all cursor-pointer"
              >
                <item.icon className="mx-auto mb-3 text-blue-600 w-6 h-6" />
                <h3 className="font-bold text-slate-900">{item.title}</h3>
              </motion.div>
            </FloatingCard>
          ))}
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8"
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2 }}
      >
        <ChevronDown className="text-blue-600 w-6 h-6" />
      </motion.div>
    </motion.section>
  )
}
export default HeroSection