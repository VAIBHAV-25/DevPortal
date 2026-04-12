import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, FileText, Terminal } from 'lucide-react'
import { API_REGISTRY } from '@/apis/api-registry'
import { parseSpec } from '@/lib/spec-parser'
import { Badge } from '@/components/Badge'
import type { ParsedEndpoint } from '@/types'

interface SearchResult {
  apiId: string
  apiName: string
  endpoint: ParsedEndpoint
}

interface SearchModalProps {
  open: boolean
  onClose: () => void
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  // Parse all endpoints from registry
  const allEndpoints = useMemo<SearchResult[]>(() => {
    return API_REGISTRY.flatMap((api) =>
      parseSpec(api.spec).map((ep) => ({
        apiId: api.id,
        apiName: api.name,
        endpoint: ep,
      }))
    )
  }, [])

  const results = useMemo(() => {
    if (!query.trim()) return allEndpoints.slice(0, 8)
    const q = query.toLowerCase()
    return allEndpoints
      .filter(
        (r) =>
          r.endpoint.path.toLowerCase().includes(q) ||
          r.endpoint.summary.toLowerCase().includes(q) ||
          r.endpoint.method.toLowerCase().includes(q) ||
          r.apiName.toLowerCase().includes(q)
      )
      .slice(0, 10)
  }, [query, allEndpoints])

  // Reset query when modal opens — done via key on the input, not setState in effect
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  const handleSelect = (result: SearchResult) => {
    navigate(`/apis/${result.apiId}/docs`)
    onClose()
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />

      {/* Modal */}
      <div className="relative w-full max-w-xl animate-scale-in">
        <div className="glass rounded-2xl overflow-hidden shadow-2xl border border-white/10">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/8">
            <Search size={16} className="text-gray-400 flex-shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search endpoints, APIs…"
              className="flex-1 bg-transparent text-gray-100 placeholder-gray-500 focus:outline-none text-sm"
            />
            <kbd className="text-xs text-gray-600 bg-white/5 px-2 py-0.5 rounded border border-white/10">ESC</kbd>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto">
            {results.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-600">No endpoints found</p>
            ) : (
              <div className="p-2">
                {results.map((result, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelect(result)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left group"
                  >
                    <Terminal size={14} className="text-gray-600 group-hover:text-brand-400 transition-colors flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant={result.endpoint.method} size="sm">{result.endpoint.method}</Badge>
                        <span className="text-sm font-mono text-gray-300 truncate">{result.endpoint.path}</span>
                      </div>
                      {result.endpoint.summary && (
                        <p className="text-xs text-gray-600 mt-0.5 truncate">{result.endpoint.summary}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <FileText size={12} className="text-gray-700" />
                      <span className="text-xs text-gray-600">{result.apiName}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-4 px-4 py-2 border-t border-white/5 text-xs text-gray-700">
            <span><kbd className="bg-white/5 px-1.5 py-0.5 rounded">↑↓</kbd> navigate</span>
            <span><kbd className="bg-white/5 px-1.5 py-0.5 rounded">↵</kbd> select</span>
            <span><kbd className="bg-white/5 px-1.5 py-0.5 rounded">esc</kbd> close</span>
          </div>
        </div>
      </div>
    </div>
  )
}
