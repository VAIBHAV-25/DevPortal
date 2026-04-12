import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { API_REGISTRY } from '@/apis/api-registry'
import { Badge } from '@/components/Badge'
import type { ChangelogEntry } from '@/types'
import { cn } from '@/lib/cn'

const TYPE_LABELS: Record<ChangelogEntry['type'], string> = {
  breaking: 'Breaking',
  feature: 'Feature',
  fix: 'Fix',
}

export function ChangelogPage() {
  const { apiId } = useParams<{ apiId: string }>()
  const [filterApi, setFilterApi] = useState<string>(apiId ?? 'all')
  const [filterType, setFilterType] = useState<ChangelogEntry['type'] | 'all'>('all')

  const allEntries = useMemo(() => {
    const apisToShow = filterApi === 'all' ? API_REGISTRY : API_REGISTRY.filter((a) => a.id === filterApi)
    return apisToShow.flatMap((api) =>
      (api.changelog ?? []).map((entry) => ({ ...entry, apiName: api.name, apiId: api.id }))
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [filterApi])

  const filteredEntries = useMemo(() =>
    filterType === 'all' ? allEntries : allEntries.filter((e) => e.type === filterType),
    [allEntries, filterType]
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-white mb-2">Changelog</h1>
      <p className="text-gray-400 text-sm mb-6">Track API changes, new features, and breaking updates.</p>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setFilterApi('all')}
            className={cn('px-3 py-1 text-sm rounded transition-colors',
              filterApi === 'all' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'
            )}
          >
            All APIs
          </button>
          {API_REGISTRY.map((api) => (
            <button
              key={api.id}
              onClick={() => setFilterApi(api.id)}
              className={cn('px-3 py-1 text-sm rounded transition-colors',
                filterApi === api.id ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'
              )}
            >
              {api.name}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
          {(['all', 'breaking', 'feature', 'fix'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={cn('px-3 py-1 text-sm rounded transition-colors capitalize',
                filterType === type ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'
              )}
            >
              {type === 'all' ? 'All Types' : TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      {/* Changelog entries */}
      <div className="relative">
        {/* vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-800" />

        <div className="space-y-6 pl-12">
          {filteredEntries.length === 0 && (
            <div className="text-center py-12 text-gray-600">No changelog entries match your filters</div>
          )}
          {filteredEntries.map((entry, i) => (
            <div key={`${entry.apiId}-${entry.version}-${i}`} className="relative">
              {/* dot */}
              <div className={cn('absolute -left-10 top-1 w-4 h-4 rounded-full border-2 border-gray-950',
                entry.type === 'breaking' ? 'bg-red-500' :
                entry.type === 'feature' ? 'bg-emerald-500' : 'bg-blue-500'
              )} />

              <div className="border border-gray-800 rounded-xl p-4 bg-gray-900">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge variant={entry.type}>{TYPE_LABELS[entry.type]}</Badge>
                  <span className="text-xs font-mono text-gray-500">v{entry.version}</span>
                  <span className="text-xs text-gray-600">{new Date(entry.date).toLocaleDateString('en', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  {filterApi === 'all' && (
                    <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full ml-auto">
                      {(entry as { apiName: string }).apiName}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-gray-200 mb-1">{entry.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{entry.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
