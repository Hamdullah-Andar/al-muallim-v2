'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { syncLibraryPortionRead } from '@/app/student/dashboard/actions'

interface BookDetailClientProps {
  bookId: string
  user: any
  profile: any
  initialAssignmentId?: string | null
  initialStartRoba?: number | null
  initialBookData?: any
  initialLoggedPortionsToday?: number
}

interface ChapterItem {
  id: number
  title: string
  itemsCount: string
  status: 'completed' | 'current' | 'locked'
}

export default function BookDetailClient({ bookId, user, profile, initialAssignmentId, initialStartRoba, initialBookData, initialLoggedPortionsToday }: BookDetailClientProps) {
  const router = useRouter()
  const isQuranBook = bookId === 'quran' || bookId.toLowerCase().includes('quran') || Boolean(initialBookData?.title && initialBookData.title.toLowerCase().includes('quran'))
  
  const [isSaved, setIsSaved] = useState(false)
  const [expandedAll, setExpandedAll] = useState(true)
  const [activeTab, setActiveTab] = useState<'content' | 'overview' | 'notes'>('content')
  const [activeReaderChapter, setActiveReaderChapter] = useState<ChapterItem | null>(null)
  const [isSyncingLog, setIsSyncingLog] = useState<boolean>(false)
  const [loggedPortionsToday, setLoggedPortionsToday] = useState<number>(initialLoggedPortionsToday || 0)
  const [quranRobaNumber, setQuranRobaNumber] = useState<number>(initialStartRoba || 1)
  const [quranVerses, setQuranVerses] = useState<any[]>([])
  const [isLoadingVerses, setIsLoadingVerses] = useState<boolean>(false)
  const [quranFetchError, setQuranFetchError] = useState<string | null>(null)

  // Initialize quranRobaNumber when activeReaderChapter opens
  useEffect(() => {
    if (activeReaderChapter && isQuranBook && typeof activeReaderChapter.id === 'number') {
      setQuranRobaNumber(activeReaderChapter.id)
    }
  }, [activeReaderChapter, isQuranBook])

  // Fetch live verses whenever quranRobaNumber changes (Option B: Rub' el Juz 1..120)
  useEffect(() => {
    if (!activeReaderChapter || !isQuranBook) return
    const robaToFetch = quranRobaNumber || 1

    let isMounted = true
    setIsLoadingVerses(true)
    setQuranFetchError(null)

    // Option B: Each Rub' el Juz (Quarter Juz, out of 120) consists of two Rub' el Hizb (out of 240)
    const hizbRub1 = (robaToFetch * 2) - 1
    const hizbRub2 = robaToFetch * 2

    Promise.all([
      fetch(`https://api.quran.com/api/v4/verses/by_rub_el_hizb/${hizbRub1}?language=en&translations=131&fields=text_uthmani`).then(res => res.ok ? res.json() : { verses: [] }),
      fetch(`https://api.quran.com/api/v4/verses/by_rub_el_hizb/${hizbRub2}?language=en&translations=131&fields=text_uthmani`).then(res => res.ok ? res.json() : { verses: [] })
    ])
      .then(([data1, data2]) => {
        if (isMounted) {
          const combined = [...(data1.verses || []), ...(data2.verses || [])]
          setQuranVerses(combined)
        }
      })
      .catch(err => {
        console.error('Quran API fetch error:', err)
        if (isMounted) setQuranFetchError('Could not load live verses from Quran.com. Please check your network connection.')
      })
      .finally(() => {
        if (isMounted) setIsLoadingVerses(false)
      })

    return () => { isMounted = false }
  }, [quranRobaNumber, activeReaderChapter, isQuranBook])

  // Determine book info dynamically for Hero Featured Resource, Continue Reading, or Library Grid books
  const getBookData = (id: string) => {
    if (id === 'feat-1') {
      return {
        title: 'The Marvels of Creation: Foundations of Islamic Science',
        author: 'Dr. Muzaffar Iqbal',
        category: 'Islamic History',
        subcategory: 'Science & Philosophy',
        rating: 5.0,
        reviewsCount: '890',
        pages: 340,
        completedPages: 68,
        percentComplete: 20,
        timeSpent: '3h 15m',
        notesCount: '7 Items',
        lastSession: '2 days ago',
        description: `The Marvels of Creation examines the profound connection between scientific exploration and spiritual contemplation in classical Islamic civilization. Covering astronomy, mathematics, medicine, and optics, this volume explores how scholars viewed nature as signs of divine perfection.

Through detailed historical accounts and primary source translations, Dr. Muzaffar Iqbal demonstrates how Islamic intellectual traditions fostered scientific rigor while maintaining harmony with theology and moral ethics.`,
        chapters: [
          { id: 1, title: 'Chapter 1: The Epistemological Foundations of Science in Islam', itemsCount: '45 Pages • Completed', status: 'completed' },
          { id: 2, title: 'Chapter 2: Astronomy & The Observational Revolution', itemsCount: '52 Pages • Currently Reading', status: 'current' },
          { id: 3, title: 'Chapter 3: Mathematics, Geometry & Divine Harmony', itemsCount: '60 Pages • Locked', status: 'locked' },
          { id: 4, title: 'Chapter 4: Medicine & Ethics of the Classical Physicians', itemsCount: '48 Pages • Locked', status: 'locked' }
        ] as ChapterItem[]
      }
    }

    if (id === 'cont-fiqh') {
      return {
        title: 'Fiqh Simplified: Core Principles of Islamic Jurisprudence',
        author: 'Shaykh Ahmad al-Faruqi',
        category: 'Fiqh Studies',
        subcategory: 'Jurisprudence',
        rating: 4.8,
        reviewsCount: '520',
        pages: 190,
        completedPages: 134,
        percentComplete: 68,
        timeSpent: '8h 20m',
        notesCount: '14 Items',
        lastSession: 'Today',
        description: `Fiqh Simplified provides an accessible and clear introduction to the fundamental principles of Islamic jurisprudence across the classical schools of thought. Designed specifically for modern students, it unpacks foundational terminology and practical worship rulings.`,
        chapters: [
          { id: 1, title: 'Purification (Tahara) & Water Rulings', itemsCount: '32 Pages • Completed', status: 'completed' },
          { id: 2, title: 'The Prayer (Salah): Conditions & Pillars', itemsCount: '48 Pages • Completed', status: 'completed' },
          { id: 3, title: 'Zakat & Charity Calculations', itemsCount: '36 Pages • Currently Reading', status: 'current' },
          { id: 4, title: 'Fasting (Sawm) & Spiritual Discipline', itemsCount: '28 Pages • Locked', status: 'locked' }
        ] as ChapterItem[]
      }
    }

    if (id === 'cont-history') {
      return {
        title: 'History of the Caliphs: Leadership & Society',
        author: 'Ustadh Sulaiman',
        category: 'Islamic History',
        subcategory: 'Classical Eras',
        rating: 4.9,
        reviewsCount: '410',
        pages: 380,
        completedPages: 45,
        percentComplete: 12,
        timeSpent: '2h 10m',
        notesCount: '3 Items',
        lastSession: '3 days ago',
        description: `An engaging exploration of the socio-political and spiritual developments during the era of the Rightly Guided Caliphs and subsequent dynasties, focusing on administrative reforms, justice, and societal cohesion.`,
        chapters: [
          { id: 1, title: 'The Election of Abu Bakr as-Siddiq', itemsCount: '40 Pages • Completed', status: 'completed' },
          { id: 2, title: 'Umar ibn al-Khattab & Institutional Reforms', itemsCount: '65 Pages • Currently Reading', status: 'current' },
          { id: 3, title: 'Uthman ibn Affan & Compilation of the Quran', itemsCount: '50 Pages • Locked', status: 'locked' },
          { id: 4, title: 'Ali ibn Abi Talib & Principles of Governance', itemsCount: '55 Pages • Locked', status: 'locked' }
        ] as ChapterItem[]
      }
    }

    if (id === 'cont-tafsir') {
      return {
        title: 'Gems of Tafsir: Contemplating the Quranic Discourse',
        author: 'Shaykh Hassan Al-Banna',
        category: 'Quran & Tafsir',
        subcategory: 'Exegesis',
        rating: 5.0,
        reviewsCount: '1,120',
        pages: 355,
        completedPages: 312,
        percentComplete: 88,
        timeSpent: '16h 40m',
        notesCount: '24 Items',
        lastSession: 'Yesterday',
        description: `Gems of Tafsir highlights profound linguistic pearls, thematic connections, and spiritual reflections from selected surahs of the Holy Quran, bringing timeless guidance into everyday living.`,
        chapters: [
          { id: 1, title: 'Surah Al-Fatiha: The Mother of the Book', itemsCount: '35 Pages • Completed', status: 'completed' },
          { id: 2, title: 'Surah Al-Kahf: Trials and Divine Protection', itemsCount: '60 Pages • Completed', status: 'completed' },
          { id: 3, title: 'Surah Ya-Seen: Heart of the Quran', itemsCount: '45 Pages • Completed', status: 'completed' },
          { id: 4, title: 'Surah Al-Mulk: Contemplating Creation', itemsCount: '40 Pages • Currently Reading', status: 'current' }
        ] as ChapterItem[]
      }
    }

    if (id === 'quran' || id === 'holy-quran' || id === '0') {
      const activeStart = initialStartRoba || quranRobaNumber || 1
      const generatedChapters: ChapterItem[] = Array.from({ length: 120 }, (_, i) => {
        const n = i + 1
        const j = Math.ceil(n / 4)
        const r = ((n - 1) % 4) + 1
        return {
          id: n,
          title: `Juz ${j} • Roba ${r} (Rub el Juz ${n})`,
          itemsCount: '~5 Pages • Live Quran.com API',
          status: n === activeStart ? 'current' : n < activeStart ? 'completed' : 'locked'
        }
      })

      return {
        title: 'The Holy Quran (Al-Quran Al-Kareem)',
        author: 'Divine Revelation (Mushaf Madani & Uthmani Script)',
        category: 'Sacred Scripture',
        subcategory: 'Recitation & Tajweed',
        rating: 5.0,
        reviewsCount: '15,420',
        pages: 604,
        completedPages: Math.min(604, Math.round(activeStart * 5)),
        percentComplete: Math.round((activeStart / 120) * 100),
        timeSpent: '48h 15m',
        notesCount: '30 Items',
        lastSession: 'Today',
        description: `The Holy Quran is the central religious text of Islam, believed by Muslims to be a revelation from God (Allah). Organized in 114 Surahs across 30 Juz (divided into 120 Quarters of Juz / Rub' el Juz).

This interactive reader is linked live to the official Quran.com API (by_rub_el_hizb endpoints grouped into Quarter Juz). Students recite authentic Uthmani script portion by portion (1 Roba of Juz each day from the beginning, ~5 pages per portion) and sync progress directly to their assignment tracker.`,
        chapters: generatedChapters
      }
    }

    if (id === '7') {
      return {
        title: 'Anwar ul-Quran / Tafsir Ibn Kathir',
        author: 'Imam Ibn Kathir (Abridged & Annotated)',
        category: 'Quran & Tafsir',
        subcategory: 'Exegesis & Translation',
        rating: 4.9,
        reviewsCount: '980',
        pages: 520,
        completedPages: 180,
        percentComplete: 35,
        timeSpent: '14h 20m',
        notesCount: '15 Items',
        lastSession: '2 days ago',
        description: `Tafsir Ibn Kathir is one of the most comprehensive and authentic explanations of the Quran, utilizing prophetic traditions and early scholarship to illuminate the context and meanings of divine verses.`,
        chapters: [
          { id: 1, title: 'Introduction & Principles of Tafsir', itemsCount: '40 Pages • Completed', status: 'completed' },
          { id: 2, title: 'Tafsir of Surah Al-Fatiha & Early Baqarah', itemsCount: '70 Pages • Completed', status: 'completed' },
          { id: 3, title: 'Tafsir of Surah Al-Baqarah: Laws & Ethics', itemsCount: '70 Pages • Currently Reading', status: 'current' },
          { id: 4, title: 'Tafsir of Surah Al-Imran: Steadfastness', itemsCount: '65 Pages • Locked', status: 'locked' }
        ] as ChapterItem[]
      }
    }

    if (id === '1') {
      return {
        title: 'Introduction to Hadith Sciences (Mustalah al-Hadith)',
        author: 'Dr. Mahmud at-Tahan',
        category: 'Hadith Studies',
        subcategory: 'Methodology',
        rating: 4.8,
        reviewsCount: '450',
        pages: 240,
        completedPages: 120,
        percentComplete: 50,
        timeSpent: '7h 10m',
        notesCount: '12 Items',
        lastSession: '3 days ago',
        description: `An authoritative and structured guide introducing students to the rigorous classification of Hadith narrations, chain verification (Isnad), and terminology used by classical scholars.`,
        chapters: [
          { id: 1, title: 'Definition & History of Hadith Compilation', itemsCount: '45 Pages • Completed', status: 'completed' },
          { id: 2, title: 'Classification of Hadith: Sahih, Hasan & Daif', itemsCount: '75 Pages • Currently Reading', status: 'current' },
          { id: 3, title: 'Conditions of the Narrator (Adalah & Dabd)', itemsCount: '60 Pages • Locked', status: 'locked' }
        ] as ChapterItem[]
      }
    }

    if (id === '8') {
      return {
        title: 'Hisnul Muslim (Fortress of the Muslim)',
        author: 'Saeed bin Ali bin Wahf Al-Qahtani',
        category: 'Zikr & Prayers',
        subcategory: 'Supplications',
        rating: 5.0,
        reviewsCount: '2,890',
        pages: 180,
        completedPages: 140,
        percentComplete: 78,
        timeSpent: '9h 30m',
        notesCount: '19 Items',
        lastSession: 'Today',
        description: `A beloved pocket-sized compendium of authentic supplications (Dua) and remembrance (Zikr) compiled from the Quran and Sunnah for daily protection, morning/evening remembrance, and every life situation.`,
        chapters: [
          { id: 1, title: 'Morning and Evening Adhkar', itemsCount: '35 Pages • Completed', status: 'completed' },
          { id: 2, title: 'Supplications for Prayer & Mosque', itemsCount: '45 Pages • Completed', status: 'completed' },
          { id: 3, title: 'Supplications in Times of Difficulty', itemsCount: '40 Pages • Currently Reading', status: 'current' }
        ] as ChapterItem[]
      }
    }

    if (initialBookData) {
      return {
        title: initialBookData.title || 'Class Assigned Book',
        author: initialBookData.author || 'Class Instructor',
        category: initialBookData.category || 'Class Resource',
        subcategory: 'Enrolled Class Reading',
        rating: 5.0,
        reviewsCount: 'Class Library',
        pages: initialBookData.pages || 100,
        completedPages: 5,
        percentComplete: 5,
        timeSpent: '30m',
        notesCount: '0 Items',
        lastSession: 'Today',
        description: initialBookData.description || 'Class reading material provided by your instructor.',
        fileUrl: initialBookData.file_url,
        chapters: [
          { id: 1, title: 'Section 1: Core Reading Material', itemsCount: `${Math.round((initialBookData.pages || 100)/2)} Pages • Currently Reading`, status: 'current' },
          { id: 2, title: 'Section 2: Supplementary Material & Notes', itemsCount: `${Math.round((initialBookData.pages || 100)/2)} Pages • Locked`, status: 'locked' }
        ] as ChapterItem[]
      }
    }

    // Default to Riyad as-Salihin if id === '9' or unknown
    return {
      title: 'Riyad as-Salihin',
      author: 'Imam Yahya ibn Sharaf al-Nawawi',
      category: 'Hadith Studies',
      subcategory: 'Classical',
      rating: 4.9,
      reviewsCount: '1,240',
      pages: 450,
      completedPages: 292,
      percentComplete: 65,
      timeSpent: '12h 45m',
      notesCount: '18 Items',
      lastSession: 'Yesterday',
      description: `Riyad as-Salihin, often translated as The Meadows of the Righteous, is a compiled collection of verses from the Quran and hadith by Imam al-Nawawi. It contains about 1,900 hadith divided into 372 chapters, many of which are introduced by verses of the Quran.

The book is widely considered one of the most important works in the Islamic world for its focus on character building, moral etiquette, and spiritual refinement. It covers every aspect of Islamic belief and moral conduct, selecting the most authentic traditions of the Prophet Muhammad (peace be upon him).`,
      chapters: [
        {
          id: 1,
          title: 'The Book of Miscellany: Sincerity and Intentions',
          itemsCount: '12 Hadiths • Completed',
          status: 'completed'
        },
        {
          id: 2,
          title: 'Chapter on Repentance (At-Tawbah)',
          itemsCount: '18 Hadiths • Completed',
          status: 'completed'
        },
        {
          id: 3,
          title: 'Chapter on Patience (As-Sabr)',
          itemsCount: '29 Hadiths • Currently Reading',
          status: 'current'
        },
        {
          id: 4,
          title: 'Chapter on Truthfulness (As-Sidq)',
          itemsCount: '6 Hadiths • Locked',
          status: 'locked'
        },
        {
          id: 5,
          title: 'Chapter on Watchfulness (Al-Muraqabah)',
          itemsCount: '11 Hadiths • Locked',
          status: 'locked'
        },
        {
          id: 6,
          title: 'Chapter on Piety (At-Taqwa)',
          itemsCount: '8 Hadiths • Locked',
          status: 'locked'
        }
      ] as ChapterItem[]
    }
  }

  const book = getBookData(bookId)


  return (
    <div className="flex flex-col w-full min-h-screen bg-[#fbfbfb] dark:bg-[#0a0a0a]">
      {/* TOP HEADER */}
      <header className="flex items-center justify-between px-8 py-5 bg-white dark:bg-[#111] border-b border-black/5 dark:border-white/5 sticky top-0 z-10">
        {/* Search Input */}
        <div className="relative w-full max-w-md">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search library..."
            className="w-full bg-[#f4f7f6] dark:bg-white/5 border border-transparent focus:border-primary-500 rounded-2xl py-2.5 pl-11 pr-4 text-xs font-medium text-gray-900 dark:text-white outline-none transition-all"
          />
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-4">
          <button type="button" className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/40 border-2 border-white dark:border-gray-800 flex items-center justify-center font-bold text-primary-700 dark:text-primary-300 text-sm shadow-sm">
            {profile?.full_name?.charAt(0) || 'S'}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="p-8 max-w-[1240px] w-full mx-auto space-y-6">
        
        {/* BREADCRUMB */}
        <nav className="flex items-center gap-2 text-xs font-bold text-gray-400">
          <Link href="/student/personal-library" className="hover:text-[#092B2B] dark:hover:text-white transition-colors">
            Library
          </Link>
          <span>›</span>
          <Link href="/student/personal-library" className="hover:text-[#092B2B] dark:hover:text-white transition-colors">
            {book.category}
          </Link>
          <span>›</span>
          <span className="text-gray-800 dark:text-gray-200">{book.title}</span>
        </nav>

        {/* 2-COLUMN BOOK DETAILS LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT SIDEBAR (BOOK COVER & ACTIONS) */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Cover & Primary Actions Card */}
            <div className="bg-white dark:bg-[#111] p-6 rounded-[32px] border border-black/5 dark:border-white/5 shadow-sm space-y-6">
              
              {/* Decorative Book Cover Graphic */}
              <div className="relative aspect-[4/5] bg-gradient-to-br from-[#1c3a2c] to-[#0a1b14] rounded-2xl p-6 shadow-xl border border-white/10 flex flex-col items-center justify-center text-center overflow-hidden">
                {/* Gold Arabesque Frame */}
                <div className="absolute inset-4 border border-amber-400/30 rounded-xl pointer-events-none"></div>
                <div className="absolute inset-5 border border-amber-400/10 rounded-lg pointer-events-none"></div>
                
                <div className="w-12 h-12 rounded-full border border-amber-400/40 flex items-center justify-center mb-3">
                  <span className="text-xs text-amber-300 font-bold">حديث</span>
                </div>

                <h2 className="text-xl font-bold text-white leading-tight mb-1">
                  {book.title}
                </h2>
                <p className="text-[10px] text-emerald-200/80 font-medium tracking-wide uppercase">
                  ESTABLISHED EDITION
                </p>

                <div className="w-16 h-0.5 bg-amber-400/40 my-3"></div>

                <p className="text-[10px] text-gray-300 line-clamp-2">
                  {book.author}
                </p>
              </div>

              {/* Bookmark Resume Indicator */}
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-2.5 text-xs text-emerald-900 dark:text-emerald-200">
                <span className="text-base">📍</span>
                <div className="min-w-0">
                  <p className="font-bold truncate">Auto-Resuming Bookmark</p>
                  <p className="text-[11px] opacity-80 truncate">
                    {book.chapters.find(c => c.status === 'current')?.title || 'Chapter 1'} (Page {book.completedPages + (loggedPortionsToday * 5)})
                  </p>
                </div>
              </div>

              {/* Primary Continue Reading / Open PDF Button */}
              <button
                type="button"
                onClick={() => {
                  if (book.fileUrl && book.fileUrl.startsWith('http')) {
                    window.open(book.fileUrl, '_blank')
                    return
                  }
                  if (isQuranBook) {
                    const targetRoba = initialStartRoba || quranRobaNumber || 1
                    const matchCh = book.chapters.find(c => c.id === targetRoba) || book.chapters.find(c => c.status === 'current') || book.chapters[0]
                    setQuranRobaNumber(targetRoba)
                    setActiveReaderChapter(matchCh)
                    return
                  }
                  const currentCh = book.chapters.find(c => c.status === 'current') || book.chapters[0]
                  setActiveReaderChapter(currentCh)
                }}
                className="w-full bg-[#092B2B] hover:bg-emerald-950 text-white font-bold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-black/10 active:scale-95"
              >
                <span>▶</span>
                <span>{book.fileUrl ? 'Open Book PDF / Reader' : 'Continue Reading'}</span>
              </button>

              {book.fileUrl && book.fileUrl.startsWith('http') && (
                <a
                  href={book.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow"
                >
                  <span>📄</span>
                  <span>Download / View PDF File</span>
                </a>
              )}

              {/* Secondary Actions (Save & Share) */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsSaved(!isSaved)}
                  className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold transition-all border ${
                    isSaved
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                      : 'bg-[#f8f9fa] dark:bg-white/5 border-black/5 dark:border-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'
                  }`}
                >
                  <span>{isSaved ? '🔖 Saved' : '🔖 Save'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href)
                    alert('Book link copied to clipboard!')
                  }}
                  className="flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold bg-[#f8f9fa] dark:bg-white/5 border border-black/5 dark:border-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
                >
                  <span>🔗 Share</span>
                </button>
              </div>

              {/* DAILY PORTION TRACKING BOX */}
              <div className="bg-gradient-to-br from-emerald-900/10 to-primary-900/10 dark:from-emerald-950/40 dark:to-primary-950/40 rounded-2xl p-4 border border-emerald-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#092B2B] dark:text-emerald-300 flex items-center gap-1.5">
                    <span>📖</span> Daily Reading Goal
                  </span>
                  <span className="text-[10px] font-black uppercase bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 px-2.5 py-0.5 rounded-full">
                    {loggedPortionsToday >= 1 ? 'Marked Done ✓' : 'In Progress'}
                  </span>
                </div>

                <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed">
                  Log your daily portion right here to update your student assignment dashboard automatically.
                </p>

                <button
                  type="button"
                  disabled={isSyncingLog || loggedPortionsToday >= 1}
                  onClick={async () => {
                    setIsSyncingLog(true)
                    try {
                      await syncLibraryPortionRead(
                        isQuranBook,
                        bookId,
                        initialAssignmentId || null,
                        book.title,
                        book.completedPages || 1,
                        (book as any)?.file_url || (book as any)?.fileUrl || ''
                      )
                      setLoggedPortionsToday(prev => prev + 1)
                    } catch (error) {
                      console.error('Failed to log portion', error)
                    } finally {
                      setIsSyncingLog(false)
                    }
                  }}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
                >
                  {isSyncingLog ? <span>Logging progress...</span> : <span>{loggedPortionsToday >= 1 ? 'Marked Done for Today' : '+ Log 1 Portion Read Today'}</span>}
                </button>
              </div>
            </div>

            {/* Mini Stats Pills Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-[#111] p-4 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm flex items-center justify-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-500 flex items-center justify-center font-bold text-sm">
                  ☆
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Rating</p>
                  <p className="text-sm font-black text-gray-900 dark:text-white">{book.rating}</p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#111] p-4 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm flex items-center justify-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                  📖
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Pages</p>
                  <p className="text-sm font-black text-gray-900 dark:text-white">{book.pages}</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (MAIN CONTENT) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* BOOK HEADER & LEARNING PROGRESS CARD */}
            <div className="bg-white dark:bg-[#111] p-8 rounded-[32px] border border-black/5 dark:border-white/5 shadow-sm space-y-6">
              
              {/* Tags & Rating Header */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="bg-[#dcf5ea] dark:bg-emerald-900/40 text-[#0a6c4c] dark:text-emerald-300 text-[10px] font-black uppercase px-3 py-1 rounded-full">
                    {book.category.split(' ')[0]}
                  </span>
                  <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] font-bold uppercase px-3 py-1 rounded-full">
                    {book.subcategory}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-amber-400 tracking-wide">★★★★★</span>
                  <span className="text-gray-400 font-medium">Based on {book.reviewsCount} reviews</span>
                </div>
              </div>

              {/* Title & Author */}
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {book.title}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {book.author}
                </p>
              </div>

              {/* YOUR LEARNING PROGRESS INNER BOX */}
              <div className="bg-[#f4f8f7] dark:bg-white/5 p-6 rounded-3xl border border-black/5 dark:border-white/5 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#092B2B] dark:text-white">Your Learning Progress</h3>
                  <span className="bg-[#092B2B] text-white text-[11px] font-bold px-3.5 py-1 rounded-full shadow-sm">
                    {book.percentComplete}% Complete
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#092B2B] dark:bg-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${book.percentComplete}%` }}
                  ></div>
                </div>

                {/* Progress Stats Columns */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 text-center sm:text-left">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Completed</p>
                    <p className="text-xs font-black text-gray-900 dark:text-white mt-0.5">
                      {book.completedPages} / {book.pages} Pages
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Time Spent</p>
                    <p className="text-xs font-black text-gray-900 dark:text-white mt-0.5">
                      {book.timeSpent}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Notes Made</p>
                    <p className="text-xs font-black text-gray-900 dark:text-white mt-0.5">
                      {book.notesCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Last Session</p>
                    <p className="text-xs font-black text-gray-900 dark:text-white mt-0.5">
                      {book.lastSession}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* DESCRIPTION CARD */}
            <div className="bg-white dark:bg-[#111] p-8 rounded-[32px] border border-black/5 dark:border-white/5 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-[#092B2B] dark:text-white flex items-center gap-2">
                <span>ⓘ</span>
                <span>Description</span>
              </h3>
              <div className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line space-y-3">
                {book.description}
              </div>
            </div>

            {/* TABLE OF CONTENTS CARD */}
            <div className="bg-white dark:bg-[#111] p-8 rounded-[32px] border border-black/5 dark:border-white/5 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#092B2B] dark:text-white flex items-center gap-2">
                  <span>📖</span>
                  <span>Table of Contents</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setExpandedAll(!expandedAll)}
                  className="text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-[#092B2B] dark:hover:text-white transition-colors"
                >
                  {expandedAll ? 'Collapse All' : 'Expand All'}
                </button>
              </div>

              {/* Chapters List */}
              <div className="space-y-3">
                {book.chapters.map((chapter) => {
                  const isCompleted = chapter.status === 'completed'
                  const isCurrent = chapter.status === 'current'
                  const isLocked = chapter.status === 'locked'

                  return (
                    <div
                      key={chapter.id}
                      onClick={() => {
                        if (!isLocked) {
                          setActiveReaderChapter(chapter)
                        } else {
                          alert(`Chapter locked: Complete previous sections first.`)
                        }
                      }}
                      className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                        isCurrent
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/30 cursor-pointer shadow-sm'
                          : isCompleted
                          ? 'bg-[#fbfcfc] dark:bg-white/5 border-black/5 dark:border-white/5 hover:border-black/10 cursor-pointer'
                          : 'bg-gray-50/70 dark:bg-white/[0.02] border-black/5 dark:border-white/5 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      {/* Left: Number badge + Title & Subtitle */}
                      <div className="flex items-center gap-4 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isCompleted
                              ? 'bg-[#092B2B] text-white'
                              : isCurrent
                              ? 'bg-emerald-500 text-white shadow-sm'
                              : 'bg-gray-200 dark:bg-white/10 text-gray-500'
                          }`}
                        >
                          {String(chapter.id).padStart(2, '0')}
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-xs md:text-sm font-bold text-gray-900 dark:text-white truncate">
                            {chapter.title}
                          </h4>
                          <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                            {chapter.itemsCount}
                          </p>
                        </div>
                      </div>

                      {/* Right: Status Icon */}
                      <div className="shrink-0 flex items-center">
                        {isCompleted && (
                          <div className="w-7 h-7 rounded-full bg-[#dcf5ea] dark:bg-emerald-900/40 text-[#0a6c4c] dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                            ✓
                          </div>
                        )}
                        {isCurrent && (
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                          </div>
                        )}
                        {isLocked && (
                          <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-white/10 text-gray-400 flex items-center justify-center text-xs">
                            🔒
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* INTERACTIVE READER OVERLAY MODAL */}
        {activeReaderChapter && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 w-full max-w-4xl h-[88vh] rounded-[32px] shadow-2xl flex flex-col overflow-hidden border border-white/10">
              
              {/* Reader Header */}
              <div className="bg-[#092B2B] text-white p-6 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold px-3 py-1 rounded-full shrink-0">
                    Resumed Bookmark
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-bold text-base md:text-lg truncate">{book.title}</h3>
                    <p className="text-xs text-emerald-200/80 truncate">{activeReaderChapter.title} • {activeReaderChapter.itemsCount}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveReaderChapter(null)}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors shrink-0"
                >
                  ✕
                </button>
              </div>

              {/* Reader Content Area */}
              <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 font-serif leading-relaxed text-gray-800 dark:text-gray-200">
                {isQuranBook ? (
                  <>
                    {/* Live Quran Roba Navigation Bar */}
                    <div className="bg-[#f4f8f7] dark:bg-white/5 p-5 rounded-3xl border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 font-sans">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🕌</span>
                        <div>
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                            Live Quran.com API Recitation
                          </span>
                          <h4 className="font-bold text-base text-[#092B2B] dark:text-white">
                            Juz {Math.ceil(quranRobaNumber / 4)} • Roba {((quranRobaNumber - 1) % 4) + 1} of 4 <span className="text-xs font-normal text-gray-500">(Overall Rub #{quranRobaNumber} of 120)</span>
                          </h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={quranRobaNumber <= 1 || isLoadingVerses}
                          onClick={() => setQuranRobaNumber(prev => Math.max(1, prev - 1))}
                          className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#111] border border-black/10 dark:border-white/10 text-xs font-bold hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-40 transition-all"
                        >
                          ‹ Prev Roba
                        </button>
                        
                        <select
                          value={quranRobaNumber}
                          onChange={e => setQuranRobaNumber(Number(e.target.value))}
                          disabled={isLoadingVerses}
                          className="px-3 py-2 rounded-xl bg-white dark:bg-[#111] border border-black/10 dark:border-white/10 text-xs font-bold text-[#092B2B] dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                        >
                          {Array.from({ length: 120 }, (_, i) => i + 1).map(n => {
                            const j = Math.ceil(n / 4)
                            const r = ((n - 1) % 4) + 1
                            return (
                              <option key={n} value={n}>
                                Juz {j} • Roba {r} (Overall #{n})
                              </option>
                            )
                          })}
                        </select>

                        <button
                          type="button"
                          disabled={quranRobaNumber >= 120 || isLoadingVerses}
                          onClick={() => setQuranRobaNumber(prev => Math.min(120, prev + 1))}
                          className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#111] border border-black/10 dark:border-white/10 text-xs font-bold hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-40 transition-all"
                        >
                          Next Roba ›
                        </button>
                      </div>
                    </div>

                    {/* Verses Display */}
                    {isLoadingVerses ? (
                      <div className="py-20 text-center space-y-4 font-sans">
                        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-sm font-bold text-gray-500 dark:text-gray-400">
                          Connecting to Quran.com API & loading Uthmani script for Juz {Math.ceil(quranRobaNumber / 4)} • Roba {((quranRobaNumber - 1) % 4) + 1}...
                        </p>
                      </div>
                    ) : quranFetchError ? (
                      <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-500/20 text-center text-red-700 dark:text-red-300 font-sans">
                        {quranFetchError}
                      </div>
                    ) : quranVerses.length === 0 ? (
                      <div className="py-12 text-center text-gray-500 font-sans">No verses found for this Roba.</div>
                    ) : (
                      <div className="space-y-6">
                        {quranVerses.map(verse => (
                          <div key={verse.id} className="p-6 rounded-3xl bg-[#fcfdfd] dark:bg-white/5 border border-black/5 dark:border-white/5 space-y-4 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-3 text-xs font-sans font-bold text-emerald-800 dark:text-emerald-300">
                              <span className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-[11px] font-bold">
                                  {verse.verse_key.split(':')[1]}
                                </span>
                                <span>Surah & Ayah: {verse.verse_key}</span>
                              </span>
                              <span className="bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full text-[10px] uppercase tracking-wider border border-emerald-500/20">
                                Uthmani Script
                              </span>
                            </div>
                            <div className="text-right font-arabic text-2xl md:text-3xl leading-[2.2] text-[#092B2B] dark:text-amber-100 py-3 select-text">
                              {verse.text_uthmani}
                            </div>
                            {verse.translations?.[0]?.text && (
                              <div className="text-sm md:text-base text-gray-700 dark:text-gray-300 border-t border-black/5 dark:border-white/5 pt-4 leading-relaxed font-sans select-text">
                                {verse.translations[0].text.replace(/<[^>]*>?/gm, '')}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="text-center pb-6 border-b border-black/5 dark:border-white/10">
                      <span className="text-xs font-sans font-bold tracking-widest text-emerald-600 dark:text-emerald-400 uppercase">
                        Classical Text & Commentary
                      </span>
                      <h2 className="text-2xl md:text-3xl font-bold font-sans text-gray-900 dark:text-white mt-2">
                        {activeReaderChapter.title}
                      </h2>
                    </div>

                    {/* Simulated Classical Text Display */}
                    <div className="space-y-6 text-base md:text-lg">
                      <div className="bg-amber-50/60 dark:bg-amber-950/20 p-6 rounded-2xl border border-amber-500/20 text-right font-arabic text-xl md:text-2xl leading-loose text-[#092B2B] dark:text-amber-200">
                        بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ ٭ وَقُل رَّبِّ زِدْنِي عِلْمًا
                      </div>
                      
                      <p>
                        In the study of sacred knowledge and classical wisdom, the seeker embarks upon a path where sincerity of intention serves as the foundation for all understanding. As scholars across centuries have documented, knowledge is not merely the accumulation of facts, but a spiritual light that illuminates ethical discernment and character.
                      </p>
                      <p>
                        Within this chapter, we explore how foundational principles guide everyday actions, transforming routine endeavors into acts of profound spiritual devotion. By adhering strictly to verified texts and established commentaries, students develop both intellectual discipline and inner tranquility.
                      </p>
                      <p>
                        Each section within this portion has been carefully structured to facilitate daily reflection. We encourage students to contemplate the underlying meanings and connect these teachings with practical daily conduct in their homes, schools, and communities.
                      </p>
                    </div>
                  </>
                )}

                {/* Reader Portion Quick Action Bar inside the reader */}
                <div className="mt-12 bg-[#f4f8f7] dark:bg-white/5 p-6 rounded-3xl border border-emerald-500/30 flex flex-col md:flex-row items-center justify-between gap-4 font-sans">
                  <div>
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block mb-1">
                      📚 Assignment Sync
                    </span>
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                      {isQuranBook ? `Finished reciting Juz ${Math.ceil(quranRobaNumber / 4)} • Roba ${((quranRobaNumber - 1) % 4) + 1} today?` : `Finished reading today's portion?`}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {isQuranBook 
                        ? `Marking done records +1 Roba (Quarter Juz) to your daily Quran assignment and unlocks the next Roba automatically.` 
                        : `Marking done here updates your progress on the main student dashboard immediately.`}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isSyncingLog || (isQuranBook && isLoadingVerses)}
                    onClick={async () => {
                      setIsSyncingLog(true)
                      try {
                        await syncLibraryPortionRead(
                          isQuranBook,
                          bookId,
                          initialAssignmentId,
                          initialBookData?.title || book.title,
                          isQuranBook ? quranRobaNumber : (loggedPortionsToday + 1) * 10,
                          initialBookData?.file_url || initialBookData?.fileUrl || book.fileUrl
                        )
                        setLoggedPortionsToday(prev => prev + 1)
                        if (isQuranBook) {
                          alert(`MashAllah! Recitation of Juz ${Math.ceil(quranRobaNumber / 4)} • Roba ${((quranRobaNumber - 1) % 4) + 1} recorded (+1 Roba synced to your assignment tracker)!`)
                          if (quranRobaNumber < 120) {
                            setQuranRobaNumber(prev => prev + 1)
                          } else {
                            setActiveReaderChapter(null)
                          }
                        } else {
                          alert(`MashAllah! Progress recorded (+1 portion read). Check your assignment tracker!`)
                          setActiveReaderChapter(null)
                        }
                        router.refresh()
                      } catch (err) {
                        console.error('Error syncing reading progress:', err)
                        alert('Could not sync progress to server. Please check your network.')
                      } finally {
                        setIsSyncingLog(false)
                      }
                    }}
                    className="shrink-0 bg-[#092B2B] hover:bg-emerald-900 text-white font-bold px-6 py-3.5 rounded-2xl text-xs flex items-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isSyncingLog ? <span>Recording & Syncing...</span> : <span>✓ Mark Portion Read & Sync</span>}
                  </button>
                </div>
              </div>

              {/* Reader Footer */}
              <div className="bg-gray-50 dark:bg-[#0a0a0a] p-4 border-t border-black/5 dark:border-white/10 flex items-center justify-between text-xs font-bold text-gray-500 shrink-0 font-sans">
                <span>
                  {isQuranBook 
                    ? `Juz ${Math.ceil(quranRobaNumber / 4)} • Roba ${((quranRobaNumber - 1) % 4) + 1} of 4 (Overall Rub #{quranRobaNumber} of 120) • (${loggedPortionsToday} Robas read today)`
                    : `Page ${book.completedPages + (loggedPortionsToday * 5)} of ${book.pages}`}
                </span>
                <div className="flex items-center gap-4">
                  {isQuranBook && quranRobaNumber > 1 && (
                    <button type="button" onClick={() => setQuranRobaNumber(prev => Math.max(1, prev - 1))} className="hover:text-[#092B2B] dark:hover:text-white">
                      ‹ Previous Roba
                    </button>
                  )}
                  <button type="button" onClick={() => setActiveReaderChapter(null)} className="hover:text-[#092B2B] dark:hover:text-white">
                    Close Reader ›
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
