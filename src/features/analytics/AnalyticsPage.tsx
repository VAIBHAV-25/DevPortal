import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from 'recharts'
import { TrendingUp, AlertCircle, Clock, Database, RefreshCcw } from 'lucide-react'
import { getApiById } from '@/apis/api-registry'
import { parseSpec } from '@/lib/spec-parser'
import { useAnalytics } from './useAnalytics'
import { cn } from '@/lib/cn'

export function AnalyticsPage() {
  const { apiId } = useParams<{ apiId: string }>()
  const [range, setRange] = useState<7 | 30>(7)

  const api = getApiById(apiId ?? '')
  const endpoints = useMemo(() => api ? parseSpec(api.spec) : [], [api])

  const { data, isLoading, isError, refetch } = useAnalytics(apiId ?? '', range)

  const timeSeriesData = data?.timeSeries ?? []
  const endpointStatsFromDb = data?.endpointStats ?? []
  const isReal = data?.isReal ?? false

  const totalCalls = timeSeriesData.reduce((s, d) => s + d.calls, 0)
  const totalErrors = timeSeriesData.reduce((s, d) => s + d.errors, 0)
  const avgLatency = timeSeriesData.length
    ? Math.round(timeSeriesData.reduce((s, d) => s + d.avgLatency, 0) / timeSeriesData.length)
    : 0
  const errorRate = totalCalls > 0 ? ((totalErrors / totalCalls) * 100).toFixed(2) : '0.00'

  // Fallback per-endpoint stats when no real data
  function seededRand(seed: number): number {
    const x = Math.sin(seed + 1) * 10000
    return x - Math.floor(x)
  }
  const fallbackEndpointStats = useMemo(() => endpoints.map((ep, idx) => {
    const s1 = seededRand(idx * 3)
    const s2 = seededRand(idx * 3 + 1)
    const s3 = seededRand(idx * 3 + 2)
    return {
      endpoint: ep.path,
      method: ep.method,
      calls: Math.round(Math.max(totalCalls, 100) / Math.max(endpoints.length, 1) * (0.5 + s1)),
      errorRate: parseFloat((s2 * 5).toFixed(2)),
      avgLatency: Math.round(60 + s3 * 120),
    }
  }).sort((a, b) => b.calls - a.calls), [endpoints, totalCalls])

  const endpointStats = endpointStatsFromDb.length > 0 ? endpointStatsFromDb : fallbackEndpointStats

  const METRICS = [
    { label: 'Total Requests', value: totalCalls.toLocaleString(), icon: TrendingUp, color: 'text-brand-400', bg: 'bg-brand-900/20 border-brand-800/40' },
    { label: 'Error Rate', value: `${errorRate}%`, icon: AlertCircle, color: parseFloat(errorRate) > 5 ? 'text-red-400' : 'text-emerald-400', bg: parseFloat(errorRate) > 5 ? 'bg-red-900/20 border-red-800/40' : 'bg-emerald-900/20 border-emerald-800/40' },
    { label: 'Avg Latency', value: avgLatency > 0 ? `${avgLatency}ms` : '—', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-900/20 border-amber-800/40' },
  ]

  if (isLoading) return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-4 animate-pulse">
      <div className="skeleton h-8 w-48 rounded-lg" />
      <div className="grid sm:grid-cols-3 gap-4">
        {[1,2,3].map(i => <div key={i} className="skeleton h-28 rounded-xl" />)}
      </div>
      <div className="skeleton h-64 rounded-xl" />
    </div>
  )

  if (isError) return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="card p-12 text-center">
        <AlertCircle size={32} className="text-red-400 mx-auto mb-3" />
        <p className="text-red-400 text-sm mb-3">Failed to load analytics data</p>
        <button onClick={() => refetch()} className="text-brand-400 hover:text-brand-300 text-sm flex items-center gap-1 mx-auto">
          <RefreshCcw size={14} /> Retry
        </button>
      </div>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <TrendingUp size={22} className="text-brand-400" />
            Analytics
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-gray-500 text-sm">{api?.name} · Usage overview</p>
            {isReal ? (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-900/20 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                <Database size={10} /> Live Supabase data
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-amber-400 bg-amber-900/20 border border-amber-800/40 px-2 py-0.5 rounded-full">
                Demo data · make requests in Sandbox to see real stats
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="text-gray-600 hover:text-gray-300 transition-colors" title="Refresh">
            <RefreshCcw size={15} />
          </button>
          <div className="flex gap-1 bg-white/5 rounded-lg p-1 border border-white/8">
            {([7, 30] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cn('px-3 py-1 text-sm rounded transition-colors',
                  range === r ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'
                )}
              >
                {r}d
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        {METRICS.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={cn('border rounded-xl p-5 card-hover', bg)}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">{label}</span>
              <Icon size={16} className={color} />
            </div>
            <span className={cn('text-3xl font-bold', color)}>{value}</span>
          </div>
        ))}
      </div>

      {/* Request volume chart */}
      <div className="border border-white/8 rounded-xl p-5 mb-6 bg-white/2">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Request Volume</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={timeSeriesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }}
              labelStyle={{ color: '#d1d5db' }}
              itemStyle={{ color: '#818cf8' }}
            />
            <Line type="monotone" dataKey="calls" stroke="#818cf8" strokeWidth={2} dot={false} name="Requests" />
            <Line type="monotone" dataKey="errors" stroke="#f87171" strokeWidth={1.5} dot={false} name="Errors" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Latency chart */}
      <div className="border border-white/8 rounded-xl p-5 mb-6 bg-white/2">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Average Latency (ms)</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={timeSeriesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }}
              labelStyle={{ color: '#d1d5db' }}
            />
            <Bar dataKey="avgLatency" fill="#fbbf24" radius={[4,4,0,0]} name="Latency (ms)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Per-endpoint breakdown */}
      <div className="border border-white/8 rounded-xl overflow-hidden bg-white/2">
        <div className="px-5 py-3 border-b border-white/6 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-300">Per-Endpoint Breakdown</h3>
          {!isReal && <span className="text-xs text-gray-600">Estimated • make real requests to see actuals</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/6">
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Endpoint</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Method</th>
                <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium">Calls</th>
                <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium">Error Rate</th>
                <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium">Avg Latency</th>
              </tr>
            </thead>
            <tbody>
              {endpointStats.map((stat, i) => (
                <tr key={i} className="border-b border-white/4 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-300 max-w-xs truncate">{stat.endpoint}</td>
                  <td className="px-4 py-3">
                    <span className={cn('text-xs font-mono font-semibold',
                      stat.method === 'GET' ? 'text-emerald-400' :
                      stat.method === 'POST' ? 'text-blue-400' :
                      stat.method === 'DELETE' ? 'text-red-400' : 'text-amber-400'
                    )}>
                      {stat.method}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-300">{stat.calls.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={cn('text-xs font-mono font-medium',
                      stat.errorRate < 1 ? 'text-emerald-400' : stat.errorRate < 5 ? 'text-amber-400' : 'text-red-400'
                    )}>
                      {stat.errorRate}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500 font-mono text-xs">
                    {stat.avgLatency > 0 ? `${stat.avgLatency}ms` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
