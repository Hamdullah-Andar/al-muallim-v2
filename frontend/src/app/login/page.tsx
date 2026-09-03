import { login } from './actions'
import Link from 'next/link'

/*
  What is this file doing?
  This is the visual User Interface (UI) for our Login Page.
  Because we put it in the `src/app/login` folder, Next.js automatically creates a 
  route for it at `al-muallim.com/login`!
*/
export default async function LoginPage(props: {
  searchParams: Promise<{ message: string }>
}) {
  // We check the URL for any error messages (e.g. if the Server Action sent back an error)
  const searchParams = await props.searchParams

  return (
    <div className="flex flex-col w-full justify-center items-center min-h-screen p-4 bg-background">
      
      {/* 
        Our Glassmorphism Card! 
        Notice we are using the `.glass-card` custom class we created in globals.css earlier!
      */}
      <form className="glass-card flex flex-col w-full max-w-md gap-4 text-foreground">
        
        <h1 className="text-4xl font-bold text-primary-800 dark:text-primary-400 text-center mb-2">
          Al-Mu'allim
        </h1>
        <p className="text-center text-sm opacity-70 mb-6">Sign in to your account</p>
        
        {/* Email Input */}
        <label className="text-sm font-medium" htmlFor="email">Email</label>
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
        
        {/* 
          Submit Button 
          The `formAction={login}` tells the form to securely send the inputs to 
          our Server Action function we wrote in `actions.ts`!
          When clicked, React automatically finds all <input> fields in this <form>,
          packages them into a `FormData` object, and securely sends them to our 
          server-side `login` function we wrote in `actions.ts`! No Javascript fetch() required!
        */}
        <button 
          formAction={login} 
          className="bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-md px-4 py-3 transition-colors shadow-sm"
        >
          Sign In
        </button>

        {/* Display any error messages from the server action here */}
        {searchParams?.message && (
          <p className="mt-4 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm text-center rounded-md border border-red-200 dark:border-red-800">
            {searchParams.message}
          </p>
        )}

        {/* Link to Registration Page */}
        <div className="mt-8 text-center text-sm opacity-80">
            Don't have an account?{' '}
            <Link href="/register" className="text-primary-600 dark:text-primary-400 hover:underline font-semibold">
              Create Account
            </Link>
          </div>
        </form>
    </div>
  )
}
