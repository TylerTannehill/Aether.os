'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowUpRight, BookOpen, BriefcaseBusiness, GraduationCap, MessageCircle, Plus, Save, Trash2, Users, Landmark, Sparkles, Target, NotebookPen, CheckCircle2 } from 'lucide-react'

type Goal = { id: string; text: string; progress: number }
type PersonalConnection = { id: string; product: 'Political' | 'Business'; role: string; connected_at: string }
type SocialConnection = { id: string; social_profile_id: string; username: string | null; display_name: string | null; connected_at: string }
const supabase = createClient()

const connections = [
  { name: 'Aether Political', icon: Landmark, description: 'Campaigns and civic work' },
  { name: 'Aether Business', icon: BriefcaseBusiness, description: 'Your business world' },
  { name: 'Aether Social', icon: Users, description: 'Your connections' },
  { name: 'Aether Academy', icon: GraduationCap, description: 'Learning and resources' },
  { name: 'OpenAI', icon: Sparkles, description: 'AI-powered context' },
]

export default function PersonalDashboardPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [draft, setDraft] = useState('')
  const [profileId, setProfileId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [notes, setNotes] = useState('')
  const [notesReady, setNotesReady] = useState(false)
  const [notesStatus, setNotesStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [linkedAccounts, setLinkedAccounts] = useState<PersonalConnection[]>([])
  const [connectionsLoading, setConnectionsLoading] = useState(true)
  const [connectionsError, setConnectionsError] = useState('')
  const [connectionBusy, setConnectionBusy] = useState(false)
  const [connectingProduct, setConnectingProduct] = useState<'Political' | 'Business' | null>(null)
  const [organizationSlug, setOrganizationSlug] = useState('')
  const [workEmail, setWorkEmail] = useState('')
  const [socialConnection, setSocialConnection] = useState<SocialConnection | null>(null)
  const [socialLoading, setSocialLoading] = useState(true)
  const [socialBusy, setSocialBusy] = useState(false)
  const [socialError, setSocialError] = useState('')
  const [socialModalOpen, setSocialModalOpen] = useState(false)
  const [socialEmail, setSocialEmail] = useState('')
  const [socialPassword, setSocialPassword] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadGoals() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) throw new Error('Please sign in to Aether Personal again.')

        const { data: profile, error: profileError } = await supabase
          .from('personal_profiles')
          .select('id')
          .eq('auth_user_id', user.id)
          .single()
        if (profileError || !profile) throw new Error(profileError?.message || 'Personal profile not found.')

        const { data, error } = await supabase
          .from('personal_goals')
          .select('id, text, progress')
          .eq('personal_profile_id', profile.id)
          .order('created_at', { ascending: true })
        if (error) throw error
        const { data: noteRecord, error: notesError } = await supabase
          .from('personal_notes')
          .select('content')
          .eq('personal_profile_id', profile.id)
          .maybeSingle()
        if (notesError) throw notesError
        if (!cancelled) {
          setNotes(noteRecord?.content ?? '')
          setNotesReady(true)
          setProfileId(profile.id)
          setGoals(data ?? [])
        }
      } catch (err) {
        if (!cancelled) setErrorMessage(err instanceof Error ? err.message : 'Unable to load goals.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadGoals()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadConnections() {
      try {
        const response = await fetch('/api/personal/connections', { cache: 'no-store' })
        const payload = await response.json()
        if (!response.ok) throw new Error(payload.error || 'Unable to load connections.')
        if (!cancelled) setLinkedAccounts(Array.isArray(payload.connections) ? payload.connections : [])
      } catch (err) {
        if (!cancelled) setConnectionsError(err instanceof Error ? err.message : 'Unable to load connections.')
      } finally {
        if (!cancelled) setConnectionsLoading(false)
      }
    }
    void loadConnections()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadSocialConnection() {
      try {
        const response = await fetch('/api/personal/social-connection', { cache: 'no-store' })
        const payload = await response.json()
        if (!response.ok) throw new Error(payload.error || 'Unable to load Social connection.')
        if (!cancelled) setSocialConnection(payload.connection ?? null)
      } catch (err) {
        if (!cancelled) setSocialError(err instanceof Error ? err.message : 'Unable to load Social connection.')
      } finally {
        if (!cancelled) setSocialLoading(false)
      }
    }
    void loadSocialConnection()
    return () => { cancelled = true }
  }, [])

  async function connectSocial(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (socialBusy) return
    setSocialBusy(true)
    setSocialError('')
    try {
      const response = await fetch('/api/personal/social-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: socialEmail.trim(), password: socialPassword }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Unable to connect Social.')
      setSocialConnection(payload.connection ?? null)
      setSocialModalOpen(false)
      setSocialEmail('')
      setSocialPassword('')
    } catch (err) {
      setSocialError(err instanceof Error ? err.message : 'Unable to connect Social.')
    } finally {
      setSocialBusy(false)
    }
  }

  async function disconnectSocial() {
    if (socialBusy || !window.confirm('Disconnect Aether Social from Personal?')) return
    setSocialBusy(true)
    setSocialError('')
    try {
      const response = await fetch('/api/personal/social-connection', { method: 'DELETE' })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Unable to disconnect Social.')
      setSocialConnection(null)
    } catch (err) {
      setSocialError(err instanceof Error ? err.message : 'Unable to disconnect Social.')
    } finally {
      setSocialBusy(false)
    }
  }

  async function connectAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!connectingProduct || connectionBusy) return
    setConnectionBusy(true)
    setConnectionsError('')
    try {
      const response = await fetch('/api/personal/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organization_slug: organizationSlug.trim(), email: workEmail.trim() }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Unable to connect membership.')
      const next = Array.isArray(payload.connections) ? payload.connections as PersonalConnection[] : []
      if (!next.some(connection => connection.product === connectingProduct)) {
        throw new Error(`That membership isn't an Aether ${connectingProduct} account. Please check the organization slug.`)
      }
      setLinkedAccounts(next)
      setConnectingProduct(null)
      setOrganizationSlug('')
      setWorkEmail('')
    } catch (err) {
      setConnectionsError(err instanceof Error ? err.message : 'Unable to connect membership.')
    } finally {
      setConnectionBusy(false)
    }
  }

  async function disconnectAccount(id: string) {
    if (connectionBusy || !window.confirm('Disconnect this membership from Aether Personal?')) return
    setConnectionBusy(true)
    setConnectionsError('')
    try {
      const response = await fetch('/api/personal/connections', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connection_id: id }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Unable to disconnect membership.')
      setLinkedAccounts(Array.isArray(payload.connections) ? payload.connections : [])
    } catch (err) {
      setConnectionsError(err instanceof Error ? err.message : 'Unable to disconnect membership.')
    } finally {
      setConnectionBusy(false)
    }
  }

  // One note per Personal profile. Debounce typing so each keystroke does not hit Supabase.
  useEffect(() => {
    if (!profileId || !notesReady) return
    setNotesStatus('idle')
    const timeout = window.setTimeout(async () => {
      setNotesStatus('saving')
      const { error } = await supabase
        .from('personal_notes')
        .upsert({ personal_profile_id: profileId, content: notes, updated_at: new Date().toISOString() }, { onConflict: 'personal_profile_id' })
      setNotesStatus(error ? 'error' : 'saved')
    }, 800)
    return () => window.clearTimeout(timeout)
  }, [notes, profileId, notesReady])

  async function addGoal() {
    const text = draft.trim()
    if (!text || !profileId || saving) return
    setSaving(true)
    setErrorMessage('')
    const { data, error } = await supabase
      .from('personal_goals')
      .insert({ personal_profile_id: profileId, text, progress: 0 })
      .select('id, text, progress')
      .single()
    if (error) setErrorMessage(error.message)
    else if (data) {
      setGoals(current => [...current, data])
      setDraft('')
    }
    setSaving(false)
  }

  function updateGoal(id: string, patch: Partial<Pick<Goal, 'text' | 'progress'>>) {
    setGoals(current => current.map(goal => goal.id === id ? { ...goal, ...patch } : goal))
  }

  async function saveGoal(id: string, patch: Partial<Pick<Goal, 'text' | 'progress'>>) {
    setErrorMessage('')
    const { error } = await supabase.from('personal_goals').update(patch).eq('id', id)
    if (error) setErrorMessage(`Goal could not be saved: ${error.message}`)
  }

  async function deleteGoal(id: string) {
    setErrorMessage('')
    const { error } = await supabase.from('personal_goals').delete().eq('id', id)
    if (error) setErrorMessage(`Goal could not be deleted: ${error.message}`)
    else setGoals(current => current.filter(goal => goal.id !== id))
  }

  const average = goals.length ? Math.round(goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length) : 0

  return (
    <main className="relative min-h-[100svh] overflow-x-hidden bg-[#090e20] text-white">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_10%_10%,rgba(66,86,220,0.18),transparent_40%),radial-gradient(ellipse_at_92%_82%,rgba(177,41,190,0.14),transparent_46%)]" />
      <div className="relative mx-auto flex min-h-[100svh] w-full max-w-[1500px] flex-col px-5 py-5 sm:px-8 lg:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <Link href="/personal/dashboard" aria-label="Aether Personal dashboard" className="block">
            <img src="/aether-personal-logo.png" alt="Aether Personal" className="h-20 w-auto max-w-[230px] object-contain sm:h-24" />
          </Link>
          <nav aria-label="Personal pages" className="inline-flex rounded-xl border border-violet-400/20 bg-[#18172d] p-1">
            <Link href="/personal/dashboard" aria-current="page" className="rounded-lg bg-gradient-to-r from-violet-700 to-indigo-600 px-3 py-2.5 text-xs font-bold text-white shadow-md sm:px-5 sm:text-sm">Personal Dashboard</Link>
            <Link href="/personal/chat" className="rounded-lg px-3 py-2.5 text-xs font-bold text-slate-300 transition hover:bg-white/10 hover:text-white sm:px-5 sm:text-sm">Personal Conversations</Link>
          </nav>
        </header>

        <div className="flex-1 py-7">
          <div className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-[22px] border border-white/10 bg-white/[0.055] p-5 shadow-xl backdrop-blur-lg">
              <div className="mb-4 flex items-center gap-3">
                <span className="rounded-xl bg-violet-500/15 p-2.5 text-violet-300"><Target className="h-5 w-5" /></span>
                <div><h2 className="text-xl font-black">My Goals</h2><p className="text-xs text-slate-400">Write anything you're working toward.</p></div>
              </div>
              <div className="flex items-start gap-2">
                <textarea aria-label="New goal" rows={2} value={draft} onChange={e => setDraft(e.target.value)} placeholder="What matters to you?" className="min-h-[82px] flex-1 resize-y rounded-xl border border-white/10 bg-[#0c1327] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400" />
                <button type="button" onClick={() => void addGoal()} disabled={!draft.trim() || !profileId || saving} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-700 to-indigo-600 px-4 py-3 text-sm font-bold transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"><Plus className="h-4 w-4" /> Add</button>
              </div>
              {errorMessage && <p role="alert" className="mt-3 text-sm text-rose-300">{errorMessage}</p>}
              <div className="mt-4 space-y-3">
                {!loading && goals.length === 0 && <p className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-slate-400">Your goals will appear here when you add them.</p>}
                {loading && <p className="text-sm text-slate-400">Loading your goals…</p>}
                {goals.map(goal => (
                  <div key={goal.id} className="flex items-start gap-2 rounded-xl border border-white/10 bg-[#11182e] p-3">
                    <textarea aria-label="Edit goal" rows={2} value={goal.text} onChange={e => updateGoal(goal.id, { text: e.target.value })} onBlur={e => void saveGoal(goal.id, { text: e.currentTarget.value })} className="min-w-0 flex-1 resize-y bg-transparent text-sm leading-6 text-slate-100 outline-none" />
                    <button type="button" aria-label="Delete goal" title="Delete goal" onClick={() => void deleteGoal(goal.id)} className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-300"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[22px] border border-white/10 bg-white/[0.055] p-5 shadow-xl backdrop-blur-lg">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div><h2 className="text-xl font-black">Progress Meter</h2><p className="mt-1 text-xs text-slate-400">You decide how far you've come.</p></div>
                <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-sm font-bold text-violet-200">{average}% overall</span>
              </div>
              <div className="space-y-5">
                {goals.length === 0 && <p className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-slate-400">Add a goal to start tracking progress.</p>}
                {goals.map(goal => (
                  <div key={goal.id}>
                    <div className="mb-2 flex items-start justify-between gap-3"><p className="min-w-0 whitespace-pre-wrap break-words text-sm font-semibold text-slate-200">{goal.text || 'Untitled goal'}</p><span className="shrink-0 text-sm font-black text-violet-300">{goal.progress}%</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#35324f]"><div className="h-full rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-fuchsia-500 transition-all" style={{ width: `${goal.progress}%` }} /></div>
                    <input aria-label={`Progress for ${goal.text || 'goal'}`} type="range" min="0" max="100" step="1" value={goal.progress} onChange={e => updateGoal(goal.id, { progress: Number(e.target.value) })} onPointerUp={e => void saveGoal(goal.id, { progress: Number(e.currentTarget.value) })} onKeyUp={e => void saveGoal(goal.id, { progress: Number(e.currentTarget.value) })} className="mt-2 w-full cursor-pointer accent-violet-500" />
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="mt-5 rounded-[22px] border border-white/10 bg-white/[0.055] p-5 shadow-xl backdrop-blur-lg">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-violet-500/15 p-2.5 text-violet-300"><NotebookPen className="h-5 w-5" /></span>
                <div><h2 className="text-xl font-black">Notes to Self</h2><p className="mt-1 text-xs text-slate-400">Your thoughts, reminders, and ideas — shared with Personal Conversations.</p></div>
              </div>
              <span role="status" className={`text-xs font-semibold ${notesStatus === 'error' ? 'text-rose-300' : 'text-violet-300'}`}>
                {notesStatus === 'saving' ? 'Saving…' : notesStatus === 'saved' ? 'Saved to Personal' : notesStatus === 'error' ? 'Could not save — edit to retry' : notesReady ? 'Autosaves as you type' : 'Loading notes…'}
              </span>
            </div>
            <textarea
              aria-label="Notes to Self"
              rows={5}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              disabled={!notesReady}
              placeholder="What do you want to remember?"
              className="w-full resize-y rounded-xl border border-white/10 bg-[#0c1327] px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-slate-500 focus:border-violet-400 disabled:opacity-50"
            />
          </section>

          <section className="mt-5 rounded-[22px] border border-white/10 bg-white/[0.055] p-5 shadow-xl backdrop-blur-lg">
            <div className="mb-4">
              <h2 className="text-xl font-black">Connections</h2>
              <p className="mt-1 text-xs text-slate-400">Connect your Aether accounts. Activity summaries will come later.</p>
            </div>
            {connectionsError && <p role="alert" className="mb-4 rounded-xl border border-rose-400/25 bg-rose-500/10 p-3 text-sm text-rose-200">{connectionsError}</p>}
            {socialError && !socialModalOpen && <p role="alert" className="mb-4 rounded-xl border border-rose-400/25 bg-rose-500/10 p-3 text-sm text-rose-200">Social: {socialError}</p>}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {connections.map(({ name, icon: Icon, description }) => {
                const product = name === 'Aether Political' ? 'Political' : name === 'Aether Business' ? 'Business' : null
                const matches = product ? linkedAccounts.filter(account => account.product === product) : []
                return (
                  <div key={name} className="rounded-2xl border border-violet-400/15 bg-[#16172e] p-4">
                    <Icon className="mb-3 h-6 w-6 text-violet-300" />
                    <h3 className="text-sm font-bold">{name}</h3>
                    <p className="mt-1 text-xs text-slate-400">{description}</p>
                    {name === 'Aether Academy' ? (
                      <a href="https://aetheros.pro/aether-academy" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-700 to-indigo-600 px-3 py-2 text-xs font-bold text-white transition hover:brightness-110">
                        Enter Academy <ArrowUpRight className="h-3.5 w-3.5" />
                      </a>
                    ) : name === 'Aether Social' ? (
                      <div className="mt-3 space-y-2">
                        {socialLoading ? <p className="text-xs text-slate-400">Checking connection…</p> : socialConnection ? (
                          <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-2">
                            <p className="flex items-center gap-1 text-xs font-bold text-emerald-300"><CheckCircle2 className="h-3.5 w-3.5" /> Connected</p>
                            {(socialConnection.display_name || socialConnection.username) && (
                              <p className="mt-1 break-words text-[11px] text-slate-300">{socialConnection.display_name || socialConnection.username}</p>
                            )}
                            <button type="button" disabled={socialBusy} onClick={() => void disconnectSocial()} className="mt-2 text-[11px] font-semibold text-rose-300 hover:text-rose-200 disabled:opacity-50">{socialBusy ? 'Disconnecting…' : 'Disconnect'}</button>
                          </div>
                        ) : (
                          <>
                            <p className="text-[11px] font-semibold text-violet-300/80">Not connected</p>
                            <button type="button" disabled={socialBusy} onClick={() => { setSocialError(''); setSocialEmail(''); setSocialPassword(''); setSocialModalOpen(true) }} className="rounded-lg bg-gradient-to-r from-violet-700 to-indigo-600 px-3 py-2 text-xs font-bold text-white transition hover:brightness-110 disabled:opacity-50">Connect</button>
                          </>
                        )}
                      </div>
                    ) : product ? (
                      <div className="mt-3 space-y-2">
                        {connectionsLoading ? <p className="text-xs text-slate-400">Checking connections…</p> : (
                          <>
                            {matches.map(account => (
                              <div key={account.id} className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-2">
                                <p className="flex items-center gap-1 text-xs font-bold text-emerald-300"><CheckCircle2 className="h-3.5 w-3.5" /> Connected</p>
                                <p className="mt-1 break-words text-[11px] text-slate-300">Role: {account.role}</p>
                                <button type="button" disabled={connectionBusy} onClick={() => void disconnectAccount(account.id)} className="mt-2 text-[11px] font-semibold text-rose-300 hover:text-rose-200 disabled:opacity-50">Disconnect</button>
                              </div>
                            ))}
                            {matches.length === 0 && <p className="text-[11px] font-semibold text-violet-300/80">Not connected</p>}
                            <button type="button" disabled={connectionBusy} onClick={() => { setConnectingProduct(product); setOrganizationSlug(''); setWorkEmail(''); setConnectionsError('') }} className="rounded-lg bg-gradient-to-r from-violet-700 to-indigo-600 px-3 py-2 text-xs font-bold text-white transition hover:brightness-110 disabled:opacity-50">
                              {matches.length ? 'Connect another' : 'Connect'}
                            </button>
                          </>
                        )}
                      </div>
                    ) : (
                      <p className="mt-3 text-[11px] font-semibold text-violet-300/80">Not connected</p>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
          {socialModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" onMouseDown={event => { if (event.target === event.currentTarget && !socialBusy) { setSocialModalOpen(false); setSocialPassword(''); setSocialError('') } }}>
              <div role="dialog" aria-modal="true" aria-labelledby="social-connect-title" className="w-full max-w-md rounded-[22px] border border-violet-400/25 bg-[#16172e] p-6 shadow-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 id="social-connect-title" className="text-xl font-black">Connect Aether Social</h2>
                    <p className="mt-2 text-sm text-slate-400">Confirm your Social login to link it with Aether Personal. Your password is not saved.</p>
                  </div>
                  <button type="button" aria-label="Close" disabled={socialBusy} onClick={() => { setSocialModalOpen(false); setSocialPassword(''); setSocialError('') }} className="rounded-lg px-2 py-1 text-slate-300 hover:bg-white/10 disabled:opacity-50">✕</button>
                </div>
                {socialError && <p role="alert" className="mt-4 text-sm text-rose-300">{socialError}</p>}
                <form onSubmit={event => void connectSocial(event)} className="mt-5 space-y-4">
                  <label className="block text-xs font-semibold text-slate-200">Social email
                    <input autoFocus required type="email" autoComplete="username" maxLength={254} value={socialEmail} onChange={event => setSocialEmail(event.target.value)} placeholder="you@example.com" className="mt-2 w-full rounded-xl border border-white/10 bg-[#0c1327] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400" />
                  </label>
                  <label className="block text-xs font-semibold text-slate-200">Social password
                    <input required type="password" autoComplete="current-password" value={socialPassword} onChange={event => setSocialPassword(event.target.value)} placeholder="Enter your password" className="mt-2 w-full rounded-xl border border-white/10 bg-[#0c1327] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400" />
                  </label>
                  <div className="flex justify-end gap-2">
                    <button type="button" disabled={socialBusy} onClick={() => { setSocialModalOpen(false); setSocialPassword(''); setSocialError('') }} className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold text-slate-300 disabled:opacity-50">Cancel</button>
                    <button type="submit" disabled={socialBusy || !socialEmail.trim() || !socialPassword} className="rounded-lg bg-gradient-to-r from-violet-700 to-indigo-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{socialBusy ? 'Verifying…' : 'Verify & connect'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}
          {connectingProduct && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" onMouseDown={event => { if (event.target === event.currentTarget && !connectionBusy) setConnectingProduct(null) }}>
              <div role="dialog" aria-modal="true" aria-labelledby="connect-title" className="w-full max-w-md rounded-[22px] border border-violet-400/25 bg-[#16172e] p-6 shadow-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 id="connect-title" className="text-xl font-black">Connect Aether {connectingProduct}</h2>
                    <p className="mt-2 text-sm text-slate-400">Enter the organization slug and email associated with your membership.</p>
                  </div>
                  <button type="button" aria-label="Close" disabled={connectionBusy} onClick={() => setConnectingProduct(null)} className="rounded-lg px-2 py-1 text-slate-300 hover:bg-white/10 disabled:opacity-50">✕</button>
                </div>
                {connectionsError && <p role="alert" className="mt-4 text-sm text-rose-300">{connectionsError}</p>}
                <form onSubmit={event => void connectAccount(event)} className="mt-5 space-y-4">
                  <label className="block text-xs font-semibold text-slate-200">Organization slug
                    <input autoFocus required maxLength={120} value={organizationSlug} onChange={event => setOrganizationSlug(event.target.value)} placeholder="your-organization" className="mt-2 w-full rounded-xl border border-white/10 bg-[#0c1327] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400" />
                  </label>
                  <label className="block text-xs font-semibold text-slate-200">Membership email
                    <input required type="email" maxLength={254} value={workEmail} onChange={event => setWorkEmail(event.target.value)} placeholder="you@organization.com" className="mt-2 w-full rounded-xl border border-white/10 bg-[#0c1327] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400" />
                  </label>
                  <div className="flex justify-end gap-2">
                    <button type="button" disabled={connectionBusy} onClick={() => setConnectingProduct(null)} className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold text-slate-300 disabled:opacity-50">Cancel</button>
                    <button type="submit" disabled={connectionBusy || !organizationSlug.trim() || !workEmail.trim()} className="rounded-lg bg-gradient-to-r from-violet-700 to-indigo-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{connectionBusy ? 'Connecting…' : 'Verify & connect'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
        <footer className="py-2 text-center text-[10px] text-slate-500">© {new Date().getFullYear()} Aether Systems LLC · Aether Personal</footer>
      </div>
    </main>
  )
}
