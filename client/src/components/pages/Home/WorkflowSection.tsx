import { motion } from "framer-motion"
import { Database, ClipboardCheck, Users, FileCog } from "lucide-react"

export default function WorkflowSection() {
  return (
    <section className="py-20 bg-white px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-black text-center mb-16">
          How BatchFlow Works
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {[
            { icon: Database, title: "Standard Definition" },
            { icon: ClipboardCheck, title: "Batch Verification" },
            { icon: Users, title: "Team Training" },
            { icon: FileCog, title: "Audit & Compliance" },
          ].map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="bg-slate-50 p-6 rounded-xl border"
            >
              <step.icon className="text-blue-600 mb-3" />
              <h3 className="font-bold">{step.title}</h3>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
