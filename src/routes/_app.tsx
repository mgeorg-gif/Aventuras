import { Outlet, createFileRoute, Link } from '@tanstack/react-router'
import {
  AppShell,
  AppShellSidebar,
  AppShellMain,
  MobileSidebarTrigger,
  Avatar,
  AvatarFallback,
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@blinkdotnew/ui'
import { Swords, Settings, Sparkles, PanelLeft, Database } from 'lucide-react'
import { useState, useCallback, useEffect, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

const SIDEBAR_KEY = 'sidebar_collapsed'
const LOCAL_USER_KEY = 'tv_local_user_id'

const FALLBACK_USER_NAME = 'Local Storyteller'

function readLocalUserName(): string {
  try {
    const id = window.localStorage.getItem(LOCAL_USER_KEY) || ''
    if (!id) return FALLBACK_USER_NAME
    // Truncated id makes the footer feel like a stable identity
    return `Local · ${id.slice(-6)}`
  } catch {
    return FALLBACK_USER_NAME
  }
}

export const Route = createFileRoute('/_app')({
  head: () => ({
    meta: [
      { title: 'Tales of the Void — Dark Fantasy Roleplay' },
      { name: 'description', content: 'An immersive dark fantasy AI roleplay experience. Runs entirely in your browser.' },
    ],
  }),
  component: AppLayout,
})

function AppLayout() {
  return <AppLayoutInner />
}

function AppLayoutInner() {
  return (
    <AppShell>
      <AppShellSidebar className="shrink-0">
        <SidebarContent />
      </AppShellSidebar>
      <AppShellMain>
        {/* Mobile header */}
        <div className="md:hidden flex items-center gap-3 px-4 h-14 border-b border-border bg-background sticky top-0 z-30">
          <MobileSidebarTrigger />
          <span className="font-serif font-semibold text-sm tracking-wide text-foreground">
            Tales of the Void
          </span>
        </div>
        <div className="min-h-dvh">
          <Outlet />
        </div>
      </AppShellMain>
    </AppShell>
  )
}

function SidebarContent() {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(SIDEBAR_KEY) === 'true'
  })

  const toggle = useCallback(() => {
    setCollapsed((v) => {
      const next = !v
      localStorage.setItem(SIDEBAR_KEY, String(next))
      return next
    })
  }, [])

  // SSR-safe: render the fallback on both server and first client render,
  // then hydrate the real user name from localStorage after mount.
  const [userName, setUserName] = useState<string>(FALLBACK_USER_NAME)
  useEffect(() => {
    setUserName(readLocalUserName())
  }, [])

  const userInitial = '·'

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={cn(
          'flex flex-col h-full bg-sidebar border-r border-sidebar-border overflow-hidden',
          'transition-[width] duration-200 ease-linear shrink-0',
          collapsed ? 'w-[3rem]' : 'w-[15rem]',
        )}
      >
        {/* ── Header ──────────────────────────────────── */}
        <div
          className={cn(
            'flex items-center gap-2 shrink-0 border-b border-sidebar-border h-[52px] px-3',
            collapsed && 'justify-center px-2',
          )}
        >
          {!collapsed && (
            <>
              <div className="flex items-center justify-center h-7 w-7 rounded-md bg-primary text-primary-foreground text-xs font-bold shrink-0">
                <Swords className="h-3.5 w-3.5" />
              </div>
              <span className="flex-1 font-serif font-semibold text-sm truncate text-sidebar-foreground">
                Tales of the Void
              </span>
            </>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 shrink-0 text-sidebar-foreground/60 hover:text-sidebar-foreground"
                onClick={toggle}
              >
                <PanelLeft
                  className={cn('h-4 w-4 transition-transform duration-200', collapsed && 'rotate-180')}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* ── Nav (scrollable) ───────────────────────── */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-2 py-2 space-y-0.5">
          {!collapsed && (
            <p className="px-3 pt-1 pb-1 text-[10px] font-medium text-sidebar-foreground/50 uppercase tracking-wider">
              Navigation
            </p>
          )}
          <NavItem
            href="/"
            icon={<Swords className="h-4 w-4" />}
            label="Campaigns"
            collapsed={collapsed}
          />
          <NavItem
            href="/settings"
            icon={<Settings className="h-4 w-4" />}
            label="Settings"
            collapsed={collapsed}
          />
        </div>

        {/* ── Footer (pinned) ────────────────────────── */}
        <div
          className={cn(
            'shrink-0 border-t border-sidebar-border',
            collapsed ? 'flex flex-col items-center gap-1 p-2' : 'p-3 space-y-1',
          )}
        >
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-center h-8 w-8 rounded-md bg-sidebar-accent text-sidebar-accent-foreground">
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarFallback className="text-[10px] bg-sidebar-accent text-sidebar-accent-foreground">
                      {userInitial}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">{userName}</TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
              <Avatar className="h-6 w-6 shrink-0">
                <AvatarFallback className="text-[10px] bg-sidebar-accent text-sidebar-accent-foreground">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-medium leading-tight truncate text-sidebar-foreground">
                  {userName}
                </p>
                <p className="text-[10px] text-sidebar-foreground/50 leading-tight truncate flex items-center gap-1">
                  <Database className="h-2.5 w-2.5" />
                  Stored locally
                </p>
              </div>
            </div>
          )}

          {!collapsed && (
            <p className="text-[10px] text-sidebar-foreground/40 leading-snug px-2 flex items-center gap-1">
              <Sparkles className="h-2.5 w-2.5" />
              Runs entirely in your browser
            </p>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}

function NavItem({
  href,
  icon,
  label,
  collapsed,
}: {
  href: string
  icon: ReactNode
  label: string
  collapsed: boolean
}) {
  const link = (
    <Link
      to={href}
      className={cn(
        'flex items-center gap-2.5 rounded-md text-sm transition-colors',
        collapsed ? 'justify-center w-8 h-8 mx-auto' : 'px-3 py-2 w-full',
        'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
        '[&.active]:bg-sidebar-accent [&.active]:text-sidebar-foreground [&.active]:font-medium',
      )}
    >
      <span className="shrink-0">{icon}</span>
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  )

  if (!collapsed) return link
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
}
