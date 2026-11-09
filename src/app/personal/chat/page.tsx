'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Target, NotebookPen, MessageCircle, Send, CheckCircle2, AlertCircle } from 'lucide-react'

type Goal = { id: string; text: string; progress: number }
const supabase = createClient()

export default function PersonalConversationsPage() {
  const [profileId, setProfileId] = useState<string | null>(null)
  const [goals, setGoals] = useState<Goal[]>([])
  const [notes, setNotes] = useState('')
  const [notesReady, setNotesReady] = useState(false)
  const [notesStatus, setNotesStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [messageDraft, setMessageDraft] = useState('')
  const [showChatNotice, setShowChatNotice] = useState(false)
  const saveVersion = useRef(0)
  const noteContent = useRef('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) throw new Error('Please sign in to Aether Personal again.')
        const { data: profile, error: profileError } = await supabase.from('personal_profiles')
          .select('id').eq('auth_user_id', user.id).single()
        if (profileError || !profile) throw new Error(profileError?.message || 'Personal profile not found.')
        const [goalsResult, notesResult] = await Promise.all([
          supabase.from('personal_goals').select('id, text, progress')
            .eq('personal_profile_id', profile.id).order('created_at', { ascending: true }),
          supabase.from('personal_notes').select('content')
            .eq('personal_profile_id', profile.id).maybeSingle(),
        ])
        if (goalsResult.error) throw goalsResult.error
        if (notesResult.error) throw notesResult.error
        if (cancelled) return
        setGoals(goalsResult.data ?? [])
        const initialNotes = notesResult.data?.content ?? ''
        noteContent.current = initialNotes
        setNotes(initialNotes)
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

  const average = goals.length
    ? Math.round(goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length)
    : 0

  return (
    <main className="relative min-h-[100svh] overflow-x-hidden bg-[#090e20] text-white">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_10%_10%,rgba(66,86,220,0.18),transparent_40%),radial-gradient(ellipse_at_92%_82%,rgba(177,41,190,0.14),transparent_46%)]" />
      <div className="relative mx-auto flex min-h-[100svh] w-full max-w-[1500px] flex-col px-5 py-5 sm:px-8 lg:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <Link href="/personal/dashboard" aria-label="Aether Personal dashboard" className="block">
            <img src="/aether-personal-logo.png" alt="Aether Personal" className="h-20 w-auto max-w-[230px] object-contain sm:h-24" />
          </Link>
          <nav aria-label="Personal pages" className="inline-flex rounded-xl border border-violet-400/20 bg-[#18172d] p-1">
            <Link href="/personal/dashboard" className="rounded-lg px-3 py-2.5 text-xs font-bold text-slate-300 transition hover:bg-white/10 hover:text-white sm:px-5 sm:text-sm">Personal Dashboard</Link>
            <Link href="/personal/chat" aria-current="page" className="rounded-lg bg-gradient-to-r from-violet-700 to-indigo-600 px-3 py-2.5 text-xs font-bold text-white shadow-md sm:px-5 sm:text-sm">Personal Conversations</Link>
          </nav>
        </header>

        <div className="flex-1 py-7">
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

            <section className="flex min-h-[530px] flex-col rounded-[22px] border border-violet-400/15 bg-white/[0.055] p-5 shadow-xl backdrop-blur-lg">
              <div className="mb-4 flex items-center gap-3 border-b border-white/10 pb-4">
                <span className="rounded-xl bg-violet-500/15 p-2.5 text-violet-300"><MessageCircle className="h-5 w-5" /></span>
                <div><h2 className="text-lg font-black">Conversation</h2><p className="text-xs text-slate-400">AI conversation integration is next</p></div>
              </div>
              <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
                <span className="mb-4 rounded-2xl border border-violet-400/20 bg-violet-500/10 p-4 text-violet-300"><MessageCircle className="h-8 w-8" /></span>
                <h3 className="text-xl font-black">What's on your mind?</h3>
                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">This is your conversation space. Next, we'll connect it to AI and save your conversation history to Personal.</p>
                {showChatNotice && <p role="status" className="mt-4 rounded-xl border border-violet-400/20 bg-violet-500/10 px-4 py-3 text-xs text-violet-200">Messages aren't sent or saved yet. AI chat is the next phase.</p>}
              </div>
              <form onSubmit={e => { e.preventDefault(); if (messageDraft.trim()) setShowChatNotice(true) }} className="mt-4 flex items-end gap-2 rounded-xl border border-white/10 bg-[#0c1327] p-2">
                <textarea aria-label="Message draft" rows={2} value={messageDraft} onChange={e => { setMessageDraft(e.target.value); setShowChatNotice(false) }} placeholder="Message Aether Personal..." className="max-h-36 min-h-[54px] min-w-0 flex-1 resize-y bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-slate-500" />
                <button type="submit" aria-label="Check message availability" disabled={!messageDraft.trim()} className="rounded-lg bg-gradient-to-r from-violet-700 to-indigo-600 p-3 text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"><Send className="h-4 w-4" /></button>
              </form>
              <p className="mt-2 text-center text-[11px] text-slate-500">Preview only — messages are not sent or stored.</p>
            </section>

            <section className="flex flex-col rounded-[22px] border border-white/10 bg-white/[0.055] p-5 shadow-xl backdrop-blur-lg">
              <div className="mb-4 flex items-center gap-3">
                <span className="rounded-xl bg-violet-500/15 p-2.5 text-violet-300"><NotebookPen className="h-5 w-5" /></span>
                <div><h2 className="text-lg font-black">Notes to Self</h2><p className="text-xs text-slate-400">Shared with your dashboard</p></div>
              </div>
              <textarea aria-label="Notes to Self" value={notes} onChange={e => { noteContent.current = e.target.value; setNotes(e.target.value) }} disabled={!notesReady} placeholder={loading ? 'Loading your notes…' : 'Thoughts, reminders, ideas…'} className="min-h-[320px] w-full flex-1 resize-y rounded-xl border border-white/10 bg-[#0c1327] p-4 text-sm leading-6 text-white outline-none placeholder:text-slate-500 focus:border-violet-400 disabled:opacity-60" />
              <div className="mt-3 flex items-center justify-end gap-2 text-xs text-slate-400">
                {notesStatus === 'saving' && 'Saving…'}
                {notesStatus === 'saved' && <><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Saved to Personal</>}
                {notesStatus === 'error' && <><AlertCircle className="h-4 w-4 text-rose-400" /> Save failed — edit to retry</>}
                {notesStatus === 'idle' && (notesReady ? 'Autosaves as you type' : 'Loading…')}
              </div>
            </section>
          </div>
        </div>
        <footer className="py-2 text-center text-[10px] text-slate-500">© {new Date().getFullYear()} Aether Systems LLC · Aether Personal</footer>
      </div>
    </main>
  )
}
