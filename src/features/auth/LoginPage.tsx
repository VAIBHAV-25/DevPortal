import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Eye, EyeOff, ArrowRight, Zap, Shield, Code2, BarChart3, User } from 'lucide-react'
import { Input } from '@/components/Input'
import { Button } from '@/components/Button'
import { useAuthStore } from './useAuthStore'
import { DEMO_CREDENTIALS } from './useAuthStore'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

const FEATURES = [
  { icon: Code2, label: 'Live API Sandbox', desc: 'Test endpoints with real HTTP requests' },
  { icon: BarChart3, label: 'Analytics Dashboard', desc: 'Monitor call volume, errors, latency' },
  { icon: Shield, label: 'API Key Management', desc: 'Create & revoke keys securely' },
  { icon: Zap, label: 'Auto-generated Docs', desc: 'Powered by your OpenAPI spec' },
]

export function LoginPage() {
  const [form, setForm] = useState<LoginForm>({ email: '', password: '' })
  const [errors, setErrors] = useState<Partial<LoginForm>>({})
  const [showPw, setShowPw] = useState(false)
  const { signIn, loading, error, clearError } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    const result = loginSchema.safeParse(form)
    if (!result.success) {
      const fieldErrors: Partial<LoginForm> = {}
      result.error.issues.forEach((err) => {
        const field = err.path[0] as keyof LoginForm
        fieldErrors[field] = err.message
      })
      setErrors(fieldErrors)
      return
    }
    setErrors({})
    try {
      await signIn(form.email, form.password)
      navigate('/')
    } catch {
      // error handled in store
    }
  }

  const fillDemo = () => {
    setForm({ email: DEMO_CREDENTIALS.email, password: DEMO_CREDENTIALS.password })
    setErrors({})
    clearError()
  }

  return (
    <div className="min-h-screen flex overflow-hidden" style={{ background: '#07070f' }}>
      {/* Left panel — features */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-14 relative overflow-hidden">
        {/* Radial gradient background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full opacity-20"
               style={{ background: 'radial-gradient(circle, #4f46e5 0%, transparent 70%)', transform: 'translate(-30%, -30%)' }} />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full opacity-15"
               style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)', transform: 'translate(30%, 30%)' }} />
          {/* Grid lines */}
          <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center glow-brand">
            <span className="text-white font-bold text-sm">DP</span>
          </div>
          <span className="text-white font-semibold text-lg">DevPortal</span>
        </div>

        {/* Hero text */}
        <div className="relative z-10">
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Build faster with<br />
            <span className="text-gradient">powerful APIs</span>
          </h2>
          <p className="text-gray-400 text-base mb-10">
            Explore, test, and manage your APIs in one<br />extensible developer dashboard.
          </p>
          <div className="space-y-4">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-3 group">
                <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-900/40 group-hover:border-brand-700/40 transition-all duration-200">
                  <Icon size={16} className="text-brand-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-200">{label}</p>
                  <p className="text-xs text-gray-600">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom quote */}
        <div className="relative z-10">
          <p className="text-xs text-gray-700">Trusted by engineers building production APIs</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative">
        <div className="absolute inset-0 pointer-events-none lg:hidden">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full opacity-15"
               style={{ background: 'radial-gradient(circle, #4f46e5 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
        </div>

        <div className="w-full max-w-sm relative z-10 animate-slide-up">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center">
              <span className="text-white font-bold text-sm">DP</span>
            </div>
            <span className="text-white font-semibold">DevPortal</span>
          </div>

          <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
          <p className="text-gray-500 text-sm mb-7">Sign in to your developer account</p>

          {/* Demo account card */}
          <button
            type="button"
            onClick={fillDemo}
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-brand-700/30 bg-brand-900/20 hover:bg-brand-900/30 transition-all duration-150 text-left group mb-2"
          >
            <div className="w-8 h-8 rounded-lg bg-brand-800/50 flex items-center justify-center flex-shrink-0">
              <User size={14} className="text-brand-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-brand-300">Try demo account</p>
              <p className="text-xs text-gray-600 font-mono">{DEMO_CREDENTIALS.email} · demo123</p>
            </div>
            <ArrowRight size={13} className="text-brand-500 group-hover:text-brand-300 transition-colors flex-shrink-0" />
          </button>

          {/* Divider */}
          <div className="flex items-center gap-2 mb-0">
            <div className="flex-1 h-px bg-white/6" />
            <span className="text-xs text-gray-700">or sign in with your account</span>
            <div className="flex-1 h-px bg-white/6" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-900/20 border border-red-700/30 text-red-300 text-sm animate-slide-up">
                {error}
              </div>
            )}

            <Input
              label="Email"
              type="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              error={errors.email}
              autoComplete="email"
            />

            {/* Password with toggle */}
            <div className="relative">
              <Input
                label="Password"
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                error={errors.password}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute right-3 top-[34px] text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            <Button type="submit" loading={loading} className="w-full gap-2 mt-2" size="lg">
              Sign in <ArrowRight size={15} />
            </Button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
