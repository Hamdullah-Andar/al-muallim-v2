'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface StudentSidebarProps {
  hasClasses?: boolean
  onLinkClick?: () => void
}

export default function StudentSidebar({ hasClasses = false, onLinkClick }: StudentSidebarProps) {
  const pathname = usePathname()

  const personalLinks = [
    {
      name: 'Dashboard',
      href: '/student/dashboard',
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
    },
    {
      name: 'My Habits',
      href: '/student/habits',
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
    },
    {
      name: 'Personal Analytics',
      href: '/student/personal-analytics',
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
    },
    {
      name: 'Global Library',
      href: '/student/personal-library',
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
    }
  ]

  const classLinks = [
    {
      name: 'Dashboard',
      href: '/student/class-dashboard',
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
    },
    {
      name: 'Joined Classes',
      href: '/student/classes',
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
    },
    {
      name: 'Assignments',
      href: '/student/assignments',
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
    },
    {
      name: 'Analytics',
      href: '/student/analytics',
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
    },
    {
      name: 'Library',
      href: '/student/library',
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
    }
  ]

  const renderLink = (link: any) => {
    const isActive = link.href === '/student/dashboard' 
      ? pathname === link.href 
      : (pathname === link.href || pathname.startsWith(link.href + '/'))

    return (
      <Link 
        key={link.name}
        href={link.href} 
        onClick={onLinkClick}
        className={`flex items-center gap-4 px-4 py-3.5 rounded-xl font-bold transition-colors ${
          isActive 
            ? 'bg-[#bdf3df]/80 text-primary-800' 
            : 'hover:bg-black/5 dark:hover:bg-white/5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white font-medium'
        }`}
      >
         <div className={isActive ? 'opacity-80' : 'opacity-60 group-hover:opacity-100'}>
           {link.icon}
         </div>
         {link.name}
      </Link>
    )
  }

  return (
    <aside className="w-[280px] bg-white dark:bg-black border-r border-black/5 dark:border-white/5 flex flex-col h-full shadow-sm">
      <div className="flex-1 overflow-y-auto pb-4 pt-4">
        {/* MY TAQWA SPACE */}
        <div className="px-6 pt-2 pb-2">
          <p className="text-[10px] font-black tracking-widest text-gray-400 dark:text-gray-500 uppercase mb-3 px-4">
            My Taqwa Space
          </p>
          <nav className="space-y-1">
            {personalLinks.map(renderLink)}
          </nav>
        </div>

        {/* ACADEMY CLASSES (Only shown if enrolled in a class) */}
        {hasClasses && (
          <div className="px-6 pt-4 pb-2 border-t border-black/5 dark:border-white/5 mt-4">
            <p className="text-[10px] font-black tracking-widest text-emerald-600/70 dark:text-emerald-500/70 uppercase mb-3 px-4">
              Academy Classes
            </p>
            <nav className="space-y-1">
              {classLinks.map(renderLink)}
            </nav>
          </div>
        )}
      </div>

      <div className="p-6 space-y-1 mb-4 border-t border-black/5 dark:border-white/5 pt-6">
        {pathname.startsWith('/student/class/') && (
          <div className="space-y-3 mb-6">
            <button className="flex items-center justify-center gap-2 w-full bg-[#092B2B] hover:bg-[#0a3838] dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white px-4 py-3.5 rounded-xl font-bold transition-all shadow-sm">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              Join Live Session
            </button>
            <button className="flex items-center justify-center gap-2 w-full bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-white/5 text-[#092B2B] dark:text-emerald-400 border-2 border-black/10 dark:border-white/20 px-4 py-3 rounded-xl font-bold transition-all">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
              Ask Teacher
            </button>
          </div>
        )}
         <Link href="/student/support" onClick={onLinkClick} className="flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 opacity-60 hover:opacity-100 font-medium transition-colors text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
           Support
        </Link>
        
        <Link href="/student/join" onClick={onLinkClick} className="flex items-center justify-center gap-2 w-full bg-[#092B2B] hover:bg-[#0a3838] dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white px-4 py-3.5 rounded-xl font-bold transition-all shadow-sm">
           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
           Join New Class
        </Link>

        <form action="/auth/signout" method="post">
          <button type="submit" className="flex w-full items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 opacity-80 hover:opacity-100 font-medium transition-colors">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
             Sign Out
          </button>
        </form>
      </div>
    </aside>
  )
}
