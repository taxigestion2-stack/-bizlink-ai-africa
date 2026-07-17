import type { ReactNode } from 'react'
import { requireProfile } from '@/lib/auth/require-profile'
import { Sidebar } from '@/components/dashboard/sidebar'
import { NotificationBell } from '@/components/notifications/notification-bell'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { organization, profile } = await requireProfile()

  return (
    <div className="flex min-h-screen">
      <Sidebar organizationName={organization.name} />
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-end gap-3 border-b px-6 py-3">
          <span className="text-sm text-muted-foreground">{profile.full_name ?? profile.email}</span>
          <NotificationBell />
        </header>
        <main className="flex-1 overflow-y-auto p-6 md:p-8">{children}</main>
      </div>
    </div>
  )
}
