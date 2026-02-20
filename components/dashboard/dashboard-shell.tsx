"use client"

import type { User } from "@supabase/supabase-js"
import type { Profile, BusinessSettings } from "@/lib/types"
import { DashboardSidebar } from "./dashboard-sidebar"
import { DashboardHeader } from "./dashboard-header"
import { useState } from "react"

interface DashboardShellProps {
  user: User
  profile: Profile | null
  settings: BusinessSettings | null
  children: React.ReactNode
}

export function DashboardShell({
  user,
  profile,
  settings,
  children,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar
        profile={profile}
        settings={settings}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader
          user={user}
          profile={profile}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
