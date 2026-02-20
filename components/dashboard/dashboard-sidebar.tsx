"use client"

import type { Profile, BusinessSettings } from "@/lib/types"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Droplets,
  ClipboardList,
  Settings,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface DashboardSidebarProps {
  profile: Profile | null
  settings: BusinessSettings | null
  open: boolean
  onClose: () => void
}

const navItems = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/dashboard/customers", label: "Clientes", icon: Users },
  { href: "/dashboard/loyalty", label: "Fidelidad", icon: CreditCard },
  { href: "/dashboard/services", label: "Servicios", icon: Droplets },
  { href: "/dashboard/history", label: "Historial", icon: ClipboardList },
  { href: "/dashboard/settings", label: "Configuracion", icon: Settings },
]

export function DashboardSidebar({
  settings,
  open,
  onClose,
}: DashboardSidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-200 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo area */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          <Link href="/dashboard" className="flex items-center gap-3">
            <Image
              src="/images/logo.png"
              alt="Elite Carwash"
              width={140}
              height={47}
              className="object-contain"
            />
          </Link>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-sidebar-foreground hover:bg-sidebar-accent lg:hidden"
            aria-label="Cerrar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" &&
                  pathname.startsWith(item.href))
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-4">
          <p className="text-xs text-muted-foreground">
            {settings?.business_name || "Elite Carwash"}
          </p>
        </div>
      </aside>
    </>
  )
}
