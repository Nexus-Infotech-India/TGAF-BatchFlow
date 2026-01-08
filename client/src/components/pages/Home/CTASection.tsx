"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { Rocket, ArrowRight, Sparkles } from "lucide-react"

export default function CTASection() {
  const { scrollYProgress } = useScroll()
  const opacity = useTransform(scrollYProgress, [0.8, 0.95], [0, 1])

  return (
    <motion.section
      style={{ opacity }}
      className="py-20 bg-gradient-to-br from-blue-600 to-purple-700 text-white relative overflow-hidden"
    >
      <div className="absolute top-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl opacity-10 animate-pulse" />
      <div className="absolute bottom-20 left-20 w-80 h-80 bg-blue-300 rounded-full blur-3xl opacity-10 animate-pulse" />

      <motion.div className="max-w-4xl mx-auto text-center relative z-10 px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-center gap-2 mb-4"
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-sm font-semibold text-blue-100">READY TO START</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl md:text-6xl font-black mb-6 leading-tight text-balance"
        >
          Ready to transform your quality management?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mb-10 text-blue-100 text-lg max-w-2xl mx-auto"
        >
          Join the future of enterprise quality systems.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <motion.button
            onClick={() => (window.location.href = "/login")}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            className="bg-white text-blue-700 px-8 py-4 rounded-xl font-bold flex items-center gap-3 mx-auto hover:shadow-2xl transition-shadow cursor-pointer"
          >
            <motion.div
              animate={{ rotate: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Rocket size={20} />
            </motion.div>

            <span>Get Started</span>

            <motion.div
              animate={{ x: [0, 6, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ArrowRight size={20} />
            </motion.div>
          </motion.button>

        </motion.div>
      </motion.div>
    </motion.section>
  )
}
