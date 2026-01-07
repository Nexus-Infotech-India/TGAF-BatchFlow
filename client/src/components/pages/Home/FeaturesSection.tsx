import { motion } from "framer-motion"
import { Clipboard, Calendar, FileCheck, CheckCircle2, ArrowRight } from "lucide-react"

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
}

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-slate-50 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial="hidden"
          whileInView="visible"
          variants={fadeInUp}
          className="text-4xl font-black text-center mb-14"
        >
          Comprehensive Management Tools
        </motion.h2>

        <div className="grid lg:grid-cols-3 gap-6">
          {[
            {
              icon: Clipboard,
              title: "Batch Management",
              features: ["Maker-checker workflow", "Chemical properties", "Notifications"],
            },
            {
              icon: Calendar,
              title: "Training Management",
              features: ["Scheduling", "Materials", "Attendance"],
            },
            {
              icon: FileCheck,
              title: "Audit Control",
              features: ["Audit reports", "Corrective actions", "Compliance"],
            },
          ].map((f, i) => (
            <motion.div
              key={i}
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              className="bg-white p-6 rounded-2xl shadow border"
            >
              <f.icon className="text-blue-600 mb-4" />
              <h3 className="font-bold text-xl mb-4">{f.title}</h3>
              <ul className="space-y-2">
                {f.features.map((item) => (
                  <li key={item} className="flex gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    {item}
                  </li>
                ))}
              </ul>

              <button className="mt-6 text-blue-600 font-bold flex items-center gap-2">
                Explore <ArrowRight size={14} />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
