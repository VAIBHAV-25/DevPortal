import { useState, useEffect, useCallback } from 'react'
import { NavLink, useNavigate, useParams } from 'react-router-dom'
import {
  BookOpen, Terminal, Key, BarChart2, Activity,
  FileText, ChevronRight, LogOut, Search, Menu, X,
  Sun, Moon, ChevronDown,
} from 'lucide-react'
import { API_REGISTRY } from '@/apis/api-registry'
import { useAuthStore } from '@/features/auth/useAuthStore'
import { SearchModal } from './SearchModal'
import { cn } from '@/lib/cn'

const NAV_ITEMS = [
  { label: 'Docs', icon: BookOpen, path: 'docs' },
  { label: 'Sandbox', icon: Terminal, path: 'sandbox' },
  { label: 'API Keys', icon: Key, path: 'keys' },
  { label: 'Analytics', icon: BarChart2, path: 'analytics' },
  { label: 'Status', icon: Activity, path: 'status' },
  { label: 'Changelog', icon: FileText, path: 'changelog' },
]

type Theme = 'dark' | 'light'

function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('devportal-theme-v2') as Theme) ?? 'dark'
  })
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('light', theme === 'light')
    localStorage.setItem('devportal-theme-v2', theme)
  }, [theme])
  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  return { theme, toggle }
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [apiExpanded, setApiExpanded] = useState<Record<string, boolean>>({})
  const { theme, toggle: toggleTheme } = useTheme()
  const { user, signOut } = useAuthStore()
  const navigate = useNavigate()
  const { apiId } = useParams<{ apiId: string }>()

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const handleSignOut = useCallback(async () => {
    await signOut()
    navigate('/login')
  }, [signOut, navigate])

  const toggleApiExpanded = (id: string) => {
    setApiExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const isApiExpanded = (id: string) =>
    apiId === id || apiExpanded[id] === true

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-4 border-b border-subtle',
        sidebarCollapsed && 'justify-center px-0'
      )}>
        <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center flex-shrink-0 glow-sm">
          <span className="text-white font-bold text-xs">DP</span>
        </div>
        {!sidebarCollapsed && (
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-white">DevPortal</p>
            <p className="text-xs text-gray-500">API Dashboard</p>
          </div>
        )}
        <button
          className="hidden lg:flex text-gray-600 hover:text-gray-300 transition-colors"
          onClick={() => setSidebarCollapsed((c) => !c)}
        >
          <ChevronRight size={14} className={cn('transition-transform duration-200', !sidebarCollapsed && 'rotate-180')} />
        </button>
      </div>

      {/* API list */}
      <div className="flex-1 overflow-y-auto py-3 px-2">
        {!sidebarCollapsed && (
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider px-2 mb-2">APIs</p>
        )}
        {API_REGISTRY.map((api) => (
          <div key={api.id}>
            <button
              onClick={() => {
                if (sidebarCollapsed) {
                  navigate(`/apis/${api.id}/docs`)
                } else {
                  toggleApiExpanded(api.id)
                }
              }}
              title={sidebarCollapsed ? api.name : undefined}
              className={cn(
                'sidebar-item w-full mb-0.5',
                apiId === api.id && 'sidebar-item-active',
                sidebarCollapsed && 'justify-center px-0 py-2.5'
              )}
            >
              <span className="text-base flex-shrink-0">{api.icon}</span>
              {!sidebarCollapsed && (
                <>
                  <span className="flex-1 text-left truncate">{api.name}</span>
                  <span className="text-xs text-gray-600 font-mono">{api.version}</span>
                  <ChevronDown
                    size={12}
                    className={cn('text-gray-600 transition-transform duration-200', isApiExpanded(api.id) && 'rotate-180')}
                  />
                </>
              )}
            </button>

            {/* Nested nav items */}
            {!sidebarCollapsed && isApiExpanded(api.id) && (
              <div className="ml-4 border-l border-white/6 pl-2 mb-1 animate-slide-up">
                {NAV_ITEMS.map(({ label, icon: Icon, path }) => (
                  <NavLink
                    key={`${api.id}-${path}`}
                    to={`/apis/${api.id}/${path}`}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn('sidebar-item mb-0.5', isActive && 'sidebar-item-active')
                    }
                  >
                    <Icon size={14} className="flex-shrink-0" />
                    <span>{label}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Quick nav for collapsed */}
        {sidebarCollapsed && (
          <div className="mt-2">
            {NAV_ITEMS.map(({ label, icon: Icon, path }) => (
              <NavLink
                key={`collapsed-${path}`}
                to={`/apis/${API_REGISTRY[0]?.id ?? 'pokeapi'}/${path}`}
                title={label}
                className={({ isActive }) =>
                  cn('sidebar-item justify-center px-0 py-2.5 mb-0.5', isActive && 'sidebar-item-active')
                }
              >
                <Icon size={16} />
              </NavLink>
            ))}
          </div>
        )}
      </div>

      {/* Bottom: user info */}
      <div className={cn(
        'border-t border-subtle p-3',
        sidebarCollapsed ? 'flex flex-col items-center gap-2' : 'flex items-center gap-2'
      )}>
        {!sidebarCollapsed && (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-app-muted truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign out"
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-900/30 text-app-muted hover:text-red-400 transition-colors"
            >
              <LogOut size={15} />
            </button>
          </>
        )}
        {sidebarCollapsed && (
          <button
            onClick={handleSignOut}
            title="Sign out"
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-900/30 text-app-muted hover:text-red-400 transition-colors"
          >
            <LogOut size={15} />
          </button>
        )}
      </div>
    </>
  )

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed lg:relative z-30 flex flex-col h-full',
        'bg-sidebar border-r border-subtle',
        'transition-all duration-200',
        sidebarCollapsed ? 'w-14' : 'w-60',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {sidebarContent}
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-app">
        {/* Top bar */}
        <header className="flex items-center gap-3 px-4 h-14 border-b border-subtle bg-header backdrop-blur-md flex-shrink-0">
          {/* Mobile menu button */}
          <button
            className="lg:hidden text-gray-500 hover:text-gray-100 transition-colors"
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Search bar */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 flex-1 max-w-sm bg-white/4 hover:bg-white/7 border border-white/8 rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:text-gray-400 transition-all duration-150 group"
          >
            <Search size={13} />
            <span className="flex-1 text-left">Search endpoints…</span>
            <div className="hidden sm:flex items-center gap-1 text-xs text-gray-700">
              <kbd className="bg-white/5 px-1.5 py-0.5 rounded">⌘K</kbd>
            </div>
          </button>

          <div className="ml-auto flex items-center gap-2">
            {/* Current API indicator */}
            {apiId && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-app-muted bg-white/4 px-2.5 py-1 rounded-lg border border-subtle">
                <span>{API_REGISTRY.find((a) => a.id === apiId)?.icon}</span>
                <span>{API_REGISTRY.find((a) => a.id === apiId)?.name}</span>
              </div>
            )}
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/8 text-app-muted hover:text-app-primary transition-colors"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center flex-shrink-0 glow-sm cursor-pointer" title={user?.email}>
              <span className="text-white text-xs font-bold">
                {user?.email?.[0]?.toUpperCase() ?? 'U'}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden flex items-center border-t border-subtle bg-sidebar backdrop-blur-md safe-area-pb">
          {NAV_ITEMS.slice(0, 5).map(({ label, icon: Icon, path }) => (
            <NavLink
              key={path}
              to={`/apis/${apiId ?? API_REGISTRY[0]?.id ?? 'pokeapi'}/${path}`}
              className={({ isActive }) =>
                cn(
                  'flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs transition-colors',
                  isActive ? 'text-brand-400' : 'text-gray-600 hover:text-gray-400'
                )
              }
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Cmd+K search modal */}
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}
