import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ChevronDown, ChevronRight, ExternalLink, Search } from 'lucide-react'
import { getApiById } from '@/apis/api-registry'
import { parseSpec, endpointsByTag } from '@/lib/spec-parser'
import { Badge } from '@/components/Badge'
import type { ParsedEndpoint } from '@/types'
import { cn } from '@/lib/cn'

function SchemaViewer({ schema, depth = 0 }: { schema?: Record<string, unknown>; depth?: number }) {
  if (!schema) return <span className="text-gray-500 text-xs italic">No schema</span>

  if (schema.type === 'array' && schema.items) {
    return (
      <div>
        <span className="text-blue-400 text-xs font-mono">array of:</span>
        <div className="ml-4 mt-1">
          <SchemaViewer schema={schema.items as Record<string, unknown>} depth={depth + 1} />
        </div>
      </div>
    )
  }

  if (schema.type === 'object' && schema.properties) {
    const props = schema.properties as Record<string, Record<string, unknown>>
    const required = (schema.required as string[]) ?? []
    return (
      <div className="space-y-1">
        {Object.entries(props).map(([name, prop]) => (
          <div key={name} className="flex items-start gap-2 text-xs font-mono">
            <span className="text-emerald-400 min-w-0 break-all">{name}</span>
            {required.includes(name) && <span className="text-red-400 text-xs">*</span>}
            <span className="text-gray-500">{String(prop.type ?? 'any')}</span>
            {prop.description && (
              <span className="text-gray-600 font-sans font-normal normal-case">{String(prop.description)}</span>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="text-xs font-mono">
      <span className="text-blue-400">{String(schema.type ?? 'any')}</span>
      {schema.description && <span className="text-gray-500 ml-2 font-sans">{String(schema.description)}</span>}
    </div>
  )
}

function EndpointCard({ endpoint, isExpanded, onToggle }: { endpoint: ParsedEndpoint; isExpanded: boolean; onToggle: () => void }) {
  return (
    <div className="border border-gray-800 rounded-xl overflow-hidden mb-3">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 bg-gray-900 hover:bg-gray-800/80 transition-colors text-left"
      >
        <Badge variant={endpoint.method}>{endpoint.method}</Badge>
        <code className="text-sm text-gray-200 font-mono flex-1">{endpoint.path}</code>
        <span className="text-sm text-gray-500 hidden sm:block truncate max-w-xs">{endpoint.summary}</span>
        {isExpanded ? <ChevronDown size={16} className="text-gray-500 flex-shrink-0" /> : <ChevronRight size={16} className="text-gray-500 flex-shrink-0" />}
      </button>

      {isExpanded && (
        <div className="p-4 border-t border-gray-800 bg-gray-950 space-y-5">
          {endpoint.description && (
            <p className="text-sm text-gray-400">{endpoint.description}</p>
          )}

          {/* Parameters */}
          {endpoint.parameters.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Parameters</h4>
              <div className="border border-gray-800 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 bg-gray-900">
                      <th className="text-left px-3 py-2 text-xs text-gray-500 font-medium">Name</th>
                      <th className="text-left px-3 py-2 text-xs text-gray-500 font-medium">In</th>
                      <th className="text-left px-3 py-2 text-xs text-gray-500 font-medium">Type</th>
                      <th className="text-left px-3 py-2 text-xs text-gray-500 font-medium">Required</th>
                      <th className="text-left px-3 py-2 text-xs text-gray-500 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {endpoint.parameters.map((p, i) => (
                      <tr key={i} className="border-b border-gray-800/50 last:border-0">
                        <td className="px-3 py-2 font-mono text-emerald-400 text-xs">{p.name}</td>
                        <td className="px-3 py-2 text-xs text-gray-500">{p.in}</td>
                        <td className="px-3 py-2 font-mono text-xs text-blue-400">{p.type}</td>
                        <td className="px-3 py-2">
                          {p.required
                            ? <span className="text-red-400 text-xs font-semibold">Yes</span>
                            : <span className="text-gray-600 text-xs">No</span>}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-400">{p.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Request Body */}
          {endpoint.requestBody && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Request Body{endpoint.requestBody.required && <span className="text-red-400 ml-1">*</span>}
              </h4>
              <div className="bg-gray-900 rounded-lg p-3 border border-gray-800">
                <p className="text-xs text-gray-500 mb-2 font-mono">{endpoint.requestBody.contentType}</p>
                <SchemaViewer schema={endpoint.requestBody.schema} />
              </div>
            </div>
          )}

          {/* Responses */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Responses</h4>
            <div className="space-y-2">
              {endpoint.responses.map((res, i) => (
                <div key={i} className="border border-gray-800 rounded-lg overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-900">
                    <span className={cn('text-xs font-mono font-bold',
                      res.statusCode.startsWith('2') ? 'text-emerald-400' :
                      res.statusCode.startsWith('4') ? 'text-red-400' : 'text-gray-300'
                    )}>
                      {res.statusCode}
                    </span>
                    <span className="text-xs text-gray-400">{res.description}</span>
                  </div>
                  {res.schema && (
                    <div className="p-3 bg-gray-950">
                      <SchemaViewer schema={res.schema} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function DocsPage() {
  const { apiId } = useParams<{ apiId: string }>()
  const [search, setSearch] = useState('')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<'endpoints' | 'getting-started' | 'sdks' | 'errors'>('getting-started')

  const api = getApiById(apiId ?? '')
  if (!api) return <div className="p-8 text-red-400">API not found: {apiId}</div>

  const endpoints = useMemo(() => parseSpec(api.spec), [api.spec])
  const grouped = useMemo(() => endpointsByTag(endpoints), [endpoints])

  const filteredGrouped = useMemo(() => {
    if (!search.trim()) return grouped
    const q = search.toLowerCase()
    const result: Record<string, ParsedEndpoint[]> = {}
    for (const [tag, eps] of Object.entries(grouped)) {
      const filtered = eps.filter(
        (e) =>
          e.path.toLowerCase().includes(q) ||
          e.summary.toLowerCase().includes(q) ||
          e.method.toLowerCase().includes(q)
      )
      if (filtered.length > 0) result[tag] = filtered
    }
    return result
  }, [grouped, search])

  const toggleEndpoint = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const MOCK_GETTING_STARTED = `# Getting Started with ${api.name}

## Overview

${api.description}

## Base URL

\`\`\`
${api.baseUrl}
\`\`\`

## Quick Start

\`\`\`bash
curl ${api.baseUrl}
\`\`\`

## Authentication

Check the Sandbox tab to test live requests with auto-injected authentication.
`

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: `${api.color}22`, border: `1px solid ${api.color}44` }}>
          {api.icon}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{api.name}</h1>
          <p className="text-gray-400 text-sm mt-0.5">{api.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded font-mono">v{api.version}</span>
            <a href={api.baseUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
              {api.baseUrl} <ExternalLink size={10} />
            </a>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-800 mb-6">
        {(['getting-started', 'endpoints', 'sdks', 'errors'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors',
              activeTab === tab
                ? 'border-brand-400 text-brand-300'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            )}
          >
            {tab.replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Getting Started */}
      {activeTab === 'getting-started' && (
        <div className="prose prose-invert prose-sm max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{MOCK_GETTING_STARTED}</ReactMarkdown>
        </div>
      )}

      {/* Endpoints */}
      {activeTab === 'endpoints' && (
        <div>
          <div className="relative mb-4">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              placeholder="Search endpoints…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          {Object.entries(filteredGrouped).map(([tag, eps]) => (
            <div key={tag} className="mb-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-3 capitalize flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-400 inline-block" />
                {tag}
                <span className="text-gray-600 text-xs font-normal">({eps.length})</span>
              </h3>
              {eps.map((ep) => (
                <EndpointCard
                  key={ep.operationId}
                  endpoint={ep}
                  isExpanded={expandedIds.has(ep.operationId)}
                  onToggle={() => toggleEndpoint(ep.operationId)}
                />
              ))}
            </div>
          ))}
          {Object.keys(filteredGrouped).length === 0 && (
            <div className="text-center py-12 text-gray-600">No endpoints match your search</div>
          )}
        </div>
      )}

      {/* SDKs */}
      {activeTab === 'sdks' && (
        <div>
          <p className="text-gray-400 text-sm mb-4">Official and community SDKs for {api.name}.</p>
          {api.sdks && api.sdks.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {api.sdks.map((sdk) => (
                <a
                  key={sdk.language}
                  href={sdk.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 border border-gray-800 rounded-xl bg-gray-900 hover:border-brand-700 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-200">{sdk.language}</p>
                    <p className="text-xs font-mono text-gray-500 mt-0.5">{sdk.package}</p>
                  </div>
                  <ExternalLink size={14} className="text-gray-600" />
                </a>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-600">No SDK links configured for this API</div>
          )}
        </div>
      )}

      {/* Errors */}
      {activeTab === 'errors' && (
        <div className="space-y-3">
          <p className="text-gray-400 text-sm mb-4">Common error codes returned by {api.name}.</p>
          {[
            { code: '400', name: 'Bad Request', desc: 'The request is malformed or missing required parameters.' },
            { code: '401', name: 'Unauthorized', desc: 'Authentication is required or the token is invalid.' },
            { code: '403', name: 'Forbidden', desc: 'You do not have permission to access this resource.' },
            { code: '404', name: 'Not Found', desc: 'The requested resource does not exist.' },
            { code: '429', name: 'Too Many Requests', desc: 'You have exceeded the rate limit. Please wait before retrying.' },
            { code: '500', name: 'Internal Server Error', desc: 'An unexpected error occurred on the server.' },
          ].map(({ code, name, desc }) => (
            <div key={code} className="flex gap-4 p-4 border border-gray-800 rounded-xl bg-gray-900">
              <span className={cn('text-sm font-mono font-bold min-w-[3rem]',
                code.startsWith('4') ? 'text-red-400' : code.startsWith('5') ? 'text-orange-400' : 'text-emerald-400'
              )}>
                {code}
              </span>
              <div>
                <p className="text-sm font-medium text-gray-200">{name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
