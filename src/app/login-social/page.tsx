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
    <div className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-white/20 bg-white/5 p-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{mode === 'register' ? 'Join Aether Social' : 'Login to Aether Social'}</h1>

          <p className="text-sm text-white/70">
            {mode === 'login'
              ? 'Sign in with your email and password to continue.'
              : mode === 'register'
                ? 'Create your personal Aether Social account.'
                : 'Enter your email and we’ll send a secure password reset link.'}
          </p>
        </div>

        {message ? (
          <div className="rounded border border-white/20 bg-white/10 p-3 text-sm text-white/80">
            {message}
          </div>
        ) : null}

        {mode === 'login' || mode === 'register' ? (
          <form onSubmit={mode === 'register' ? handleRegister : handleLogin} className="space-y-4">
            {mode === 'register' && (
              <div className="space-y-2">
                <label htmlFor="display-name" className="block text-sm font-medium">Display Name</label>
                <input id="display-name" type="text" value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  autoComplete="name" required
                  className="w-full rounded border border-white bg-white px-3 py-2 text-black" />
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium">
                Email
              </label>

              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded border border-white bg-white px-3 py-2 text-black"
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="password" className="block text-sm font-medium">
                  Password
                </label>

                {mode === 'login' && <button
                  type="button"
                  onClick={() => {
                    setMode('reset')
                    setMessage('')
                  }}
                  className="text-xs font-medium text-blue-400 underline underline-offset-2 hover:text-blue-300"
                >
                  Forgot password?
                </button>}
              </div>

              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded border border-white bg-white px-3 py-2 text-black"
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded bg-white px-4 py-2 text-black disabled:opacity-50"
            >
              {loading ? 'Please wait...' : mode === 'register' ? 'Create Account' : 'Log In'}
            </button>
            <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setMessage('') }}
              className="w-full text-sm text-blue-400 underline underline-offset-2 hover:text-blue-300">
              {mode === 'login' ? 'New here? Create an account' : 'Already have an account? Log in'}
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="reset-email" className="block text-sm font-medium">
                Email
              </label>

              <input
                id="reset-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded border border-white bg-white px-3 py-2 text-black"
                autoComplete="email"
              />
            </div>

            <button
              type="submit"
              disabled={resetLoading}
              className="w-full rounded bg-white px-4 py-2 text-black disabled:opacity-50"
            >
              {resetLoading ? 'Sending reset link...' : 'Send Reset Link'}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('login')
                setMessage('')
              }}
              className="w-full rounded border border-white/30 px-4 py-2 text-white transition hover:bg-white/10"
            >
              Back to Login
            </button>
          </form>
        )}

        <Link
          href="/"
          className="block w-full rounded border border-white/30 px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-white/10"
        >
          Back to Landing Page
        </Link>

        <p className="text-center text-xs text-white/60">
          By logging in, you agree to our{' '}

          <Link
            href="/terms"
            style={{ color: '#3B82F6' }}
            className="underline"
          >
            Terms
          </Link>{' '}

          and{' '}

          <Link
            href="/privacy"
            style={{ color: '#3B82F6' }}
            className="underline"
          >
            Privacy Policy
          </Link>

          .
        </p>
      </div>
    </div>
  )
}
