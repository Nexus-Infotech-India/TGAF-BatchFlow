
import { motion, useScroll, useTransform, useSpring } from "framer-motion"
import {
  ChevronDown,
  Clipboard,
  Calendar,
  FileCheck,
  Shield,
  ArrowRight,
  CheckCircle2,
  Users,
  Database,
  BarChartIcon as ChartBar,
  FileCog,
  BarChart4,
  ClipboardCheck,
  Layers,
  TrendingUp,
  Activity,
  Target,
  Zap,
  Star,
  Globe,
  Award,
  Sparkles,
  Rocket,
  Eye,
  Settings,
} from "lucide-react"
import { useEffect, useState, useRef } from "react"

// Enhanced animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
}

const fadeInScale = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
}

const slideInLeft = {
  hidden: { opacity: 0, x: -50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
}

const slideInRight = {
  hidden: { opacity: 0, x: 50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

// Floating animation component
const FloatingElement = ({ children, delay = 0, amplitude = 15, duration = 4 }: any) => (
  <motion.div
    animate={{
      y: [0, -amplitude, 0],
      rotate: [0, 1, 0, -1, 0],
    }}
    transition={{
      duration,
      repeat: Number.POSITIVE_INFINITY,
      ease: "easeInOut",
      delay,
    }}
  >
    {children}
  </motion.div>
)

// Particle system component
const ParticleSystem = () => {
  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 8 + 8,
    delay: Math.random() * 4,
  }))

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-gradient-to-r from-blue-400/15 to-indigo-400/15"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
          }}
          animate={{
            y: [0, -80, 0],
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: particle.duration,
            repeat: Number.POSITIVE_INFINITY,
            delay: particle.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}

// Enhanced gradient orb component
const GradientOrb = ({ className, animate: animateProps }: any) => (
  <motion.div
    className={`absolute rounded-full blur-3xl ${className}`}
    animate={animateProps}
    transition={{
      duration: 15,
      repeat: Number.POSITIVE_INFINITY,
      ease: "linear",
    }}
  />
)

const EnhancedHome = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)
  const { scrollYProgress } = useScroll()
  const heroRef = useRef(null)

  // Enhanced parallax effects
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -150])
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.3], [1, 0.9])

  // Smooth mouse tracking
  const springConfig = { damping: 25, stiffness: 700 }
  const mouseX = useSpring(0, springConfig)
  const mouseY = useSpring(0, springConfig)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e
      setMousePosition({ x: clientX, y: clientY })
      mouseX.set(clientX)
      mouseY.set(clientY)
    }

    window.addEventListener("mousemove", handleMouseMove)
    setIsVisible(true)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [mouseX, mouseY])

  return (
    <div className="min-h-screen bg-white text-slate-800 overflow-hidden">
      {/* Enhanced Hero Section */}
      <motion.section
        ref={heroRef}
        className="relative min-h-[85vh] flex flex-col items-center justify-center px-4 bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30"
        style={{ opacity, scale }}
      >
        {/* Advanced background system */}
        <div className="absolute inset-0 overflow-hidden">
          <ParticleSystem />

          {/* Dynamic gradient orbs */}
          <GradientOrb
            className="w-[600px] h-[600px] -top-64 -right-64 bg-gradient-to-br from-blue-400/8 via-indigo-400/4 to-purple-400/8"
            animate={{
              x: mousePosition.x * 0.015,
              y: mousePosition.y * 0.015,
              rotate: [0, 360],
              scale: [1, 1.05, 1],
            }}
          />

          <GradientOrb
            className="w-[450px] h-[450px] -bottom-64 -left-64 bg-gradient-to-br from-cyan-400/8 via-blue-400/4 to-indigo-400/8"
            animate={{
              x: -mousePosition.x * 0.01,
              y: mousePosition.y * 0.01,
              rotate: [360, 0],
              scale: [1, 0.95, 1],
            }}
          />

          <GradientOrb
            className="w-[300px] h-[300px] top-1/2 left-1/2 bg-gradient-to-br from-indigo-400/4 via-purple-400/4 to-pink-400/4"
            animate={{
              x: mousePosition.x * 0.008,
              y: -mousePosition.y * 0.008,
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
            }}
          />

          {/* Mesh gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/15 to-transparent" />
        </div>

        {/* Enhanced floating elements */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <FloatingElement key={i} delay={i * 0.4} amplitude={10 + i} duration={5 + i * 0.3}>
              <div
                className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-blue-400/25 to-indigo-400/25 shadow-sm"
                style={{
                  left: `${15 + i * 10}%`,
                  top: `${25 + (i % 3) * 15}%`,
                }}
              />
            </FloatingElement>
          ))}
        </div>

        <motion.div
          className="max-w-5xl mx-auto text-center z-10 relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: isVisible ? 1 : 0 }}
          transition={{ duration: 1 }}
        >
          {/* Enhanced welcome badge */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-xl px-5 py-2 rounded-full border border-blue-200/50 text-blue-700 font-medium mb-8 shadow-lg shadow-blue-500/10 hover:shadow-blue-500/15 transition-all duration-300 text-sm"
            whileHover={{ scale: 1.02, y: -1 }}
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            >
              <Sparkles className="w-4 h-4 text-yellow-500" />
            </motion.div>
            Welcome to the Future of Quality Management
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}>
              <Star className="w-3 h-3 text-yellow-500" />
            </motion.div>
          </motion.div>

          {/* Enhanced main heading */}
          <motion.h1
            className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-8 leading-none"
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <span className="block bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 drop-shadow-lg">
              TGAF
            </span>
            <motion.span
              className="block text-slate-800 relative"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              BatchFlow
              <motion.div
                className="absolute -inset-1 bg-gradient-to-r from-blue-400/15 to-indigo-400/15 rounded-xl blur-lg"
                animate={{
                  scale: [1, 1.05, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
              />
            </motion.span>
          </motion.h1>

          {/* Enhanced description */}
          <motion.div
            className="max-w-4xl mx-auto mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <p className="text-lg md:text-xl text-slate-600 mb-6 leading-relaxed font-light">
              Revolutionary enterprise batch management with comprehensive{" "}
              <motion.span className="text-blue-600 font-medium relative inline-block" whileHover={{ scale: 1.02 }}>
                training
                <motion.div
                  className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.6, delay: 1 }}
                />
              </motion.span>{" "}
              and{" "}
              <motion.span className="text-indigo-600 font-medium relative inline-block" whileHover={{ scale: 1.02 }}>
                audit
                <motion.div
                  className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.6, delay: 1.2 }}
                />
              </motion.span>{" "}
              solutions for{" "}
              <motion.span className="text-purple-600 font-medium relative inline-block" whileHover={{ scale: 1.02 }}>
                quality-focused
                <motion.div
                  className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.6, delay: 1.4 }}
                />
              </motion.span>{" "}
              organizations.
            </p>
          </motion.div>

          {/* Enhanced CTA buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <motion.button
              className="group relative px-8 py-3 text-base font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-lg hover:shadow-blue-500/25 focus:outline-none focus:ring-2 focus:ring-blue-300/50 transition-all overflow-hidden"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-400"></div>
              <motion.div
                className="absolute inset-0 bg-white/15 rounded-2xl"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.5 }}
              />
              <div className="relative flex items-center gap-2">
                <Rocket className="w-4 h-4" />
                Get Started Now
                <ArrowRight className="group-hover:translate-x-1 transition-transform duration-250" size={16} />
              </div>
            </motion.button>

            <motion.button
              onClick={() => {
                document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })
              }}
              className="group px-8 py-3 text-base font-bold text-slate-700 bg-white/90 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-lg hover:shadow-lg hover:bg-white transition-all"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Explore Features
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                >
                  <Globe size={16} />
                </motion.div>
              </div>
            </motion.button>
          </motion.div>

          {/* Enhanced quick stats */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {[
              {
                icon: Clipboard,
                title: "Batch Management",
                desc: "Complete lifecycle tracking",
                color: "blue",
                gradient: "from-blue-500 to-cyan-500",
              },
              {
                icon: Calendar,
                title: "Training Center",
                desc: "Comprehensive management",
                color: "indigo",
                gradient: "from-indigo-500 to-purple-500",
              },
              {
                icon: FileCheck,
                title: "Audit Control",
                desc: "End-to-end management",
                color: "purple",
                gradient: "from-purple-500 to-pink-500",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                className="group bg-white/80 backdrop-blur-xl rounded-2xl p-5 border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-400 relative overflow-hidden"
                variants={fadeInScale}
                whileHover={{ y: -4, scale: 1.01 }}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-3 transition-opacity duration-400`}
                />

                <FloatingElement delay={index * 0.15}>
                  <div className={`flex items-center justify-center mb-4 relative`}>
                    <div className={`p-2 bg-gradient-to-br ${item.gradient} rounded-xl shadow-md`}>
                      <item.icon className="w-6 h-6 text-white" />
                    </div>
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-br ${item.gradient} rounded-xl blur-lg opacity-20`}
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2.5, repeat: Number.POSITIVE_INFINITY, delay: index * 0.4 }}
                    />
                  </div>
                </FloatingElement>

                <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
                  {item.title}
                </h3>
                <p className="text-slate-600 text-sm">{item.desc}</p>

                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  transition={{ duration: 0.8, delay: index * 0.15 }}
                />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Enhanced scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-0 right-0 flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          style={{ y: y1 }}
        >
          <motion.div
            className="flex flex-col items-center gap-2 text-blue-600 cursor-pointer group"
            animate={{ y: [0, 8, 0] }}
            transition={{
              repeat: Number.POSITIVE_INFINITY,
              duration: 2.5,
              ease: "easeInOut",
            }}
            onClick={() => {
              document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })
            }}
          >
            <span className="text-sm font-medium group-hover:text-blue-700 transition-colors">Discover More</span>
            <motion.div
              className="p-2 bg-white/90 backdrop-blur-xl rounded-full border border-blue-200/50 shadow-lg group-hover:shadow-blue-500/15 transition-all duration-400"
              whileHover={{ scale: 1.1, rotate: 180 }}
            >
              <ChevronDown size={16} />
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Enhanced Features Section */}
      <section
        id="features"
        className="py-20 px-4 bg-gradient-to-br from-white via-slate-50/50 to-blue-50/30 relative overflow-hidden"
      >
        {/* Background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-16 left-16 w-48 h-48 bg-blue-100/15 rounded-full blur-3xl" />
          <div className="absolute bottom-16 right-16 w-56 h-56 bg-indigo-100/15 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-100/8 rounded-full blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            className="text-center mb-16"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100/80 to-indigo-100/80 backdrop-blur-xl px-5 py-2 rounded-full border border-blue-200/50 text-blue-700 font-medium mb-6 shadow-lg text-sm"
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 2.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              >
                <Zap className="w-4 h-4" />
              </motion.div>
              Powerful Enterprise Solutions
            </motion.div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-8 text-slate-800 leading-tight">
              Comprehensive{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                Management
              </span>{" "}
              Tools
            </h2>

            <p className="text-base md:text-lg text-slate-600 max-w-4xl mx-auto leading-relaxed font-light">
              Our integrated platform revolutionizes quality control processes with powerful batch management,
              intelligent training coordination, and comprehensive audit tracking capabilities.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {/* Enhanced Feature Cards */}
            {[
              {
                icon: Clipboard,
                title: "Batch Management",
                description:
                  "Comprehensive batch processing with role-based access control, detailed organoleptic and physical property tracking with advanced workflow automation.",
                features: [
                  "Maker-checker verification workflow",
                  "Complete chemical properties tracking",
                  "Production data management",
                  "Automated email notifications",
                ],
                gradient: "from-blue-500 to-cyan-500",
                bgGradient: "from-blue-500/5 via-transparent to-cyan-500/5",
                link: "/batch-creation",
                linkText: "Explore Batch Management",
              },
              {
                icon: Calendar,
                title: "Training Management",
                description:
                  "Centralized training coordination with intelligent scheduling, comprehensive documentation management, and real-time attendance tracking.",
                features: [
                  "Automated calendar invitations",
                  "Training materials repository",
                  "Participant feedback collection",
                  "Digital attendance tracking",
                ],
                gradient: "from-indigo-500 to-purple-500",
                bgGradient: "from-indigo-500/5 via-transparent to-purple-500/5",
                link: "/training",
                linkText: "Explore Training Center",
              },
              {
                icon: FileCheck,
                title: "Audit Control",
                description:
                  "Complete audit lifecycle management from creation through follow-up with detailed reporting, analytics, and automated compliance monitoring.",
                features: [
                  "Comprehensive audit workflows",
                  "Auto-generated audit reports",
                  "Corrective action tracking",
                  "Compliance monitoring",
                ],
                gradient: "from-purple-500 to-pink-500",
                bgGradient: "from-purple-500/5 via-transparent to-pink-500/5",
                link: "/audit-management",
                linkText: "Explore Audit Control",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="group bg-white/90 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/50 shadow-lg hover:shadow-xl relative overflow-hidden transition-all duration-500"
                variants={fadeInUp}
                whileHover={{ y: -6, scale: 1.01 }}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                />
                <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-slate-100/40 to-transparent rounded-full opacity-40" />

                <div className="relative z-10">
                  <FloatingElement delay={index * 0.2}>
                    <div
                      className={`bg-gradient-to-br ${feature.gradient} p-3 rounded-2xl inline-flex mb-6 shadow-lg relative`}
                    >
                      <feature.icon className="h-6 w-6 text-white" />
                      <motion.div
                        className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-2xl blur-lg opacity-40`}
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, delay: index * 0.4 }}
                      />
                    </div>
                  </FloatingElement>

                  <h3 className="text-xl md:text-2xl font-bold mb-4 text-slate-800 group-hover:text-blue-600 transition-colors duration-300">
                    {feature.title}
                  </h3>

                  <p className="text-slate-600 mb-6 text-sm leading-relaxed">{feature.description}</p>

                  <ul className="space-y-3 text-slate-600 mb-6">
                    {feature.features.map((item, i) => (
                      <motion.li
                        key={i}
                        className="flex items-center gap-3"
                        initial={{ opacity: 0, x: -15 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        viewport={{ once: true }}
                      >
                        <div className={`p-1 bg-gradient-to-br ${feature.gradient} rounded-full shadow-sm`}>
                          <CheckCircle2 className="h-3 w-3 text-white" />
                        </div>
                        <span className="font-medium text-sm">{item}</span>
                      </motion.li>
                    ))}
                  </ul>

                  <motion.div
                    className="pt-4 border-t border-slate-200 flex justify-between items-center"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    viewport={{ once: true }}
                  >
                    <motion.button
                      className={`group/link flex items-center gap-2 text-sm font-bold bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent hover:scale-105 transition-all duration-300`}
                      whileHover={{ x: 3 }}
                    >
                      {feature.linkText}
                      <ArrowRight
                        className="group-hover/link:translate-x-1 transition-transform duration-300 text-blue-600"
                        size={14}
                      />
                    </motion.button>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Enhanced Workflow Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-slate-50/50 to-white relative overflow-hidden">
        {/* Enhanced background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-12 w-32 h-32 bg-blue-200/15 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-20 right-12 w-40 h-40 bg-indigo-200/15 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "0.8s" }}
          />
          <div
            className="absolute top-1/2 left-1/3 w-24 h-24 bg-purple-200/15 rounded-full blur-2xl animate-pulse"
            style={{ animationDelay: "1.6s" }}
          />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            className="mb-16"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-slate-100/80 to-blue-100/80 backdrop-blur-xl px-5 py-2 rounded-full border border-slate-200/50 text-slate-700 font-medium mb-6 shadow-lg text-sm"
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY }}
                >
                  <Activity className="w-4 h-4" />
                </motion.div>
                Streamlined Processes
              </motion.div>

              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-8 text-slate-800 leading-tight">
                How{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                  BatchFlow
                </span>{" "}
                Works
              </h2>

              <p className="text-base md:text-lg text-slate-600 max-w-4xl mx-auto leading-relaxed font-light">
                Our end-to-end solution provides a comprehensive framework for quality management with seamless
                integration across all modules.
              </p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Enhanced Process steps */}
            <motion.div
              className="lg:col-span-6 space-y-6"
              variants={slideInLeft}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {[
                {
                  number: 1,
                  title: "Standard Definition",
                  description:
                    "Create measurement standards, set parameters, and define methodologies for batch processing with customizable templates and validation rules.",
                  icon: Database,
                  feature: "Forms & Templates",
                  gradient: "from-blue-600 to-indigo-600",
                },
                {
                  number: 2,
                  title: "Batch Creation & Verification",
                  description:
                    "Makers create batches with detailed specifications, checkers review and approve submitted data with comprehensive validation and approval workflows.",
                  icon: ClipboardCheck,
                  feature: "Maker-Checker Workflow",
                  gradient: "from-indigo-600 to-purple-600",
                },
                {
                  number: 3,
                  title: "Team Training",
                  description:
                    "Schedule and deliver training sessions with complete documentation, interactive materials, and comprehensive feedback collection systems.",
                  icon: Users,
                  feature: "Calendar & Materials",
                  gradient: "from-purple-600 to-pink-600",
                },
                {
                  number: 4,
                  title: "Audit & Compliance",
                  description:
                    "Conduct comprehensive audits, document findings, track corrective actions, and monitor compliance status with automated reporting.",
                  icon: FileCog,
                  feature: "Audit Reporting",
                  gradient: "from-pink-600 to-red-600",
                },
              ].map((step, index) => (
                <motion.div
                  key={index}
                  className="group bg-white/90 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/50 shadow-lg hover:shadow-xl relative overflow-hidden transition-all duration-500"
                  whileHover={{ x: 10, scale: 1.01 }}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.15 }}
                  viewport={{ once: true }}
                >
                  <div className="absolute -left-4 top-1/2 transform -translate-y-1/2 z-20">
                    <motion.div
                      className={`bg-gradient-to-r ${step.gradient} text-white font-black rounded-full w-10 h-10 flex items-center justify-center shadow-lg border-2 border-white text-sm`}
                      whileHover={{ scale: 1.05, rotate: 360 }}
                      transition={{ duration: 0.4 }}
                    >
                      {step.number}
                    </motion.div>
                  </div>

                  <div className="ml-8">
                    <h3 className="text-lg font-bold text-slate-800 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                      {step.title}
                    </h3>

                    <p className="text-slate-600 mb-4 text-sm leading-relaxed">{step.description}</p>

                    <div className="flex items-center gap-3 text-blue-700 font-medium text-sm">
                      <div className={`p-2 bg-gradient-to-br ${step.gradient} rounded-lg shadow-md`}>
                        <step.icon size={16} className="text-white" />
                      </div>
                      <span>{step.feature}</span>
                    </div>
                  </div>

                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent"
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: index * 0.15 }}
                  />
                </motion.div>
              ))}
            </motion.div>

            {/* Enhanced Dashboard preview */}
            <motion.div
              className="lg:col-span-6 relative"
              variants={slideInRight}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <FloatingElement amplitude={8} duration={5}>
                <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-black rounded-3xl p-4 shadow-2xl overflow-hidden relative">
                  {/* Enhanced dashboard mockup */}
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-4 h-full min-h-[500px] relative overflow-hidden">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-200">
                      <div className="flex items-center gap-3">
                        <motion.div
                          className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl w-10 h-10 flex items-center justify-center text-white font-black text-lg shadow-lg"
                          whileHover={{ rotate: 360, scale: 1.05 }}
                          transition={{ duration: 0.4 }}
                        >
                          B
                        </motion.div>
                        <div>
                          <h3 className="font-black text-slate-800 text-lg">BatchFlow Dashboard</h3>
                          <p className="text-slate-600 text-xs">Real-time system overview</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <motion.div
                          className="h-2 w-2 rounded-full bg-green-500 shadow-sm"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.8 }}
                        />
                        <div className="h-2 w-2 rounded-full bg-slate-300"></div>
                        <div className="h-2 w-2 rounded-full bg-slate-300"></div>
                      </div>
                    </div>

                    {/* Stats cards */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      {[
                        {
                          icon: Clipboard,
                          label: "Active Batches",
                          value: "42",
                          change: "+12% this week",
                          color: "blue",
                        },
                        {
                          icon: FileCheck,
                          label: "Pending Audits",
                          value: "7",
                          change: "Due this week",
                          color: "purple",
                        },
                        {
                          icon: Calendar,
                          label: "Training Events",
                          value: "12",
                          change: "5 this month",
                          color: "indigo",
                        },
                      ].map((stat, i) => (
                        <motion.div
                          key={i}
                          className="bg-white p-3 rounded-xl shadow-md border border-slate-200 hover:shadow-lg transition-all duration-300"
                          whileHover={{ y: -2, scale: 1.01 }}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.15 }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`p-1 bg-${stat.color}-100 rounded-md`}>
                              <stat.icon size={12} className={`text-${stat.color}-600`} />
                            </div>
                            <div className="text-xs text-slate-500 font-medium">{stat.label}</div>
                          </div>
                          <div className="text-xl font-black text-slate-800 mb-1">{stat.value}</div>
                          <div className="text-xs text-green-600 font-medium">{stat.change}</div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Charts section */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {/* Quality metrics chart */}
                      <div className="bg-white p-3 rounded-xl shadow-md border border-slate-200">
                        <div className="flex justify-between items-center mb-3">
                          <div className="font-bold text-slate-800 text-sm">Quality Metrics</div>
                          <TrendingUp size={14} className="text-green-500" />
                        </div>
                        <div className="h-24 flex items-end gap-1">
                          {[100, 85, 65, 90, 75, 95, 88].map((height, i) => (
                            <motion.div
                              key={i}
                              className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t shadow-sm"
                              style={{ height: `${height}%` }}
                              initial={{ height: 0 }}
                              animate={{ height: `${height}%` }}
                              transition={{ delay: i * 0.1, duration: 0.6, ease: "easeOut" }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Compliance rate */}
                      <div className="bg-white p-3 rounded-xl shadow-md border border-slate-200">
                        <div className="flex justify-between items-center mb-3">
                          <div className="font-bold text-slate-800 text-sm">Compliance Rate</div>
                          <Target size={14} className="text-blue-500" />
                        </div>
                        <div className="flex items-center justify-center h-24">
                          <div className="relative w-20 h-20">
                            <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                              <path
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="#E5E7EB"
                                strokeWidth="2"
                              />
                              <motion.path
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="#3B82F6"
                                strokeWidth="2"
                                strokeDasharray="98, 100"
                                initial={{ strokeDasharray: "0, 100" }}
                                animate={{ strokeDasharray: "98, 100" }}
                                transition={{ duration: 1.5, delay: 0.8 }}
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center text-lg font-black text-slate-800">
                              98%
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recent activity */}
                    <div className="bg-white p-3 rounded-xl shadow-md border border-slate-200">
                      <div className="flex justify-between items-center mb-3">
                        <div className="font-bold text-slate-800 text-sm">Recent Activity</div>
                        <BarChart4 size={14} className="text-slate-400" />
                      </div>
                      <div className="space-y-2">
                        {[
                          { icon: CheckCircle2, text: "Batch #4528 approved", color: "green" },
                          { icon: Calendar, text: "New training scheduled", color: "blue" },
                          { icon: FileCheck, text: "Audit #127 completed", color: "purple" },
                        ].map((item, i) => (
                          <motion.div
                            key={i}
                            className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1.5 + i * 0.2 }}
                          >
                            <div className={`p-1 bg-${item.color}-100 rounded-md`}>
                              <item.icon size={12} className={`text-${item.color}-600`} />
                            </div>
                            <span className="text-slate-600 font-medium text-xs">{item.text}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </FloatingElement>

              {/* Enhanced floating elements */}
              <FloatingElement delay={0.8} amplitude={10} duration={4}>
                <motion.div
                  className="absolute -top-4 -right-4 bg-white/95 backdrop-blur-xl p-3 rounded-xl shadow-lg border border-blue-100 flex items-center gap-2"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="bg-green-100 p-2 rounded-lg">
                    <ChartBar size={16} className="text-green-600" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-700 text-sm">Real-time Analytics</div>
                    <div className="text-xs text-slate-500">Live monitoring</div>
                  </div>
                </motion.div>
              </FloatingElement>

              <FloatingElement delay={1.2} amplitude={8} duration={5}>
                <motion.div
                  className="absolute -bottom-4 -left-4 bg-white/95 backdrop-blur-xl p-3 rounded-xl shadow-lg border border-purple-100 flex items-center gap-2"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <Shield size={16} className="text-purple-600" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-700 text-sm">Compliance Reports</div>
                    <div className="text-xs text-slate-500">Automated generation</div>
                  </div>
                </motion.div>
              </FloatingElement>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 text-white relative overflow-hidden">
        {/* Enhanced background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/20 to-transparent"></div>
          <motion.div
            className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-500/15 rounded-full blur-3xl"
            animate={{ scale: [1, 1.1, 1], rotate: [0, 180, 360] }}
            transition={{ duration: 15, repeat: Number.POSITIVE_INFINITY }}
          />
          <motion.div
            className="absolute top-1/2 left-1/4 w-48 h-48 bg-indigo-400/8 rounded-full blur-2xl"
            animate={{ x: [0, 80, 0], y: [0, -40, 0] }}
            transition={{ duration: 12, repeat: Number.POSITIVE_INFINITY }}
          />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-xl px-5 py-2 rounded-full border border-white/20 text-white/90 font-medium mb-8 shadow-lg text-sm"
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 2.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              >
                <Award className="w-4 h-4" />
              </motion.div>
              Start Your Quality Journey
            </motion.div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-8 leading-tight">
              Ready to transform your{" "}
              <motion.span
                className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-orange-200 to-pink-200"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
              >
                quality management?
              </motion.span>
            </h2>

            <p className="text-lg md:text-xl text-blue-100 mb-10 max-w-3xl mx-auto leading-relaxed font-light">
              Join the future of batch management, training coordination, and audit processes with BatchFlow's
              revolutionary enterprise solution.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <motion.button
                className="group relative px-8 py-3 text-base font-bold bg-white text-blue-700 rounded-2xl shadow-lg hover:shadow-white/25 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all overflow-hidden"
                whileHover={{ scale: 1.02, y: -3 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
                <motion.div
                  className="absolute inset-0 bg-white/15 rounded-2xl"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.5 }}
                />
                <div className="relative flex items-center gap-2">
                  <Rocket className="w-4 h-4" />
                  Get Started Now
                  <ArrowRight className="group-hover:translate-x-1 transition-transform duration-250" size={16} />
                </div>
              </motion.button>

              <motion.button
                onClick={() => {
                  document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })
                }}
                className="group px-8 py-3 text-base font-bold border border-white/30 text-white rounded-2xl hover:bg-white/10 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                whileHover={{ scale: 1.02, y: -3 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-2">
                  <Layers size={16} />
                  Explore Features
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 2.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  >
                    <Settings size={16} />
                  </motion.div>
                </div>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="bg-gradient-to-br from-slate-900 via-slate-800 to-black text-white py-16 px-4 relative overflow-hidden">
        {/* Enhanced background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-48 h-48 bg-blue-600/4 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-56 h-56 bg-indigo-600/4 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-purple-600/4 rounded-full blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <motion.h2
                  className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 mb-4"
                  whileHover={{ scale: 1.02 }}
                >
                  BatchFlow
                </motion.h2>
                <p className="text-slate-300 mb-6 text-sm leading-relaxed max-w-md">
                  Enterprise quality management solutions for pharmaceutical, food, and manufacturing industries with
                  comprehensive batch tracking and compliance features.
                </p>
                <div className="flex gap-4">
                  {[1, 2, 3, 4].map((_, i) => (
                    <motion.a
                      key={i}
                      href="#"
                      className="text-slate-400 hover:text-white transition-colors"
                      whileHover={{ scale: 1.1, y: -2 }}
                    >
                      <div className="bg-slate-800 p-2 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors shadow-lg">
                        <div className="w-4 h-4 bg-gradient-to-br from-blue-400 to-indigo-400 rounded"></div>
                      </div>
                    </motion.a>
                  ))}
                </div>
              </motion.div>
            </div>

            <div>
              <h3 className="font-bold mb-4 text-base">Platform</h3>
              <ul className="space-y-2">
                {["Batch Management", "Training Center", "Audit Control", "Quality Reports", "Analytics Dashboard"].map(
                  (item) => (
                    <li key={item}>
                      <motion.a
                        href="#"
                        className="text-slate-400 hover:text-white transition-colors text-sm"
                        whileHover={{ x: 3 }}
                      >
                        {item}
                      </motion.a>
                    </li>
                  ),
                )}
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-4 text-base">Company</h3>
              <ul className="space-y-2">
                {["About", "Support", "Documentation", "Training", "Contact"].map((item) => (
                  <li key={item}>
                    <motion.a
                      href="#"
                      className="text-slate-400 hover:text-white transition-colors text-sm"
                      whileHover={{ x: 3 }}
                    >
                      {item}
                    </motion.a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <motion.div
            className="pt-8 border-t border-slate-700 flex flex-col md:flex-row justify-between items-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <div className="text-slate-400 text-sm mb-4 md:mb-0">
              © {new Date().getFullYear()} BatchFlow. All rights reserved. Built with precision for quality excellence.
            </div>
            <div className="flex gap-6 text-sm">
              {["Privacy Policy", "Terms of Service", "Security"].map((item) => (
                <motion.a
                  key={item}
                  href="#"
                  className="text-slate-400 hover:text-white transition-colors"
                  whileHover={{ y: -1 }}
                >
                  {item}
                </motion.a>
              ))}
            </div>
          </motion.div>
        </div>
      </footer>
    </div>
  )
}

export default EnhancedHome