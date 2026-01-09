import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import api from "../../../utils/api";
import { API_ROUTES } from "../../../utils/api";
import LoginAnimation from "../../material/Animation";
import logo from "../../../assets/logo12.png"
import { Lock, Mail, Check, Rocket, Star, Sparkles, ArrowRight, Zap, Shield, ChevronLeft, ChevronRight } from "lucide-react"

interface LoginResponse {
  token?: string
  user?: {
    id: string
    email: string
    name: string
    role: string
  }
}

interface LoginError {
  response?: {
    data?: {
      message?: string
    }
  }
}

const fadeInScale = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
}

const slideInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
}

const FloatingCard = ({ children, delay = 0 }: any) => (
  <motion.div
    animate={{
      y: [0, -10, 0],
      transition: { duration: 3.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay },
    }}
  >
    {children}
  </motion.div>
)

const GlowingBadge = () => (
  <motion.div
    initial={{ opacity: 0, y: -20, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.45 }}
    className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm mb-6 hover:shadow-md hover:scale-105 transition-all group relative"
  >
    <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}>
      <Sparkles className="text-yellow-400 w-4 h-4" />
    </motion.div>
    <span className="text-sm font-semibold text-slate-700">Quality Management System</span>
  </motion.div>
)

const Login = () => {
  const slides = [
    {
      title: "Batch\nManagement",
      desc: "Simplify batch creation, tracking, and documentation with our intuitive interface.",
      image:
        "https://videos.openai.com/az/vg-assets/task_01keehkt24e13b4fgcjb1k4k5x%2F1767867313_img_1.webp?se=2026-01-13T00%3A00%3A00Z&sp=r&sv=2024-08-04&sr=b&skoid=aa5ddad1-c91a-4f0a-9aca-e20682cc8969&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2026-01-08T03%3A55%3A27Z&ske=2026-01-15T04%3A00%3A27Z&sks=b&skv=2024-08-04&sig=uga4yHvWpuKOVfnO0Trv%2BaOekYZobIJ2GsHSv8ggtDE%3D&ac=oaivgprodscus2",
    },
    {
      title: "Streamline Quality\nControl",
      desc: "End-to-end batch workflows with traceability and audit-ready reports.",
      image:
        "https://videos.openai.com/az/vg-assets/task_01keehyt2dexdtpjgv52rmcm25%2F1767867669_img_2.webp?se=2026-01-13T00%3A00%3A00Z&sp=r&sv=2024-08-04&sr=b&skoid=aa5ddad1-c91a-4f0a-9aca-e20682cc8969&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2026-01-08T03%3A51%3A56Z&ske=2026-01-15T03%3A56%3A56Z&sks=b&skv=2024-08-04&sig=Or2SgUr1xJZmnF16bty4DLcxJafmHppQfRV%2BSM9X/vI%3D&ac=oaivgprodscus2",
    },
    {
      title: "Training & Compliance",
      desc: "Centralized training modules and attendance tracking for consistent operations.",
      image:
        "https://videos.openai.com/az/vg-assets/task_01keej1m2pfe9vtkkb4tg9gp3x%2F1767867760_img_1.webp?se=2026-01-13T00%3A00%3A00Z&sp=r&sv=2024-08-04&sr=b&skoid=aa5ddad1-c91a-4f0a-9aca-e20682cc8969&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2026-01-08T03%3A55%3A09Z&ske=2026-01-15T04%3A00%3A09Z&sks=b&skv=2024-08-04&sig=e7SQ8SxWUbbgFg4YNdW6NL9SiETplcDsUwyOnl4Pr/I%3D&ac=oaivgprodscus2",
    },
  ]
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setCurrentSlide((s) => (s + 1) % slides.length), 5000)
    return () => clearInterval(t)
  }, [])

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const storedEmail = localStorage.getItem("rememberedEmail")
    const isRemembered = localStorage.getItem("rememberMe") === "true"

    if (isRemembered && storedEmail) {
      setEmail(storedEmail)
      setRememberMe(true)
    }
  }, [])

  const loginMutation = useMutation({
    mutationFn: async (): Promise<LoginResponse> => {
      const response = await api.post(API_ROUTES.AUTH.LOGIN, { email, password })
      return response.data
    },
    onSuccess: (data) => {
      if (data.token && data.user) {
        localStorage.setItem("authToken", data.token)
        localStorage.setItem("userId", data.user.id || "")
        localStorage.setItem("userEmail", data.user.email || "")
        localStorage.setItem("userName", data.user.name || "")
        localStorage.setItem("userRole", data.user.role || "")

        if (rememberMe) {
          localStorage.setItem("rememberedEmail", email)
          localStorage.setItem("rememberMe", "true")
        } else {
          localStorage.removeItem("rememberedEmail")
          localStorage.removeItem("rememberMe")
        }

        window.location.href = "/dashboard"
      }
    },
    onError: (err: LoginError) => {
      setError(err.response?.data?.message || "Invalid email or password")
    },
  })

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    loginMutation.mutate()
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-hidden">
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.08, 0.18, 0.08] }}
        transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY }}
        className="absolute top-16 left-12 w-72 h-72 bg-blue-400 rounded-full blur-3xl pointer-events-none opacity-40"
      />
      <motion.div
        animate={{ scale: [1, 1.12, 1], opacity: [0.06, 0.16, 0.06] }}
        transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, delay: 2 }}
        className="absolute bottom-12 right-12 w-80 h-80 bg-purple-300 rounded-full blur-3xl pointer-events-none opacity-35"
      />

      <div className="flex w-full max-w-6xl rounded-3xl shadow-sm overflow-hidden bg-white border border-slate-100 relative z-10">
        <motion.div
          className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-50 via-indigo-50 to-white items-center justify-center p-6 relative overflow-hidden"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="absolute inset-0 opacity-20">
            <motion.div
              animate={{ y: [0, 20, 0] }}
              transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY }}
              className="absolute top-10 right-20"
            >
              <Zap className="w-16 h-16 text-blue-200" />
            </motion.div>
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 7, repeat: Number.POSITIVE_INFINITY, delay: 1 }}
              className="absolute bottom-20 left-10"
            >
              <Shield className="w-14 h-14 text-blue-200" />
            </motion.div>
          </div>

          <div className="relative z-10 w-full h-full">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              style={{
                backgroundImage: `linear-gradient(rgba(6,8,19,0.45), rgba(6,8,19,0.35)), url(${slides[currentSlide].image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
              className="w-full h-full rounded-lg p-6 flex flex-col justify-between text-white"
            >
              <div>
                <div className="flex items-center gap-2">
                </div>

                <h2 className="mt-6 text-2xl lg:text-3xl font-extrabold leading-tight whitespace-pre-line caveat-brush-regular">
                  {slides[currentSlide].title}
                </h2>
                <p className="mt-2 max-w-md text-sm text-white/90">{slides[currentSlide].desc}</p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentSlide((s) => (s - 1 + slides.length) % slides.length)}
                    className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition"
                    aria-label="previous"
                  >
                    <ChevronLeft className="w-5 h-5 text-white" />
                  </button>

                  <div className="flex items-center gap-2">
                    {slides.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentSlide(i)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          i === currentSlide ? "bg-white" : "bg-white/40"
                        }`}
                        aria-label={`go to slide ${i + 1}`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentSlide((s) => (s + 1) % slides.length)}
                    className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition"
                    aria-label="next"
                  >
                    <ChevronRight className="w-5 h-5 text-white" />
                  </button>
                </div>

                <div className="text-sm text-white/80">{currentSlide + 1} / {slides.length}</div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          className="w-full lg:w-1/2 p-6 lg:p-8 flex flex-col justify-center bg-white"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="text-center mb-6">
            <motion.div className="text-center mb-4">
              <div className="flex items-center justify-center mb-1">
                <img src={logo} alt="logo1" className="w-30 h-30 object-contain mx-auto" />
              </div>

              <motion.h2 initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-4xl font-extrabold text-slate-900 mb-0 caveat-brush-regular">
                Welcome Back
              </motion.h2>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-slate-600 text-sm">
                Sign in to your quality management dashboard
              </motion.p>
            </motion.div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl opacity-0 group-focus-within:opacity-20 transition-all duration-300 pointer-events-none" />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-2 py-2 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all bg-slate-50 focus:bg-white"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </motion.div>

            {/* Password Field */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl opacity-0 group-focus-within:opacity-20 transition-all duration-300 pointer-events-none" />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-2 py-2 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all bg-slate-50 focus:bg-white"
                  placeholder="••••••••"
                  required
                />
              </div>
            </motion.div>

            {/* Remember Me Checkbox */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="flex items-center"
            >
              <label className="flex items-center text-sm text-slate-600 cursor-pointer group">
                <div className="relative w-5 h-5 mr-3">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="hidden"
                  />
                  <motion.div
                    animate={{ scale: rememberMe ? 1 : 0.8 }}
                    className={`w-5 h-5 rounded border-2 transition-all ${
                      rememberMe
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 border-purple-600"
                        : "border-slate-300 group-hover:border-blue-400"
                    }`}
                  >
                    {rememberMe && <Check size={14} className="text-white m-auto" />}
                  </motion.div>
                </div>
                Remember me
              </label>
            </motion.div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium"
              >
                {error}
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.button
              type="submit"
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all overflow-hidden relative group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loginMutation.isPending}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <motion.div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
              <div className="flex items-center justify-center gap-2 relative z-10">
                {loginMutation.isPending ? (
                  <>
                    <motion.div
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Number.POSITIVE_INFINITY, duration: 0.8, ease: "linear" }}
                    />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <Rocket size={18} />
                    <span>Sign In</span>
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                    >
                      <ArrowRight size={18} />
                    </motion.div>
                  </>
                )}
              </div>
            </motion.button>

            
          </form>
        </motion.div>
      </div>
    </div>
  )
}

export default Login
