import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { NextResponse, type NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  await supabase.auth.signOut()

  const url = req.nextUrl.clone()
  url.pathname = '/login'

  revalidatePath('/', 'layout')
  return NextResponse.redirect(url, { status: 302 })
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  await supabase.auth.signOut()

  const url = req.nextUrl.clone()
  url.pathname = '/login'

  revalidatePath('/', 'layout')
  return NextResponse.redirect(url, { status: 302 })
}
