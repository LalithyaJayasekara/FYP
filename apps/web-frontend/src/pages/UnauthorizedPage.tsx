import { Link } from 'react-router-dom'

export default function UnauthorizedPage() {
  return (
    <main className="min-h-screen bg-rose-50 px-6 py-10 text-rose-950">
      <section className="mx-auto w-full max-w-xl rounded-2xl bg-white p-6 text-center shadow-sm sm:p-10">
        <h1 className="text-3xl font-bold">Access Restricted</h1>
        <p className="mt-3 text-sm text-rose-900">
          Your current role does not have permission to open this page. Use a permitted account role or return to the
          role selection dashboard.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link to="/home" className="rounded-md bg-rose-700 px-4 py-2 text-sm font-semibold text-white">
            Back to Home
          </Link>
          <Link to="/auth" className="text-sm font-semibold underline">
            Switch account
          </Link>
        </div>
      </section>
    </main>
  )
}
