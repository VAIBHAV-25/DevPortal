import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface HistoryEntry {
  id: string
  apiId: string
  method: string
  url: string
  pathParams: Record<string, string>
  queryParams: Record<string, string>
  headers: Record<string, string>
  body: string
  responseStatus?: number
  responseLatency?: number
  timestamp: string
}

interface RequestHistoryState {
  entries: HistoryEntry[]
  addEntry: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void
  clearHistory: () => void
}

export const useRequestHistory = create<RequestHistoryState>()(
  persist(
    (set) => ({
      entries: [],
      addEntry: (entry) =>
        set((state) => ({
          entries: [
            {
              ...entry,
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
            },
            ...state.entries.slice(0, 19), // keep last 20
          ],
        })),
      clearHistory: () => set({ entries: [] }),
    }),
    { name: 'devportal-request-history' }
  )
)
