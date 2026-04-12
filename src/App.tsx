import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { LoginPage } from '@/features/auth/LoginPage'
import { SignupPage } from '@/features/auth/SignupPage'
import { DocsPage } from '@/features/docs/DocsPage'
import { SandboxPage } from '@/features/sandbox/SandboxPage'
import { KeysPage } from '@/features/keys/KeysPage'
import { AnalyticsPage } from '@/features/analytics/AnalyticsPage'
import { StatusPage } from '@/features/status/StatusPage'
import { ChangelogPage } from '@/features/changelog/ChangelogPage'
import { useAuthStore } from '@/features/auth/useAuthStore'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { API_REGISTRY } from '@/apis/api-registry'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1 },
  },
})

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { setSession, initializeDemoMode } = useAuthStore()

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      initializeDemoMode()
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // Listen for auth changes (silent token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [setSession, initializeDemoMode])

  return <>{children}</>
}

const defaultApi = API_REGISTRY[0]?.id ?? 'pokeapi'

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthInitializer>
          <Routes>
            {/* Public auth routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Protected app routes */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      {/* Root redirect to first API docs */}
                      <Route index element={<Navigate to={`/apis/${defaultApi}/docs`} replace />} />

                      {/* API-scoped routes */}
                      <Route path="apis/:apiId/docs" element={<DocsPage />} />
                      <Route path="apis/:apiId/sandbox" element={<SandboxPage />} />
                      <Route path="apis/:apiId/keys" element={<KeysPage />} />
                      <Route path="apis/:apiId/analytics" element={<AnalyticsPage />} />
                      <Route path="apis/:apiId/status" element={<StatusPage />} />
                      <Route path="apis/:apiId/changelog" element={<ChangelogPage />} />

                      {/* Fallback */}
                      <Route path="*" element={<Navigate to={`/apis/${defaultApi}/docs`} replace />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthInitializer>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
