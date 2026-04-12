import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuthStore } from '@/features/auth/useAuthStore'
import type { ApiKey } from '@/types'

// --- Local fallback store for demo/offline mode ---
let localKeys: ApiKey[] = [
  {
    id: '1',
    name: 'Development Key',
    key: 'pk_test_abcde12345xyz',
    maskedKey: 'pk_test_abc••••••••••••xyz',
    environment: 'sandbox',
    createdAt: '2024-01-15',
    lastUsedAt: '2024-03-10',
    revoked: false,
  },
]

function generateKey(env: string): string {
  const prefix = env === 'production' ? 'pk_live_' : 'pk_test_'
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let key = prefix
  for (let i = 0; i < 32; i++) key += chars.charAt(Math.floor(Math.random() * chars.length))
  return key
}

function maskKey(key: string): string {
  return key.slice(0, 12) + '••••••••••••••••••••' + key.slice(-4)
}

// --- Supabase helpers ---
async function fetchKeysFromSupabase(userId: string): Promise<ApiKey[]> {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    key: row.key_value,
    maskedKey: row.masked_key,
    environment: row.environment as 'sandbox' | 'production',
    createdAt: row.created_at.slice(0, 10),
    expiresAt: row.expires_at?.slice(0, 10),
    lastUsedAt: row.last_used_at?.slice(0, 10),
    revoked: row.revoked,
  }))
}

async function createKeyInSupabase(
  userId: string,
  name: string,
  environment: 'sandbox' | 'production',
  expiresAt?: string
): Promise<ApiKey> {
  if (!supabase) throw new Error('Supabase not configured')
  const fullKey = generateKey(environment)
  const masked = maskKey(fullKey)
  const { data, error } = await supabase
    .from('api_keys')
    .insert({
      user_id: userId,
      name,
      key_value: fullKey,
      masked_key: masked,
      environment,
      expires_at: expiresAt || null,
    })
    .select()
    .single()
  if (error) throw error
  return {
    id: data.id,
    name: data.name,
    key: data.key_value,
    maskedKey: data.masked_key,
    environment: data.environment,
    createdAt: data.created_at.slice(0, 10),
    expiresAt: data.expires_at?.slice(0, 10),
    revoked: false,
  }
}

async function revokeKeyInSupabase(keyId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')
  const { error } = await supabase
    .from('api_keys')
    .update({ revoked: true })
    .eq('id', keyId)
  if (error) throw error
}

// --- React Query hooks ---
export function useApiKeys() {
  const { user } = useAuthStore()
  return useQuery<ApiKey[]>({
    queryKey: ['api_keys', user?.id],
    queryFn: async () => {
      if (!isSupabaseConfigured || !user || user.id === 'demo-user-id') {
        return localKeys
      }
      return fetchKeysFromSupabase(user.id)
    },
    enabled: !!user,
    staleTime: 1000 * 30,
  })
}

export function useCreateApiKey() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  return useMutation({
    mutationFn: async ({
      name,
      environment,
      expiresAt,
    }: {
      name: string
      environment: 'sandbox' | 'production'
      expiresAt?: string
    }): Promise<ApiKey> => {
      if (!isSupabaseConfigured || !user || user.id === 'demo-user-id') {
        const fullKey = generateKey(environment)
        const newKey: ApiKey = {
          id: Date.now().toString(),
          name,
          key: fullKey,
          maskedKey: maskKey(fullKey),
          environment,
          createdAt: new Date().toISOString().slice(0, 10),
          expiresAt: expiresAt || undefined,
          revoked: false,
        }
        localKeys = [...localKeys, newKey]
        return newKey
      }
      return createKeyInSupabase(user.id, name, environment, expiresAt)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['api_keys', user?.id] })
    },
  })
}

export function useRevokeApiKey() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  return useMutation({
    mutationFn: async (keyId: string) => {
      if (!isSupabaseConfigured || !user || user.id === 'demo-user-id') {
        localKeys = localKeys.map((k) => k.id === keyId ? { ...k, revoked: true } : k)
        return
      }
      return revokeKeyInSupabase(keyId)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['api_keys', user?.id] })
    },
  })
}
