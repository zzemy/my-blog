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
      <div className="min-h-screen bg-background">
        <AdminHeader />
        <main className="container mx-auto max-w-6xl px-4 py-8">
          {children}
        </main>
        <Toaster />
      </div>
    </AdminProtector>
  )
}
