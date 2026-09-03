import JoinClassModalClient from '@/components/student/JoinClassModalClient'

export default function JoinClassPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black w-full flex flex-col justify-center items-center p-4">
      {/* 
        We reuse the same Client component used by the intercepting route 
        so the experience is identical even if they hard-refresh the page!
      */}
      <JoinClassModalClient />
    </div>
  )
}
