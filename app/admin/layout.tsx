import { AdminHeader } from "@/features/admin/components/header"
import { AdminProtector } from "@/features/admin/components/protector"
import { Toaster } from "sonner"

export const metadata = {
  metadataBase: new URL('https://blog.zzemy.top'),
  title: 'Blog Admin',
  description: 'Manage your blog content',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminProtector>
      <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
        <AdminHeader />
        <main className="min-h-[calc(100vh-4.5rem)]">
          {children}
        </main>
        <Toaster />
      </div>
    </AdminProtector>
  )
}
