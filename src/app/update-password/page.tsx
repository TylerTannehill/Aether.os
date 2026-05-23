'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function UpdatePasswordPage() {
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        setMessage(
          'Password recovery session not found. Please request a new reset link from the login page.'
        )
      }

      setReady(true)
    }

    checkSession()
  }, [supabase.auth])

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    if (!password || !confirmPassword) {
      setMessage('Enter and confirm your new password.')
      return
    }

    if (password.length < 8) {
      setMessage('Password must be at least 8 characters.')
      return
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password,
    })

    setLoading(false)

    if (error) {
      setMessage(error.message)
      return
    }

    setMessage('Password updated. Redirecting to login...')

    await supabase.auth.signOut()

    window.setTimeout(() => {
      window.location.href = '/login'
    }, 900)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-white/20 bg-white/5 p-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Update Password</h1>

          <p className="text-sm text-white/70">
            Set a new password for your Aether.os account.
          </p>
        </div>

        {message ? (
          <div className="rounded border border-white/20 bg-white/10 p-3 text-sm text-white/80">
            {message}
          </div>
        ) : null}

        {!ready ? (
          <div className="rounded border border-white/20 bg-white/10 p-3 text-sm text-white/70">
            Checking recovery session...
          </div>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium">
                New Password
              </label>

              <input
                id="password"
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded border border-white bg-white px-3 py-2 text-black"
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="confirm-password"
                className="block text-sm font-medium"
              >
                Confirm Password
              </label>

              <input
                id="confirm-password"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded border border-white bg-white px-3 py-2 text-black"
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded bg-white px-4 py-2 text-black disabled:opacity-50"
            >
              {loading ? 'Updating password...' : 'Update Password'}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-white/60">
          Need a new reset link?{' '}
          <Link
            href="/login"
            style={{ color: '#3B82F6' }}
            className="underline"
          >
            Return to login
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
