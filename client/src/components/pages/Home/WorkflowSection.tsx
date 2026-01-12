import { motion, useScroll, useTransform } from "framer-motion"
import { Database, ClipboardCheck, Users, FileCog, Sparkles } from "lucide-react"
import React from "react"

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const roadmapSteps = [
  {
    step: 1,
    title: "Standard Definition",
    description: "Set up batch standards",
    icon: Database,
    color: "from-blue-500 to-blue-600",
  },
  {
    step: 2,
    title: "Batch Verification",
    description: "Verify batch data",
    icon: ClipboardCheck,
    color: "from-purple-500 to-purple-600",
  },
  {
    step: 3,
    title: "Team Training",
    description: "Train your team",
    icon: Users,
    color: "from-pink-500 to-pink-600",
  },
  {
    step: 4,
    title: "Audit & Compliance",
    description: "Ensure compliance",
    icon: FileCog,
    color: "from-emerald-500 to-emerald-600",
  },
]

export default function WorkflowSection() {
  const { scrollYProgress } = useScroll()
  const opacity = useTransform(scrollYProgress, [0.4, 0.65], [0, 1])
  const [currentStep, setCurrentStep] = React.useState(0)

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % roadmapSteps.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <motion.section
      id="workflow"
      style={{ opacity }}
      className="py-20 bg-gradient-to-b from-white via-slate-50 to-white px-4 relative overflow-hidden"
    >
      <div className="hidden lg:block absolute top-40 right-20 w-72 h-72 bg-purple-400 rounded-full blur-3xl opacity-5" />
      <div className="hidden lg:block absolute bottom-40 left-20 w-96 h-96 bg-blue-400 rounded-full blur-3xl opacity-5" />

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-4 flex items-center justify-center gap-2"
        >
          <Sparkles className="text-blue-600 w-5 h-5" />
          <span className="text-sm font-semibold text-blue-600">HOW IT WORKS</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl md:text-6xl font-black text-center mb-6 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-blue-600"
        >
          BatchFlow Workflow
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-lg text-slate-600 text-center mb-16 max-w-2xl mx-auto"
        >
          A streamlined process designed to optimize your batch management from start to finish
        </motion.p>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-4">
            {roadmapSteps.map((item, idx) => (
              <motion.div
                key={idx}
                variants={fadeInUp}
                initial="hidden"
                whileInView="visible"
                transition={{ duration: 0.6, delay: 0.1 + idx * 0.1 }}
                className="relative pl-12"
              >
                {/* Connecting line */}
                {idx < roadmapSteps.length - 1 && (
                  <motion.div
                    initial={{ scaleY: 0 }}
                    whileInView={{ scaleY: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 + idx * 0.1 }}
                    className="absolute left-5 top-12 w-0.5 h-16 bg-gradient-to-b from-blue-400 to-purple-400 origin-top"
                  />
                )}

                {/* Circle with number */}
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className={`absolute left-0 top-0 w-11 h-11 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center text-white font-bold shadow-lg`}
                >
                  {item.step}
                </motion.div>

                {/* Content */}
                <motion.div
                  whileHover={{ x: 8 }}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  <h3 className="font-bold text-slate-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-slate-600">{item.description}</p>
                </motion.div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative flex justify-center items-center lg:h-auto"
          >
            <motion.div
              animate={{
                y: [0, -12, 0],
              }}
              transition={{
                duration: 3,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
              className="relative w-[700px] h-96 bg-slate-900 rounded-2xl shadow-2xl border-8 border-slate-800 overflow-hidden"
            >
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-32 h-3 bg-slate-700 rounded-full" />
              <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-1 h-8 bg-slate-700" />

              {/* Monitor screen */}
              <div className="w-full h-full bg-gradient-to-b from-slate-50 to-white overflow-hidden flex flex-col">
                {/* Status bar */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 flex justify-between items-center text-sm font-semibold">
                  <span>Dashboard</span>
                  <div className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                </div>

                {/* Monitor content - synchronized animated carousel */}
                <div className="flex-1 overflow-hidden relative flex flex-col items-center justify-center">
                  {roadmapSteps.map((step, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: currentStep === idx ? 1 : 0,
                        pointerEvents: currentStep === idx ? "auto" : "none",
                      }}
                      transition={{
                        duration: 0.5,
                        ease: "easeInOut",
                      }}
                      className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.08, 1] }}
                        transition={{
                          duration: 2.4,
                          repeat: Number.POSITIVE_INFINITY,
                          repeatDelay: 0.6,
                        }}
                        className={`w-24 h-24 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center mb-6 shadow-lg`}
                      >
                        <step.icon className="w-12 h-12 text-white" />
                      </motion.div>
                      <h4 className="font-bold text-slate-900 text-lg mb-2">{step.title}</h4>
                      <p className="text-sm text-slate-600">{step.description}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Bottom indicator dots - synchronized with carousel */}
                <div className="flex justify-center gap-3 pb-6">
                  {roadmapSteps.map((_, idx) => (
                    <motion.div
                      key={idx}
                      animate={{
                        scale: currentStep === idx ? 1.25 : 1,
                        backgroundColor: currentStep === idx ? "#2563eb" : "#d1d5db",
                      }}
                      transition={{
                        duration: 0.3,
                        ease: "easeInOut",
                      }}
                      className="w-3 h-3 rounded-full bg-gray-300"
                    />
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Glow effect around monitor */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-2xl -z-10" />
          </motion.div>
        </div>
      </div>
    </motion.section>
  )
}
