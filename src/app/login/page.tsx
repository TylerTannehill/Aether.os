'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()

  const [campaign, setCampaign] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!campaign || !email || !password) {
      alert('Enter your campaign, email, and password')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setLoading(false)
      alert(error.message)
      return
    }

    const campaignResponse = await fetch('/api/auth/select-campaign', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ campaign }),
    })

    const campaignResult = await campaignResponse.json()

    setLoading(false)

    if (!campaignResponse.ok) {
      await supabase.auth.signOut()
      alert(campaignResult?.error || 'Unable to access this campaign')
      return
    }

    window.location.href = '/dashboard'
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-white/20 bg-white/5 p-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Login to Aether.os</h1>
          <p className="text-sm text-white/70">
            Enter your campaign workspace to continue.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="campaign" className="block text-sm font-medium">
              Campaign
            </label>
            <input
              id="campaign"
              type="text"
              placeholder="aether-demo-campaign"
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
              className="w-full rounded border border-white bg-white px-3 py-2 text-black"
              autoComplete="organization"
            />
          </div>

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
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-white bg-white px-3 py-2 text-black"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-white px-4 py-2 text-black disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p className="text-center text-xs text-white/60">
          By logging in, you agree to our{' '}
          <Link href="/terms" className="underline hover:text-white">
            Terms
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline hover:text-white">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  )
}