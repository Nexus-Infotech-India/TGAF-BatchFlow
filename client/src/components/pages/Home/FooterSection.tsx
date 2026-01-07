export default function FooterSection() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-16 px-4">
      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
        <div>
          <h3 className="font-black text-white mb-4">BatchFlow</h3>
          <p className="text-sm">
            Enterprise quality management platform.
          </p>
        </div>

        <div>
          <h4 className="font-bold text-white mb-3">Platform</h4>
          <ul className="space-y-2 text-sm">
            <li>Batch Management</li>
            <li>Training</li>
            <li>Audit Control</li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-white mb-3">Company</h4>
          <ul className="space-y-2 text-sm">
            <li>About</li>
            <li>Support</li>
            <li>Contact</li>
          </ul>
        </div>
      </div>

      <div className="text-center text-sm mt-10 text-slate-500">
        © {new Date().getFullYear()} BatchFlow
      </div>
    </footer>
  )
}
