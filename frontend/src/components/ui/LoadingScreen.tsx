'use client'

import { useEffect, useState } from 'react'

const quotes = [
  { text: "Seeking knowledge is an obligation upon every Muslim.", author: "PROPHET MUHAMMAD (PBUH)" },
  { text: "He who travels a path in search of knowledge, Allah will make his path to Paradise easy.", author: "PROPHET MUHAMMAD (PBUH)" },
  { text: "Read! In the name of your Lord who created.", author: "QURAN 96:1" },
  { text: "Knowledge is the life of the mind.", author: "ABU BAKR (RA)" },
  { text: "The ink of the scholar is more holy than the blood of the martyr.", author: "PROPHET MUHAMMAD (PBUH)" }
];

export default function LoadingScreen() {
  // Always initialize with the first quote to ensure perfect Server/Client hydration matching
  const [quote, setQuote] = useState(quotes[0]);

  useEffect(() => {
    // Once mounted on the client, instantly switch to a random quote
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/90 dark:bg-[#111]/90 backdrop-blur-md overflow-hidden">
      {/* Subtle Geometric Background Pattern (Hexagons) */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" 
           style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}>
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-2xl px-6 w-full animate-in fade-in zoom-in duration-1000">
        
        {/* Book Icon with Pulsing Circle */}
        <div className="relative mb-8">
          <div className="absolute inset-0 rounded-full border-2 border-[#0a6c4c] dark:border-emerald-500 opacity-20 animate-ping"></div>
          <div className="w-24 h-24 rounded-full border-2 border-[#0a6c4c] dark:border-emerald-500 flex items-center justify-center bg-white dark:bg-[#1a1a1a] shadow-lg shadow-[#0a6c4c]/10">
            {/* Elegant Book Icon */}
            <svg className="w-10 h-10 text-[#0a6c4c] dark:text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zm6.8 6L12 12.16 5.2 8.45 12 4.74l6.8 4.26z" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-[#0a6c4c] dark:text-emerald-400 mb-2">Al-Mu'allim</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-12">Loading your journey...</p>

        {/* Quote Container */}
        <div className="bg-white dark:bg-[#1a1a1a] p-8 md:p-12 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-gray-800/60 w-full text-center relative mt-4">
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-4xl text-[#bdf3df] dark:text-emerald-900 font-serif">"</div>
          <p className="text-lg md:text-xl text-[#0a6c4c] dark:text-emerald-100 font-medium leading-relaxed mb-6 italic">
            "{quote.text}"
          </p>
          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            — {quote.author}
          </p>
        </div>

        {/* Bottom Progress Line */}
        <div className="fixed bottom-12 w-48 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-[#0a6c4c] dark:bg-emerald-500 rounded-full animate-pulse w-full"></div>
        </div>

      </div>
    </div>
  )
}
