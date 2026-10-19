'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { BriefcaseBusiness, Check, Megaphone, Mail } from 'lucide-react'

export default function SocialEmployersPublicPage() {
  const supabase = createClient()
  const [org, setOrg] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'reset'>('login')
  const [busy, setBusy] = useState(false)
  const [loginMessage, setLoginMessage] = useState('')
  const [contact, setContact] = useState({ name: '', email: '', organization: '', phone: '', message: '' })
  const [contactBusy, setContactBusy] = useState(false)
  const [contactDone, setContactDone] = useState(false)
  const [contactError, setContactError] = useState('')

  async function submitLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoginMessage('')
    setBusy(true)
    try {
      if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
          redirectTo: `${window.location.origin}/update-password`,
        })
        if (error) throw error
        setLoginMessage('Password reset link sent. Check your inbox.')
        return
      }
      const normalizedOrg = org.trim().toLowerCase()
      if (!normalizedOrg) throw new Error('Enter your organization.')
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
      if (error) throw error
      const response = await fetch('/api/auth/select-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign: normalizedOrg, ...(normalizedOrg !== 'team-aether' ? { context: 'employer' } : {}) }),
      })
      const result = await response.json()
      if (!response.ok) {
        await supabase.auth.signOut()
        throw new Error(result?.error || 'Unable to access this organization.')
      }
      // This sign-in is exclusively for the Social employer workspace.
      // The organization's Political/Business/Social product context is unchanged.
      // Team Aether retains its own administrative sign-in destination.
      if (normalizedOrg === 'team-aether') {
        window.location.assign('/team-aether')
      } else {
        window.location.assign('/social/jobs/employers')
      }
    } catch (err) {
      setLoginMessage(err instanceof Error ? err.message : 'Unable to sign in.')
    } finally {
      setBusy(false)
    }
  }

  async function submitContact(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setContactBusy(true)
    setContactError('')
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'demo',
          ...contact,
          message: `Aether Social employer inquiry. ${contact.message}`.trim(),
        }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error || 'Unable to send inquiry.')
      setContactDone(true)
    } catch (err) {
      setContactError(err instanceof Error ? err.message : 'Unable to send inquiry.')
    } finally {
      setContactBusy(false)
    }
  }

  const inputClass = 'w-full rounded-xl border border-white/15 bg-[#0b1328] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400'
  const labelClass = 'mb-1 block text-xs font-semibold text-slate-300'

  return (
    <main className="relative min-h-[100svh] overflow-x-hidden bg-[#090e20] text-white ">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_12%_16%,rgba(103,47,191,0.34),transparent_42%),radial-gradient(ellipse_at_90%_85%,rgba(45,93,196,0.19),transparent_45%)]" />
      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-[1550px] flex-col px-5 py-4 sm:px-8 lg:py-2">
        <header className="flex shrink-0 items-center justify-between gap-4">
          <div className="flex h-14 shrink-0 items-center gap-2 sm:gap-3">
            <Link href="/" aria-label="Aether home" className="inline-flex items-center">
              <img src="/aether-logo-full.png" alt="Aether OS" className="block h-14 w-auto object-contain drop-shadow-[0_0_25px_rgba(139,92,246,0.3)]" />
            </Link>
            <Link href="/social-public" aria-label="Aether Social home" className="inline-flex items-center">
              <img src="/social-branding-transparent.png" alt="Aether Social" className="block h-9 w-auto max-w-[95px] object-contain drop-shadow-[0_0_20px_rgba(139,92,246,0.35)] sm:h-10 sm:max-w-[110px]" />
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            <Link href="/login-social/ad-purchasing" className="rounded-2xl border border-white/20 bg-white/[0.06] px-4 py-3 text-xs font-black uppercase tracking-wider transition hover:border-violet-400/70 hover:bg-violet-600/20 sm:px-6 sm:text-sm">Advertise on Aether Social</Link>
            <Link href="/login-social" className="rounded-2xl border border-violet-400/70 bg-violet-700/20 px-4 py-3 text-xs font-black uppercase tracking-wider transition hover:bg-violet-600/30 sm:px-6 sm:text-sm">Aether Social Sign In</Link>
          </div>
        </header>

        <div className="grid flex-1 items-start gap-4 pb-2 lg:grid-cols-[0.9fr_1.1fr] lg:gap-5">
          <section className="flex flex-col rounded-[26px] border border-white/10 bg-white/[0.055] p-4 shadow-2xl backdrop-blur-xl sm:p-5 lg:p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.35em] text-violet-300">Aether Social · Employers</p>
            <h1 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">Hire your next great teammate.</h1>
            <p className="mt-1 text-sm font-semibold text-slate-300">Your organization. Your opportunities. Your team.</p>

            <div className="mt-3 rounded-2xl border border-white/10 bg-[#10162b]/80 p-3 sm:p-4">
              <h2 className="text-lg font-black">{mode === 'login' ? 'Employer Sign In' : 'Reset your password'}</h2>
              <p className="mt-1 text-xs text-slate-400">{mode === 'login' ? 'Use your Aether organization credentials.' : 'We’ll email you a secure reset link.'}</p>
              <form onSubmit={submitLogin} className="mt-3 space-y-2">
                {mode === 'login' && <div><label htmlFor="employer-org" className={labelClass}>Organization</label><input id="employer-org" className={inputClass} value={org} onChange={e => setOrg(e.target.value)} placeholder="your-organization" autoComplete="organization" required /></div>}
                <div><label htmlFor="employer-email" className={labelClass}>Email address</label><input id="employer-email" className={inputClass} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" autoComplete="email" required /></div>
                {mode === 'login' && <div><div className="flex items-center justify-between"><label htmlFor="employer-password" className={labelClass}>Password</label><button type="button" className="text-xs font-semibold text-violet-300 hover:text-white" onClick={() => { setMode('reset'); setLoginMessage('') }}>Forgot password?</button></div><input id="employer-password" className={inputClass} type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required /></div>}
                {loginMessage && <p role="status" className="text-xs text-violet-200">{loginMessage}</p>}
                <button disabled={busy} type="submit" className="w-full cursor-pointer rounded-xl bg-gradient-to-r from-violet-700 to-indigo-600 px-4 py-2 text-sm font-black transition hover:brightness-110 disabled:opacity-50">{busy ? 'Please wait…' : mode === 'login' ? 'Enter Employer Workspace' : 'Send Reset Link'}</button>
                {mode === 'reset' && <button type="button" className="w-full text-xs font-semibold text-violet-300 hover:text-white" onClick={() => { setMode('login'); setLoginMessage('') }}>Back to sign in</button>}
              </form>
            </div>
            <p className="mt-2 text-center text-xs text-slate-400">New to Aether Social? <a href="#employer-contact" className="font-bold text-violet-300 underline underline-offset-4 hover:text-white">Ask about an employer account</a></p>
            <p className="mt-auto pt-3 text-center text-[11px] text-slate-500">Existing Aether Political and Business customers can continue using their current organization login.</p>
          </section>

          <section className="flex min-h-0 flex-col gap-2">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-violet-300">Simple hiring. Clear pricing.</p>
              <h2 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">Find talent. Grow your team.</h2>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/15 bg-white/[0.045] p-3">
                <BriefcaseBusiness className="h-6 w-6 text-violet-300" />
                <h3 className="mt-1 text-lg font-black">Needle</h3>
                <p className="mt-1 text-2xl font-black">$100<span className="text-sm font-medium text-slate-400"> / month</span></p>
                <div className="mt-2 flex items-start gap-2 text-xs text-slate-200"><Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />Unlimited job postings to the Aether Social Jobs board</div>
              </div>
              <div className="rounded-2xl border border-violet-400/55 bg-violet-500/[0.12] p-3">
                <Megaphone className="h-6 w-6 text-violet-300" />
                <h3 className="mt-1 text-lg font-black">Haystack</h3>
                <p className="mt-1 text-2xl font-black">$250<span className="text-sm font-medium text-slate-400"> / month</span></p>
                <div className="mt-2 flex items-start gap-2 text-xs text-slate-200"><Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />Unlimited job-board postings</div>
                <div className="mt-1 flex items-start gap-2 text-xs text-slate-200"><Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />Ability to advertise jobs in the professional feed</div>
              </div>
            </div>
            <div id="employer-contact" className="min-h-0 rounded-2xl border border-white/10 bg-white/[0.055] p-3 sm:p-4">
              <div className="flex items-center gap-2"><Mail className="h-5 w-5 text-violet-300" /><h3 className="text-lg font-black">Interested? Let's talk.</h3></div>
              <p className="mt-1 text-xs text-slate-400">Ask about employer access, pricing, or getting your organization set up.</p>
              {contactDone ? <p role="status" className="mt-5 rounded-xl border border-violet-400/30 bg-violet-500/10 p-4 text-sm font-semibold text-violet-100">Your inquiry has been sent. Team Aether will be in touch.</p> :
                <form onSubmit={submitContact} className="mt-2 grid gap-2 sm:grid-cols-2">
                  <input className={inputClass} aria-label="Your name" placeholder="Your name *" required value={contact.name} onChange={e => setContact({ ...contact, name: e.target.value })} />
                  <input className={inputClass} aria-label="Email address" type="email" placeholder="Email address *" required value={contact.email} onChange={e => setContact({ ...contact, email: e.target.value })} />
                  <input className={inputClass} aria-label="Organization" placeholder="Organization" value={contact.organization} onChange={e => setContact({ ...contact, organization: e.target.value })} />
                  <input className={inputClass} aria-label="Phone" type="tel" placeholder="Phone (optional)" value={contact.phone} onChange={e => setContact({ ...contact, phone: e.target.value })} />
                  <textarea className={`${inputClass} resize-none sm:col-span-2`} rows={1} aria-label="Message" placeholder="How can we help?" value={contact.message} onChange={e => setContact({ ...contact, message: e.target.value })} />
                  {contactError && <p role="alert" className="text-xs text-rose-300 sm:col-span-2">{contactError}</p>}
                  <button type="submit" disabled={contactBusy} className="cursor-pointer rounded-xl bg-gradient-to-r from-violet-700 to-indigo-600 px-4 py-2 text-sm font-black transition hover:brightness-110 disabled:opacity-50 sm:col-span-2">{contactBusy ? 'Sending…' : 'Contact Team Aether'}</button>
                </form>}
            </div>
          </section>
        </div>
        <footer className="shrink-0 text-center text-[10px] text-slate-600">© {new Date().getFullYear()} Aether Systems LLC</footer>
      </div>
    </main>
  )
}
