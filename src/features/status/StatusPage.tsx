import { useMemo } from 'react'
import { API_REGISTRY } from '@/apis/api-registry'
import { Badge } from '@/components/Badge'
import type { ApiStatus, StatusIncident } from '@/types'
import { cn } from '@/lib/cn'

function generateStatus(apiId: string): ApiStatus {
  const seed = apiId.length
  const statuses: ApiStatus['status'][] = ['operational', 'operational', 'operational', 'degraded']
  return {
    apiId,
    status: statuses[seed % statuses.length],
    uptime: 99.0 + Math.random() * 0.98,
    incidents: [],
  }
}

const GLOBAL_INCIDENTS: StatusIncident[] = [
  {
    id: '1',
    title: 'Elevated latency on PokéAPI endpoints',
    status: 'resolved',
    startedAt: '2024-03-10T14:30:00Z',
    resolvedAt: '2024-03-10T15:45:00Z',
    description: 'Some users experienced elevated p99 latency on /pokemon endpoints. This was caused by a database hot-spot and has been resolved by query optimisation.',
  },
  {
    id: '2',
    title: 'Planned maintenance: Database migration',
    status: 'resolved',
    startedAt: '2024-02-25T02:00:00Z',
    resolvedAt: '2024-02-25T03:20:00Z',
    description: 'Scheduled maintenance window for database schema migration. All services were briefly unavailable during this window.',
  },
]

const STATUS_ICON: Record<ApiStatus['status'], string> = {
  operational: '✅',
  degraded: '⚠️',
  outage: '🔴',
}

export function StatusPage() {
  const statuses = useMemo(() => API_REGISTRY.map((api) => ({
    api,
    status: generateStatus(api.id),
  })), [])

  const hasAnyDegraded = statuses.some((s) => s.status.status !== 'operational')

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Global banner if any degraded */}
      {hasAnyDegraded && (
        <div className="mb-6 p-4 rounded-xl bg-amber-900/20 border border-amber-600/40 flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="text-amber-300 font-semibold">Some APIs are experiencing degraded performance</p>
            <p className="text-amber-600 text-sm mt-0.5">Our team is actively investigating. Check below for individual API status.</p>
          </div>
        </div>
      )}

      <h1 className="text-2xl font-bold text-white mb-2">API Status</h1>
      <p className="text-gray-400 text-sm mb-6">Real-time status for all APIs in the registry.</p>

      {/* Overall status card */}
      <div className={cn('border rounded-xl p-5 mb-6',
        hasAnyDegraded ? 'border-amber-700/40 bg-amber-900/10' : 'border-emerald-700/40 bg-emerald-900/10'
      )}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{hasAnyDegraded ? '⚠️' : '✅'}</span>
          <div>
            <p className={cn('font-bold text-lg', hasAnyDegraded ? 'text-amber-300' : 'text-emerald-300')}>
              {hasAnyDegraded ? 'Partial Outage' : 'All Systems Operational'}
            </p>
            <p className="text-sm text-gray-500">Last checked: {new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      </div>

      {/* Per-API status */}
      <div className="space-y-3 mb-8">
        {statuses.map(({ api, status }) => (
          <div key={api.id} className="border border-gray-800 rounded-xl p-4 bg-gray-900 flex items-center gap-4">
            <span className="text-xl">{STATUS_ICON[status.status]}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-200">{api.name}</span>
                <Badge variant={status.status} size="sm">{status.status}</Badge>
              </div>
              <p className="text-xs text-gray-500 font-mono mt-0.5">{api.baseUrl}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className={cn('text-sm font-bold', status.uptime >= 99.5 ? 'text-emerald-400' : 'text-amber-400')}>
                {status.uptime.toFixed(2)}%
              </p>
              <p className="text-xs text-gray-600">uptime (30d)</p>
            </div>
          </div>
        ))}
      </div>

      {/* Incident history */}
      <div>
        <h2 className="text-lg font-semibold text-gray-200 mb-4">Incident History</h2>
        <div className="space-y-4">
          {GLOBAL_INCIDENTS.map((incident) => (
            <div key={incident.id} className="border border-gray-800 rounded-xl p-4 bg-gray-900">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className={cn('w-2 h-2 rounded-full flex-shrink-0 mt-1',
                    incident.status === 'resolved' ? 'bg-emerald-500' :
                    incident.status === 'investigating' ? 'bg-red-500' : 'bg-amber-500'
                  )} />
                  <span className="font-medium text-gray-200 text-sm">{incident.title}</span>
                </div>
                <span className={cn('text-xs font-semibold capitalize flex-shrink-0',
                  incident.status === 'resolved' ? 'text-emerald-400' : 'text-amber-400'
                )}>
                  {incident.status}
                </span>
              </div>
              <p className="text-xs text-gray-500 ml-4 leading-relaxed">{incident.description}</p>
              <div className="flex gap-4 mt-2 ml-4 text-xs text-gray-600">
                <span>Started: {new Date(incident.startedAt).toLocaleString()}</span>
                {incident.resolvedAt && <span>Resolved: {new Date(incident.resolvedAt).toLocaleString()}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
