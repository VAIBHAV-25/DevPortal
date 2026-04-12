import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Eye, EyeOff, Copy, Check, Trash2, AlertTriangle, Key } from 'lucide-react'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Badge } from '@/components/Badge'
import { useApiKeys, useCreateApiKey, useRevokeApiKey } from './useApiKeys'
import { cn } from '@/lib/cn'

export function KeysPage() {
  const { apiId } = useParams<{ apiId: string }>()
  const { data: keys = [], isLoading, isError } = useApiKeys()
  const createMutation = useCreateApiKey()
  const revokeMutation = useRevokeApiKey()

  const [showCreate, setShowCreate] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyEnv, setNewKeyEnv] = useState<'sandbox' | 'production'>('sandbox')
  const [newKeyExpiry, setNewKeyExpiry] = useState('')
  const [justCreated, setJustCreated] = useState<{ key: string; name: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set())
  const [revokeConfirm, setRevokeConfirm] = useState<string | null>(null)
  const [nameError, setNameError] = useState('')

  const handleCreate = async () => {
    if (!newKeyName.trim()) { setNameError('Key name is required'); return }
    setNameError('')
    try {
      const created = await createMutation.mutateAsync({
        name: newKeyName.trim(),
        environment: newKeyEnv,
        expiresAt: newKeyExpiry || undefined,
      })
      setJustCreated({ key: created.key, name: created.name })
      setShowCreate(false)
      setNewKeyName('')
      setNewKeyEnv('sandbox')
      setNewKeyExpiry('')
    } catch {
      setNameError('Failed to create key. Please try again.')
    }
  }

  const handleCopy = async (key: string) => {
    await navigator.clipboard.writeText(key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRevoke = async (id: string) => {
    await revokeMutation.mutateAsync(id)
    setRevokeConfirm(null)
  }

  if (isLoading) return (
    <div className="max-w-4xl mx-auto px-4 py-6 animate-pulse space-y-4">
      <div className="skeleton h-8 w-48 rounded-lg" />
      <div className="skeleton h-24 rounded-xl" />
      <div className="skeleton h-24 rounded-xl" />
    </div>
  )

  if (isError) return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="card p-10 text-center">
        <p className="text-red-400 text-sm">Failed to load API keys.</p>
        <Button variant="ghost" className="mt-3" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Key size={22} className="text-brand-400" />
            API Keys
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage keys for <span className="text-gray-300 font-medium">{apiId}</span></p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2 flex-shrink-0">
          <Plus size={15} /> Create Key
        </Button>
      </div>

      {/* Newly created key banner */}
      {justCreated && (
        <div className="mb-6 p-4 rounded-xl bg-amber-950/30 border border-amber-600/30 animate-slide-up">
          <div className="flex items-start gap-3 mb-3">
            <AlertTriangle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-300 font-semibold text-sm">Save your key — it won't be shown again</p>
              <p className="text-amber-600 text-xs mt-0.5">Copy it now. Once you close this, it cannot be recovered.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-gray-950 rounded-lg border border-white/8 px-3 py-2.5">
            <code className="flex-1 text-sm font-mono text-white break-all">{justCreated.key}</code>
            <button onClick={() => handleCopy(justCreated.key)} className="text-gray-400 hover:text-white flex-shrink-0 transition-colors">
              {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
            </button>
          </div>
          <button onClick={() => setJustCreated(null)} className="mt-3 text-xs text-amber-700 hover:text-amber-500 transition-colors">
            I've saved the key →
          </button>
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="mb-6 p-5 rounded-xl border border-white/10 bg-white/3 animate-slide-up">
          <h3 className="text-sm font-semibold text-gray-200 mb-4">New API Key</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Key Name"
              placeholder="e.g. My App Production"
              value={newKeyName}
              onChange={(e) => { setNewKeyName(e.target.value); setNameError('') }}
              error={nameError}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-300">Environment</label>
              <div className="flex gap-2">
                {(['sandbox', 'production'] as const).map((env) => (
                  <button
                    key={env}
                    onClick={() => setNewKeyEnv(env)}
                    className={cn('flex-1 py-2 rounded-lg border text-sm capitalize transition-all',
                      newKeyEnv === env
                        ? 'border-brand-500 bg-brand-900/30 text-brand-300 glow-sm'
                        : 'border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/20'
                    )}
                  >
                    {env}
                  </button>
                ))}
              </div>
            </div>
            <Input
              label="Expiry (optional)"
              type="date"
              value={newKeyExpiry}
              onChange={(e) => setNewKeyExpiry(e.target.value)}
              hint="Leave blank for no expiry"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleCreate} loading={createMutation.isPending}>Create Key</Button>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Keys list */}
      <div className="space-y-3">
        {keys.length === 0 && (
          <div className="card p-12 text-center">
            <Key size={36} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm mb-3">No API keys yet</p>
            <Button onClick={() => setShowCreate(true)} variant="ghost" size="sm" className="gap-1.5">
              <Plus size={14} /> Create your first key
            </Button>
          </div>
        )}
        {keys.map((key) => (
          <div
            key={key.id}
            className={cn(
              'border rounded-xl p-4 transition-all duration-200 card-hover',
              key.revoked
                ? 'border-white/4 bg-white/1 opacity-50'
                : 'border-white/8 bg-white/3'
            )}
          >
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-gray-200 text-sm">{key.name}</span>
                <Badge variant={key.environment} size="sm">{key.environment}</Badge>
                {key.revoked && <span className="text-xs text-red-400 font-bold">REVOKED</span>}
              </div>
              {!key.revoked && (
                revokeConfirm === key.id ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-red-400">Revoke this key?</span>
                    <Button size="sm" variant="danger" loading={revokeMutation.isPending} onClick={() => handleRevoke(key.id)}>Revoke</Button>
                    <Button size="sm" variant="ghost" onClick={() => setRevokeConfirm(null)}>Cancel</Button>
                  </div>
                ) : (
                  <button
                    onClick={() => setRevokeConfirm(key.id)}
                    className="text-gray-700 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                )
              )}
            </div>
            <div className="flex items-center gap-2 bg-gray-950 rounded-lg border border-white/6 px-3 py-2">
              <code className="flex-1 text-xs font-mono text-gray-400 break-all">
                {revealedIds.has(key.id) ? key.key : key.maskedKey}
              </code>
              <button
                onClick={() => setRevealedIds((s) => { const n = new Set(s); n.has(key.id) ? n.delete(key.id) : n.add(key.id); return n })}
                className="text-gray-600 hover:text-gray-300 transition-colors flex-shrink-0"
              >
                {revealedIds.has(key.id) ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
              <button onClick={() => handleCopy(key.key)} className="text-gray-600 hover:text-gray-300 transition-colors flex-shrink-0">
                <Copy size={13} />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-700">
              <span>Created {key.createdAt}</span>
              {key.expiresAt && <span>Expires {key.expiresAt}</span>}
              {key.lastUsedAt && <span>Last used {key.lastUsedAt}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
