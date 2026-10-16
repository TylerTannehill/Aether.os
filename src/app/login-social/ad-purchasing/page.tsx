'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Check, Mail, Megaphone, PanelRight, RectangleHorizontal } from 'lucide-react'

export default function SocialAdPurchasingPage() {
  const [contact, setContact] = useState({ name: '', email: '', organization: '', phone: '', message: '' })
  const [interest, setInterest] = useState('Banner advertising — $1,000/month')
  const [contactBusy, setContactBusy] = useState(false)
  const [contactDone, setContactDone] = useState(false)
  const [contactError, setContactError] = useState('')

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
          message: `Aether Social advertising inquiry. Interested in: ${interest}. ${contact.message}`.trim(),
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

  return (
    <main className="relative min-h-[100svh] overflow-x-hidden bg-[#090e20] text-white">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_12%_16%,rgba(103,47,191,0.34),transparent_42%),radial-gradient(ellipse_at_90%_85%,rgba(45,93,196,0.19),transparent_45%)]" />
      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-[1550px] flex-col px-5 py-4 sm:px-8 lg:py-2">
        <header className="flex shrink-0 items-center justify-between gap-4">
          <Link href="/" aria-label="Aether home" className="inline-flex items-center">
            <img src="/aether-logo-full.png" alt="Aether OS" className="h-20 w-auto object-contain drop-shadow-[0_0_25px_rgba(139,92,246,0.3)] lg:h-20" />
          </Link>
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            <Link href="/login-social/employer-login" className="rounded-2xl border border-violet-400/70 bg-violet-700/20 px-4 py-3 text-xs font-black uppercase tracking-wider transition hover:bg-violet-600/30 sm:px-6 sm:text-sm">Post Jobs on Aether Social</Link>
            <Link href="/login-social" className="rounded-2xl border border-violet-400/70 bg-violet-700/20 px-4 py-3 text-xs font-black uppercase tracking-wider transition hover:bg-violet-600/30 sm:px-6 sm:text-sm">Aether Social Sign In</Link>
          </div>
        </header>

        <div className="grid flex-1 items-start gap-4 pb-2 lg:grid-cols-[0.9fr_1.1fr] lg:gap-5">
          <section className="flex flex-col rounded-[26px] border border-white/10 bg-white/[0.055] p-4 shadow-2xl backdrop-blur-xl sm:p-5 lg:p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.35em] text-violet-300">Aether Social · Advertising</p>
            <h1 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">Put your brand in the conversation.</h1>
            <p className="mt-1 text-sm font-semibold text-slate-300">Reach the professionals and organizations building what comes next.</p>
            <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-[#10162b]/80 p-3 sm:p-4">
              <img src="/ad-purchasing.png" alt="Aether Social advertising placement preview" className="h-auto w-full rounded-xl object-contain" />
            </div>
            <div className="mt-3 rounded-xl border border-violet-400/20 bg-violet-500/10 p-3">
              <p className="text-sm font-bold text-violet-100">Visibility with a purpose.</p>
              <p className="mt-1 text-xs leading-5 text-slate-300">Explore advertising opportunities across Aether Social. Team Aether can help you find the right placement for your organization.</p>
            </div>
          </section>

          <section className="flex min-h-0 flex-col gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-violet-300">Simple placements. Clear pricing.</p>
              <h2 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">Make your presence known.</h2>
              <p className="mt-1 text-xs text-slate-400">Two straightforward advertising options inside Aether Social.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/15 bg-white/[0.045] p-3">
                <RectangleHorizontal className="h-6 w-6 text-violet-300" />
                <h3 className="mt-1 text-lg font-black">Banner Ads</h3>
                <p className="mt-1 text-2xl font-black">$1,000<span className="text-sm font-medium text-slate-400"> / month</span></p>
                <div className="mt-2 flex items-start gap-2 text-xs text-slate-200"><Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />Prominent banner advertising placement within Aether Social</div>
              </div>
              <div className="rounded-2xl border border-violet-400/55 bg-violet-500/[0.12] p-3">
                <PanelRight className="h-6 w-6 text-violet-300" />
                <h3 className="mt-1 text-lg font-black">Feed Sidebar Ads</h3>
                <p className="mt-1 text-2xl font-black">$500<span className="text-sm font-medium text-slate-400"> / month</span></p>
                <div className="mt-2 flex items-start gap-2 text-xs text-slate-200"><Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />Advertising alongside the Aether Social feed</div>
                <div className="mt-1 flex items-start gap-2 text-xs text-slate-200"><Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />Included with Aether Business Enterprise or Aether Political Tier 3</div>
              </div>
            </div>
            <div id="advertising-contact" className="min-h-0 rounded-2xl border border-white/10 bg-white/[0.055] p-3 sm:p-4">
              <div className="flex items-center gap-2"><Mail className="h-5 w-5 text-violet-300" /><h3 className="text-lg font-black">Interested? Let's talk.</h3></div>
              <p className="mt-1 text-xs text-slate-400">Ask Team Aether about advertising availability, placement, or your existing plan benefits.</p>
              {contactDone ? (
                <p role="status" className="mt-5 rounded-xl border border-violet-400/30 bg-violet-500/10 p-4 text-sm font-semibold text-violet-100">Your advertising inquiry has been sent. Team Aether will be in touch.</p>
              ) : (
                <form onSubmit={submitContact} className="mt-2 grid gap-2 sm:grid-cols-2">
                  <input className={inputClass} aria-label="Your name" placeholder="Your name *" required value={contact.name} onChange={e => setContact({ ...contact, name: e.target.value })} />
                  <input className={inputClass} aria-label="Email address" type="email" placeholder="Email address *" required value={contact.email} onChange={e => setContact({ ...contact, email: e.target.value })} />
                  <input className={inputClass} aria-label="Organization" placeholder="Organization" value={contact.organization} onChange={e => setContact({ ...contact, organization: e.target.value })} />
                  <input className={inputClass} aria-label="Phone" type="tel" placeholder="Phone (optional)" value={contact.phone} onChange={e => setContact({ ...contact, phone: e.target.value })} />
                  <select className={`${inputClass} sm:col-span-2`} aria-label="Advertising interest" value={interest} onChange={e => setInterest(e.target.value)}>
                    <option value="Banner advertising — $1,000/month">Banner advertising — $1,000/month</option>
                    <option value="Feed sidebar advertising — $500/month">Feed sidebar advertising — $500/month</option>
                    <option value="Included sidebar advertising — Business Enterprise / Political Tier 3">Included sidebar advertising — Business Enterprise / Political Tier 3</option>
                    <option value="General advertising inquiry">General advertising inquiry</option>
                  </select>
                  <textarea className={`${inputClass} resize-none sm:col-span-2`} rows={1} aria-label="Message" placeholder="Tell us about your advertising goals (optional)" value={contact.message} onChange={e => setContact({ ...contact, message: e.target.value })} />
                  {contactError && <p role="alert" className="text-xs text-rose-300 sm:col-span-2">{contactError}</p>}
                  <button type="submit" disabled={contactBusy} className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-700 to-indigo-600 px-4 py-2 text-sm font-black transition hover:brightness-110 disabled:opacity-50 sm:col-span-2"><Megaphone className="h-4 w-4" />{contactBusy ? 'Sending…' : 'Contact Team Aether'}</button>
                </form>
              )}
            </div>
          </section>
        </div>
        <footer className="shrink-0 text-center text-[10px] text-slate-600">© {new Date().getFullYear()} Aether Systems LLC</footer>
      </div>
    </main>
  )
}
