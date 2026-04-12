import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center px-6 text-slate-900">
      <div className="sw-glass-card w-full max-w-lg rounded-2xl p-8 text-center sm:p-10">
        <h1 className="text-4xl font-bold">Page Not Found</h1>
        <p className="mt-3 text-slate-700">The route does not exist yet in this frontend skeleton.</p>
        <Link to="/home" className="sw-btn-secondary mt-6 inline-block rounded-md px-4 py-2 text-sm font-semibold transition">
          Back to home
        </Link>
      </div>
    </main>
  )
}
