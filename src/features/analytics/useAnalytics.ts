import { useQuery } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuthStore } from '@/features/auth/useAuthStore'
import type { AnalyticsDataPoint, EndpointStat } from '@/types'

// ─── Supabase helpers ────────────────────────────────────────────────────────

async function fetchAnalyticsFromSupabase(
  userId: string,
  apiId: string,
  days: number
): Promise<{ timeSeries: AnalyticsDataPoint[]; endpointStats: EndpointStat[] }> {
  if (!supabase) throw new Error('Supabase not configured')

  const since = new Date()
  since.setDate(since.getDate() - days)

  const { data, error } = await supabase
    .from('request_history')
    .select('*')
    .eq('user_id', userId)
    .eq('api_id', apiId)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: true })

  if (error) throw error

  const rows = data ?? []

  // Build a map of date → aggregated metrics
  const dayMap: Record<string, { calls: number; errors: number; latencies: number[] }> = {}
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const label = d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
    dayMap[label] = { calls: 0, errors: 0, latencies: [] }
  }

  for (const row of rows) {
    const label = new Date(row.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })
    if (!dayMap[label]) dayMap[label] = { calls: 0, errors: 0, latencies: [] }
    dayMap[label].calls += 1
    if (row.response_status && row.response_status >= 400) dayMap[label].errors += 1
    if (row.response_latency) dayMap[label].latencies.push(row.response_latency)
  }

  const timeSeries: AnalyticsDataPoint[] = Object.entries(dayMap).map(([date, m]) => ({
    date,
    calls: m.calls,
    errors: m.errors,
    avgLatency: m.latencies.length
      ? Math.round(m.latencies.reduce((a, b) => a + b, 0) / m.latencies.length)
      : 0,
  }))

  // Per-endpoint stats
  const epMap: Record<string, { method: string; calls: number; errors: number; latencies: number[] }> = {}
  for (const row of rows) {
    const key = row.url
    if (!epMap[key]) epMap[key] = { method: row.method, calls: 0, errors: 0, latencies: [] }
    epMap[key].calls += 1
    if (row.response_status && row.response_status >= 400) epMap[key].errors += 1
    if (row.response_latency) epMap[key].latencies.push(row.response_latency)
  }

  const endpointStats: EndpointStat[] = Object.entries(epMap)
    .map(([url, m]) => ({
      endpoint: url,
      method: m.method,
      calls: m.calls,
      errorRate: m.calls > 0 ? parseFloat(((m.errors / m.calls) * 100).toFixed(2)) : 0,
      avgLatency: m.latencies.length
        ? Math.round(m.latencies.reduce((a, b) => a + b, 0) / m.latencies.length)
        : 0,
    }))
    .sort((a, b) => b.calls - a.calls)
    .slice(0, 20)

  return { timeSeries, endpointStats }
}

// ─── Deterministic fallback (no Supabase / new users) ──────────────────────

function seededRand(seed: number): number {
  const x = Math.sin(seed + 1) * 10000
  return x - Math.floor(x)
}

function generateMockTimeSeries(days: number): AnalyticsDataPoint[] {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (days - 1 - i))
    const base = 1200 + Math.sin(i * 0.5) * 400
    const s = seededRand(i)
    const calls = Math.round(base + s * 300)
    return {
      date: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      calls,
      errors: Math.round(calls * (0.01 + seededRand(i + 100) * 0.04)),
      avgLatency: Math.round(80 + seededRand(i + 200) * 60),
    }
  })
}

// ─── TanStack Query hook ─────────────────────────────────────────────────────

export function useAnalytics(apiId: string, days: 7 | 30) {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: ['analytics', apiId, days, user?.id],
    queryFn: async () => {
      if (!isSupabaseConfigured || !user || user.id === 'demo-user-id') {
        // Return mock data when not connected
        return {
          timeSeries: generateMockTimeSeries(days),
          endpointStats: [] as EndpointStat[],
          isReal: false,
        }
      }
      const { timeSeries, endpointStats } = await fetchAnalyticsFromSupabase(user.id, apiId, days)
      return { timeSeries, endpointStats, isReal: true }
    },
    enabled: !!user,
    staleTime: 1000 * 60, // refresh every minute
  })
}

// ─── Save a request to Supabase ──────────────────────────────────────────────

export async function logRequestToSupabase(params: {
  userId: string
  apiId: string
  method: string
  url: string
  pathParams: Record<string, string>
  queryParams: Record<string, string>
  headers: Record<string, string>
  body?: string
  responseStatus?: number
  responseLatency?: number
}): Promise<void> {
  if (!supabase || !isSupabaseConfigured || params.userId === 'demo-user-id') return
  await supabase.from('request_history').insert({
    user_id: params.userId,
    api_id: params.apiId,
    method: params.method,
    url: params.url,
    path_params: params.pathParams,
    query_params: params.queryParams,
    headers: params.headers,
    body: params.body || null,
    response_status: params.responseStatus || null,
    response_latency: params.responseLatency || null,
  })
}
