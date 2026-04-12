import { cn } from '@/lib/cn'

type BadgeVariant = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD' |
  'breaking' | 'feature' | 'fix' |
  'operational' | 'degraded' | 'outage' |
  'sandbox' | 'production' |
  'default'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md'
}

const variantStyles: Record<BadgeVariant, string> = {
  GET: 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/40',
  POST: 'bg-blue-900/40 text-blue-300 border border-blue-700/40',
  PUT: 'bg-amber-900/40 text-amber-300 border border-amber-700/40',
  PATCH: 'bg-orange-900/40 text-orange-300 border border-orange-700/40',
  DELETE: 'bg-red-900/40 text-red-300 border border-red-700/40',
  OPTIONS: 'bg-gray-800 text-gray-400 border border-gray-700',
  HEAD: 'bg-gray-800 text-gray-400 border border-gray-700',
  breaking: 'bg-red-900/40 text-red-300 border border-red-700/40',
  feature: 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/40',
  fix: 'bg-blue-900/40 text-blue-300 border border-blue-700/40',
  operational: 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/40',
  degraded: 'bg-amber-900/40 text-amber-300 border border-amber-700/40',
  outage: 'bg-red-900/40 text-red-300 border border-red-700/40',
  sandbox: 'bg-violet-900/40 text-violet-300 border border-violet-700/40',
  production: 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/40',
  default: 'bg-gray-800 text-gray-400 border border-gray-700',
}

export function Badge({ variant = 'default', children, className, size = 'sm' }: BadgeProps) {
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  }
  return (
    <span className={cn('inline-flex items-center font-mono font-semibold rounded uppercase tracking-wide', sizes[size], variantStyles[variant], className)}>
      {children}
    </span>
  )
}
