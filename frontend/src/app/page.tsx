import { redirect } from 'next/navigation'

export default function Home() {
  // Automatically redirect anyone visiting the root domain to the login handler.
  // The login page automatically handles bouncing logged-in users to their correct dashboard!
  redirect('/login')
}
