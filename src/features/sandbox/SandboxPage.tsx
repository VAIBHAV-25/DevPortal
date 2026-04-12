import { useState, useMemo, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import CodeMirror from '@uiw/react-codemirror'
import { json } from '@codemirror/lang-json'
import { oneDark } from '@codemirror/theme-one-dark'
import { Play, Plus, X, Code, History, RotateCcw, Trash2, Terminal } from 'lucide-react'
import { getApiById } from '@/apis/api-registry'
import { parseSpec } from '@/lib/spec-parser'
import { generateSnippets } from '@/lib/snippet-generator'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { CodeBlock } from '@/components/CodeBlock'
import { useAuthStore } from '@/features/auth/useAuthStore'
import { useRequestHistory } from './useRequestHistory'
import { logRequestToSupabase } from '@/features/analytics/useAnalytics'
import type { ParsedEndpoint, RequestState, ApiCallResponse } from '@/types'
import { cn } from '@/lib/cn'

function buildInitialRequest(endpoint: ParsedEndpoint, baseUrl: string): RequestState {
  const pathParams: Record<string, string> = {}
  const queryParams: Record<string, string> = {}
  for (const p of endpoint.parameters) {
    if (p.in === 'path') pathParams[p.name] = p.example ?? ''
    if (p.in === 'query') queryParams[p.name] = ''
  }
  return {
    method: endpoint.method,
    url: `${baseUrl}${endpoint.path}`,
    headers: { 'Content-Type': 'application/json' },
    pathParams,
    queryParams,
    body: endpoint.requestBody ? JSON.stringify({ example: 'value' }, null, 2) : '',
  }
}

async function executeRequest(request: RequestState, token?: string): Promise<ApiCallResponse> {
  let url = request.url
  for (const [key, value] of Object.entries(request.pathParams)) {
    url = url.replace(`{${key}}`, encodeURIComponent(value))
  }
  const queryEntries = Object.entries(request.queryParams).filter(([, v]) => v !== '')
  if (queryEntries.length > 0) {
    url += '?' + queryEntries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')
  }

  const headers: Record<string, string> = { ...request.headers }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const start = performance.now()
  const res = await fetch(url, {
    method: request.method,
    headers,
    body: ['POST', 'PUT', 'PATCH'].includes(request.method) && request.body ? request.body : undefined,
  })
  const latency = Math.round(performance.now() - start)

  let data: unknown
  try {
    data = await res.json()
  } catch {
    data = await res.text()
  }

  const responseHeaders: Record<string, string> = {}
  res.headers.forEach((value, key) => { responseHeaders[key] = value })

  return { status: res.status, statusText: res.statusText, data, latency, headers: responseHeaders }
}

export function SandboxPage() {
  const { apiId } = useParams<{ apiId: string }>()
  const { session, user } = useAuthStore()
  const { entries: historyEntries, addEntry, clearHistory } = useRequestHistory()

  const api = getApiById(apiId ?? '')
  const endpoints = useMemo(() => api ? parseSpec(api.spec) : [], [api])

  const [selectedEndpoint, setSelectedEndpoint] = useState<ParsedEndpoint | null>(endpoints[0] ?? null)
  const [request, setRequest] = useState<RequestState | null>(
    endpoints[0] && api ? buildInitialRequest(endpoints[0], api.baseUrl) : null
  )
  const [response, setResponse] = useState<ApiCallResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [snippetLang, setSnippetLang] = useState<'curl' | 'fetch' | 'python'>('curl')
  const [showSnippets, setShowSnippets] = useState(false)
  const [activeTab, setActiveTab] = useState<'request' | 'history'>('request')
  const [newHeaderKey, setNewHeaderKey] = useState('')
  const [newHeaderVal, setNewHeaderVal] = useState('')

  const apiHistoryEntries = historyEntries.filter((e) => e.apiId === (apiId ?? ''))

  const handleSelectEndpoint = useCallback((ep: ParsedEndpoint) => {
    if (!api) return
    setSelectedEndpoint(ep)
    setRequest(buildInitialRequest(ep, api.baseUrl))
    setResponse(null)
    setError(null)
  }, [api])

  const handleRun = async () => {
    if (!request) return
    setLoading(true)
    setError(null)
    setResponse(null)
    try {
      const result = await executeRequest(request, session?.access_token)
      setResponse(result)
      // 1. Persist to Zustand local history (for replay)
      addEntry({
        apiId: apiId ?? '',
        method: request.method,
        url: request.url,
        pathParams: request.pathParams,
        queryParams: request.queryParams,
        headers: request.headers,
        body: request.body,
        responseStatus: result.status,
        responseLatency: result.latency,
      })
      // 2. Persist to Supabase request_history (for analytics)
      if (user) {
        void logRequestToSupabase({
          userId: user.id,
          apiId: apiId ?? '',
          method: request.method,
          url: request.url,
          pathParams: request.pathParams,
          queryParams: request.queryParams,
          headers: request.headers,
          body: request.body,
          responseStatus: result.status,
          responseLatency: result.latency,
        })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  const handleReplay = (entry: typeof historyEntries[0]) => {
    const ep = endpoints.find((e) => e.path === entry.url.replace(api?.baseUrl ?? '', '').split('?')[0])
    if (ep) setSelectedEndpoint(ep)
    setRequest({
      method: entry.method,
      url: entry.url,
      pathParams: entry.pathParams,
      queryParams: entry.queryParams,
      headers: entry.headers,
      body: entry.body ?? '',
    })
    setActiveTab('request')
    setResponse(null)
    setError(null)
  }

  const snippets = useMemo(() => {
    if (!request) return null
    return generateSnippets({ request, apiToken: session?.access_token })
  }, [request, session])

  if (!api) return <div className="p-8 text-red-400">API not found: {apiId}</div>

  return (
    <div className="flex h-full overflow-hidden">
      {/* Endpoint list sidebar */}
      <div className="w-56 flex-shrink-0 border-r border-white/6 overflow-y-auto bg-white/2 hidden sm:flex flex-col">
        <div className="p-3 border-b border-white/6 flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Endpoints</p>
          <span className="text-xs text-gray-600">{endpoints.length}</span>
        </div>
        {endpoints.map((ep) => (
          <button
            key={ep.operationId}
            onClick={() => handleSelectEndpoint(ep)}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2.5 text-left border-b border-white/4 transition-colors',
              selectedEndpoint?.operationId === ep.operationId
                ? 'bg-brand-900/30 border-l-2 border-l-brand-500 pl-[10px]'
                : 'hover:bg-white/4'
            )}
          >
            <Badge variant={ep.method} size="sm">{ep.method}</Badge>
            <span className="text-xs text-gray-300 truncate font-mono">{ep.path}</span>
          </button>
        ))}
      </div>

      {/* Main request/response area */}
      <div className="flex-1 overflow-y-auto">
        {/* Tab bar */}
        <div className="flex items-center gap-1 px-4 pt-3 pb-0 border-b border-white/6 mb-0">
          {(['request', 'history'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-xs font-medium capitalize border-b-2 transition-colors -mb-px',
                activeTab === tab
                  ? 'border-brand-500 text-brand-300'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              )}
            >
              {tab === 'history' ? <History size={12} /> : <Terminal size={12} />}
              {tab}
              {tab === 'history' && apiHistoryEntries.length > 0 && (
                <span className="bg-brand-800 text-brand-300 text-xs px-1 rounded">{apiHistoryEntries.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* History panel */}
        {activeTab === 'history' && (
          <div className="p-4 animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-300">Request History</p>
              {apiHistoryEntries.length > 0 && (
                <button onClick={clearHistory} className="text-xs text-gray-600 hover:text-red-400 flex items-center gap-1 transition-colors">
                  <Trash2 size={11} /> Clear
                </button>
              )}
            </div>
            {apiHistoryEntries.length === 0 ? (
              <div className="text-center py-12 text-gray-600">
                <History size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No requests yet. Run one from the Request tab.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {apiHistoryEntries.map((entry) => (
                  <div key={entry.id} className="card card-hover p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={entry.method as 'GET' | 'POST'} size="sm">{entry.method}</Badge>
                      <span className="text-xs font-mono text-gray-300 flex-1 truncate">{entry.url}</span>
                      {entry.responseStatus && (
                        <span className={cn('text-xs font-mono font-bold flex-shrink-0',
                          entry.responseStatus < 300 ? 'text-emerald-400' : 'text-red-400'
                        )}>{entry.responseStatus}</span>
                      )}
                      {entry.responseLatency && (
                        <span className="text-xs text-gray-600">{entry.responseLatency}ms</span>
                      )}
                      <button
                        onClick={() => handleReplay(entry)}
                        className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 transition-colors"
                      >
                        <RotateCcw size={11} /> Replay
                      </button>
                    </div>
                    <p className="text-xs text-gray-700">{new Date(entry.timestamp).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'request' && selectedEndpoint && request ? (
          <div className="p-4 space-y-4">
            {/* URL bar */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={selectedEndpoint.method} size="md">{selectedEndpoint.method}</Badge>
              <input
                value={request.url}
                onChange={(e) => setRequest((r) => r ? { ...r, url: e.target.value } : r)}
                className="flex-1 min-w-0 bg-white/4 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-gray-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <Button onClick={handleRun} loading={loading} className="gap-2 flex-shrink-0">
                <Play size={14} /> Run
              </Button>
            </div>

            <div className="grid lg:grid-cols-2 gap-4 pb-4">
              {/* Request config */}
              <div className="space-y-4">
                {/* Path params */}
                {Object.keys(request.pathParams).length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Path Parameters</h4>
                    <div className="space-y-2">
                      {Object.entries(request.pathParams).map(([key, val]) => (
                        <div key={key} className="flex items-center gap-2">
                          <span className="text-xs font-mono text-emerald-400 w-28 flex-shrink-0">{`{${key}}`}</span>
                          <input
                            value={val}
                            onChange={(e) => setRequest((r) => r ? {
                              ...r, pathParams: { ...r.pathParams, [key]: e.target.value }
                            } : r)}
                            placeholder={`Enter ${key}`}
                            className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Query params */}
                {Object.keys(request.queryParams).length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Query Parameters</h4>
                    <div className="space-y-2">
                      {Object.entries(request.queryParams).map(([key, val]) => (
                        <div key={key} className="flex items-center gap-2">
                          <span className="text-xs font-mono text-blue-400 w-28 flex-shrink-0">{key}</span>
                          <input
                            value={val}
                            onChange={(e) => setRequest((r) => r ? {
                              ...r, queryParams: { ...r.queryParams, [key]: e.target.value }
                            } : r)}
                            placeholder="optional"
                            className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Headers */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Headers</h4>
                  <div className="space-y-2">
                    {Object.entries(request.headers).map(([key, val]) => (
                      <div key={key} className="flex items-center gap-2">
                        <input
                          value={key}
                          readOnly
                          className="w-36 bg-gray-950 border border-gray-800 rounded px-2 py-1 text-xs font-mono text-gray-400"
                        />
                        <input
                          value={val}
                          onChange={(e) => setRequest((r) => r ? {
                            ...r, headers: { ...r.headers, [key]: e.target.value }
                          } : r)}
                          className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-gray-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                        <button
                          onClick={() => setRequest((r) => {
                            if (!r) return r
                            const h = { ...r.headers }
                            delete h[key]
                            return { ...r, headers: h }
                          })}
                          className="text-gray-600 hover:text-red-400"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center gap-2">
                      <input
                        placeholder="Header name"
                        value={newHeaderKey}
                        onChange={(e) => setNewHeaderKey(e.target.value)}
                        className="w-36 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                      <input
                        placeholder="Value"
                        value={newHeaderVal}
                        onChange={(e) => setNewHeaderVal(e.target.value)}
                        className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                      <button
                        onClick={() => {
                          if (newHeaderKey) {
                            setRequest((r) => r ? { ...r, headers: { ...r.headers, [newHeaderKey]: newHeaderVal } } : r)
                            setNewHeaderKey('')
                            setNewHeaderVal('')
                          }
                        }}
                        className="text-brand-400 hover:text-brand-300"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Request body */}
                {selectedEndpoint.requestBody && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Request Body</h4>
                    <div className="border border-gray-800 rounded-lg overflow-hidden">
                      <CodeMirror
                        value={request.body}
                        height="200px"
                        extensions={[json()]}
                        theme={oneDark}
                        onChange={(val) => setRequest((r) => r ? { ...r, body: val } : r)}
                        basicSetup={{ lineNumbers: false, foldGutter: false }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Response */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase">Response</h4>
                  {snippets && (
                    <button
                      onClick={() => setShowSnippets((s) => !s)}
                      className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1"
                    >
                      <Code size={12} /> {showSnippets ? 'Hide' : 'Show'} snippets
                    </button>
                  )}
                </div>

                {showSnippets && snippets && (
                  <div className="mb-3">
                    <div className="flex gap-1 mb-2">
                      {(['curl', 'fetch', 'python'] as const).map((lang) => (
                        <button
                          key={lang}
                          onClick={() => setSnippetLang(lang)}
                          className={cn('px-3 py-1 text-xs rounded font-mono transition-colors',
                            snippetLang === lang ? 'bg-brand-700 text-brand-100' : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                          )}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                    <CodeBlock code={snippets[snippetLang]} language={snippetLang} />
                  </div>
                )}

                {loading && (
                  <div className="flex items-center gap-2 text-gray-500 text-sm py-8 justify-center">
                    <div className="animate-spin w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full" />
                    Sending request…
                  </div>
                )}

                {error && (
                  <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                {response && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className={cn('text-sm font-mono font-bold',
                        response.status < 300 ? 'text-emerald-400' :
                        response.status < 400 ? 'text-amber-400' : 'text-red-400'
                      )}>
                        {response.status} {response.statusText}
                      </span>
                      <span className="text-xs text-gray-500">{response.latency}ms</span>
                    </div>
                    <div className="border border-gray-800 rounded-lg overflow-hidden">
                      <CodeMirror
                        value={JSON.stringify(response.data, null, 2)}
                        height="300px"
                        extensions={[json()]}
                        theme={oneDark}
                        editable={false}
                        basicSetup={{ lineNumbers: true, foldGutter: true }}
                      />
                    </div>
                  </div>
                )}

                {!loading && !error && !response && (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-600">
                    <Play size={32} className="mb-3 opacity-30" />
                    <p className="text-sm">Configure your request and click Run</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : activeTab === 'request' && (
          <div className="p-8 text-center text-gray-600">Select an endpoint from the list to get started</div>
        )}
      </div>
    </div>
  )
}
