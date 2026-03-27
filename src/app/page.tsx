export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
      <div className="text-center max-w-2xl">
        <div className="mb-6 inline-flex items-center rounded-full bg-[#06B6D4]/10 px-4 py-1.5 text-sm font-medium text-[#0E7490]">
          Coming soon
        </div>
        <h1 className="text-5xl font-bold tracking-tight text-[#1E293B] sm:text-6xl">
          Piki<span className="text-[#06B6D4]">Med</span>
        </h1>
        <p className="mt-4 text-xl text-slate-500">
          The smarter way to find care.
        </p>
        <p className="mt-6 text-base text-slate-400">
          Connect with the right healthcare providers near you — fast, simple, and stress-free.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href="/api/health"
            className="rounded-lg bg-[#06B6D4] px-6 py-3 text-sm font-semibold text-white shadow hover:bg-[#0E7490] transition-colors"
          >
            API Health Check
          </a>
        </div>
      </div>
    </main>
  );
}
