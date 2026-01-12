import { motion, useScroll } from "framer-motion"
import { Clipboard, Calendar, FileCheck, CheckCircle2, ArrowRight, Sparkles } from "lucide-react"

const fadeInUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
}

export default function FeaturesSection() {
  useScroll()

  return (
    <motion.section
      id="features"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="py-20 bg-gradient-to-b from-slate-100 via-white to-slate-100 px-4 relative overflow-hidden"
    >

      <div className="hidden lg:block absolute top-20 left-10 w-64 h-64 bg-blue-400 rounded-full blur-3xl opacity-5" />
      <div className="hidden lg:block absolute bottom-20 right-10 w-80 h-80 bg-purple-400 rounded-full blur-3xl opacity-5" />

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-4 flex items-center justify-center gap-2"
        >
          <Sparkles className="text-blue-600 w-5 h-5" />
          <span className="text-sm font-semibold text-blue-600">POWERFUL FEATURES</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl md:text-6xl font-black text-center mb-6 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-blue-600"
        >
          Comprehensive Management Tools
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-lg text-slate-600 text-center mb-14 max-w-2xl mx-auto"
        >
          Enterprise-grade solutions for batch management, training, and compliance auditing
        </motion.p>

        <div className="grid lg:grid-cols-3 gap-6">
          {[
            {
              icon: Clipboard,
              title: "Batch Management",
              features: ["Maker-checker workflow", "Chemical properties", "Real-time notifications"],
            },
            {
              icon: Calendar,
              title: "Training Management",
              features: ["Smart scheduling", "Learning materials", "Attendance tracking"],
            },
            {
              icon: FileCheck,
              title: "Audit Control",
              features: ["Comprehensive reports", "Corrective actions", "Compliance tracking"],
            },
          ].map((f, i) => (
            <motion.div
              key={i}
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }}
              className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:scale-105 transition-all duration-300 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />

              <div className="relative z-10">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
                >
                  <f.icon className="text-blue-600 mb-4 w-8 h-8 group-hover:text-purple-600 transition-colors" />
                </motion.div>

                <h3 className="font-bold text-xl mb-4 text-slate-900 group-hover:text-blue-600 transition-colors">
                  {f.title}
                </h3>

                <ul className="space-y-3 mb-6">
                  {f.features.map((item, idx) => (
                    <motion.li
                      key={item}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + idx * 0.1 }}
                      className="flex gap-3 text-sm text-slate-600"
                    >
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </motion.li>
                  ))}
                </ul>

                <motion.button
                  whileHover={{ x: 5 }}
                  className="text-blue-600 font-bold flex items-center gap-2 group/btn hover:text-purple-600 transition-colors"
                >
                  Explore
                  <motion.span
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                  >
                    <ArrowRight size={16} />
                  </motion.span>
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  )
}
