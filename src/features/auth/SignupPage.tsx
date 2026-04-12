import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Eye, EyeOff, ArrowRight, CheckCircle, Sparkles, Mail } from 'lucide-react'
import { Input } from '@/components/Input'
import { Button } from '@/components/Button'
import { useAuthStore } from './useAuthStore'

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Must be at least 8 characters'),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: "Passwords don't match",
  path: ['confirm'],
})

type SignupForm = z.infer<typeof signupSchema>
type SignupErrors = Partial<Record<keyof SignupForm, string>>

const PERKS = [
  'No credit card required',
  'Real requests to live APIs',
  'Persistent API key management',
  'Full analytics dashboard',
]

export function SignupPage() {
  const [form, setForm] = useState<SignupForm>({ email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState<SignupErrors>({})
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const { signUp, loading, error, clearError, isDemo } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    const result = signupSchema.safeParse(form)
    if (!result.success) {
      const fe: SignupErrors = {}
      result.error.issues.forEach((err) => { fe[err.path[0] as keyof SignupForm] = err.message })
      setErrors(fe)
      return
    }
    setErrors({})
    try {
      await signUp(form.email, form.password)
      if (isDemo) {
        navigate('/')
      } else {
        setEmailSent(true)
      }
    } catch {
      // error handled in store
    }
  }

  // Email sent confirmation screen
  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#07070f' }}>
        <div className="text-center max-w-sm animate-scale-in">
          <div className="w-20 h-20 rounded-full bg-brand-900/30 border border-brand-700/40 flex items-center justify-center mx-auto mb-6 glow-brand">
            <Mail size={32} className="text-brand-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Check your email</h2>
          <p className="text-gray-500 text-sm mb-2">
            We sent a confirmation link to
          </p>
          <p className="text-brand-300 font-medium text-sm mb-6">{form.email}</p>
          <p className="text-gray-600 text-xs mb-8">
            Click the link to activate your account. If it doesn't show up, check your spam folder.<br/>
            <span className="text-amber-400/70">Note: Supabase free plan may rate-limit emails. Try disabling email confirmation in Supabase Auth settings for development.</span>
          </p>
          <Link to="/login" className="text-brand-400 hover:text-brand-300 text-sm font-medium transition-colors">
            ← Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex overflow-hidden" style={{ background: '#07070f' }}>
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-14 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 w-[500px] h-[500px] rounded-full opacity-20"
               style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)', transform: 'translate(-50%, -50%)' }} />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full opacity-15"
               style={{ background: 'radial-gradient(circle, #4f46e5 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />
          <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center glow-brand">
            <span className="text-white font-bold text-sm">DP</span>
          </div>
          <span className="text-white font-semibold text-lg">DevPortal</span>
        </div>

        {/* Hero */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-900/40 border border-brand-700/40 text-brand-300 text-xs font-medium mb-6">
            <Sparkles size={12} /> Free to get started
          </div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Your API workspace,<br />
            <span className="text-gradient">ready in minutes</span>
          </h2>
          <p className="text-gray-500 text-base mb-10">
            Join developers building and shipping APIs<br />faster with DevPortal.
          </p>

          <div className="space-y-3">
            {PERKS.map((perk) => (
              <div key={perk} className="flex items-center gap-2.5">
                <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" />
                <span className="text-sm text-gray-400">{perk}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-gray-700">
          Add new APIs with zero component code changes
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative">
        <div className="absolute inset-0 pointer-events-none lg:hidden">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full opacity-15"
               style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
        </div>

        <div className="w-full max-w-sm relative z-10 animate-slide-up">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center">
              <span className="text-white font-bold text-sm">DP</span>
            </div>
            <span className="text-white font-semibold">DevPortal</span>
          </div>

          <h1 className="text-2xl font-bold text-white mb-1">Create your account</h1>
          <p className="text-gray-500 text-sm mb-7">Start exploring our APIs today</p>

          {/* Error */}
          {error && !error.includes('rate limit') && (
            <div className="mb-4 p-3 rounded-xl bg-red-900/20 border border-red-700/30 text-red-300 text-sm animate-slide-up">
              {error}
            </div>
          )}

          {/* Rate limit special message */}
          {error?.includes('rate limit') && (
            <div className="mb-4 p-3 rounded-xl bg-amber-900/20 border border-amber-700/30 text-amber-300 text-xs animate-slide-up">
              <strong>Email rate limit reached.</strong> Supabase free plan limits signup emails to ~2/hour. 
              Go to Supabase → <strong>Auth Settings → Email → disable "Confirm email"</strong> to fix this.
            </div>
          )}

          {/* Demo banner */}
          {isDemo && (
            <div className="mb-5 p-3 rounded-xl bg-brand-900/20 border border-brand-700/30 text-brand-300 text-xs">
              <strong>Demo Mode —</strong> Any email &amp; password will work. No real account created.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              error={errors.email}
              autoComplete="email"
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPw ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                error={errors.password}
                autoComplete="new-password"
                hint={!errors.password ? 'At least 8 characters' : undefined}
              />
              <button type="button" onClick={() => setShowPw((s) => !s)}
                className="absolute right-3 top-[34px] text-gray-500 hover:text-gray-300 transition-colors">
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            <div className="relative">
              <Input
                label="Confirm Password"
                type={showConfirm ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.confirm}
                onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
                error={errors.confirm}
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowConfirm((s) => !s)}
                className="absolute right-3 top-[34px] text-gray-500 hover:text-gray-300 transition-colors">
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            <Button type="submit" loading={loading} className="w-full gap-2 mt-2" size="lg">
              Create account <ArrowRight size={15} />
            </Button>
          </form>

          <p className="text-center text-xs text-gray-700 mt-4">
            By signing up you agree to our terms of service.
          </p>

          <p className="text-center text-sm text-gray-600 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
