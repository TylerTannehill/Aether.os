'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useSocialExperience } from '@/components/layout/social-shell'
import { ArrowLeft, ArrowRight, AtSign, BriefcaseBusiness, Check, Heart, LockKeyhole, Loader2, MessageCircle, Music2, Pause, Play, Send, ShieldCheck, UserRound, UserRoundPlus, X } from 'lucide-react'

type PublicProfile = {
  id: string
  display_name: string | null
  username: string | null
  bio: string | null
  avatar_path: string | null
}

type ExperiencePreview = {
  id: string
  company_name: string
  job_title: string
  start_date: string
  end_date: string | null
  is_current: boolean
}

type EducationPreview = {
  id: string
  entry_type: 'high_school' | 'college' | 'certification'
  institution_name: string
  degree: string | null
  field_of_study: string | null
  issuing_organization: string | null
  start_date: string | null
  end_date: string | null
  issue_date: string | null
  expiration_date: string | null
  credential_url: string | null
  description: string | null
  display_order: number
}

function monthLabel(value: string | null) {
  if (!value) return 'Present'
  const [year, month] = value.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

type Connection = {
  id: string
  requester_id: string
  recipient_id: string
  status: 'pending' | 'accepted'
  requester_grants_personal: boolean
  recipient_grants_personal: boolean
}

type SocialContext = 'professional' | 'personal'
type SocialPost = { id: string; author_id: string; context: SocialContext; content: string; created_at: string }
type PostLike = { id: string; post_id: string; profile_id: string }
type PostComment = { id: string; post_id: string; profile_id: string; content: string; created_at: string }
type CommentAuthor = { id: string; display_name: string | null; username: string | null }
type PersonalDetails = { profile_id: string; bio: string | null; avatar_path: string | null; jam_url: string | null }
type JamTrack = { title: string; artist: string; artwork: string | null; preview: string | null }

function appleTrackId(url: string): string | null {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:' || !/(^|\.)music\.apple\.com$/i.test(parsed.hostname)) return null
    const id = parsed.searchParams.get('i') || parsed.pathname.match(/\/(?:id)(\d+)(?:\/)?$/)?.[1]
    return id && /^\d+$/.test(id) ? id : null
  } catch { return null }
}

function postBody(content: string) {
  return content.split(/(https?:\/\/[^\s]+)/g).map((part, index) => {
    if (!/^https?:\/\//i.test(part)) return <span key={index}>{part}</span>
    const url = part.replace(/[),.!?;:]+$/, '')
    const tail = part.slice(url.length)
    return <span key={index}><a href={url} target="_blank" rel="noopener noreferrer" className="break-all text-violet-300 underline underline-offset-2 hover:text-violet-200">{url}</a>{tail}</span>
  })
}

export default function SocialPublicProfilePage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const searchParams = useSearchParams()
  const requestedPersonal = searchParams.get('view') === 'personal'
  const experienceMode = useSocialExperience()
  const isEmployer = experienceMode === 'employer'
  const isIndividual = experienceMode === 'individual'
  const [supabase] = useState(() => createClient())
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [experience, setExperience] = useState<ExperiencePreview[]>([])
  const [education, setEducation] = useState<EducationPreview[]>([])
  const [experienceError, setExperienceError] = useState('')
  const [educationError, setEducationError] = useState('')
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
  const [context, setContext] = useState<SocialContext>('professional')
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [postsLoading, setPostsLoading] = useState(false)
  const [postsError, setPostsError] = useState('')
  const [likes, setLikes] = useState<PostLike[]>([])
  const [comments, setComments] = useState<PostComment[]>([])
  const [commentAuthors, setCommentAuthors] = useState<Record<string, CommentAuthor>>({})
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({})
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({})
  const [engagementBusy, setEngagementBusy] = useState<string | null>(null)
  const [engagementError, setEngagementError] = useState<Record<string, string>>({})
  const [personalDetails, setPersonalDetails] = useState<PersonalDetails | null>(null)
  const [personalError, setPersonalError] = useState('')
  const [jamTrack, setJamTrack] = useState<JamTrack | null>(null)
  const [jamLoading, setJamLoading] = useState(false)
  const [jamError, setJamError] = useState('')
  const [jamPlaying, setJamPlaying] = useState(false)
  const jamAudioRef = useRef<HTMLAudioElement | null>(null)


  useEffect(() => {
    let active = true

    async function loadProfile() {
      setLoading(true)
      setError('')
      setProfile(null)
      setExperience([])
      setEducation([])
      setExperienceError('')
      setEducationError('')
      setOwnProfile(false)
      setHasMyProfile(false)
      setMyProfileId(null)
      setConnection(null)
      setConnectionError('')
      setConnectionNotice('')
      setContext('professional')
      setPersonalDetails(null)
      setPersonalError('')
      setPosts([])

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
        .select('id, display_name, username, bio, avatar_path')
        .eq('id', id)
        .maybeSingle()

      if (!active) return
      if (profileError) {
        setError('We could not load this profile right now.')
      } else if (!data) {
        setError('This Social profile was not found or is not available to you.')
      } else {
        setProfile(data as PublicProfile)
        const [positionsResult, educationResult] = await Promise.all([
          supabase.from('social_professional_experience')
            .select('id, company_name, job_title, start_date, end_date, is_current')
            .eq('profile_id', data.id)
            .order('is_current', { ascending: false })
            .order('start_date', { ascending: false }),
          supabase.from('social_professional_education')
            .select('id, entry_type, institution_name, degree, field_of_study, issuing_organization, start_date, end_date, issue_date, expiration_date, credential_url, description, display_order')
            .eq('profile_id', data.id)
            .order('display_order', { ascending: true }),
        ])
        if (!active) return
        if (positionsResult.error) setExperienceError('Experience unavailable right now.')
        else setExperience((positionsResult.data ?? []) as ExperiencePreview[])
        if (educationResult.error) setEducationError('Education unavailable right now.')
        else setEducation(((educationResult.data ?? []) as EducationPreview[]).sort((a, b) => {
          const aDate = a.entry_type === 'certification' ? a.issue_date : a.start_date
          const bDate = b.entry_type === 'certification' ? b.issue_date : b.start_date
          if (!aDate && !bDate) return a.display_order - b.display_order
          if (!aDate) return 1
          if (!bDate) return -1
          return bDate.localeCompare(aDate) || a.display_order - b.display_order
        }))
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
          if (isIndividual && mine?.id && mine.id !== data.id) {
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
  }, [id, supabase, isIndividual])

  const canViewPersonal = isIndividual && (ownProfile || Boolean(
    connection?.status === 'accepted' && myProfileId && (
      (connection.requester_id === profile?.id && connection.recipient_id === myProfileId && connection.requester_grants_personal) ||
      (connection.recipient_id === profile?.id && connection.requester_id === myProfileId && connection.recipient_grants_personal)
    )
  ))

  useEffect(() => {
    if (requestedPersonal && isIndividual && !loading && profile && canViewPersonal) setContext('personal')
  }, [requestedPersonal, isIndividual, loading, profile, canViewPersonal])

  useEffect(() => {
    let active = true
    if (!profile || loading || !isIndividual && !isEmployer) return
    if (context === 'personal' && !canViewPersonal) {
      setPosts([])
      setPersonalDetails(null)
      setPostsError('')
      setPostsLoading(false)
      return
    }
    setPostsLoading(true)
    setPostsError('')
    setPosts([])
    setLikes([])
    setComments([])
    setCommentAuthors({})
    async function loadPosts() {
      const result = await supabase.from('social_posts')
        .select('id, author_id, context, content, created_at')
        .eq('author_id', profile!.id)
        .eq('context', context)
        .order('created_at', { ascending: false })
        .limit(100)
      if (!active) return
      if (result.error) setPostsError('Unable to load posts: ' + result.error.message)
      else setPosts((result.data ?? []) as SocialPost[])
      setPostsLoading(false)
    }
    void loadPosts()
    return () => { active = false }
  }, [supabase, profile, loading, context, canViewPersonal, isIndividual, isEmployer])

  useEffect(() => {
    let active = true
    if (!profile || loading || !isIndividual || context !== 'personal' || !canViewPersonal) {
      setPersonalDetails(null)
      setPersonalError('')
      return
    }
    async function loadPersonal() {
      const result = await supabase.from('social_personal_profiles')
        .select('profile_id, bio, avatar_path, jam_url')
        .eq('profile_id', profile!.id)
        .maybeSingle()
      if (!active) return
      if (result.error) setPersonalError('Personal profile details are not available to this viewer.')
      else { setPersonalDetails((result.data as PersonalDetails | null) ?? null); setPersonalError('') }
    }
    void loadPersonal()
    return () => { active = false }
  }, [supabase, profile, loading, context, canViewPersonal, isIndividual, isEmployer])

  useEffect(() => {
    const url = context === 'personal' && canViewPersonal ? personalDetails?.jam_url?.trim() : null
    jamAudioRef.current?.pause()
    jamAudioRef.current = null
    setJamPlaying(false)
    setJamTrack(null)
    setJamError('')
    if (!url) { setJamLoading(false); return }
    const trackId = appleTrackId(url)
    if (!trackId) { setJamError('This Apple Music link does not contain a song ID.'); setJamLoading(false); return }

    const controller = new AbortController()
    setJamLoading(true)
    async function loadJam() {
      try {
        const response = await fetch(`https://itunes.apple.com/lookup?id=${encodeURIComponent(trackId!)}&entity=song`, { signal: controller.signal })
        if (!response.ok) throw new Error('Apple Music lookup unavailable.')
        const result = await response.json()
        const song = (result.results as Array<Record<string, unknown>> | undefined)?.find(item => item.kind === 'song' && String(item.trackId) === trackId)
        if (!song) throw new Error('Song details are not available for this link.')
        const artwork = typeof song.artworkUrl100 === 'string' ? song.artworkUrl100.replace(/100x100bb/, '200x200bb') : null
        const preview = typeof song.previewUrl === 'string' && song.previewUrl.startsWith('https://') ? song.previewUrl : null
        if (!controller.signal.aborted) setJamTrack({
          title: String(song.trackName || 'Untitled song'),
          artist: String(song.artistName || 'Unknown artist'),
          artwork,
          preview,
        })
      } catch (err) {
        if (!controller.signal.aborted) setJamError(err instanceof Error ? err.message : 'Unable to load this jam.')
      } finally {
        if (!controller.signal.aborted) setJamLoading(false)
      }
    }
    void loadJam()
    return () => { controller.abort(); jamAudioRef.current?.pause(); jamAudioRef.current = null }
  }, [context, canViewPersonal, personalDetails?.jam_url])

  async function toggleJam() {
    if (!jamTrack?.preview || !canViewPersonal || context !== 'personal') return
    if (jamPlaying) { jamAudioRef.current?.pause(); setJamPlaying(false); return }
    try {
      if (!jamAudioRef.current) {
        const audio = new Audio(jamTrack.preview)
        audio.onended = () => setJamPlaying(false)
        audio.onerror = () => { setJamPlaying(false); setJamError('The preview could not be played.') }
        jamAudioRef.current = audio
      }
      await jamAudioRef.current.play()
      setJamPlaying(true)
      setJamError('')
    } catch { setJamPlaying(false); setJamError('The preview could not be played.') }
  }

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
    if (!isIndividual || !myProfileId || !profile || connectionBusy) return
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

  async function toggleLike(postId: string) {
    if (!isIndividual || !myProfileId || engagementBusy || (context === 'personal' && !canViewPersonal)) return
    setEngagementBusy(postId)
    setEngagementError(previous => ({ ...previous, [postId]: '' }))
    const existing = likes.find(like => like.post_id === postId && like.profile_id === myProfileId)
    const result = existing
      ? await supabase.from('social_post_likes').delete().eq('id', existing.id)
      : await supabase.from('social_post_likes').insert({ post_id: postId, profile_id: myProfileId }).select('id, post_id, profile_id').single()
    if (result.error) setEngagementError(previous => ({ ...previous, [postId]: result.error!.message }))
    else if (existing) setLikes(previous => previous.filter(like => like.id !== existing.id))
    else if (result.data) setLikes(previous => [...previous, result.data as PostLike])
    setEngagementBusy(null)
  }

  async function submitComment(postId: string, event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const content = (commentDrafts[postId] || '').trim()
    if (!isIndividual || !myProfileId || !content || content.length > 2000 || engagementBusy || (context === 'personal' && !canViewPersonal)) return
    setEngagementBusy(postId)
    setEngagementError(previous => ({ ...previous, [postId]: '' }))
    const { data, error: commentError } = await supabase.from('social_post_comments')
      .insert({ post_id: postId, profile_id: myProfileId, content })
      .select('id, post_id, profile_id, content, created_at').single()
    if (commentError) setEngagementError(previous => ({ ...previous, [postId]: commentError.message }))
    else if (data) {
      setComments(previous => [...previous, data as PostComment])
      // Use the signed-in individual's identity, not the viewed profile's identity.
      const { data: mine } = await supabase.from('social_profiles').select('id, display_name, username').eq('id', myProfileId).maybeSingle()
      if (mine) setCommentAuthors(previous => ({ ...previous, [myProfileId]: mine as CommentAuthor }))
      setCommentDrafts(previous => ({ ...previous, [postId]: '' }))
      setExpandedComments(previous => ({ ...previous, [postId]: true }))
    }
    setEngagementBusy(null)
  }

  const currentPosition = experience.find(item => item.is_current && item.job_title && item.company_name)

  const avatarUrl = profile?.avatar_path
    ? supabase.storage.from('social-avatars').getPublicUrl(profile.avatar_path).data.publicUrl
    : null

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
            <div className={`flex h-16 items-center justify-end px-3 sm:h-20 sm:px-5 ${context === 'personal' ? 'bg-gradient-to-r from-fuchsia-800 via-violet-800 to-indigo-800' : 'bg-gradient-to-r from-violet-700 via-indigo-700 to-blue-800'}`}>
              <div className="inline-flex rounded-xl border border-slate-300 bg-white p-1 shadow-sm" role="group" aria-label="Profile context">
                <button type="button" onClick={() => setContext('professional')} aria-pressed={context === 'professional'} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${context === 'professional' ? 'bg-violet-700 text-white' : 'text-slate-600 hover:bg-slate-100'}`}><BriefcaseBusiness className="h-4 w-4" /> Professional</button>
                {isIndividual && <button type="button" onClick={() => setContext('personal')} aria-pressed={context === 'personal'} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${context === 'personal' ? 'bg-violet-700 text-white' : 'text-slate-600 hover:bg-slate-100'}`}><Heart className="h-4 w-4" /> Personal</button>}
              </div>
            </div>
            <div className="flex items-center gap-4 px-5 pb-5 sm:gap-6 sm:px-6">
              <div className="-mt-12 h-28 w-28 shrink-0 overflow-hidden rounded-full border-4 border-[#101b30] bg-[#253451] text-violet-200 shadow-lg sm:-mt-14 sm:h-32 sm:w-32">
                {(context === 'personal' && canViewPersonal && personalDetails?.avatar_path
                  ? supabase.storage.from('social-avatars').getPublicUrl(personalDetails.avatar_path).data.publicUrl
                  : context === 'professional' ? avatarUrl : null)
                  ? <img src={context === 'personal' ? supabase.storage.from('social-avatars').getPublicUrl(personalDetails!.avatar_path!).data.publicUrl : avatarUrl!} alt={`${profile.display_name || 'Member'}'s ${context} profile picture`} className="h-full w-full object-cover" />
                  : <div className="flex h-full w-full items-center justify-center"><UserRound className="h-12 w-12" /></div>}
              </div>
              <div className="min-w-0 flex-1 pt-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="break-words text-xl font-bold sm:text-2xl">{profile.display_name || 'Aether Social Member'}</h1>
                  <span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-2.5 py-1 text-xs font-semibold text-violet-200">{context === 'personal' ? 'Personal' : 'Professional'}</span>
                </div>
                {(profile.username || currentPosition) && (
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-violet-300">
                    {profile.username && <span className="inline-flex items-center gap-1"><AtSign className="h-3.5 w-3.5" /> {profile.username}</span>}
                    {context === 'professional' && profile.username && currentPosition && <span className="text-slate-500">·</span>}
                    {context === 'professional' && currentPosition && <span className="text-slate-300">{currentPosition.job_title} at {currentPosition.company_name}</span>}
                  </p>
                )}
                {context === 'personal' && canViewPersonal && personalDetails?.jam_url && (
                  <div className="mt-2 flex max-w-lg items-center gap-2.5" aria-label="My Jam">
                    {jamTrack?.artwork ? (
                      <img src={jamTrack.artwork} alt="Album artwork" className="h-10 w-10 shrink-0 rounded-md object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-violet-500/20 text-violet-200"><Music2 className="h-5 w-5" /></div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-fuchsia-300">My Jam</p>
                      {jamLoading ? <p className="text-xs text-slate-300">Finding their song…</p> : jamTrack ? (
                        <><p className="truncate text-xs font-semibold text-white" title={jamTrack.title}>{jamTrack.title}</p><p className="truncate text-[11px] text-slate-400" title={jamTrack.artist}>{jamTrack.artist}</p></>
                      ) : <p className="text-xs text-slate-400">{jamError || 'Song unavailable'}</p>}
                    </div>
                    {jamTrack?.preview ? (
                      <button type="button" onClick={() => void toggleJam()} aria-label={jamPlaying ? 'Pause My Jam' : 'Play My Jam'} title={jamPlaying ? 'Pause preview' : 'Play song preview'} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white transition hover:bg-violet-500">
                        {jamPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
                      </button>
                    ) : jamLoading ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-violet-300" /> : null}
                    {jamTrack && !jamTrack.preview && <span className="text-[10px] text-slate-400">No preview</span>}
                  </div>
                )}
                {context === 'personal' && canViewPersonal && jamTrack && jamError && <p role="alert" className="mt-1 text-xs text-rose-300">{jamError}</p>}
              </div>
              {isIndividual && ownProfile && <Link href="/social/profile" className="inline-flex shrink-0 items-center gap-2 self-start rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold transition hover:bg-white/10">My Profile <ArrowRight className="h-3.5 w-3.5" /></Link>}
            </div>
          </article>

          {isIndividual && context === 'personal' ? (
            canViewPersonal ? (
              <section className="rounded-2xl border border-white/10 bg-[#101b30] p-5 shadow-lg sm:p-6">
                <h2 className="text-base font-bold">Bio</h2>
                {personalError ? <p className="mt-3 text-sm text-amber-200">{personalError}</p> : <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-300">{personalDetails?.bio || 'No personal bio available.'}</p>}
              </section>
            ) : (
              <section className="rounded-2xl border border-white/10 bg-[#101b30] p-7 text-center shadow-lg">
                <LockKeyhole className="mx-auto h-7 w-7 text-violet-300" />
                <h2 className="mt-3 text-lg font-bold">Personal profile is private</h2>
                <p className="mt-2 text-sm text-slate-300">This member has not granted you access to their Personal profile or posts.</p>
              </section>
            )
          ) : <>
          <section className="rounded-2xl border border-white/10 bg-[#101b30] p-5 shadow-lg sm:p-6">
            <h2 className="text-base font-bold">About</h2>
            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-300">{profile.bio || 'This member has not added a bio yet.'}</p>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/10 pt-3 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1.5 font-semibold text-violet-200"><ShieldCheck className="h-4 w-4" /> Aether Verified</span>
              {(['Political', 'Business'] as const).map(category => (
                <span key={category} className="inline-flex items-center gap-1.5" title={`${category} verification not yet connected`}>
                  <span aria-label="Not verified" className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-slate-500 text-[10px]">—</span>
                  <span className="text-slate-200">{category}</span> · Pending
                </span>
              ))}
            </div>
          </section>

          <section className="min-w-0 rounded-2xl border border-white/10 bg-[#101b30] p-5 shadow-lg sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-bold">Experience &amp; skills</h2>
              {experience.length > 0 && <span className="text-xs text-slate-400">{experience.length} {experience.length === 1 ? 'position' : 'positions'}</span>}
            </div>
            {experienceError ? <p className="mt-3 text-sm text-amber-200">{experienceError}</p> : experience.length > 0 ? (
              <div className="mt-3 grid grid-cols-1 gap-x-8 sm:grid-cols-2">
                {experience.map(item => (
                  <article id={`experience-${item.id}`} key={item.id} className="min-w-0 border-b border-white/10 py-3">
                    <p className="break-words text-sm font-semibold text-white">{item.company_name}</p>
                    <p className="mt-1 break-words text-sm text-slate-300">{item.job_title}</p>
                    <p className="mt-1 text-xs text-slate-400">{monthLabel(item.start_date)} – {item.is_current ? 'Present' : monthLabel(item.end_date)}</p>
                    <Link href={`/social/profile/${profile.id}/professional#experience-${item.id}`} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-violet-300 hover:text-violet-200">Learn more about this experience <ArrowRight className="h-3.5 w-3.5" /></Link>
                  </article>
                ))}
              </div>
            ) : <p className="mt-3 text-sm text-slate-300">No professional experience added yet.</p>}
          </section>

          <section className="min-w-0 rounded-2xl border border-white/10 bg-[#101b30] p-5 shadow-lg sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-bold">Education &amp; Certifications</h2>
              {education.length > 0 && <span className="text-xs text-slate-400">{education.length} {education.length === 1 ? 'entry' : 'entries'}</span>}
            </div>
            {educationError ? <p className="mt-3 text-sm text-amber-200">{educationError}</p> : education.length > 0 ? (
              <div className="mt-3 divide-y divide-white/10">
                {education.map(item => (
                  <article key={item.id} className="min-w-0 py-3 first:pt-0 last:pb-0">
                    <p className="text-xs font-semibold text-violet-300">{item.entry_type === 'certification' ? 'Certification' : item.entry_type === 'college' ? 'College / University' : 'High School'}</p>
                    <p className="mt-1 break-words text-sm font-semibold text-white">{item.institution_name}</p>
                    {item.entry_type === 'college' && (item.degree || item.field_of_study) && <p className="mt-1 text-sm text-slate-300">{[item.degree, item.field_of_study].filter(Boolean).join(' · ')}</p>}
                    {item.entry_type === 'certification' && item.issuing_organization && <p className="mt-1 text-sm text-slate-300">{item.issuing_organization}</p>}
                    {(item.entry_type === 'certification' ? item.issue_date || item.expiration_date : item.start_date || item.end_date) && (
                      <p className="mt-1 text-xs text-slate-400">{item.entry_type === 'certification'
                        ? [item.issue_date ? `Issued ${monthLabel(item.issue_date)}` : null, item.expiration_date ? `Expires ${monthLabel(item.expiration_date)}` : null].filter(Boolean).join(' · ')
                        : [item.start_date ? monthLabel(item.start_date) : null, item.end_date ? monthLabel(item.end_date) : null].filter(Boolean).join(' – ')}</p>
                    )}
                    {item.description && <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-300">{item.description}</p>}
                    {item.credential_url && /^https?:\/\//i.test(item.credential_url) && <a href={item.credential_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs font-semibold text-violet-300 hover:underline">View credential ↗</a>}
                  </article>
                ))}
              </div>
            ) : <p className="mt-3 text-sm text-slate-300">No education or certifications added yet.</p>}
          </section>

          </>}

          {(isEmployer || isIndividual) && (context === 'professional' || canViewPersonal) && (
            <section className="rounded-2xl border border-white/10 bg-[#101b30] p-5 shadow-lg sm:p-6">
              <h2 className="text-base font-bold">{context === 'personal' ? 'Personal posts' : 'Professional posts'}</h2>
              {postsLoading ? <p className="mt-4 flex items-center gap-2 text-sm text-slate-300"><Loader2 className="h-4 w-4 animate-spin" /> Loading posts...</p>
                : postsError ? <p role="alert" className="mt-4 text-sm text-rose-300">{postsError}</p>
                : posts.length === 0 ? <p className="mt-4 text-sm text-slate-400">No {context} posts yet.</p>
                : <div className="mt-4 space-y-3">{posts.map(post => (
                  <article key={post.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#253451]">
                        {(context === 'personal' ? personalDetails?.avatar_path : profile.avatar_path)
                          ? <img src={supabase.storage.from('social-avatars').getPublicUrl((context === 'personal' ? personalDetails?.avatar_path : profile.avatar_path)!).data.publicUrl} alt="" className="h-full w-full object-cover" />
                          : <UserRound className="h-5 w-5 text-violet-200" />}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{profile.display_name || 'Aether Social Member'}</p>
                        <p className="text-xs text-slate-400">{context === 'personal' ? 'Personal' : 'Professional'} · {new Date(post.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-200">{postBody(post.content)}</p>
                     {isIndividual && <div className="mt-4 border-t border-white/10 pt-3">
                       <div className="flex flex-wrap items-center gap-4">
                         <button type="button" disabled={!myProfileId || engagementBusy === post.id} onClick={() => void toggleLike(post.id)}
                           aria-pressed={likes.some(like => like.post_id === post.id && like.profile_id === myProfileId)}
                           className={`inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold transition disabled:opacity-50 ${likes.some(like => like.post_id === post.id && like.profile_id === myProfileId) ? 'text-violet-300' : 'text-slate-300 hover:text-violet-300'}`}>
                           <Heart className={`h-4 w-4 ${likes.some(like => like.post_id === post.id && like.profile_id === myProfileId) ? 'fill-current' : ''}`} />
                           {likes.filter(like => like.post_id === post.id).length} {likes.filter(like => like.post_id === post.id).length === 1 ? 'Like' : 'Likes'}
                         </button>
                         <button type="button" onClick={() => setExpandedComments(previous => ({ ...previous, [post.id]: !previous[post.id] }))}
                           aria-expanded={Boolean(expandedComments[post.id])}
                           className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-slate-300 hover:text-violet-300">
                           <MessageCircle className="h-4 w-4" /> {comments.filter(comment => comment.post_id === post.id).length} Comments
                         </button>
                       </div>
                       {engagementError[post.id] && <p role="alert" className="mt-2 text-xs text-rose-300">{engagementError[post.id]}</p>}
                       {expandedComments[post.id] && <div className="mt-3 space-y-3 border-t border-white/10 pt-4">
                         {comments.filter(comment => comment.post_id === post.id).map(comment => {
                           const commenter = commentAuthors[comment.profile_id]
                           return <div key={comment.id} className="rounded-xl bg-white/5 px-4 py-3">
                             <div className="flex flex-wrap items-center justify-between gap-2">
                               <Link href={`/social/profile/${comment.profile_id}${post.context === 'personal' ? '?view=personal' : ''}`} className="text-sm font-bold text-violet-300 hover:underline">
                                 {commenter?.display_name || commenter?.username || 'Aether member'}
                               </Link>
                               <span className="text-xs text-slate-400">{new Date(comment.created_at).toLocaleString()}</span>
                             </div>
                             <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-200">{comment.content}</p>
                           </div>
                         })}
                         <form onSubmit={event => void submitComment(post.id, event)} className="flex flex-col gap-2 sm:flex-row sm:items-end">
                           <textarea rows={2} maxLength={2000} value={commentDrafts[post.id] || ''}
                             onChange={event => setCommentDrafts(previous => ({ ...previous, [post.id]: event.target.value }))}
                             placeholder="Write a comment..." aria-label="Write a comment"
                             className="min-h-12 flex-1 resize-y rounded-xl border border-white/20 bg-[#16233a] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-400 focus:border-violet-400" />
                           <button type="submit" disabled={!myProfileId || !commentDrafts[post.id]?.trim() || engagementBusy === post.id}
                             className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-violet-500 disabled:opacity-40">
                             {engagementBusy === post.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Comment
                           </button>
                         </form>
                       </div>}
                     </div>}
                  </article>
                ))}</div>}
            </section>
          )}

          {isIndividual && !ownProfile && (
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
                    <p className="mt-3 text-xs text-slate-400">Personal posts are visible only to people their author currently allows.</p>
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
