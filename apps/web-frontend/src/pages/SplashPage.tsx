import { Link } from 'react-router-dom'

export default function SplashPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-6">
      <div className="absolute -left-20 -top-24 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="absolute -bottom-16 -right-20 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />

      <section className="relative z-10 text-center max-w-2xl">
        {/* CareLink Wordmark Logo */}
        <div className="mb-8 flex justify-center">
          <img 
            src="/carelink-wordmark.svg" 
            alt="CareLink" 
            className="h-40 w-auto"
          />
        </div>

        {/* System Description */}
        <p className="mt-2 text-lg text-slate-600 leading-relaxed">
          Making workplaces truly inclusive for people with learning disabilities
        </p>

        {/* Key Benefits */}
        <div className="mt-10 grid grid-cols-3 gap-4 mb-10">
          <div className="rounded-lg bg-emerald-50 p-4 border border-emerald-200">
            <p className="font-semibold text-emerald-900 text-sm">3 Weeks for Support</p>
            <p className="text-xs text-emerald-700 mt-1">vs 8 weeks traditional</p>
          </div>
          <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
            <p className="font-semibold text-blue-900 text-sm">Personalized Plans</p>
            <p className="text-xs text-blue-700 mt-1">Cognitive + workplace fit</p>
          </div>
          <div className="rounded-lg bg-indigo-50 p-4 border border-indigo-200">
            <p className="font-semibold text-indigo-900 text-sm">Inclusive Outcomes</p>
            <p className="text-xs text-indigo-700 mt-1">85% retention rate</p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col gap-3 items-center justify-center">
          <Link 
            to="/auth" 
            className="w-full max-w-xs rounded-lg bg-gradient-to-r from-cyan-600 to-cyan-500 px-6 py-3 text-base font-semibold text-white hover:shadow-lg transition-shadow"
          >
            Get Started
          </Link>
          <Link 
            to="/guest" 
            className="w-full max-w-xs rounded-lg border-2 border-slate-300 px-6 py-3 text-base font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Browse as guest
          </Link>
        </div>

        {/* Footer */}
        <p className="mt-10 text-xs text-slate-500">
          Healthcare-HR Bridge Platform • v1.0
        </p>
      </section>
    </main>
  )
}
