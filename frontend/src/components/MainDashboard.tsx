import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { DashboardUI } from '@/components/DashboardUI'

export const dynamic = 'force-dynamic'

export default async function MainDashboard() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Handle server action cookies if needed
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Handle server action cookies if needed
          }
        },
      },
    }
  )

  // Fetch products and categories for everyone
  const { data: products } = await supabase
    .from('products')
    .select(`
            *,
            seller:profiles(id, full_name, avatar_url),
            category:categories(id, name, icon)
        `)
    .neq('status', 'deleted')
    .order('created_at', { ascending: false })

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  return <DashboardUI initialProducts={products || []} categories={categories || []} />
}
