'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type AuthMode = 'login' | 'register' | 'reset'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()

  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [message, setMessage] = useState('')

  const ensureSocialProfile = async (authUserId: string, name?: string) => {
    const { data: existing, error: lookupError } = await supabase
      .from('social_profiles')
      .select('id')
      .eq('auth_user_id', authUserId)
      .maybeSingle()

    if (lookupError) throw new Error(lookupError.message)
    if (existing) return

    const { error: insertError } = await supabase
      .from('social_profiles')
      .insert({ auth_user_id: authUserId, ...(name ? { display_name: name } : {}) })

    // A simultaneous request may already have created the unique profile.
    if (insertError && insertError.code !== '23505') {
      throw new Error(insertError.message)
    }
  }

  const selectIndividualSocialMode = async () => {
    const response = await fetch('/api/auth/select-campaign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context: 'individual' }),
    })
    if (!response.ok) {
      const result = await response.json().catch(() => null)
      throw new Error(result?.error || 'Unable to select individual Social mode.')
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    if (!email.trim() || !password) {
      setMessage('Enter your email and password.')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })
      if (error) throw error
      if (!data.user) throw new Error('Could not verify your account.')

      await ensureSocialProfile(data.user.id)
      await selectIndividualSocialMode()
      router.replace('/social')
      router.refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Sign-in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    if (!email.trim() || !password || !displayName.trim()) {
      setMessage('Enter your name, email, and password.')
      return
    }
    if (password.length < 6) {
      setMessage('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { data: { display_name: displayName.trim() } },
      })
      if (error) throw error
      if (data.session && data.user) {
        await ensureSocialProfile(data.user.id, displayName.trim())
        await selectIndividualSocialMode()
        router.replace('/social')
        router.refresh()
      } else {
        setMode('login')
        setMessage('Check your email for a confirmation link. Once confirmed, return here to sign in.')
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    const normalizedEmail = email.trim().toLowerCase()

    if (!normalizedEmail) {
      alert('Enter your email address')
      return
    }

    setResetLoading(true)

    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/update-password`
        : undefined

    const { error } = await supabase.auth.resetPasswordForEmail(
      normalizedEmail,
      {
        redirectTo,
      }
    )

    setResetLoading(false)

    if (error) {
      setMessage(error.message)
      return
    }

    setMessage(
      'Password reset email sent. Check your inbox and follow the secure link to set a new password.'
    )
  }

  return (
    <main className="relative flex min-h-[100svh] flex-col overflow-hidden bg-[#090e20] text-white">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_18%_15%,rgba(103,47,191,0.32),transparent_43%),radial-gradient(ellipse_at_88%_85%,rgba(45,93,196,0.20),transparent_43%)]" />
      <header className="absolute inset-x-0 top-0 z-30 flex items-start justify-between px-5 py-2 sm:px-8">
        <Link href="/" aria-label="Aether home" className="inline-flex items-center"><img src="/aether-logo-full.png" alt="Aether OS" className="h-28 w-auto max-w-[340px] object-contain drop-shadow-[0_0_25px_rgba(139,92,246,0.35)] sm:h-48" /></Link>
        <Link href="/" className="relative z-40 inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-violet-400/70 bg-violet-700/20 px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-white shadow-xl shadow-violet-950/30 transition hover:bg-violet-600/30">Back to Aether</Link>
      </header>

      <div className="relative z-10 flex flex-1 items-start justify-center px-4 pb-4 pt-10 sm:pt-12">
        <div className="w-full max-w-[390px]">
          <div className="mb-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.44em] text-violet-300">Aether Social</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
              {mode === 'register' ? 'Find your people.' : mode === 'reset' ? 'Reset your password.' : 'Welcome back.'}
            </h1>
            <p className="mt-1 text-sm font-semibold text-slate-200">
              {mode === 'register' ? 'Your next connection starts here.' : mode === 'reset' ? 'We’ll send you a secure reset link.' : 'Your network. Your opportunities. Your space.'}
            </p>
          </div>

          <section className="rounded-[22px] border border-white/10 bg-white/[0.055] p-4 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-5">
            {mode !== 'reset' && (
              <div className="mb-4 grid grid-cols-2 rounded-xl bg-black/25 p-1">
                <button type="button" onClick={() => { setMode('login'); setMessage('') }}
                  className={`rounded-lg px-3 py-2 text-sm font-bold transition ${mode === 'login' ? 'bg-gradient-to-r from-violet-700 to-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Sign In</button>
                <button type="button" onClick={() => { setMode('register'); setMessage('') }}
                  className={`rounded-lg px-3 py-2 text-sm font-bold transition ${mode === 'register' ? 'bg-gradient-to-r from-violet-700 to-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Sign Up</button>
              </div>
            )}
            {message && <p role="status" className="mb-5 rounded-xl border border-violet-400/25 bg-violet-400/10 px-4 py-3 text-sm text-violet-100">{message}</p>}

            {mode === 'reset' ? (
              <form onSubmit={handlePasswordReset} className="space-y-3">
                <label className="block text-xs font-semibold text-slate-300" htmlFor="reset-email">Email address</label>
                <input id="reset-email" type="email" autoComplete="email" required placeholder="you@example.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0c1327] px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400" />
                <button type="submit" disabled={resetLoading} className="w-full rounded-xl bg-gradient-to-r from-violet-700 to-indigo-600 px-4 py-3 text-sm font-bold transition hover:brightness-110 disabled:opacity-50">{resetLoading ? 'Sending…' : 'Send Reset Link'}</button>
                <button type="button" onClick={() => { setMode('login'); setMessage('') }} className="w-full py-2 text-sm text-violet-300 hover:text-white">← Back to sign in</button>
              </form>
            ) : (
              <form onSubmit={mode === 'register' ? handleRegister : handleLogin} className="space-y-3">
                {mode === 'register' && <div>
                  <label htmlFor="display-name" className="mb-1 block text-xs font-semibold text-slate-300">Display name</label>
                  <input id="display-name" type="text" autoComplete="name" required value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your name"
                    className="w-full rounded-xl border border-white/10 bg-[#0c1327] px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400" />
                </div>}
                <div>
                  <label htmlFor="email" className="mb-1 block text-xs font-semibold text-slate-300">Email address</label>
                  <input id="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                    className="w-full rounded-xl border border-white/10 bg-[#0c1327] px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400" />
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label htmlFor="password" className="text-xs font-semibold text-slate-300">Password</label>
                    {mode === 'login' && <button type="button" onClick={() => { setMode('reset'); setMessage('') }} className="text-xs text-violet-300 hover:text-white">Forgot password?</button>}
                  </div>
                  <input id="password" type="password" required minLength={mode === 'register' ? 6 : undefined} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} placeholder={mode === 'register' ? 'At least 6 characters' : 'Enter your password'}
                    className="w-full rounded-xl border border-white/10 bg-[#0c1327] px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400" />
                </div>
                <button type="submit" disabled={loading} className="mt-2 w-full rounded-xl bg-gradient-to-r from-violet-700 to-indigo-600 px-4 py-2.5 text-sm font-bold shadow-lg shadow-violet-950/40 transition hover:brightness-110 disabled:opacity-50">
                  {loading ? 'Please wait…' : mode === 'register' ? 'Create Social Account →' : 'Enter Aether Social →'}
                </button>
              </form>
            )}
            <p className="mt-3 text-center text-[11px] leading-relaxed text-slate-500">
              By continuing, you agree to our <Link href="/terms" className="text-slate-300 underline underline-offset-2 hover:text-white">Terms</Link> and <Link href="/privacy" className="text-slate-300 underline underline-offset-2 hover:text-white">Privacy Policy</Link>.
            </p>
          </section>

          <div className="mt-3 rounded-2xl border border-violet-400/20 bg-violet-500/[0.08] px-4 py-3 text-center">
            <p className="text-sm font-bold text-white">Hiring for your organization?</p>
            <p className="mt-1 text-xs text-slate-400">Already have an employer account, or want to create one?</p>
            <Link href="/login-social/employer-login" className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-violet-300 transition hover:text-white">
              Employer Sign In &amp; Sign Up <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <div className="mt-3 rounded-2xl border border-violet-400/20 bg-violet-500/[0.08] px-4 py-3 text-center">
            <p className="text-sm font-bold text-white">Want to buy ad space?</p>
            <Link href="/login-social/ad-purchasing" className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-violet-300 transition hover:text-white">
              Contact Team Aether about Advertising <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </div>
      <footer className="relative z-10 px-4 pb-2 text-center text-[10px] tracking-wide text-slate-600">© {new Date().getFullYear()} Aether Systems LLC</footer>
    </main>
  )
}
