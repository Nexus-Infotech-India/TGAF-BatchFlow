"use client"

import { useState, useEffect } from "react"

export default function FooterSection() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 },
    )

    const footer = document.getElementById("footer-section")
    if (footer) observer.observe(footer)

    return () => observer.disconnect()
  }, [])

  return (
    <footer
      id="footer-section"
      className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-300 py-16 px-4 relative overflow-hidden"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 relative z-10">
        <div
          className="transition-all duration-700"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0)" : "translateY(20px)",
            transitionDelay: "0s",
          }}
        >
          <h3 className="font-black text-white mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            BatchFlow
          </h3>
          <p className="text-sm leading-relaxed">Enterprise quality management platform.</p>
        </div>

        <div
          className="transition-all duration-700"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0)" : "translateY(20px)",
            transitionDelay: "0.1s",
          }}
        >
          <h4 className="font-bold text-white mb-3">Platform</h4>
          <ul className="space-y-2 text-sm">
            <li className="transition-all duration-300 hover:text-blue-400 hover:translate-x-1 cursor-pointer">
              Batch Management
            </li>
            <li className="transition-all duration-300 hover:text-blue-400 hover:translate-x-1 cursor-pointer">
              Training
            </li>
            <li className="transition-all duration-300 hover:text-blue-400 hover:translate-x-1 cursor-pointer">
              Audit Control
            </li>
          </ul>
        </div>

        <div
          className="transition-all duration-700"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0)" : "translateY(20px)",
            transitionDelay: "0.2s",
          }}
        >
          <h4 className="font-bold text-white mb-3">Company</h4>
          <ul className="space-y-2 text-sm">
            <li className="transition-all duration-300 hover:text-purple-400 hover:translate-x-1 cursor-pointer">
              About
            </li>
            <li className="transition-all duration-300 hover:text-purple-400 hover:translate-x-1 cursor-pointer">
              Support
            </li>
            <li className="transition-all duration-300 hover:text-purple-400 hover:translate-x-1 cursor-pointer">
              Contact
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-10 relative z-10">
        <div className="h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent mb-6" />
        <div
          className="text-center text-sm text-slate-500 transition-all duration-700"
          style={{
            opacity: isVisible ? 1 : 0,
            transitionDelay: "0.3s",
          }}
        >
          © {new Date().getFullYear()} BatchFlow. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
