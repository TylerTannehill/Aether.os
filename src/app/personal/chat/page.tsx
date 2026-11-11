'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Target, NotebookPen, MessageCircle, Send, CheckCircle2, AlertCircle, LogOut } from 'lucide-react'

type Goal = { id: string; text: string; progress: number }
type ChatMessage = { role: 'user' | 'assistant'; content: string }
const MAX_VISIBLE_MESSAGES = 20

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string'
}
const supabase = createClient()

export default function PersonalConversationsPage() {
  const [profileId, setProfileId] = useState<string | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState('')
  const [goals, setGoals] = useState<Goal[]>([])
  const [notes, setNotes] = useState('')
  const [notesReady, setNotesReady] = useState(false)
  const [lyraNotes, setLyraNotes] = useState('')
  const [lyraNotesReady, setLyraNotesReady] = useState(false)
  const [lyraNotesStatus, setLyraNotesStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [autonomyEnabled, setAutonomyEnabled] = useState(false)
  const [autonomyStatus, setAutonomyStatus] = useState<'idle' | 'saving' | 'error'>('idle')
  const [notebookView, setNotebookView] = useState<'user' | 'lyra'>('user')
  const [notesStatus, setNotesStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [messageDraft, setMessageDraft] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sending, setSending] = useState(false)
  const [chatLoading, setChatLoading] = useState(true)
  const [chatError, setChatError] = useState('')
  const [pendingNote, setPendingNote] = useState('')
  const [noteActionStatus, setNoteActionStatus] = useState<'idle' | 'saving' | 'error'>('idle')
  const chatBottomRef = useRef<HTMLDivElement | null>(null)
  const sendingRef = useRef(false)
  const saveVersion = useRef(0)
  const lyraSaveVersion = useRef(0)
  const autonomySaveVersion = useRef(0)
  const lyraNotesRef = useRef('')
  const autonomyRef = useRef(false)
  const noteActionRef = useRef(false)
  const chatRequestVersion = useRef(0)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) throw new Error('Please sign in to Aether Personal again.')
        const { data: profile, error: profileError } = await supabase.from('personal_profiles')
          .select('id').eq('auth_user_id', user.id).single()
        if (profileError || !profile) throw new Error(profileError?.message || 'Personal profile not found.')
        const [goalsResult, notesResult, lyraNotesResult] = await Promise.all([
          supabase.from('personal_goals').select('id, text, progress')
            .eq('personal_profile_id', profile.id).order('created_at', { ascending: true }),
          supabase.from('personal_notes').select('content')
            .eq('personal_profile_id', profile.id).maybeSingle(),
          supabase.from('personal_lyra_notes').select('content, autonomy_enabled')
            .eq('personal_profile_id', profile.id).maybeSingle(),
        ])
        if (goalsResult.error) throw goalsResult.error
        if (notesResult.error) throw notesResult.error
        if (lyraNotesResult.error) throw lyraNotesResult.error
        if (cancelled) return
        setGoals(goalsResult.data ?? [])
        const initialNotes = notesResult.data?.content ?? ''
        setNotes(initialNotes)
        setLyraNotes(lyraNotesResult.data?.content ?? '')
        lyraNotesRef.current = lyraNotesResult.data?.content ?? ''
        autonomyRef.current = lyraNotesResult.data?.autonomy_enabled ?? false
        setAutonomyEnabled(autonomyRef.current)
        setLyraNotesReady(true)
        setProfileId(profile.id)
        setNotesReady(true)
      } catch (err) {
        if (!cancelled) setErrorMessage(err instanceof Error ? err.message : 'Unable to load Personal data.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!profileId || !notesReady) return
    const version = ++saveVersion.current
    setNotesStatus('idle')
    const timeout = window.setTimeout(async () => {
      if (version !== saveVersion.current) return
      setNotesStatus('saving')
      const { error } = await supabase.from('personal_notes').upsert({
        personal_profile_id: profileId,
        content: notes,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'personal_profile_id' })
      if (version === saveVersion.current) setNotesStatus(error ? 'error' : 'saved')
    }, 800)
    return () => window.clearTimeout(timeout)
  }, [notes, notesReady, profileId])

  useEffect(() => {
    if (!profileId || !lyraNotesReady) return
    const version = ++lyraSaveVersion.current
    setLyraNotesStatus('idle')
    const timeout = window.setTimeout(async () => {
      if (version !== lyraSaveVersion.current) return
      setLyraNotesStatus('saving')
      const { error } = await supabase.from('personal_lyra_notes').upsert({
        personal_profile_id: profileId,
        content: lyraNotes,
        autonomy_enabled: autonomyEnabled,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'personal_profile_id' })
      if (version === lyraSaveVersion.current) setLyraNotesStatus(error ? 'error' : 'saved')
    }, 800)
    return () => window.clearTimeout(timeout)
  }, [lyraNotes, lyraNotesReady, profileId])

  async function changeAutonomy(enabled: boolean) {
    if (!profileId || !lyraNotesReady) return
    const version = ++autonomySaveVersion.current
    autonomyRef.current = enabled
    setAutonomyEnabled(enabled)
    setAutonomyStatus('saving')
    const { error } = await supabase.from('personal_lyra_notes').upsert({
      personal_profile_id: profileId,
      content: lyraNotes,
      autonomy_enabled: enabled,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'personal_profile_id' })
    if (version === autonomySaveVersion.current) {
      setAutonomyStatus(error ? 'error' : 'idle')
      if (error) {
        autonomyRef.current = !enabled
        setAutonomyEnabled(!enabled)
      }
    }
  }

  // The model only proposes text. The page handles approval and persistence.
  async function saveSuggestedNote(suggestion: string, automatic = false) {
    if (!profileId || noteActionRef.current) return
    noteActionRef.current = true
    setNoteActionStatus('saving')
    try {
      // Re-read the saved setting and notebook, rather than trusting a stale UI toggle.
      const { data: current, error: readError } = await supabase
        .from('personal_lyra_notes')
        .select('content, autonomy_enabled')
        .eq('personal_profile_id', profileId)
        .maybeSingle()
      if (readError) throw readError
      if (automatic && !current?.autonomy_enabled) {
        setPendingNote(suggestion)
        setNoteActionStatus('idle')
        return
      }
      const existing = current?.content ?? ''
      // Avoid adding the same memory twice.
      const duplicate = existing.split('\n').some((line: string) =>
        line.replace(/^[-•]\s*/, '').trim().toLowerCase() === suggestion.toLowerCase()
      )
      const updated = duplicate ? existing : [existing.trimEnd(), `• ${suggestion}`].filter(Boolean).join('\n')
      const { error: writeError } = await supabase.from('personal_lyra_notes').upsert({
        personal_profile_id: profileId,
        content: updated,
        autonomy_enabled: current?.autonomy_enabled ?? false,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'personal_profile_id' })
      if (writeError) throw writeError
      // Cancel pending autosaves of old text and reflect the saved notebook.
      ++lyraSaveVersion.current
      lyraNotesRef.current = updated
      setLyraNotes(updated)
      setLyraNotesStatus('saved')
      setPendingNote('')
      setNoteActionStatus('idle')
    } catch {
      setPendingNote(suggestion)
      setNoteActionStatus('error')
    } finally {
      noteActionRef.current = false
    }
  }

  // The API is the source of truth for the rolling conversation window.
  async function loadChatHistory(): Promise<ChatMessage[]> {
    const response = await fetch('/api/personal/lyra', { method: 'GET', cache: 'no-store' })
    const data: unknown = await response.json()
    const result = data as { messages?: unknown; history?: unknown; error?: unknown }
    if (!response.ok) {
      throw new Error(typeof result.error === 'string' ? result.error : 'Unable to load conversation history.')
    }
    const raw = Array.isArray(result.messages) ? result.messages : result.history
    if (!Array.isArray(raw) || !raw.every(isChatMessage)) {
      throw new Error('Conversation history response was invalid.')
    }
    return (raw as ChatMessage[]).slice(-MAX_VISIBLE_MESSAGES)
  }

  useEffect(() => {
    if (!profileId) return
    let cancelled = false
    const version = ++chatRequestVersion.current
    async function restore() {
      setChatLoading(true)
      try {
        const saved = await loadChatHistory()
        if (!cancelled && version === chatRequestVersion.current) setMessages(saved)
      } catch (error) {
        if (!cancelled) setChatError(error instanceof Error ? error.message : 'Unable to load conversation history.')
      } finally {
        if (!cancelled) setChatLoading(false)
      }
    }
    void restore()
    return () => { cancelled = true }
  }, [profileId])

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [messages, sending])

  async function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const message = messageDraft.trim()
    if (!message || sendingRef.current || !profileId || chatLoading) return
    sendingRef.current = true
    setSending(true)
    setChatError('')
    setMessages(previous => [...previous, { role: 'user' as const, content: message }].slice(-MAX_VISIBLE_MESSAGES))
    setMessageDraft('')
    try {
      const response = await fetch('/api/personal/lyra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })
      const data: unknown = await response.json()
      const result = data as { reply?: unknown; noteSuggestion?: unknown; error?: unknown }
      if (!response.ok || typeof result.reply !== 'string' || !result.reply.trim()) {
        throw new Error(typeof result.error === 'string' ? result.error : 'Lyra could not respond. Please try again.')
      }
      // Display the response immediately, then reconcile with persisted server history.
      setMessages(previous => [...previous, { role: 'assistant' as const, content: result.reply as string }].slice(-MAX_VISIBLE_MESSAGES))
      try {
        const saved = await loadChatHistory()
        setMessages(saved)
      } catch {
        // Keep the visible reply; the next refresh can retry loading saved history.
      }
      if (typeof result.noteSuggestion === 'string' && result.noteSuggestion.trim()) {
        const suggestion = result.noteSuggestion.trim()
        if (autonomyRef.current) {
          await saveSuggestedNote(suggestion, true)
        } else {
          setPendingNote(suggestion)
          setNoteActionStatus('idle')
        }
      }
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Unable to reach Lyra.')
      // Keep the failed message visible so it can be copied and retried.
    } finally {
      sendingRef.current = false
      setSending(false)
    }
  }

  async function handleLogout() {
    if (loggingOut) return
    setLoggingOut(true)
    setLogoutError('')
    const { error } = await supabase.auth.signOut()
    if (error) {
      setLogoutError('Unable to log out: ' + error.message)
      setLoggingOut(false)
      return
    }
    window.location.replace('/login-personal')
  }

  const average = goals.length
    ? Math.round(goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length)
    : 0

  return (
    <main className="relative min-h-[100svh] overflow-x-hidden bg-[#090e20] text-white">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_10%_10%,rgba(66,86,220,0.18),transparent_40%),radial-gradient(ellipse_at_92%_82%,rgba(177,41,190,0.14),transparent_46%)]" />
      <div className="relative mx-auto flex min-h-[100svh] w-full max-w-[1500px] flex-col px-5 py-5 sm:px-8 lg:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-5 sm:gap-8">
            <Link href="/personal/dashboard" aria-label="Aether Personal dashboard" className="block">
              <img src="/aether-personal-logo.png" alt="Aether Personal" className="h-20 w-auto max-w-[230px] object-contain sm:h-24" />
            </Link>
            <button type="button" onClick={() => void handleLogout()} disabled={loggingOut} className="inline-flex items-center gap-2 rounded-xl border border-violet-400/25 bg-[#18172d] px-4 py-2.5 text-sm font-semibold text-violet-200 transition hover:border-violet-400/50 hover:bg-violet-500/15 disabled:cursor-not-allowed disabled:opacity-50">
              <LogOut className="h-4 w-4" /> {loggingOut ? 'Logging out…' : 'Log Out'}
            </button>
          </div>
          <nav aria-label="Personal pages" className="inline-flex rounded-xl border border-violet-400/20 bg-[#18172d] p-1">
            <Link href="/personal/dashboard" className="rounded-lg px-3 py-2.5 text-xs font-bold text-slate-300 transition hover:bg-white/10 hover:text-white sm:px-5 sm:text-sm">Personal Dashboard</Link>
            <Link href="/personal/chat" aria-current="page" className="rounded-lg bg-gradient-to-r from-violet-700 to-indigo-600 px-3 py-2.5 text-xs font-bold text-white shadow-md sm:px-5 sm:text-sm">Personal Conversations</Link>
          </nav>
        </header>

        <div className="flex-1 py-7">
          {logoutError && <p role="alert" className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">{logoutError}</p>}
          {errorMessage && <p role="alert" className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">{errorMessage}</p>}

          <div className="grid items-stretch gap-5 lg:grid-cols-[minmax(220px,1fr)_minmax(360px,2fr)_minmax(240px,1fr)]">
            <section className="rounded-[22px] border border-white/10 bg-white/[0.055] p-5 shadow-xl backdrop-blur-lg">
              <div className="mb-4 flex items-center gap-3">
                <span className="rounded-xl bg-violet-500/15 p-2.5 text-violet-300"><Target className="h-5 w-5" /></span>
                <div><h2 className="text-lg font-black">My Goals</h2><p className="text-xs text-slate-400">Your current priorities</p></div>
              </div>
              <div className="mb-5 rounded-xl border border-violet-400/20 bg-violet-500/10 px-3 py-2 text-sm font-bold text-violet-200">{average}% overall progress</div>
              {loading ? <p className="text-sm text-slate-400">Loading goals…</p> : goals.length === 0 ? (
                <p className="text-sm text-slate-400">No goals yet. Add one on your <Link href="/personal/dashboard" className="text-violet-300 underline">dashboard</Link>.</p>
              ) : <div className="space-y-4">{goals.map(goal => (
                <div key={goal.id} className="rounded-xl border border-white/10 bg-[#11182e] p-3">
                  <div className="mb-2 flex items-start justify-between gap-2"><p className="min-w-0 whitespace-pre-wrap break-words text-sm font-semibold">{goal.text || 'Untitled goal'}</p><span className="shrink-0 text-xs font-bold text-violet-300">{goal.progress}%</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#35324f]"><div className="h-full rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-fuchsia-500" style={{ width: `${goal.progress}%` }} /></div>
                </div>
              ))}</div>}
              <Link href="/personal/dashboard" className="mt-5 inline-block text-xs font-bold text-violet-300 hover:text-white">Manage goals on dashboard →</Link>
            </section>

            <section className="flex min-h-[530px] min-w-0 flex-col rounded-[22px] border border-violet-400/15 bg-white/[0.055] p-5 shadow-xl backdrop-blur-lg">
              <div className="mb-4 flex items-center gap-3 border-b border-white/10 pb-4">
                <span className="rounded-xl bg-violet-500/15 p-2.5 text-violet-300"><MessageCircle className="h-5 w-5" /></span>
                <div><h2 className="text-lg font-black">Conversation with Lyra</h2><p className="text-xs text-slate-400">Powered by your Personal context</p></div>
              </div>
              <div aria-live="polite" className="flex max-h-[62vh] min-h-[320px] flex-1 flex-col gap-4 overflow-y-auto pr-1">
                {messages.length === 0 && !chatLoading && (
                  <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
                    <span className="mb-4 rounded-2xl border border-violet-400/20 bg-violet-500/10 p-4 text-violet-300"><MessageCircle className="h-8 w-8" /></span>
                    <h3 className="text-xl font-black">What's on your mind?</h3>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">Lyra is ready. She receives her personality, Aether instructions, and your connected You context with every message.</p>
                  </div>
                )}
                {messages.map((item, index) => (
                  <div key={index} className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-6 ${item.role === 'user' ? 'bg-gradient-to-r from-violet-700 to-indigo-600 text-white' : 'border border-white/10 bg-[#11182e] text-slate-100'}`}>
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-violet-200">{item.role === 'user' ? 'You' : 'Lyra'}</p>
                      <p className="whitespace-pre-wrap break-words">{item.content}</p>
                    </div>
                  </div>
                ))}
                {chatLoading && <p role="status" className="text-sm text-violet-200">Loading conversation…</p>}
                {sending && <p role="status" className="text-sm text-violet-200">Lyra is thinking…</p>}
                <div ref={chatBottomRef} />
              </div>
              {pendingNote && (
                <div className="mt-3 rounded-xl border border-violet-400/30 bg-violet-500/10 p-3">
                  <p className="text-xs font-bold text-violet-200">Lyra would like to remember:</p>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-100">{pendingNote}</p>
                  {noteActionStatus === 'error' && <p role="alert" className="mt-2 text-xs text-rose-300">Could not save this memory. Please retry.</p>}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" disabled={noteActionStatus === 'saving'} onClick={() => void saveSuggestedNote(pendingNote)} className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-bold text-white hover:bg-violet-500 disabled:opacity-50">{noteActionStatus === 'saving' ? 'Saving…' : 'Save to Lyra’s notes'}</button>
                    <button type="button" disabled={noteActionStatus === 'saving'} onClick={() => { setPendingNote(''); setNoteActionStatus('idle') }} className="rounded-lg border border-white/20 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-white/10 disabled:opacity-50">Dismiss</button>
                  </div>
                </div>
              )}
              {chatError && <p role="alert" className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">{chatError}</p>}
              <form onSubmit={sendMessage} className="mt-4 flex items-end gap-2 rounded-xl border border-white/10 bg-[#0c1327] p-2">
                <textarea aria-label="Message Lyra" rows={2} maxLength={4000} value={messageDraft} onChange={e => setMessageDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); e.currentTarget.form?.requestSubmit() } }} placeholder="Message Lyra..." className="max-h-36 min-h-[54px] min-w-0 flex-1 resize-y bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-slate-500" />
                <button type="submit" aria-label="Send message to Lyra" disabled={!messageDraft.trim() || sending || chatLoading || !profileId} className="rounded-lg bg-gradient-to-r from-violet-700 to-indigo-600 p-3 text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"><Send className="h-4 w-4" /></button>
              </form>
              <p className="mt-2 text-center text-[11px] text-slate-500">Your most recent 20 messages are saved to Personal. Older messages are automatically removed.</p>
            </section>

            <section className="flex flex-col rounded-[22px] border border-white/10 bg-white/[0.055] p-5 shadow-xl backdrop-blur-lg">
              <div className="mb-4 flex items-center gap-3">
                <button type="button" onClick={() => setNotebookView(view => view === 'user' ? 'lyra' : 'user')}
                  aria-label={notebookView === 'user' ? "Switch to Lyra's Notes to Self" : 'Switch to your Notes to Self'}
                  title="Switch notebooks"
                  className="rounded-xl bg-violet-500/15 p-2.5 text-violet-300 transition hover:bg-violet-500/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-400">
                  <NotebookPen className="h-5 w-5" />
                </button>
                <div>
                  <h2 className="text-lg font-black">{notebookView === 'user' ? 'Notes to Self' : "Lyra's Notes to Self"}</h2>
                  <p className="text-xs text-slate-400">{notebookView === 'user' ? 'Shared with your dashboard' : 'What Lyra remembers about you'}</p>
                </div>
              </div>
              {notebookView === 'user' ? (
                <textarea aria-label="Notes to Self" value={notes} onChange={e => setNotes(e.target.value)} disabled={!notesReady} placeholder={loading ? 'Loading your notes…' : 'Thoughts, reminders, ideas…'} className="min-h-[320px] w-full flex-1 resize-y rounded-xl border border-white/10 bg-[#0c1327] p-4 text-sm leading-6 text-white outline-none placeholder:text-slate-500 focus:border-violet-400 disabled:opacity-60" />
              ) : (
                <>
                  <textarea aria-label="Lyra's Notes to Self" value={lyraNotes} onChange={e => { lyraNotesRef.current = e.target.value; setLyraNotes(e.target.value) }} disabled={!lyraNotesReady} placeholder={loading ? 'Loading Lyra’s notebook…' : 'Memories Lyra should keep…'} className="min-h-[320px] w-full flex-1 resize-y rounded-xl border border-white/10 bg-[#0c1327] p-4 text-sm leading-6 text-white outline-none placeholder:text-slate-500 focus:border-violet-400 disabled:opacity-60" />
                  <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0c1327] p-3">
                    <div>
                      <p className="text-xs font-bold text-slate-200">Autonomous note-taking</p>
                      <p className="mt-1 text-[11px] text-slate-400">{autonomyEnabled ? 'Lyra may save notes without asking' : 'Lyra must ask before saving notes'}</p>
                    </div>
                    <button type="button" role="switch" aria-checked={autonomyEnabled} aria-label="Autonomous note-taking"
                      disabled={!lyraNotesReady || autonomyStatus === 'saving'}
                      onClick={() => void changeAutonomy(!autonomyEnabled)}
                      className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-50 ${autonomyEnabled ? 'bg-violet-600' : 'bg-slate-600'}`}>
                      <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${autonomyEnabled ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>
                  {autonomyStatus === 'error' && <p role="alert" className="mt-2 text-xs text-rose-300">Could not save autonomy setting. Please try again.</p>}
                </>
              )}
              <div className="mt-3 flex items-center justify-end gap-2 text-xs text-slate-400">
                {(notebookView === 'user' ? notesStatus : lyraNotesStatus) === 'saving' && 'Saving…'}
                {(notebookView === 'user' ? notesStatus : lyraNotesStatus) === 'saved' && <><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Saved to Personal</>}
                {(notebookView === 'user' ? notesStatus : lyraNotesStatus) === 'error' && <><AlertCircle className="h-4 w-4 text-rose-400" /> Save failed — edit to retry</>}
                {(notebookView === 'user' ? notesStatus : lyraNotesStatus) === 'idle' && ((notebookView === 'user' ? notesReady : lyraNotesReady) ? 'Autosaves as you type' : 'Loading…')}
              </div>
            </section>
          </div>
        </div>
        <footer className="py-2 text-center text-[10px] text-slate-500">© {new Date().getFullYear()} Aether Systems LLC · Aether Personal</footer>
      </div>
    </main>
  )
}
