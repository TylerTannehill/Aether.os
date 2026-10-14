'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, AtSign, BriefcaseBusiness, Check, LockKeyhole, Loader2, ShieldCheck, UserRound, UserRoundPlus, X } from 'lucide-react'

type PublicProfile = {
  id: string
  display_name: string | null
  username: string | null
  bio: string | null
}

type Connection = {
  id: string
  requester_id: string
  recipient_id: string
  status: 'pending' | 'accepted'
  requester_grants_personal: boolean
  recipient_grants_personal: boolean
}

export default function SocialPublicProfilePage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const [supabase] = useState(() => createClient())
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [ownProfile, setOwnProfile] = useState(false)
  const [hasMyProfile, setHasMyProfile] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [myProfileId, setMyProfileId] = useState<string | null>(null)
  const [connection, setConnection] = useState<Connection | null>(null)
  const [connectionLoading, setConnectionLoading] = useState(false)
  const [connectionBusy, setConnectionBusy] = useState(false)
  const [connectionError, setConnectionError] = useState('')
  const [connectionNotice, setConnectionNotice] = useState('')

  useEffect(() => {
    let active = true

    async function loadProfile() {
      setLoading(true)
      setError('')
      setProfile(null)
      setOwnProfile(false)
      setHasMyProfile(false)
      setMyProfileId(null)
      setConnection(null)
      setConnectionError('')
      setConnectionNotice('')

      if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        setError('This profile link is invalid.')
        setLoading(false)
        return
      }

      const { data: auth, error: authError } = await supabase.auth.getUser()
      if (!active) return
      if (authError || !auth.user) {
        window.location.replace('/login-social')
        return
      }

      const { data, error: profileError } = await supabase
        .from('social_profiles')
        .select('id, display_name, username, bio')
        .eq('id', id)
        .maybeSingle()

      if (!active) return
      if (profileError) {
        setError('We could not load this profile right now.')
      } else if (!data) {
        setError('This Social profile was not found or is not available to you.')
      } else {
        setProfile(data as PublicProfile)
        const { data: mine, error: mineError } = await supabase
          .from('social_profiles')
          .select('id')
          .eq('auth_user_id', auth.user.id)
          .maybeSingle()
        if (!active) return
        if (mineError) {
          setError('We could not check your Social identity right now.')
        } else {
          setHasMyProfile(Boolean(mine))
          setOwnProfile(mine?.id === data.id)
          setMyProfileId(mine?.id ?? null)
          if (mine?.id && mine.id !== data.id) {
            setConnectionLoading(true)
            const { data: relationships, error: connectionFetchError } = await supabase
              .from('social_connections')
              .select('id, requester_id, recipient_id, status, requester_grants_personal, recipient_grants_personal')
              .or(`and(requester_id.eq.${mine.id},recipient_id.eq.${data.id}),and(requester_id.eq.${data.id},recipient_id.eq.${mine.id})`)
              .limit(1)
            if (!active) return
            if (connectionFetchError) {
              setConnectionError('Could not load connection status: ' + connectionFetchError.message)
            } else {
              setConnection((relationships?.[0] as Connection | undefined) ?? null)
            }
            setConnectionLoading(false)
          }
        }
      }
      if (active) setLoading(false)
    }

    void loadProfile()
    return () => { active = false }
  }, [id, supabase])

  async function refreshConnection(mine: string, other: string) {
    const { data, error: fetchError } = await supabase
      .from('social_connections')
      .select('id, requester_id, recipient_id, status, requester_grants_personal, recipient_grants_personal')
      .or(`and(requester_id.eq.${mine},recipient_id.eq.${other}),and(requester_id.eq.${other},recipient_id.eq.${mine})`)
      .limit(1)
    if (fetchError) throw new Error(fetchError.message)
    setConnection((data?.[0] as Connection | undefined) ?? null)
  }

  async function performConnectionAction(action: 'connect' | 'accept' | 'remove' | 'grant' | 'revoke') {
    if (!myProfileId || !profile || connectionBusy) return
    setConnectionBusy(true)
    setConnectionError('')
    setConnectionNotice('')
    try {
      // All mutations are authenticated. Accept/remove/grant/revoke use the
      // owner-checked database functions; the insert is guarded by its RLS policy.
      const { data: auth, error: authError } = await supabase.auth.getUser()
      if (authError || !auth.user) throw new Error('Your session expired. Please sign in again.')
      if (action === 'connect') {
        if (connection) throw new Error('A connection request already exists.')
        const { error: insertError } = await supabase.from('social_connections').insert({
          requester_id: myProfileId,
          recipient_id: profile.id,
          status: 'pending',
        })
        if (insertError) throw new Error(insertError.message)
        setConnectionNotice('Connection request sent.')
      } else {
        if (!connection) throw new Error('Connection no longer exists. Refresh this page.')
        const functionName = action === 'accept'
          ? 'social_accept_connection'
          : action === 'remove'
            ? 'social_remove_connection'
            : 'social_set_personal_access'
        const args = action === 'grant' || action === 'revoke'
          ? { p_connection_id: connection.id, p_allow: action === 'grant' }
          : { p_connection_id: connection.id }
        const { data: succeeded, error: rpcError } = await supabase.rpc(functionName, args)
        if (rpcError) throw new Error(rpcError.message)
        if (succeeded !== true) throw new Error('The action could not be completed. The connection may have changed.')
        setConnectionNotice(action === 'accept' ? 'Professional connection accepted.'
          : action === 'remove' ? 'Connection or request removed.'
          : action === 'grant' ? 'Personal access granted to this connection.'
          : 'Personal access revoked from this connection.')
      }
      await refreshConnection(myProfileId, profile.id)
    } catch (err) {
      setConnectionError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setConnectionBusy(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 text-slate-100 sm:px-6">
      <Link href="/social/network" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-violet-300 transition hover:text-violet-200">
        <ArrowLeft className="h-4 w-4" /> Back to Network
      </Link>

      {loading ? (
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#101b30] p-8 text-slate-300" role="status">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading profile...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-white/10 bg-[#101b30] p-8">
          <h1 className="text-xl font-bold">Profile unavailable</h1>
          <p className="mt-3 text-sm text-slate-300">{error}</p>
          <Link href="/social/network" className="mt-5 inline-block text-sm font-semibold text-violet-300 hover:underline">Return to Network</Link>
        </div>
      ) : profile ? (
        <div className="space-y-5">
          <article className="overflow-hidden rounded-2xl border border-white/10 bg-[#101b30] shadow-xl">
            <div className="h-28 bg-gradient-to-r from-violet-700/70 via-indigo-700/50 to-blue-700/50 sm:h-36" />
            <div className="px-5 pb-8 sm:px-8">
              <div className="-mt-10 mb-5 flex items-end justify-between gap-3">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-[#101b30] bg-[#253451] text-violet-200">
                  <UserRound className="h-9 w-9" aria-hidden="true" />
                </div>
                {ownProfile && (
                  <Link href="/social/profile" className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold transition hover:bg-white/10">
                    Edit My Profile
                  </Link>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold sm:text-3xl">{profile.display_name || 'Aether Social Member'}</h1>
                <span className="inline-flex items-center gap-1 rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-200">
                  <BriefcaseBusiness className="h-3.5 w-3.5" /> Professional
                </span>
              </div>
              {profile.username && (
                <p className="mt-2 flex items-center gap-1 text-sm text-violet-300">
                  <AtSign className="h-4 w-4" aria-hidden="true" /> {profile.username}
                </p>
              )}
              <p className="mt-6 whitespace-pre-wrap text-sm leading-7 text-slate-300">
                {profile.bio || 'This member has not added a bio yet.'}
              </p>
            </div>
          </article>

          {!ownProfile && (
            <section className="rounded-2xl border border-white/10 bg-[#101b30] p-5 shadow-xl sm:p-7" aria-labelledby="connection-heading">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 id="connection-heading" className="flex items-center gap-2 text-lg font-bold">
                    <UserRoundPlus className="h-5 w-5 text-violet-300" /> Professional connection
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
                    Professional profiles are visible to everyone. Connections let you build your network and manage personal sharing separately.
                  </p>
                </div>
                {connectionLoading ? (
                  <span className="inline-flex items-center gap-2 text-sm text-slate-300"><Loader2 className="h-4 w-4 animate-spin" /> Checking connection...</span>
                ) : !hasMyProfile ? (
                  <Link href="/social/profile" className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white hover:bg-violet-500">Create My Profile</Link>
                ) : !connection ? (
                  <button type="button" disabled={connectionBusy} onClick={() => void performConnectionAction('connect')}
                    className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-500 disabled:opacity-50">
                    {connectionBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserRoundPlus className="h-4 w-4" />} Connect
                  </button>
                ) : connection.status === 'pending' && connection.recipient_id === myProfileId ? (
                  <div className="flex flex-wrap gap-2">
                    <button type="button" disabled={connectionBusy} onClick={() => void performConnectionAction('accept')}
                      className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-violet-500 disabled:opacity-50">
                      <Check className="h-4 w-4" /> Accept
                    </button>
                    <button type="button" disabled={connectionBusy} onClick={() => void performConnectionAction('remove')}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold hover:bg-white/10 disabled:opacity-50">
                      <X className="h-4 w-4" /> Decline
                    </button>
                  </div>
                ) : connection.status === 'pending' ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-semibold text-amber-200">Request pending</span>
                    <button type="button" disabled={connectionBusy} onClick={() => void performConnectionAction('remove')}
                      className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold hover:bg-white/10 disabled:opacity-50">Cancel request</button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-300"><Check className="h-4 w-4" /> Connected</span>
                    <button type="button" disabled={connectionBusy} onClick={() => {
                      if (window.confirm('Disconnect professionally? This will also remove personal-access permissions in both directions.')) void performConnectionAction('remove')
                    }} className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold hover:bg-white/10 disabled:opacity-50">Disconnect</button>
                  </div>
                )}
              </div>
              {connectionError && <p role="alert" className="mt-4 rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200">{connectionError}</p>}
              {connectionNotice && <p role="status" className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">{connectionNotice}</p>}
              {!hasMyProfile && <p className="mt-4 text-sm text-amber-200">Create your Social profile before sending connection requests.</p>}
              <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                  <LockKeyhole className="h-4 w-4 text-violet-300" /> Personal access
                </h3>
                {connection?.status === 'accepted' && myProfileId ? (
                  <>
                    <p className="mt-2 text-sm leading-6 text-slate-300">You control whether this person can view <strong>your</strong> personal profile and posts. This does not change whether you can view theirs.</p>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <span className="text-sm font-medium text-slate-200">
                        {((connection.requester_id === myProfileId) ? connection.requester_grants_personal : connection.recipient_grants_personal)
                          ? 'You allow this person to see your personal content.'
                          : 'This person cannot see your personal content.'}
                      </span>
                      <button type="button" disabled={connectionBusy} onClick={() => void performConnectionAction(
                        ((connection.requester_id === myProfileId) ? connection.requester_grants_personal : connection.recipient_grants_personal) ? 'revoke' : 'grant'
                      )} className="rounded-xl border border-violet-400/40 px-4 py-2.5 text-sm font-semibold text-violet-200 transition hover:bg-violet-500/10 disabled:opacity-50">
                        {connectionBusy ? 'Saving...' : ((connection.requester_id === myProfileId) ? connection.requester_grants_personal : connection.recipient_grants_personal)
                          ? 'Revoke personal access' : 'Allow personal access'}
                      </button>
                    </div>
                    <p className="mt-3 text-xs text-slate-400">Personal profile and post visibility will be enforced separately when those features launch.</p>
                  </>
                ) : (
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Personal access can only be granted after a professional connection is accepted. Each person controls access to their own personal content independently.
                  </p>
                )}
                <div className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-400">
                  <ShieldCheck className="h-4 w-4" /> Professional profiles remain visible regardless of connection status.
                </div>
              </div>
            </section>
          )}
        </div>
      ) : null}
    </main>
  )
}
