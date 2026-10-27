'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useSocialExperience } from '@/components/layout/social-shell'
import { ArrowLeft, LockKeyhole, Loader2, MessageCircle, RefreshCw, Search, Send, UserRound, MoreHorizontal, ShieldBan } from 'lucide-react'

type InboxRow = {
  conversation_id: string
  is_locked: boolean
  other_profile_id: string | null
  other_display_name: string | null
  other_username: string | null
  other_avatar_path: string | null
  last_message: string | null
  last_message_at: string | null
  unread_count: number | null
}
type MessageRow = { message_id: string; sender_id: string; body: string; sent_at: string }
type ConnectionRow = {
  requester_id: string
  recipient_id: string
  status: string
  requester_grants_personal: boolean
  recipient_grants_personal: boolean
}
type Contact = { id: string; display_name: string | null; username: string | null; avatar_path: string | null }

function dateLabel(value: string | null) {
  if (!value) return ''
  return new Date(value).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default function SocialDMsPage() {
  const experience = useSocialExperience()
  const [supabase] = useState(() => createClient())
  const [myId, setMyId] = useState<string | null>(null)
  const [inbox, setInbox] = useState<InboxRow[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [draft, setDraft] = useState('')
  const [peopleSearch, setPeopleSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [historyError, setHistoryError] = useState('')
  const [showConversationOnMobile, setShowConversationOnMobile] = useState(false)
  const [blockedIds, setBlockedIds] = useState<string[]>([])
  const [blocksReady, setBlocksReady] = useState(false)
  const [moderationMenuOpen, setModerationMenuOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [moderationBusy, setModerationBusy] = useState(false)
  const [moderationError, setModerationError] = useState('')
  const [moderationNotice, setModerationNotice] = useState('')
  const selectedRef = useRef<string | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const requestRef = useRef(0)
  const inboxRef = useRef<InboxRow[]>([])

  const blockedSet = new Set(blockedIds)
  const active = inbox.find(row => row.conversation_id === selectedId && !row.is_locked && row.other_profile_id && !blockedSet.has(row.other_profile_id)) ?? null
  const existingIds = new Set(inbox.filter(row => !row.is_locked).map(row => row.other_profile_id))
  const newContacts = contacts.filter(contact => !existingIds.has(contact.id) && !blockedSet.has(contact.id))
  const searchTerm = peopleSearch.trim().toLocaleLowerCase()
  // Locked conversations are deliberately never searchable by identity.
  const visibleInbox = inbox.filter(row => (row.is_locked || (row.other_profile_id && !blockedSet.has(row.other_profile_id))) && (!searchTerm ||
    [row.other_display_name, row.other_username].some(value => value?.toLocaleLowerCase().includes(searchTerm))))
  const visibleNewContacts = newContacts.filter(contact => !searchTerm ||
    [contact.display_name, contact.username].some(value => value?.toLocaleLowerCase().includes(searchTerm)))

  const loadBlocks = useCallback(async (mine: string) => {
    const result = await supabase.from('social_user_blocks').select('blocker_id,blocked_id')
      .or(`blocker_id.eq.${mine},blocked_id.eq.${mine}`)
    if (result.error) {
      setBlocksReady(false)
      setError('Unable to verify blocked members. Messaging is unavailable until this check succeeds.')
      return false
    }
    const ids = [...new Set((result.data ?? []).map(row => row.blocker_id === mine ? row.blocked_id : row.blocker_id))]
    setBlockedIds(ids)
    setBlocksReady(true)
    return true
  }, [supabase])

  const loadInbox = useCallback(async (silent = false) => {
    const result = await supabase.rpc('social_dm_inbox')
    if (result.error) {
      if (!silent) setError(result.error.message)
      return
    }
    const rows = (result.data ?? []) as InboxRow[]
    inboxRef.current = rows
    setInbox(rows)
    const current = selectedRef.current
    if (current && !rows.some(row => row.conversation_id === current && !row.is_locked)) {
      selectedRef.current = null
      requestRef.current += 1
      setSelectedId(null)
      setMessages([])
      setHistoryError('')
      setShowConversationOnMobile(false)
    }
    if (!silent) setError('')
  }, [supabase])

  const loadHistory = useCallback(async (conversationId: string, silent = false) => {
    const request = ++requestRef.current
    if (!silent) setHistoryLoading(true)
    const result = await supabase.rpc('social_dm_history', { p_conversation: conversationId, p_limit: 100 })
    if (request !== requestRef.current || selectedRef.current !== conversationId) return
    if (result.error) {
      setMessages([])
      setHistoryError('Conversation unavailable. Personal access may have changed.')
      await loadInbox(true)
    } else {
      setMessages(((result.data ?? []) as MessageRow[]).slice().reverse())
      setHistoryError('')
      void supabase.rpc('social_dm_mark_read', { p_conversation: conversationId })
    }
    if (!silent) setHistoryLoading(false)
  }, [supabase, loadInbox])

  const loadContacts = useCallback(async (mine: string) => {
    const relationships = await supabase.from('social_connections')
      .select('requester_id,recipient_id,status,requester_grants_personal,recipient_grants_personal')
      .or(`requester_id.eq.${mine},recipient_id.eq.${mine}`)
      .eq('status', 'accepted')
      .eq('requester_grants_personal', true)
      .eq('recipient_grants_personal', true)
    if (relationships.error) return
    const ids = [...new Set(((relationships.data ?? []) as ConnectionRow[])
      .map(row => row.requester_id === mine ? row.recipient_id : row.requester_id))]
    if (!ids.length) { setContacts([]); return }
    const result = await supabase.from('social_profiles')
      .select('id,display_name,username,avatar_path').in('id', ids)
    if (!result.error) setContacts((result.data ?? []) as Contact[])
  }, [supabase])

  useEffect(() => {
    if (experience !== 'individual') { setLoading(false); return }
    let cancelled = false
    async function initialize() {
      setLoading(true)
      const auth = await supabase.auth.getUser()
      if (cancelled) return
      if (!auth.data.user) { window.location.replace('/login-social'); return }
      const mine = await supabase.from('social_profiles').select('id').eq('auth_user_id', auth.data.user.id).maybeSingle()
      if (cancelled) return
      if (mine.error || !mine.data) {
        setError('Create your Social profile to use direct messaging.')
        setLoading(false)
        return
      }
      setMyId(mine.data.id)
      await loadBlocks(mine.data.id)
      await Promise.all([loadInbox(), loadContacts(mine.data.id)])
      if (!cancelled) setLoading(false)
    }
    void initialize()
    return () => { cancelled = true }
  }, [experience, supabase, loadInbox, loadContacts, loadBlocks])

  useEffect(() => {
    if (experience !== 'individual' || !myId) return
    const interval = window.setInterval(() => {
      void loadBlocks(myId)
      void loadInbox(true)
      if (selectedRef.current && inboxRef.current.some(row => row.conversation_id === selectedRef.current && !row.is_locked)) {
        void loadHistory(selectedRef.current, true)
      }
      void loadContacts(myId)
    }, 5000)
    return () => window.clearInterval(interval)
  }, [experience, myId, loadInbox, loadHistory, loadContacts, loadBlocks])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [messages.length, selectedId])

  function chooseConversation(id: string) {
    if (!blocksReady || !inbox.some(row => row.conversation_id === id && !row.is_locked && row.other_profile_id && !blockedSet.has(row.other_profile_id))) return
    setModerationMenuOpen(false)
    setReportOpen(false)
    setModerationError('')
    selectedRef.current = id
    setSelectedId(id)
    setMessages([])
    setHistoryError('')
    setShowConversationOnMobile(true)
    void loadHistory(id)
  }

  async function sendMessage(recipientId: string) {
    const body = draft.trim()
    if (!body || body.length > 4000 || sending || !blocksReady || blockedSet.has(recipientId)) return
    setSending(true)
    setHistoryError('')
    const result = await supabase.rpc('social_dm_send', { p_recipient: recipientId, p_body: body })
    if (result.error) {
      setHistoryError('Unable to send. Mutual Personal access may have changed.')
      await loadInbox(true)
    } else {
      setDraft('')
      await loadInbox(true)
      const fresh = await supabase.rpc('social_dm_inbox')
      const thread = ((fresh.data ?? []) as InboxRow[]).find(row => !row.is_locked && row.other_profile_id === recipientId)
      if (thread) {
        selectedRef.current = thread.conversation_id
        setSelectedId(thread.conversation_id)
        setShowConversationOnMobile(true)
        await loadHistory(thread.conversation_id)
      }
    }
    setSending(false)
  }

  async function moderate(recipientId: string, report: boolean) {
    if (!myId || !blocksReady || moderationBusy || recipientId === myId) return
    if (report && !reportReason.trim()) {
      setModerationError('Please describe why you are reporting this member.')
      return
    }
    setModerationBusy(true)
    setModerationError('')
    setModerationNotice('')
    try {
      if (report) {
        const auth = await supabase.auth.getSession()
        const token = auth.data.session?.access_token
        if (!token) throw new Error('Your session has expired. Please sign in again.')
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ type: 'social_report', profileId: recipientId, reason: reportReason.trim() })
        })
        if (!response.ok) throw new Error('The report could not be submitted. Please try again.')
      }
      const block = await supabase.from('social_user_blocks')
        .upsert({ blocker_id: myId, blocked_id: recipientId }, { onConflict: 'blocker_id,blocked_id' })
      if (block.error) throw new Error(block.error.message)
      // End any accepted or pending connection, so unblocking cannot restore personal access.
      const relationships = await supabase.from('social_connections').select('id')
        .or(`requester_id.eq.${myId},recipient_id.eq.${myId}`)
        .or(`requester_id.eq.${recipientId},recipient_id.eq.${recipientId}`)
      if (relationships.error) {
        setModerationError('Member blocked, but connection cleanup could not be verified. Check Manage My Connections.')
      } else {
        for (const connection of relationships.data ?? []) {
          const removed = await supabase.rpc('social_remove_connection', { p_connection_id: connection.id })
          if (removed.error || removed.data !== true) {
            setModerationError('Member blocked, but connection cleanup needs attention in Manage My Connections.')
            break
          }
        }
      }
      setBlockedIds(current => [...new Set([...current, recipientId])])
      selectedRef.current = null
      requestRef.current += 1
      setSelectedId(null)
      setMessages([])
      setDraft('')
      setShowConversationOnMobile(false)
      setModerationMenuOpen(false)
      setReportOpen(false)
      setReportReason('')
      setModerationNotice(report ? 'Report submitted and member blocked.' : 'Member blocked.')
      await Promise.all([loadInbox(true), loadContacts(myId)])
    } catch (cause) {
      setModerationError(cause instanceof Error ? cause.message : 'Unable to complete moderation action.')
    } finally {
      setModerationBusy(false)
    }
  }

  const avatar = (path: string | null, name: string) => path
    ? <img src={supabase.storage.from('social-avatars').getPublicUrl(path).data.publicUrl} alt={`${name}'s avatar`} className="h-11 w-11 shrink-0 rounded-full object-cover" />
    : <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-violet-200"><UserRound className="h-5 w-5" /></span>

  if (experience !== 'individual') return (
    <main className="mx-auto max-w-4xl px-5 py-10 text-slate-100">
      <div className="rounded-2xl border border-white/10 bg-[#101b30] p-8"><LockKeyhole className="mb-3 h-7 w-7 text-violet-300" /><h1 className="text-xl font-bold">Direct messaging is for Individual members</h1><p className="mt-2 text-sm text-slate-300">Switch to your Individual Social experience to access messages.</p><Link href="/social" className="mt-5 inline-flex text-sm font-semibold text-violet-300 hover:underline">Return to Social</Link></div>
    </main>
  )

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-7 pt-0 text-slate-100 sm:px-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-gradient-to-r from-[#101b30] via-[#201344] to-[#101b30] px-5 py-2 shadow-lg sm:px-8 sm:py-3">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 sm:flex-nowrap">
          <h1 className="shrink-0 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-[44px]">Let&apos;s get</h1>
          <Image src="/social-branding-transparent.png" alt="Social" width={420} height={220} priority className="h-[90px] w-auto max-w-[220px] object-contain sm:h-[108px] sm:max-w-[300px] lg:h-[120px] lg:max-w-[340px]" />
        </div>
        <button type="button" onClick={() => { void loadInbox(); if (myId) void loadContacts(myId); if (selectedRef.current) void loadHistory(selectedRef.current) }} className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"><RefreshCw className="h-4 w-4" /> Refresh</button>
      </div>
      {moderationNotice && <p role="status" className="mb-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">{moderationNotice}</p>}
      {moderationError && <p role="alert" className="mb-4 rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200">{moderationError}</p>}
      {error && <p role="alert" className="mb-4 rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}
      <div className="grid min-h-[570px] overflow-hidden rounded-2xl border border-white/10 bg-[#101b30] shadow-xl md:grid-cols-[300px_minmax(0,1fr)]">
        <section className={`${showConversationOnMobile ? 'hidden md:flex' : 'flex'} min-h-[570px] flex-col border-r border-white/10`} aria-label="Conversations">
          <div className="border-b border-white/10 px-4 py-4">
            <label htmlFor="social-dm-people-search" className="mb-2 block text-sm font-bold text-white">Search my people</label>
            <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-[#16233a] px-3 focus-within:border-violet-400">
              <Search className="h-4 w-4 shrink-0 text-violet-300" aria-hidden="true" />
              <input id="social-dm-people-search" type="search" value={peopleSearch} onChange={event => setPeopleSearch(event.target.value)} placeholder="Search my people..." autoComplete="off" className="w-full min-w-0 bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-slate-400" />
            </div>
          </div>
          <div className="max-h-[550px] flex-1 overflow-y-auto p-2">
            {loading ? <p className="flex items-center gap-2 p-4 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading conversations...</p> : null}
            {!loading && inbox.length === 0 && <p className="p-4 text-sm text-slate-400">No conversations yet. Start one with a mutual Personal connection below.</p>}
            {!loading && searchTerm && visibleInbox.every(row => row.is_locked) && visibleNewContacts.length === 0 && <p className="px-4 py-3 text-xs text-slate-400">No matching people found.</p>}
            {blocksReady && visibleInbox.map(row => row.is_locked ? (
              <div key={row.conversation_id} className="mb-1 flex cursor-not-allowed items-center gap-3 rounded-xl border border-white/5 bg-slate-700/20 p-3 opacity-60" aria-label="Locked conversation">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-700/50"><LockKeyhole className="h-5 w-5 text-slate-400" /></span><span className="flex-1 text-sm font-semibold text-slate-400">Locked</span><LockKeyhole className="h-4 w-4 text-slate-500" />
              </div>
            ) : (
              <button key={row.conversation_id} type="button" onClick={() => chooseConversation(row.conversation_id)} className={`mb-1 flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${selectedId === row.conversation_id ? 'bg-violet-500/20' : 'hover:bg-white/5'}`}>
                {avatar(row.other_avatar_path, row.other_display_name || 'Member')}
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{row.other_display_name || row.other_username || 'Member'}</span><span className="block truncate text-xs text-slate-400">{row.last_message || 'Conversation started'}</span></span>
                <span className="flex flex-col items-end gap-1">{Number(row.unread_count) > 0 && <span className="rounded-full bg-violet-500 px-2 py-0.5 text-[10px] font-bold">{row.unread_count}</span>}<span className="text-[10px] text-slate-500">{row.last_message_at ? new Date(row.last_message_at).toLocaleDateString() : ''}</span></span>
              </button>
            ))}
            {blocksReady && !loading && visibleNewContacts.length > 0 && <div className="mt-5 border-t border-white/10 pt-3"><p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">Start a conversation</p>{visibleNewContacts.map(contact => (
              <button key={contact.id} type="button" onClick={() => { setDraft(''); setHistoryError(''); selectedRef.current = null; requestRef.current += 1; setSelectedId(`new:${contact.id}`); setMessages([]); setShowConversationOnMobile(true) }} className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-white/5">{avatar(contact.avatar_path, contact.display_name || 'Member')}<span className="min-w-0 flex-1 truncate text-sm font-semibold">{contact.display_name || contact.username || 'Member'}</span><MessageCircle className="h-4 w-4 text-violet-300" /></button>
            ))}</div>}
          </div>
        </section>
        <section className={`${showConversationOnMobile ? 'flex' : 'hidden md:flex'} min-h-[570px] min-w-0 flex-col`} aria-label="Message thread">
          {(() => {
            const starting = selectedId?.startsWith('new:') ? contacts.find(contact => contact.id === selectedId.slice(4)) : null
            const recipientId = blocksReady ? (active?.other_profile_id || starting?.id || null) : null
            const displayName = active?.other_display_name || active?.other_username || starting?.display_name || starting?.username || 'Member'
            if (!recipientId) return <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-slate-400"><MessageCircle className="h-10 w-10 text-violet-300/60" /><p className="font-semibold">Select a conversation</p><p className="max-w-sm text-sm">Your inbox is reserved for members with mutual Personal access.</p></div>
            return <>
              <div className="flex items-center gap-3 border-b border-white/10 p-4"><button type="button" className="md:hidden" aria-label="Back to conversations" onClick={() => setShowConversationOnMobile(false)}><ArrowLeft className="h-5 w-5" /></button>{avatar(active?.other_avatar_path || starting?.avatar_path || null, displayName)}<div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{displayName}</p><p className="text-xs text-violet-300">Mutual Personal connection</p></div><div className="relative shrink-0"><button type="button" aria-label="Conversation options" aria-expanded={moderationMenuOpen} onClick={() => setModerationMenuOpen(open => !open)} className="rounded-lg border border-white/20 p-2 text-slate-200 hover:bg-white/10"><MoreHorizontal className="h-5 w-5" /></button>{moderationMenuOpen && <div className="absolute right-0 top-11 z-30 w-48 rounded-xl border border-white/20 bg-[#17243a] p-1 shadow-xl"><button type="button" disabled={moderationBusy} onClick={() => void moderate(recipientId, false)} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-white/10">Block User</button><button type="button" onClick={() => { setModerationMenuOpen(false); setReportOpen(true); setModerationError('') }} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-rose-200 hover:bg-white/10">Report &amp; Block</button></div>}</div></div>
              {reportOpen && <div className="border-b border-rose-400/20 bg-[#17243a] p-4"><p className="mb-2 flex items-center gap-2 text-sm font-bold text-white"><ShieldBan className="h-4 w-4 text-rose-300" /> Report &amp; Block {displayName}</p><p className="mb-3 text-xs text-slate-300">Tell our moderation team what happened. Reporting also blocks this member.</p><textarea value={reportReason} onChange={event => setReportReason(event.target.value)} rows={3} maxLength={2000} placeholder="Reason for report..." className="w-full resize-y rounded-lg border border-white/20 bg-slate-950/70 p-3 text-sm text-white outline-none focus:border-violet-400" /><div className="mt-3 flex gap-2"><button type="button" disabled={moderationBusy || !reportReason.trim()} onClick={() => void moderate(recipientId, true)} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{moderationBusy ? 'Submitting...' : 'Submit Report & Block'}</button><button type="button" disabled={moderationBusy} onClick={() => { setReportOpen(false); setReportReason('') }} className="rounded-lg border border-white/20 px-4 py-2 text-sm">Cancel</button></div></div>}
              <div className="max-h-[550px] min-h-0 flex-1 space-y-3 overflow-y-auto p-4 sm:p-5" aria-live="polite">
                {historyLoading && <p className="flex items-center gap-2 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading messages...</p>}
                {!historyLoading && messages.length === 0 && <p className="py-8 text-center text-sm text-slate-400">No messages yet. Say hello!</p>}
                {messages.map(message => <div key={message.message_id} className={`flex ${message.sender_id === myId ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] rounded-2xl px-4 py-3 sm:max-w-[75%] ${message.sender_id === myId ? 'bg-violet-600 text-white' : 'bg-white/10 text-slate-100'}`}><p className="whitespace-pre-wrap break-words text-sm">{message.body}</p><p className="mt-1 text-right text-[10px] opacity-70">{dateLabel(message.sent_at)}</p></div></div>)}
                <div ref={bottomRef} />
              </div>
              {historyError && <p role="alert" className="mx-4 mb-2 text-xs text-rose-300">{historyError}</p>}
              <form onSubmit={event => { event.preventDefault(); if (recipientId) void sendMessage(recipientId) }} className="flex items-end gap-2 border-t border-white/10 p-3 sm:p-4"><textarea value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); if (recipientId) void sendMessage(recipientId) } }} rows={2} maxLength={4000} placeholder="Write a message... (Enter to send)" aria-label="Write a message" className="min-h-12 flex-1 resize-none rounded-xl border border-white/20 bg-[#16233a] px-3 py-3 text-sm text-white outline-none placeholder:text-slate-400 focus:border-violet-400" /><button type="submit" disabled={!draft.trim() || sending || !!historyError || !blocksReady || moderationBusy} className="inline-flex h-12 items-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-bold text-white hover:bg-violet-500 disabled:opacity-40">{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}<span className="hidden sm:inline">Send</span></button></form>
            </>
          })()}
        </section>
      </div>
      <p className="mt-3 text-xs text-slate-500">If Personal access is revoked, the conversation becomes a locked, anonymous card. Neither participant can open it. Stored messages are retained.</p>
    </main>
  )
}
