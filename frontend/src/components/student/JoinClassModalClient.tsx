'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { joinClass } from '@/app/student/join/actions'
import Link from 'next/link'

export default function JoinClassModalClient() {
  const router = useRouter()
  const [code, setCode] = useState<string[]>(Array(6).fill(''))
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'closed'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [joinedClassData, setJoinedClassData] = useState<{name: string, teacher: string} | null>(null)
  const [closedClassData, setClosedClassData] = useState<{name: string, teacher: string} | null>(null)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Close modal on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') router.back()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [router])

  const handleInput = (index: number, value: string) => {
    // Only allow alphanumeric characters
    if (!/^[a-zA-Z0-9]*$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value.toUpperCase();
    setCode(newCode);

    // Auto-advance to next input
    if (value !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (code[index] === '' && index > 0) {
        // Move to previous input and clear it
        inputRefs.current[index - 1]?.focus();
        const newCode = [...code];
        newCode[index - 1] = '';
        setCode(newCode);
      } else {
        // Clear current input
        const newCode = [...code];
        newCode[index] = '';
        setCode(newCode);
      }
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    if (pastedData) {
      const newCode = [...code];
      for (let i = 0; i < pastedData.length; i++) {
        newCode[i] = pastedData[i];
      }
      setCode(newCode);
      
      // Focus the next empty input or the last one
      const nextIndex = pastedData.length < 6 ? pastedData.length : 5;
      inputRefs.current[nextIndex]?.focus();
    }
  }

  const handleSubmit = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) return;

    setStatus('loading');
    
    const formData = new FormData();
    formData.append('classCode', fullCode);
    
    const res = await joinClass(formData);
    
    if (res?.error === 'CLASS_CLOSED') {
      setClosedClassData({ name: (res as any).className || 'This Class', teacher: (res as any).teacher || 'the instructor' });
      setStatus('closed');
    } else if (res?.error) {
      setErrorMessage(res.error);
      setStatus('error');
    } else if (res?.success && res.classData) {
      setStatus('success');
      setJoinedClassData(res.classData);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={() => router.back()}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-white dark:bg-[#1a1a1a] rounded-[28px] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-300 mx-4">
        
        {/* Close Button */}
        <button 
          onClick={() => router.back()}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {status === 'idle' || status === 'loading' ? (
          <div className="flex flex-col items-center text-center">
            {/* Icon */}
            <div className="w-16 h-16 bg-[#bdf3df]/40 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-[#092B2B] dark:text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
            </div>
            
            <h2 className="text-2xl font-extrabold text-[#092B2B] dark:text-white tracking-tight mb-3">Join a New Classroom</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-8 max-w-[280px]">
              Enter the classroom key provided by your teacher to access assignments and resources.
            </p>

            {/* Inputs */}
            <div className="w-full mb-8">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Classroom Key (6 digits)</label>
              <div className="flex items-center justify-center gap-2">
                {[0, 1, 2].map((i) => (
                  <input
                    key={`left-${i}`}
                    ref={el => { inputRefs.current[i] = el }}
                    type="text"
                    maxLength={1}
                    value={code[i]}
                    onChange={(e) => handleInput(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onPaste={handlePaste}
                    className="w-12 h-14 bg-[#F4F7F7] dark:bg-black/30 border-2 border-transparent focus:border-[#092B2B] dark:focus:border-emerald-500 rounded-xl text-center text-xl font-extrabold text-[#092B2B] dark:text-white outline-none transition-all uppercase placeholder:text-gray-300"
                  />
                ))}
                
                <span className="text-gray-300 font-bold mx-1">-</span>
                
                {[3, 4, 5].map((i) => (
                  <input
                    key={`right-${i}`}
                    ref={el => { inputRefs.current[i] = el }}
                    type="text"
                    maxLength={1}
                    value={code[i]}
                    onChange={(e) => handleInput(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onPaste={handlePaste}
                    className="w-12 h-14 bg-[#F4F7F7] dark:bg-black/30 border-2 border-transparent focus:border-[#092B2B] dark:focus:border-emerald-500 rounded-xl text-center text-xl font-extrabold text-[#092B2B] dark:text-white outline-none transition-all uppercase placeholder:text-gray-300"
                  />
                ))}
              </div>
            </div>

            <button 
              onClick={handleSubmit}
              disabled={code.join('').length < 6 || status === 'loading'}
              className="w-full bg-[#092B2B] hover:bg-[#0a3838] disabled:bg-gray-200 disabled:text-gray-400 dark:bg-emerald-600 dark:hover:bg-emerald-700 dark:disabled:bg-gray-800 text-white py-3.5 rounded-xl font-bold transition-all"
            >
              {status === 'loading' ? 'Joining...' : 'Join Class'}
            </button>
            <button 
              onClick={() => router.back()}
              className="mt-4 text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : status === 'error' ? (
          <div className="flex flex-col items-center text-center animate-in slide-in-from-bottom-4 duration-500">
            {/* Error Icon */}
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            
            <h2 className="text-2xl font-extrabold text-[#092B2B] dark:text-white tracking-tight mb-3">Invalid Classroom Key</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-8 max-w-[280px]">
              {errorMessage || 'The key you entered is either incorrect or has expired. Please verify it and try again.'}
            </p>

            <div className="w-full px-4 py-3 rounded-xl border-2 border-red-200 bg-red-50 dark:bg-red-900/10 text-red-600 font-extrabold tracking-[0.2em] text-center mb-3 flex items-center justify-between">
              <span className="flex-1 text-center pl-6">{code.join('')}</span>
              <svg className="w-5 h-5 shrink-0 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            
            <p className="text-[11px] font-medium text-gray-500 mb-8 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Tip: Ask your teacher for the updated 6-digit key.
            </p>

            <button 
              onClick={() => {
                setStatus('idle');
                setCode(Array(6).fill(''));
                setTimeout(() => inputRefs.current[0]?.focus(), 100);
              }}
              className="w-full bg-[#092B2B] hover:bg-[#0a3838] dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Try Again
            </button>
            <button className="mt-4 text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors">
              Contact Support
            </button>
          </div>
        ) : status === 'closed' ? (
          <div className="flex flex-col items-center text-center animate-in slide-in-from-bottom-4 duration-500">
            {/* Closed Icon */}
            <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-extrabold text-[#092B2B] dark:text-white tracking-tight mb-3">Class is Closed</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-2 max-w-[280px] leading-relaxed">
              <span className="font-extrabold text-[#092B2B] dark:text-white">{closedClassData?.name}</span> has been closed by <span className="italic">{closedClassData?.teacher}</span>.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-8 max-w-[280px] leading-relaxed">
              This class is no longer accepting new students. Please contact your teacher for more information.
            </p>

            <div className="w-full px-4 py-3 rounded-xl border-2 border-amber-200 bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400 text-xs font-bold text-center mb-6">
              🔒 Enrollment is currently closed for this class
            </div>

            <button 
              onClick={() => {
                setStatus('idle');
                setCode(Array(6).fill(''));
                setClosedClassData(null);
                setTimeout(() => inputRefs.current[0]?.focus(), 100);
              }}
              className="w-full bg-[#092B2B] hover:bg-[#0a3838] dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Try a Different Code
            </button>
            <button 
              onClick={() => router.back()}
              className="mt-4 text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center animate-in slide-in-from-bottom-4 duration-500">
            {/* Success Icon */}
            <div className="w-16 h-16 bg-[#bdf3df]/40 rounded-full flex items-center justify-center mb-6">
              <span className="text-3xl relative top-0.5">🎉</span>
            </div>
            
            <h2 className="text-2xl font-extrabold text-[#092B2B] dark:text-white tracking-tight mb-3">Welcome to the Class!</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-8 max-w-[280px] leading-relaxed">
              You've successfully enrolled in <br/>
              <span className="font-extrabold text-[#092B2B] dark:text-white">{joinedClassData?.name || 'Your New Class'}</span> with <span className="italic">{joinedClassData?.teacher || 'your instructor'}</span>.
            </p>

            <div className="w-full space-y-3 mb-8">
              <button 
                onClick={() => {
                  // Redirect to classroom page
                  window.location.href = '/student/dashboard' 
                }}
                className="w-full bg-[#092B2B] hover:bg-[#0a3838] dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white py-3.5 rounded-xl font-bold transition-all shadow-sm"
              >
                Go to Classroom
              </button>
              <button 
                onClick={() => router.back()}
                className="w-full bg-[#EBF1F6] hover:bg-[#e0e8f0] dark:bg-gray-800 dark:hover:bg-gray-700 text-[#092B2B] dark:text-gray-300 py-3.5 rounded-xl font-bold transition-all"
              >
                Back to Dashboard
              </button>
            </div>
            
            <p className="text-[10px] font-bold text-gray-400 italic">
              "The best of you are those who learn the Quran and teach it."
            </p>
          </div>
        )}
        
      </div>
    </div>
  )
}
