'use client'

import { notifyResourceRequest } from '@/app/actions/notifications'

import PageHeader from '@/components/ui/PageHeader'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export interface ResourceItem {
  id: string
  title: string
  author: string
  category: string
  pages: number
  rating: number
  coverColor: string
  badgeColor: string
  badgeText: string
  description?: string
  completedPages?: number
  file_url?: string
}

const DEFAULT_RESOURCES: ResourceItem[] = [
  {
    id: 'quran',
    title: 'The Holy Quran (Al-Quran Al-Karim)',
    author: 'Live Quran.com API Integration',
    category: 'Quran & Tafsir',
    pages: 604,
    rating: 5.0,
    coverColor: 'from-[#0d3b2c] to-[#061d15]',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    badgeText: 'HOLY QURAN',
    description: 'Complete Uthmani script of the Holy Quran divided by 120 Quarter-Juz (Rub el Juz) with live recitation & tafsir.'
  },
  {
    id: 'feat-1',
    title: 'The Marvels of Creation: Foundations of Islamic Science',
    author: 'Dr. Muzaffar Iqbal',
    category: 'Islamic History',
    pages: 340,
    rating: 5.0,
    coverColor: 'from-[#193a2c] to-[#0c1f17]',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    badgeText: 'FEATURED',
    description: 'Comprehensive volume covering the history of scientific discovery in the Islamic world.'
  },
  {
    id: 'cont-fiqh',
    title: 'Fiqh Simplified: Core Principles of Islamic Jurisprudence',
    author: 'Shaykh Ahmad al-Faruqi',
    category: 'Contemporary Issues',
    pages: 190,
    rating: 4.8,
    coverColor: 'from-[#1b3d2f] to-[#0d2219]',
    badgeColor: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
    badgeText: 'FIQH',
    description: 'Accessible introduction to foundational terminology and practical worship rulings.'
  },
  {
    id: 'cont-history',
    title: 'History of the Caliphs: Leadership & Society',
    author: 'Ustadh Sulaiman',
    category: 'Islamic History',
    pages: 380,
    rating: 4.9,
    coverColor: 'from-[#2e3b4e] to-[#141d2b]',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    badgeText: 'HISTORY',
    description: 'Engaging exploration of socio-political developments during classical Islamic eras.'
  },
  {
    id: 'cont-tafsir',
    title: 'Gems of Tafsir: Contemplating the Quranic Discourse',
    author: 'Shaykh Hassan Al-Banna',
    category: 'Quran & Tafsir',
    pages: 355,
    rating: 5.0,
    coverColor: 'from-[#ded2b8] to-[#bfac85]',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    badgeText: 'TAFSIR',
    description: 'Linguistic pearls, thematic connections, and spiritual reflections from selected surahs.'
  },
  {
    id: '1',
    title: 'Introduction to Hadith',
    author: 'Shaykh Muhammad Mustafa',
    category: 'Hadith Studies',
    pages: 240,
    rating: 4.9,
    coverColor: 'from-[#dfd3b8] to-[#c7b48a]',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    badgeText: 'HADITH',
    description: 'A structured methodology explaining the classification, authenticity, and preservation of Prophetic traditions.'
  },
  {
    id: '2',
    title: "Al-Ghazali's Path to Wisdom",
    author: 'Yahya M. Michot',
    category: 'Islamic History',
    pages: 185,
    rating: 4.7,
    coverColor: 'from-[#4a2e18] to-[#26150a]',
    badgeColor: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
    badgeText: 'PHILOSOPHY',
    description: 'Deep philosophical and spiritual insights drawn from the works of Imam Al-Ghazali.'
  },
  {
    id: '3',
    title: 'Standard Arabic: Vol. 1',
    author: 'Academy Linguistics Team',
    category: 'Arabic Language',
    pages: 410,
    rating: 5.0,
    coverColor: 'from-[#dcf0fa] to-[#9ed1ed]',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    badgeText: 'LANGUAGE',
    description: 'Comprehensive classical Arabic grammar, morphology, and vocabulary for students.'
  },
  {
    id: '4',
    title: 'Ethical Conduct in Business',
    author: 'Prof. Omar Qureshi',
    category: 'Contemporary Issues',
    pages: 212,
    rating: 4.8,
    coverColor: 'from-[#193a2c] to-[#0c1f17]',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    badgeText: 'ETHICS',
    description: 'Islamic jurisprudence and ethical principles governing commerce, contracts, and finance.'
  },
  {
    id: '5',
    title: 'Stories of the Companions',
    author: 'Ayesha Bint Abu Bakr',
    category: 'Islamic History',
    pages: 195,
    rating: 4.9,
    coverColor: 'from-[#e3cfb4] to-[#cba374]',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    badgeText: 'HISTORY',
    description: 'Biographical portraits highlighting the sacrifices, wisdom, and character of the Sahabah.'
  },
  {
    id: '6',
    title: 'The Art of Calligraphy',
    author: 'Master Khalid Hussain',
    category: 'Contemporary Issues',
    pages: 130,
    rating: 4.8,
    coverColor: 'from-[#f3ecd8] to-[#ded0aa]',
    badgeColor: 'bg-stone-100 text-stone-800 dark:bg-stone-900/40 dark:text-stone-300',
    badgeText: 'ART',
    description: 'A masterclass manual on traditional Arabic script aesthetics, tools, and proportions.'
  },
  {
    id: '7',
    title: 'Tafsir Ibn Kathir (Abridged)',
    author: 'Imam Ibn Kathir',
    category: 'Quran & Tafsir',
    pages: 520,
    rating: 5.0,
    coverColor: 'from-[#15342a] to-[#091813]',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    badgeText: 'QURAN & TAFSIR',
    description: 'The authentic classical exegesis of the Holy Quran with key scholarly commentary.'
  },
  {
    id: '8',
    title: 'Hisnul Muslim (Fortress of the Muslim)',
    author: 'Saed Ibn Ali Ibn Wahf',
    category: 'Zikr & Adhkar',
    pages: 144,
    rating: 4.9,
    coverColor: 'from-[#2a3c50] to-[#141f2b]',
    badgeColor: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
    badgeText: 'ZIKR & ADHKAR',
    description: 'Essential daily supplications, dhikr for morning & evening, and prayers from the Sunnah.'
  },
  {
    id: '9',
    title: 'Riyad as-Salihin (The Gardens of the Righteous)',
    author: 'Imam Al-Nawawi',
    category: 'Hadith Studies',
    pages: 460,
    rating: 5.0,
    coverColor: 'from-[#3a2c1f] to-[#1f160e]',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    badgeText: 'HADITH',
    description: 'A timeless collection of authentic hadiths covering moral excellence and spiritual guidance.'
  }
]

interface LibraryClientProps {
  user: any
  profile: any
  initialResources?: any[]
  bookProgress?: any[]
  studentProgress?: any[]
}

export default function LibraryClient({
  user,
  profile,
  initialResources = [],
  bookProgress = [],
  studentProgress = []
}: LibraryClientProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All Resources')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'recent' | 'rating' | 'pages'>('recent')
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 6

  function handleOpenBook(bookId: string) {
    router.push(`/student/personal-library/${bookId}`)
  }

  // Modal states
  const [selectedBook, setSelectedBook] = useState<ResourceItem | null>(null)
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
  const [requestTitle, setRequestTitle] = useState('')
  const [requestAuthor, setRequestAuthor] = useState('')

  // Define permanent API-based resources
  const GLOBAL_API_RESOURCES: ResourceItem[] = [
    {
      id: 'quran',
      title: 'The Holy Quran (Al-Quran Al-Kareem)',
      author: 'Quran.com Live API',
      category: 'Quran & Tafsir',
      pages: 604,
      rating: 5.0,
      coverColor: 'from-[#0d3b2c] to-[#061d15]',
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
      badgeText: 'LIVE API',
      description: 'Read the Holy Quran with translations, audio recitations, and tafsir powered by Quran.com.',
      file_url: '' 
    }
  ]

  // Combine dynamically fetched resources directly with API resources
  const allResources: ResourceItem[] = useMemo(() => {
    return [...(initialResources || []), ...GLOBAL_API_RESOURCES]
  }, [initialResources])

  // Dynamically pick the featured book: the newest available resource
  const featuredBook = useMemo(() => {
    if (allResources.length > 0) return allResources[0]
    return null
  }, [allResources])


  // Dynamically compute continue reading list based on live student progress & uploaded class books
  const continueReadingList = useMemo(() => {
    const list: any[] = []
    const seenIds = new Set<string>()

    // 1. Add active books read from bookProgress (only if user has actually read something)
    if (bookProgress && bookProgress.length > 0) {
      bookProgress.forEach((bp: any) => {
        if (!seenIds.has(bp.book_id) && (bp.completed_portions || 0) > 0) {
          const matchedResource = allResources.find(r => r.id === bp.book_id)
          if (matchedResource) {
            seenIds.add(bp.book_id)
            const pages = bp.total_pages || matchedResource.pages || 100
            const percent = Math.min(100, Math.round(((bp.current_page || 1) / pages) * 100))
            list.push({
              id: bp.book_id,
              title: bp.book_title || matchedResource.title || 'Active Reading Book',
              author: matchedResource.author || 'Class Resource',
              percent,
              pagesStr: `${bp.current_page || 1}/${pages} pages`,
              coverColor: matchedResource.coverColor || 'from-[#193a2c] to-[#0c1f17]',
              textColor: 'text-white'
            })
          }
        }
      })
    }

    // 2. Add assignments where student has progress > 0
    if (studentProgress && studentProgress.length > 0) {
      studentProgress.forEach((sp: any) => {
        const pdata = sp.progress_data || {}
        const bId = pdata.book_id || sp.assignment_id
        if (sp.completed_value > 0 && bId && !seenIds.has(bId)) {
          const matchedResource = allResources.find(r => r.id === bId)
          if (matchedResource) {
            seenIds.add(bId)
            const target = sp.target_count || 10
            const percent = Math.min(100, Math.round((sp.completed_value / target) * 100))
            list.push({
              id: bId,
              title: pdata.book_title || matchedResource.title || 'Assigned Book',
              author: matchedResource.author || 'Class Instructor',
              percent,
              pagesStr: `${sp.completed_value} portions read`,
              coverColor: matchedResource.coverColor || 'from-[#0d3b2c] to-[#061d15]',
              textColor: 'text-emerald-100'
            })
          }
        }
      })
    }

    return list
  }, [bookProgress, studentProgress, allResources])

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      'All Resources': allResources.length,
      'Quran & Tafsir': allResources.filter(r => r.category === 'Quran & Tafsir').length,
      'Hadith Studies': allResources.filter(r => r.category === 'Hadith Studies').length,
      'Islamic History': allResources.filter(r => r.category === 'Islamic History').length,
      'Arabic Language': allResources.filter(r => r.category === 'Arabic Language').length,
      'Contemporary Issues': allResources.filter(r => r.category === 'Contemporary Issues').length,
      'Zikr & Adhkar': allResources.filter(r => r.category === 'Zikr & Adhkar').length
    }
    return counts
  }, [allResources])

  // Filter & Sort
  const filteredResources = useMemo(() => {
    let result = allResources.filter(item => {
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase()
        const matchTitle = item.title.toLowerCase().includes(q)
        const matchAuthor = item.author.toLowerCase().includes(q)
        const matchCat = item.category.toLowerCase().includes(q)
        if (!matchTitle && !matchAuthor && !matchCat) return false
      }
      if (selectedCategory !== 'All Resources' && item.category !== selectedCategory) {
        return false
      }
      return true
    })

    if (sortBy === 'rating') {
      result = [...result].sort((a, b) => b.rating - a.rating)
    } else if (sortBy === 'pages') {
      result = [...result].sort((a, b) => b.pages - a.pages)
    }
    return result
  }, [allResources, searchQuery, selectedCategory, sortBy])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredResources.length / ITEMS_PER_PAGE))
  const paginatedResources = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredResources.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredResources, currentPage])

  function handleRequestSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Notify teachers/librarians of the resource request (fire & forget)
    notifyResourceRequest(requestTitle, requestAuthor || undefined).catch(() => {})
    alert(`Thank you! Your resource request for "${requestTitle}" has been submitted to the library team.`)
    setRequestTitle('')
    setRequestAuthor('')
    setIsRequestModalOpen(false)
  }

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#fbfbfb] dark:bg-[#0a0a0a]">


      {/* MAIN CONTENT AREA */}
      <main className="p-4 md:p-8 max-w-[1240px] w-full mx-auto space-y-8">
        <PageHeader
          breadcrumb="STUDENT PORTAL / GLOBAL LIBRARY"
          title="Digital Library & Resources"
          subtitle="Explore authentic Islamic texts, Quran recitations, commentary, and class study resources."
          actions={
            <div className="relative w-full sm:w-64">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                placeholder="Search resources..."
                className="w-full bg-white dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-emerald-500 transition-all"
              />
            </div>
          }
        />
        
        {/* HERO FEATURED BANNER */}
        {featuredBook ? (
        <div className="relative overflow-hidden bg-[#092B2B] rounded-[32px] p-8 md:p-10 text-white shadow-xl">
          {/* Subtle geometric background glow */}
          <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-7 space-y-5">
              <span className="inline-block bg-white/10 text-emerald-300 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                {featuredBook.badgeText || 'FEATURED RESOURCE'}
              </span>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight">
                {featuredBook.title}
              </h2>
              <p className="text-emerald-100/80 text-sm leading-relaxed max-w-xl">
                {featuredBook.description || 'Discover the intersection of faith and intellect in this comprehensive volume provided for your class study and spiritual refinement.'}
              </p>
              <div className="flex items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => handleOpenBook(featuredBook.id)}
                  className="bg-white text-[#092B2B] hover:bg-emerald-50 font-bold px-6 py-3 rounded-2xl text-xs flex items-center gap-2 transition-all shadow-md"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Start Reading
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenBook(featuredBook.id)}
                  className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3 rounded-2xl text-xs transition-all border border-white/15"
                >
                  View Details
                </button>
              </div>
            </div>

            {/* Book Cover Illustration Card */}
            <div className="md:col-span-5 flex justify-center md:justify-end">
              <div className="relative w-64 h-40 md:w-72 md:h-44 bg-gradient-to-br from-[#1b3d2f] to-[#0d2219] rounded-2xl p-4 border border-white/15 shadow-2xl rotate-2 transform hover:rotate-0 transition-transform flex items-center gap-4">
                <div className="w-24 h-32 bg-gradient-to-br from-emerald-800 to-black rounded-lg border border-amber-400/40 shadow-lg flex flex-col items-center justify-center p-2 text-center shrink-0">
                  <div className="w-6 h-6 rounded-full border border-black/20 dark:border-white/30 flex items-center justify-center mb-2">
                          <svg className="w-3.5 h-3.5 text-gray-800 dark:text-white opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                  <p className="text-[9px] font-black text-amber-200 uppercase tracking-tight leading-tight line-clamp-1">{featuredBook.category || 'LIBRARY'}</p>
                  <div className="w-8 h-0.5 bg-amber-400/50 my-1"></div>
                  <p className="text-[7px] text-emerald-200 line-clamp-1">{featuredBook.author || 'Instructor'}</p>
                </div>
                <div className="space-y-1.5 overflow-hidden">
                  <p className="text-xs font-bold text-white leading-tight line-clamp-2">{featuredBook.title}</p>
                  <p className="text-[10px] text-emerald-200/80 line-clamp-1">{featuredBook.author || 'Class Instructor'}</p>
                  <div className="w-16 h-1.5 bg-white/20 rounded-full overflow-hidden mt-2">
                    <div className="w-10 h-full bg-emerald-400 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        ) : (
          <div className="relative overflow-hidden bg-white dark:bg-[#111] rounded-[32px] p-8 md:p-10 text-center shadow-sm border border-dashed border-gray-300 dark:border-gray-800">
            <div className="flex flex-col items-center justify-center py-6">
              <svg className="w-12 h-12 text-gray-300 dark:text-gray-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white mb-2">Welcome to your Digital Library</h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto text-sm">
                Your active classes do not have any library resources uploaded yet. When your instructor adds books, they will appear here.
              </p>
            </div>
          </div>
        )}

        {/* CONTINUE READING ROW */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#092B2B] dark:text-white">Continue Reading</h3>
            <button type="button" className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline">
              <span>View All History</span><svg className="w-3.5 h-3.5 inline-block ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
          </div>

          {continueReadingList.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {continueReadingList.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => handleOpenBook(item.id)}
                  className="bg-white dark:bg-[#111] p-4 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-4 group"
                >
                  {/* Book Mini Cover */}
                  <div className={`w-14 h-20 rounded-lg bg-gradient-to-br ${item.coverColor} shadow-md shrink-0 flex flex-col items-center justify-center p-1.5 text-center border border-black/10`}>
                    <div className="w-3 h-3 rounded-full border border-black/20 dark:border-white/20 mb-1"></div>
                    <p className={`text-[8px] font-bold leading-tight line-clamp-2 ${item.textColor || 'text-gray-800 dark:text-white'}`}>{item.title}</p>
                  </div>

                  {/* Progress Content */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-primary-600 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-xs text-gray-500 truncate">{item.author}</p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-emerald-600 dark:text-emerald-400">{item.percent}% complete</span>
                        <span className="text-gray-400">{item.pagesStr}</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-[#092B2B] dark:bg-emerald-400 rounded-full" style={{ width: `${item.percent}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-[#111] p-6 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                You haven't started reading any books yet. Select a resource from your library below to begin!
              </p>
            </div>
          )}
        </div>

        {/* 2-COLUMN MAIN CONTENT (SIDEBAR + BOOKS GRID) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT SIDEBAR (CATEGORIES + REQUEST CARD) */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* CATEGORIES BOX */}
            <div className="bg-white dark:bg-[#111] p-5 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm space-y-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-3 pt-1 mb-2">CATEGORIES</p>
              
              {Object.entries(categoryCounts).map(([categoryName, count]) => {
                const isActive = selectedCategory === categoryName
                return (
                  <button
                    key={categoryName}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(categoryName)
                      setCurrentPage(1)
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-[#dcf5ea] dark:bg-emerald-900/30 text-[#0a6c4c] dark:text-emerald-300'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
                    }`}
                  >
                    <span>{categoryName}</span>
                    <span className={`text-[11px] ${isActive ? 'font-black' : 'opacity-70'}`}>
                      ({count})
                    </span>
                  </button>
                )
              })}
            </div>

            {/* REQUEST A RESOURCE DARK CARD */}
            <div className="bg-[#092B2B] p-6 rounded-3xl text-white space-y-4 shadow-lg">
              <div>
                <h4 className="text-base font-bold">Request a Resource</h4>
                <p className="text-xs text-emerald-100/80 mt-1 leading-relaxed">
                  Can&apos;t find what you&apos;re looking for? Let our librarians help.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsRequestModalOpen(true)}
                className="w-full bg-white text-[#092B2B] hover:bg-emerald-50 font-bold py-2.5 rounded-xl text-xs transition-all shadow-sm"
              >
                Submit Request
              </button>
            </div>
          </div>

          {/* RIGHT BOOKS GRID SECTION */}
          <div className="lg:col-span-9 space-y-6">
            
            {/* CONTROLS BAR */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-[#111] p-4 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm">
              <div className="flex items-center gap-3">
                {/* View Mode Toggle */}
                <div className="flex items-center bg-gray-100 dark:bg-white/5 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      viewMode === 'grid'
                        ? 'bg-[#dcf5ea] dark:bg-emerald-900/40 text-[#0a6c4c] dark:text-emerald-300 shadow-sm'
                        : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'
                    }`}
                  >
                    Grid
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      viewMode === 'list'
                        ? 'bg-[#dcf5ea] dark:bg-emerald-900/40 text-[#0a6c4c] dark:text-emerald-300 shadow-sm'
                        : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'
                    }`}
                  >
                    List
                  </button>
                </div>

                {/* Sort By Selector */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-gray-100 dark:bg-white/5 border-0 rounded-xl px-4 py-2 text-xs font-bold text-gray-700 dark:text-gray-200 outline-none cursor-pointer"
                >
                  <option value="recent">Recently Added</option>
                  <option value="rating">Highest Rated</option>
                  <option value="pages">Most Pages</option>
                </select>
              </div>

              <div className="text-xs font-bold text-gray-400">
                Showing {Math.min(filteredResources.length, (currentPage - 1) * ITEMS_PER_PAGE + 1)}-
                {Math.min(filteredResources.length, currentPage * ITEMS_PER_PAGE)} of {filteredResources.length} results
              </div>
            </div>

            {/* BOOKS CARDS (GRID OR LIST) */}
            {paginatedResources.length === 0 ? (
              <div className="bg-white dark:bg-[#111] rounded-3xl p-12 text-center border border-black/5 dark:border-white/5">
                <p className="text-base font-bold text-gray-700 dark:text-gray-300">No resources match your search criteria.</p>
                <p className="text-xs text-gray-400 mt-1">Try selecting a different category or clearing your search.</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedResources.map(item => (
                  <div
                    key={item.id}
                    onClick={() => handleOpenBook(item.id)}
                    className="bg-white dark:bg-[#111] rounded-3xl border border-black/5 dark:border-white/5 overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col group"
                  >
                    {/* Cover Area */}
                    <div className="relative aspect-[4/5] bg-[#f7f9f8] dark:bg-white/5 p-6 flex items-center justify-center">
                      <span className={`absolute top-4 left-4 ${item.badgeColor} text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md`}>
                        {item.badgeText}
                      </span>

                      {/* Book Cover Illustration */}
                      {(() => {
                        const isDark = (item.coverColor || '').includes('0d3b2c') || (item.coverColor || '').includes('193a2c') || (item.coverColor || '').includes('1b3d2f') || (item.coverColor || '').includes('2e3b4e') || (item.coverColor || '').includes('4a2e18') || (item.coverColor || '').includes('15342a') || (item.coverColor || '').includes('2a3c50') || (item.coverColor || '').includes('3a2c1f');
                        return (
                          <div className={`w-32 h-44 rounded-xl bg-gradient-to-br ${item.coverColor} shadow-xl border border-black/10 dark:border-white/10 flex flex-col items-center justify-center p-3 text-center transform group-hover:scale-105 transition-transform`}>
                            <div className={`w-6 h-6 rounded-full border ${isDark ? 'border-white/30' : 'border-black/20'} flex items-center justify-center mb-2`}>
                              <svg className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-300' : 'text-gray-800'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                            </div>
                            <p className={`text-xs font-bold leading-tight line-clamp-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {item.title}
                            </p>
                            <div className={`w-8 h-0.5 ${isDark ? 'bg-white/20' : 'bg-black/20'} my-2`}></div>
                            <p className={`text-[9px] font-medium line-clamp-1 ${isDark ? 'text-emerald-200/90' : 'text-gray-600'}`}>
                              {item.author}
                            </p>
                          </div>
                        )
                      })()}
                    </div>

                    {/* Book Details */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors line-clamp-1">
                          {item.title}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">{item.author}</p>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-black/5 dark:border-white/5">
                        <span className="flex items-center gap-1.5 font-medium">
                          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {item.pages} Pages
                        </span>
                        <span className="flex items-center gap-1 font-bold text-gray-800 dark:text-white">
                          <span className="inline-flex items-center gap-1 font-bold text-amber-500"><svg className="w-3.5 h-3.5 text-amber-500 fill-amber-500 inline-block mr-0.5" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg> {item.rating.toFixed(1)}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* LIST VIEW */
              <div className="space-y-3">
                {paginatedResources.map(item => (
                  <div
                    key={item.id}
                    onClick={() => handleOpenBook(item.id)}
                    className="bg-white dark:bg-[#111] p-4 rounded-2xl border border-black/5 dark:border-white/5 flex items-center justify-between gap-4 hover:shadow-sm transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`w-12 h-16 rounded-lg bg-gradient-to-br ${item.coverColor} shadow-md shrink-0 flex items-center justify-center p-1 text-center`}>
                        <span className="text-[10px] font-bold">ðŸ“–</span>
                      </div>
                      <div className="min-w-0">
                        <span className={`inline-block ${item.badgeColor} text-[8px] font-black px-2 py-0.5 rounded uppercase mb-1`}>
                          {item.badgeText}
                        </span>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">{item.title}</h4>
                        <p className="text-xs text-gray-500 truncate">{item.author}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 shrink-0 text-xs font-bold">
                      <span className="text-gray-500">{item.pages} Pages</span>
                      <span className="inline-flex items-center gap-1 font-bold text-amber-500"><svg className="w-3.5 h-3.5 text-amber-500 fill-amber-500 inline-block mr-0.5" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg></span>
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><span>Read</span><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* PAGINATION CONTROLS */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="w-9 h-9 rounded-xl bg-white dark:bg-[#111] border border-black/5 dark:border-white/5 flex items-center justify-center text-gray-500 disabled:opacity-30 font-bold"
                >
                  â€¹
                </button>
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const p = idx + 1
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setCurrentPage(p)}
                      className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                        currentPage === p
                          ? 'bg-[#092B2B] dark:bg-emerald-500 text-white shadow-md'
                          : 'bg-white dark:bg-[#111] text-gray-600 dark:text-gray-300 border border-black/5 dark:border-white/5'
                      }`}
                    >
                      {p}
                    </button>
                  )
                })}
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="w-9 h-9 rounded-xl bg-white dark:bg-[#111] border border-black/5 dark:border-white/5 flex items-center justify-center text-gray-500 disabled:opacity-30 font-bold"
                >
                  â€º
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* BOOK DETAIL / READER MODAL */}
      {selectedBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-black/10 dark:border-white/10 p-6 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-22 rounded-xl bg-gradient-to-br ${selectedBook.coverColor} shadow-md flex items-center justify-center p-2 text-center`}>
                  <span className="text-xl">ðŸ“–</span>
                </div>
                <div>
                  <span className={`inline-block ${selectedBook.badgeColor} text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded mb-1`}>
                    {selectedBook.badgeText}
                  </span>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{selectedBook.title}</h3>
                  <p className="text-xs text-gray-500">{selectedBook.author}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBook(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1"
              >
                âœ•
              </button>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              {selectedBook.description || 'Scholarly resource available in the library collection.'}
            </p>

            <div className="flex items-center justify-between text-xs font-bold bg-gray-50 dark:bg-white/5 p-4 rounded-2xl">
              <span>Pages: {selectedBook.pages}</span>
              <span>Rating: ★ {selectedBook.rating.toFixed(1)}</span>
              <span>Category: {selectedBook.category}</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  alert(`Opening "${selectedBook.title}" in Reader...`)
                  setSelectedBook(null)
                }}
                className="flex-1 bg-[#092B2B] text-white font-bold py-3 rounded-2xl text-xs hover:opacity-90 transition-all shadow-md"
              >
                Start Reading
              </button>
              <button
                type="button"
                onClick={() => {
                  alert(`Downloading PDF for "${selectedBook.title}"...`)
                }}
                className="bg-gray-100 dark:bg-white/10 hover:bg-gray-200 text-gray-800 dark:text-white font-bold px-5 py-3 rounded-2xl text-xs transition-all"
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REQUEST RESOURCE MODAL */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111] rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-black/10 dark:border-white/10 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Request a Resource</h3>
              <button
                type="button"
                onClick={() => setIsRequestModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                title="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleRequestSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Book or Resource Title *</label>
                <input
                  type="text"
                  required
                  value={requestTitle}
                  onChange={(e) => setRequestTitle(e.target.value)}
                  placeholder="e.g., Al-Muwatta by Imam Malik"
                  className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-xs outline-none focus:ring-2 focus:ring-[#092B2B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Author / Scholar (Optional)</label>
                <input
                  type="text"
                  value={requestAuthor}
                  onChange={(e) => setRequestAuthor(e.target.value)}
                  placeholder="e.g., Imam Malik ibn Anas"
                  className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-xs outline-none focus:ring-2 focus:ring-[#092B2B]"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="flex-1 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 font-bold py-3 rounded-xl text-xs text-gray-700 dark:text-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 bg-[#092B2B] text-white font-bold py-3 rounded-xl text-xs hover:opacity-90 transition-all shadow-md"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}