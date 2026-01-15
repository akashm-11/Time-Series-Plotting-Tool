export default function Header() {
  return (
    <header className="relative bg-linear-to-r from-black via-rose-950 to-black border-b border-rose-900">
      <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-center gap-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-rose-600/20 border border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.18)]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="w-7 h-7 text-rose-400"
          >
            <path d="M3 3v18h18" />
            <path d="M7 14l4-4 3 3 5-6" />
          </svg>
        </div>

        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-rose-400 via-rose-300 to-rose-500">
            Time Series Plotting Tool
          </h1>
          <p className="text-sm text-rose-200/70 mt-1">
            Upload → Select files & parameters → Visualize
          </p>
        </div>
      </div>
    </header>
  );
}
