import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center animate-in fade-in zoom-in duration-700 bg-gray-50/30 dark:bg-black">
      
      {/* Icon Area */}
      <div className="relative mb-12">
        <div className="w-32 h-32 bg-white dark:bg-[#1a1a1a] rounded-[2rem] shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800/60 flex items-center justify-center relative z-10">
          <svg className="w-16 h-16 text-[#0a6c4c] dark:text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             {/* Lightbulb Icon */}
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        {/* Floating elements from design */}
        <div className="absolute -top-4 -right-6 w-12 h-12 bg-[#bdf3df] rounded-full flex items-center justify-center z-0 animate-bounce" style={{animationDuration: '3s'}}>
          <svg className="w-5 h-5 text-[#0a6c4c]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
        </div>
        <div className="absolute -bottom-4 -left-6 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center z-0 animate-bounce" style={{animationDuration: '4s', animationDelay: '1s'}}>
          <svg className="w-5 h-5 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
        </div>
      </div>

      {/* Typography */}
      <h1 className="text-4xl md:text-5xl font-bold text-[#0a6c4c] dark:text-emerald-400 mb-4 tracking-tight">A Moment of Reflection</h1>
      <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-lg mx-auto">
        It seems the page you are looking for has found its own path. Let us help you find yours.
      </p>
      
      <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-12">
        ERROR 404 — THE PATH IS CURRENTLY OBSCURED
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-center gap-4 mb-20 w-full max-w-2xl">
        <Link href="/login" className="flex items-center justify-center gap-3 bg-[#0a6c4c] text-white px-8 py-4 rounded-2xl font-bold hover:bg-[#085a3f] transition-colors shadow-lg shadow-[#0a6c4c]/20 flex-1">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
          <div className="text-left leading-tight">
            <span className="block text-xs font-normal opacity-80">Return to</span>
            Dashboard
          </div>
        </Link>

        <Link href="/library" className="flex items-center justify-center gap-3 bg-[#bdf3df] dark:bg-emerald-900/40 text-[#0a6c4c] dark:text-emerald-400 px-8 py-4 rounded-2xl font-bold hover:bg-[#a6eed3] transition-colors flex-1">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          <div className="text-left leading-tight">
            <span className="block text-xs font-normal opacity-80">Visit</span>
            Library
          </div>
        </Link>
        
        <Link href="/support" className="flex items-center justify-center gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-8 py-4 rounded-2xl font-bold hover:bg-gray-50 transition-colors flex-1">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          <div className="text-left leading-tight">
            <span className="block text-xs font-normal opacity-80">Contact</span>
            Support
          </div>
        </Link>
      </div>

      {/* Quote */}
      <p className="text-sm text-gray-400 dark:text-gray-500 italic max-w-lg mx-auto leading-relaxed">
        "Seeking knowledge is a journey that never truly ends, even when the road takes an unexpected turn."
      </p>

    </div>
  )
}
