import { Rocket, ArrowRight } from "lucide-react"

export default function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-700 text-white text-center">
      <h2 className="text-4xl font-black mb-6">
        Ready to transform your quality management?
      </h2>
      <p className="mb-10 text-blue-100">
        Join the future of enterprise quality systems.
      </p>

      <button className="bg-white text-blue-700 px-8 py-3 rounded-xl font-bold flex items-center gap-2 mx-auto">
        <Rocket size={16} />
        Get Started
        <ArrowRight size={16} />
      </button>
    </section>
  )
}
