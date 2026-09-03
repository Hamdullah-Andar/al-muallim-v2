import Link from 'next/link'
import { registerUser } from './actions'

export default async function RegisterPage(props: {
  searchParams: Promise<{ message: string }>
}) {
  const searchParams = await props.searchParams

  return (
    <div className="flex w-full min-h-screen bg-background">
      
      {/* 
        LEFT SIDE: Desktop Split Screen Image 
        Hidden on mobile, takes up 1/2 of the screen on desktop.
        Right now it is a deep green placeholder gradient. You can add your Mosque Image here later!
      */}
      <div className="hidden lg:flex flex-col w-1/2 bg-gradient-to-br from-primary-800 to-primary-950 p-12 text-white justify-center relative overflow-hidden">
        {/* Placeholder for Mosque Image Graphic */}
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] mix-blend-overlay"></div>
        
        <div className="z-10 max-w-lg">
          <h1 className="text-6xl font-bold mb-6 font-arabic leading-tight">Al-Mu'allim</h1>
          <h2 className="text-3xl font-medium mb-4 opacity-90">Begin Your Journey</h2>
          <p className="text-lg opacity-80 leading-relaxed">
            Join a community dedicated to the pursuit of sacred knowledge and modern excellence.
          </p>
        </div>
      </div>

      {/* 
        RIGHT SIDE: Registration Form 
        Takes up full screen on mobile, 1/2 screen on desktop.
      */}
      <div className="flex flex-col w-full lg:w-1/2 justify-center items-center p-6 lg:p-12 xl:p-24 relative">
        
        <form className="glass-card flex flex-col w-full max-w-md gap-4 text-foreground relative z-10">
          
          {/* Mobile Header (Hidden on Desktop because desktop has the big left side) */}
          <div className="lg:hidden text-center mb-6">
            <h1 className="text-4xl font-bold text-primary-800 dark:text-primary-400 mb-2 font-arabic">Al-Mu'allim</h1>
            <p className="text-sm opacity-70">Begin Your Journey</p>
          </div>

          <h2 className="text-2xl font-bold mb-6 text-center lg:text-left">Create New Account</h2>

          {/* 
            Role Selection Toggle (CSS-only, no JavaScript needed!)
            We use hidden radio buttons and the peer-checked CSS trick to style the labels.
          */}
          <p className="text-sm font-medium mb-[-8px]">Select Your Role</p>
          <div className="flex gap-4 w-full mb-4">
            <div className="flex-1 relative">
              <input type="radio" id="role-student" name="role" value="student" className="peer hidden" defaultChecked />
              <label htmlFor="role-student" className="flex items-center justify-center w-full p-4 border border-black/10 dark:border-white/10 rounded-md cursor-pointer transition-all peer-checked:bg-primary-100 peer-checked:dark:bg-primary-900/40 peer-checked:border-primary-500 peer-checked:text-primary-700 dark:peer-checked:text-primary-300 peer-checked:shadow-inner hover:bg-black/5 dark:hover:bg-white/5 font-medium">
                I am a Student
              </label>
            </div>
            <div className="flex-1 relative">
              <input type="radio" id="role-teacher" name="role" value="teacher" className="peer hidden" />
              <label htmlFor="role-teacher" className="flex items-center justify-center w-full p-4 border border-black/10 dark:border-white/10 rounded-md cursor-pointer transition-all peer-checked:bg-primary-100 peer-checked:dark:bg-primary-900/40 peer-checked:border-primary-500 peer-checked:text-primary-700 dark:peer-checked:text-primary-300 peer-checked:shadow-inner hover:bg-black/5 dark:hover:bg-white/5 font-medium">
                I am a Teacher
              </label>
            </div>
          </div>

          {/* Full Name Input */}
          <label className="text-sm font-medium" htmlFor="full_name">Full Name</label>
          <input
            className="rounded-md px-4 py-3 bg-white/50 dark:bg-black/50 border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary-500 mb-2"
            name="full_name"
            type="text"
            placeholder="Enter your full name"
            required
          />

          {/* Email Input */}
          <label className="text-sm font-medium" htmlFor="email">Email Address</label>
          <input
            className="rounded-md px-4 py-3 bg-white/50 dark:bg-black/50 border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary-500 mb-2"
            name="email"
            type="email"
            placeholder="teacher@school.com"
            required
          />
          
          {/* Password Input */}
          <label className="text-sm font-medium" htmlFor="password">Password</label>
          <input
            className="rounded-md px-4 py-3 bg-white/50 dark:bg-black/50 border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary-500 mb-6"
            type="password"
            name="password"
            placeholder="••••••••"
            required
          />
          
          <button 
            formAction={registerUser} 
            className="bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-md px-4 py-4 transition-colors shadow-sm text-lg mt-2"
          >
            Create Account
          </button>

          {/* Display any error messages from the server action here */}
          {searchParams?.message && (
            <p className="mt-4 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm text-center rounded-md border border-red-200 dark:border-red-800">
              {searchParams.message}
            </p>
          )}

          {/* Back to Login Link */}
          <div className="mt-4 text-center text-sm opacity-80">
            Already have an account?{' '}
            <Link href="/login" className="text-primary-600 dark:text-primary-400 hover:underline font-semibold">
              Sign In
            </Link>
          </div>
        </form>

      </div>
    </div>
  )
}
