'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowRight, AtSign, BriefcaseBusiness, Download, Heart, LockKeyhole, Loader2, MessageCircle, Music2, Pause, Pencil, Play, Send, ShieldCheck, UserRound, ExternalLink, X } from 'lucide-react'

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

type AetherExperience = {
  membership_id: string
  product: 'Political' | 'Business'
  role: string
  months: number | null
}

function aetherRoleLabel(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())
}

function aetherDuration(months: number | null) {
  if (months === null) return 'Duration unavailable'
  return `${months} ${months === 1 ? 'month' : 'months'}`
}

type Profile = {
  id: string
  auth_user_id: string
  username: string | null
  display_name: string | null
  bio: string | null
  avatar_path: string | null
  linkedin_url: string | null
}

type PersonalProfile = {
  profile_id: string
  bio: string | null
  avatar_path: string | null
  jam_url: string | null
  facebook_url: string | null
  instagram_url: string | null
  x_url: string | null
  tiktok_url: string | null
  youtube_url: string | null
  website_url: string | null
}

type SocialPost = {
  id: string
  author_id: string
  context: 'professional' | 'personal'
  content: string
  image_path: string | null
  created_at: string
}

type PostLike = { id: string; post_id: string; profile_id: string }
type PostComment = { id: string; post_id: string; profile_id: string; content: string; created_at: string }
type CommentAuthor = { id: string; display_name: string | null; username: string | null }

function postParts(content: string) {
  return content.split(/(https?:\/\/[^\s<>]+)/g).map((part, index) => {
    if (!/^https?:\/\//i.test(part)) return <span key={index}>{part}</span>
    const url = part.replace(/[),.!?;:]+$/, '')
    const trailing = part.slice(url.length)
    return <span key={index}><a href={url} target="_blank" rel="noopener noreferrer" className="break-all text-violet-300 underline underline-offset-2 hover:text-violet-200">{url}</a>{trailing}</span>
  })
}

type JamTrack = {
  title: string
  artist: string
  artwork: string | null
  preview: string | null
}

function appleTrackId(url: string): string | null {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:' || !/(^|\.)music\.apple\.com$/i.test(parsed.hostname)) return null
    const id = parsed.searchParams.get('i') || parsed.pathname.match(/\/(?:id)(\d+)(?:\/)?$/)?.[1]
    return id && /^\d+$/.test(id) ? id : null
  } catch { return null }
}

function monthLabel(value: string | null) {
  if (!value) return 'Present'
  const [year, month] = value.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export default function SocialProfilePage() {
  const [supabase] = useState(() => createClient())
  const [profile, setProfile] = useState<Profile | null>(null)
  const [personalProfile, setPersonalProfile] = useState<PersonalProfile | null>(null)
  const [personalError, setPersonalError] = useState('')
  const [socialsOpen, setSocialsOpen] = useState(false)
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [postImageUrls, setPostImageUrls] = useState<Record<string, string>>({})
  const [expandedImage, setExpandedImage] = useState<string | null>(null)
  const [postsLoading, setPostsLoading] = useState(false)
  const [postsError, setPostsError] = useState('')
  const [likes, setLikes] = useState<PostLike[]>([])
  const [comments, setComments] = useState<PostComment[]>([])
  const [commentAuthors, setCommentAuthors] = useState<Record<string, CommentAuthor>>({})
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({})
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({})
  const [engagementBusy, setEngagementBusy] = useState<string | null>(null)
  const [engagementError, setEngagementError] = useState<Record<string, string>>({})
  const [experience, setExperience] = useState<ExperiencePreview[]>([])
  const [experienceError, setExperienceError] = useState('')
  const [aetherExperience, setAetherExperience] = useState<AetherExperience[]>([])
  const [aetherLoading, setAetherLoading] = useState(true)
  const [aetherError, setAetherError] = useState('')
  const [education, setEducation] = useState<EducationPreview[]>([])
  const [educationError, setEducationError] = useState('')
  const [loading, setLoading] = useState(true)
  const [context, setContext] = useState<'professional' | 'personal'>('professional')
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)
  const [jamTrack, setJamTrack] = useState<JamTrack | null>(null)
  const [jamLoading, setJamLoading] = useState(false)
  const [jamError, setJamError] = useState('')
  const [jamPlaying, setJamPlaying] = useState(false)
  const jamAudioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      const { data: auth, error: authError } = await supabase.auth.getUser()
      if (!active) return
      if (authError || !auth.user) {
        window.location.replace('/login-social')
        return
      }

      const { data, error: fetchError } = await supabase
        .from('social_profiles')
        .select('id, auth_user_id, username, display_name, bio, avatar_path, linkedin_url')
        .eq('auth_user_id', auth.user.id)
        .maybeSingle()

      if (!active) return
      if (fetchError) {
        setError(fetchError.message)
      } else if (data) {
        setProfile(data as Profile)
        const { data: personalData, error: personalFetchError } = await supabase
          .from('social_personal_profiles')
          .select('profile_id, bio, avatar_path, jam_url, facebook_url, instagram_url, x_url, tiktok_url, youtube_url, website_url')
          .eq('profile_id', data.id)
          .maybeSingle()
        if (!active) return
        if (personalFetchError) setPersonalError('Unable to load your personal profile right now.')
        else setPersonalProfile((personalData as PersonalProfile | null) ?? null)

        const { data: positions, error: experienceFetchError } = await supabase
          .from('social_professional_experience')
          .select('id, company_name, job_title, start_date, end_date, is_current')
          .eq('profile_id', data.id)
          .order('is_current', { ascending: false })
          .order('start_date', { ascending: false })
        if (!active) return
        if (experienceFetchError) setExperienceError('Experience preview unavailable right now.')
        else setExperience((positions ?? []) as ExperiencePreview[])

        const { data: educationRows, error: educationFetchError } = await supabase
          .from('social_professional_education')
          .select('id, entry_type, institution_name, degree, field_of_study, issuing_organization, start_date, end_date, issue_date, expiration_date, credential_url, description, display_order')
          .eq('profile_id', data.id)
          .order('display_order', { ascending: true })
        if (!active) return
        if (educationFetchError) setEducationError('Education preview unavailable right now.')
        else setEducation(((educationRows ?? []) as EducationPreview[]).sort((a, b) => {
          const aDate = a.entry_type === 'certification' ? a.issue_date : a.start_date
          const bDate = b.entry_type === 'certification' ? b.issue_date : b.start_date
          if (!aDate && !bDate) return a.display_order - b.display_order
          if (!aDate) return 1
          if (!bDate) return -1
          return bDate.localeCompare(aDate) || a.display_order - b.display_order
        }))
      } else {
        // Existing Aether users may not have a Social profile yet.
        const { data: created, error: createError } = await supabase
          .from('social_profiles')
          .insert({ auth_user_id: auth.user.id })
          .select('id, auth_user_id, username, display_name, bio, avatar_path, linkedin_url')
          .single()

        if (!active) return
        if (createError) {
          setError(createError.message)
        } else {
          setProfile(created as Profile)
        }
      }
      setLoading(false)
    }

    void load()
    return () => { active = false }
  }, [supabase])

  useEffect(() => {
    if (!profile?.id) return
    let active = true
    async function loadAetherExperience() {
      setAetherLoading(true)
      setAetherError('')
      try {
        const response = await fetch('/api/social/aether-verified', { cache: 'no-store' })
        if (!response.ok) throw new Error('Verification details unavailable')
        const result: { experience?: AetherExperience[] } = await response.json()
        if (active) setAetherExperience(Array.isArray(result.experience) ? result.experience : [])
      } catch {
        if (active) setAetherError('Verification details unavailable right now.')
      } finally {
        if (active) setAetherLoading(false)
      }
    }
    void loadAetherExperience()
    return () => { active = false }
  }, [profile?.id])

  useEffect(() => {
    if (!profile?.id) return
    let active = true
    async function loadPosts() {
      setPostsLoading(true)
      setPostsError('')
      setPosts([])
      setPostImageUrls({})
      setLikes([])
      setComments([])
      setCommentAuthors({})
      const { data, error: fetchError } = await supabase
        .from('social_posts')
        .select('id, author_id, context, content, image_path, created_at')
        .eq('author_id', profile!.id)
        .eq('context', context)
        .order('created_at', { ascending: false })
        .limit(100)
      if (!active) return
      if (fetchError) {
        setPostsError('Unable to load your posts right now.')
        setPostsLoading(false)
        return
      }
      const fetchedPosts = (data ?? []) as SocialPost[]
      setPosts(fetchedPosts)
      const imagePosts = fetchedPosts.filter(post => post.image_path)
      if (imagePosts.length) {
        const paths = [...new Set(imagePosts.map(post => post.image_path).filter((path): path is string => Boolean(path)))]
        const { data: signed, error: imageError } = await supabase.storage
          .from('social-post-images').createSignedUrls(paths, 60 * 15)
        if (!active) return
        if (!imageError && signed) {
          const urlByPath: Record<string, string> = {}
          signed.forEach((item, index) => { if (item.signedUrl) urlByPath[paths[index]] = item.signedUrl })
          setPostImageUrls(Object.fromEntries(imagePosts
            .filter(post => post.image_path && urlByPath[post.image_path])
            .map(post => [post.id, urlByPath[post.image_path!]])))
        }
      }
      if (fetchedPosts.length) {
        const ids = fetchedPosts.map(post => post.id)
        const [likesResult, commentsResult] = await Promise.all([
          supabase.from('social_post_likes').select('id, post_id, profile_id').in('post_id', ids).limit(10000),
          supabase.from('social_post_comments').select('id, post_id, profile_id, content, created_at').in('post_id', ids).order('created_at', { ascending: true }).limit(10000),
        ])
        if (!active) return
        if (likesResult.error || commentsResult.error) {
          setPostsError('Posts loaded, but engagement is temporarily unavailable.')
        } else {
          setLikes((likesResult.data ?? []) as PostLike[])
          const loadedComments = (commentsResult.data ?? []) as PostComment[]
          setComments(loadedComments)
          const authorIds = [...new Set(loadedComments.map(comment => comment.profile_id))]
          if (authorIds.length) {
            const authorsResult = await supabase.from('social_profiles').select('id, display_name, username').in('id', authorIds)
            if (!active) return
            if (!authorsResult.error) {
              setCommentAuthors(Object.fromEntries(((authorsResult.data ?? []) as CommentAuthor[]).map(author => [author.id, author])))
            }
          }
        }
      }
      if (active) setPostsLoading(false)
    }
    void loadPosts()
    return () => { active = false }
  }, [supabase, profile?.id, context])

  async function toggleLike(postId: string) {
    if (!profile || engagementBusy) return
    setEngagementBusy(postId)
    setEngagementError(previous => ({ ...previous, [postId]: '' }))
    try {
      const existing = likes.find(like => like.post_id === postId && like.profile_id === profile.id)
      if (existing) {
        const { error } = await supabase.from('social_post_likes').delete().eq('id', existing.id)
        if (error) throw error
        setLikes(previous => previous.filter(like => like.id !== existing.id))
      } else {
        const { data, error } = await supabase.from('social_post_likes')
          .insert({ post_id: postId, profile_id: profile.id }).select('id, post_id, profile_id').single()
        if (error) throw error
        setLikes(previous => [...previous, data as PostLike])
      }
    } catch (error) {
      setEngagementError(previous => ({ ...previous, [postId]: error instanceof Error ? error.message : 'Unable to update like.' }))
    } finally { setEngagementBusy(null) }
  }

  async function submitComment(postId: string, event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const content = (commentDrafts[postId] || '').trim()
    if (!profile || !content || content.length > 2000 || engagementBusy) return
    setEngagementBusy(postId)
    setEngagementError(previous => ({ ...previous, [postId]: '' }))
    try {
      const { data, error } = await supabase.from('social_post_comments')
        .insert({ post_id: postId, profile_id: profile.id, content })
        .select('id, post_id, profile_id, content, created_at').single()
      if (error) throw error
      setComments(previous => [...previous, data as PostComment])
      setCommentAuthors(previous => ({ ...previous, [profile.id]: { id: profile.id, display_name: profile.display_name, username: profile.username } }))
      setCommentDrafts(previous => ({ ...previous, [postId]: '' }))
      setExpandedComments(previous => ({ ...previous, [postId]: true }))
    } catch (error) {
      setEngagementError(previous => ({ ...previous, [postId]: error instanceof Error ? error.message : 'Unable to post comment.' }))
    } finally { setEngagementBusy(null) }
  }

  useEffect(() => {
    const url = personalProfile?.jam_url?.trim()
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
        if (!controller.signal.aborted) setJamError(err instanceof Error ? err.message : 'Unable to load your jam.')
      } finally {
        if (!controller.signal.aborted) setJamLoading(false)
      }
    }
    void loadJam()
    return () => { controller.abort(); jamAudioRef.current?.pause(); jamAudioRef.current = null }
  }, [personalProfile?.jam_url])

  async function toggleJam() {
    if (!jamTrack?.preview) return
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

  const currentPosition = experience.find(item => item.is_current)
  const currentRoleLabel = currentPosition
    ? [currentPosition.job_title, currentPosition.company_name].filter(Boolean).join(' at ')
    : null

  const avatarUrl = profile?.avatar_path
    ? supabase.storage.from('social-avatars').getPublicUrl(profile.avatar_path).data.publicUrl
    : null

  const personalAvatarUrl = personalProfile?.avatar_path
    ? supabase.storage.from('social-avatars').getPublicUrl(personalProfile.avatar_path).data.publicUrl
    : null

  async function downloadResume() {
    if (!profile || exporting) return
    // Open synchronously so browser popup blockers do not interfere with the print dialog.
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      setError('Allow pop-ups for Aether Social to export your resume.')
      return
    }
    printWindow.document.write('<!doctype html><html><head><title>Preparing Aether Resume</title></head><body><p>Preparing your resume…</p></body></html>')
    setExporting(true)
    setError('')
    try {
      const [experienceResult, educationResult] = await Promise.all([
        supabase.from('social_professional_experience').select('*').eq('profile_id', profile.id).order('is_current', { ascending: false }).order('start_date', { ascending: false }),
        supabase.from('social_professional_education').select('*').eq('profile_id', profile.id).order('display_order', { ascending: true }),
      ])
      if (experienceResult.error) throw experienceResult.error
      if (educationResult.error) throw educationResult.error

      const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] || char))
      const paragraph = (value: unknown) => value ? `<p class="detail">${escapeHtml(value).replace(/\r?\n/g, '<br>')}</p>` : ''
      const positions = (experienceResult.data ?? []) as Record<string, unknown>[]
      const schools = (educationResult.data ?? []) as Record<string, unknown>[]
      const date = (value: unknown) => typeof value === 'string' && value ? monthLabel(value) : ''
      const experienceHtml = positions.map(item => {
        const dates = `${date(item.start_date)}${item.is_current ? ' – Present' : item.end_date ? ' – ' + date(item.end_date) : ''}`
        const detail = item.description || item.responsibilities || item.summary || ''
        return `<article><div class="job"><div><strong>${escapeHtml(item.job_title)}</strong><div class="organization">${escapeHtml(item.company_name)}</div></div><span class="dates">${escapeHtml(dates)}</span></div>${paragraph(detail)}</article>`
      }).join('')
      const educationHtml = schools.map(item => {
        const kind = item.entry_type === 'certification' ? 'Certification' : item.entry_type === 'college' ? 'College / University' : 'High School'
        const details = [item.degree, item.field_of_study, item.issuing_organization].filter(Boolean).map(escapeHtml).join(' · ')
        const dates = item.entry_type === 'certification' ? [item.issue_date ? 'Issued ' + date(item.issue_date) : '', item.expiration_date ? 'Expires ' + date(item.expiration_date) : ''].filter(Boolean).join(' · ') : [date(item.start_date), date(item.end_date)].filter(Boolean).join(' – ')
        return `<article><div class="job"><div><strong>${escapeHtml(item.institution_name)}</strong><div class="organization">${escapeHtml(kind)}${details ? ' · ' + details : ''}</div></div><span class="dates">${escapeHtml(dates)}</span></div>${paragraph(item.description)}</article>`
      }).join('')
      const title = positions.find(item => item.is_current)
      const headline = title ? [title.job_title, title.company_name].filter(Boolean).join(' at ') : ''
      const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${escapeHtml(profile.display_name || 'Aether')} - Aether Resume</title><style>
        @page { size: letter; margin: .7in .75in; }
        * { box-sizing: border-box; } body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #192338; font-size: 10.5pt; line-height: 1.4; }
        h1 { margin: 0; font-size: 23pt; letter-spacing: -.5px; } .headline { margin: 4px 0 0; color: #44546b; font-size: 11pt; }
        .handle { color: #64748b; font-size: 9pt; margin-top: 3px; } h2 { margin: 21px 0 9px; padding-bottom: 5px; border-bottom: 1px solid #cbd5e1; text-transform: uppercase; letter-spacing: 1.3px; font-size: 10pt; color: #243b62; }
        article { margin: 0 0 13px; break-inside: avoid; } .job { display: flex; justify-content: space-between; gap: 20px; } strong { font-size: 10.5pt; }
        .organization { margin-top: 2px; color: #475569; } .dates { white-space: nowrap; color: #64748b; font-size: 9pt; text-align: right; } .detail { margin: 6px 0 0; white-space: normal; overflow-wrap: anywhere; } .summary { white-space: pre-wrap; overflow-wrap: anywhere; margin: 0; }
        @media screen { body { max-width: 8.5in; margin: 28px auto; padding: 0 32px; } }
      </style></head><body><header><h1>${escapeHtml(profile.display_name || 'Professional Resume')}</h1>${headline ? `<div class="headline">${escapeHtml(headline)}</div>` : ''}${profile.username ? `<div class="handle">Aether Social · @${escapeHtml(profile.username)}</div>` : ''}</header>
      ${profile.bio ? `<section><h2>Professional Summary</h2><p class="summary">${escapeHtml(profile.bio)}</p></section>` : ''}
      ${positions.length ? `<section><h2>Professional Experience</h2>${experienceHtml}</section>` : ''}
      ${schools.length ? `<section><h2>Education &amp; Certifications</h2>${educationHtml}</section>` : ''}
      <script>window.addEventListener('load', () => { setTimeout(() => window.print(), 300); });<\/script></body></html>`
      printWindow.document.open()
      printWindow.document.write(html.replace('<\/script>', '</script>'))
      printWindow.document.close()
    } catch (err) {
      printWindow.close()
      setError(err instanceof Error ? `Resume export failed: ${err.message}` : 'Resume export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  const personalSocials = ([
    { label: 'Facebook', url: personalProfile?.facebook_url },
    { label: 'Instagram', url: personalProfile?.instagram_url },
    { label: 'X / Twitter', url: personalProfile?.x_url },
    { label: 'TikTok', url: personalProfile?.tiktok_url },
    { label: 'YouTube', url: personalProfile?.youtube_url },
    { label: 'Website', url: personalProfile?.website_url },
  ] as const).flatMap(({ label, url }) => {
    if (!url) return []
    try {
      const parsed = new URL(url)
      if (parsed.protocol !== 'https:') return []
      return [{ label, url: parsed.toString() }]
    } catch { return [] }
  })

  const profilePosts = (
    <section className="rounded-2xl border border-white/10 bg-[#101b30] p-5 shadow-lg sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-bold">{context === 'personal' ? 'Personal posts' : 'Professional posts'}</h3>
        <Link href="/social" className="inline-flex items-center gap-1 text-xs font-semibold text-violet-300 hover:text-violet-200">Write a post <ArrowRight className="h-3.5 w-3.5" /></Link>
      </div>
      {postsLoading ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-slate-300"><Loader2 className="h-4 w-4 animate-spin" /> Loading posts...</p>
      ) : postsError ? (
        <p role="alert" className="mt-4 text-sm text-rose-300">{postsError}</p>
      ) : posts.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">No {context} posts yet. Your posts will appear here after you publish them.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {posts.map(post => (
            <article key={post.id} className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#253451] text-violet-200">
                  {(context === 'personal' ? personalAvatarUrl : avatarUrl)
                    ? <img src={(context === 'personal' ? personalAvatarUrl : avatarUrl)!} alt="Profile avatar" className="h-full w-full object-cover" />
                    : <UserRound className="h-5 w-5" />}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{profile?.display_name || profile?.username || 'Aether member'}</p>
                  <p className="text-xs text-slate-400">{post.context === 'personal' ? 'Personal' : 'Professional'} · {new Date(post.created_at).toLocaleString()}</p>
                </div>
              </div>
              {post.content && <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-200">{postParts(post.content)}</p>}
              {post.image_path && (postImageUrls[post.id] ? (
                <button type="button" onClick={() => setExpandedImage(postImageUrls[post.id])}
                  aria-label="Enlarge post image" className="mt-3 block w-full max-w-2xl overflow-hidden rounded-xl border border-white/10 bg-black/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-400">
                  <img src={postImageUrls[post.id]} alt="Post attachment" className="max-h-[520px] w-full object-contain" />
                </button>
              ) : <p className="mt-3 text-xs text-slate-400">Image unavailable.</p>)}
               <div className="mt-4 border-t border-white/10 pt-3">
                 <div className="flex flex-wrap items-center gap-4">
                   <button type="button" disabled={!profile || engagementBusy === post.id} onClick={() => void toggleLike(post.id)}
                     aria-pressed={likes.some(like => like.post_id === post.id && like.profile_id === profile?.id)}
                     className={`inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold transition disabled:opacity-50 ${likes.some(like => like.post_id === post.id && like.profile_id === profile?.id) ? 'text-violet-300' : 'text-slate-300 hover:text-violet-300'}`}>
                     <Heart className={`h-4 w-4 ${likes.some(like => like.post_id === post.id && like.profile_id === profile?.id) ? 'fill-current' : ''}`} />
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
                     <button type="submit" disabled={!profile || !commentDrafts[post.id]?.trim() || engagementBusy === post.id}
                       className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-violet-500 disabled:opacity-40">
                       {engagementBusy === post.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Comment
                     </button>
                   </form>
                 </div>}
               </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )

  const profileToggle = (
        <div className="inline-flex rounded-xl border border-slate-300 bg-white p-1 shadow-sm" role="group" aria-label="Profile context">
          <button type="button" onClick={() => { setContext('professional'); setError('') }} aria-pressed={context === 'professional'}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${context === 'professional' ? 'bg-violet-700 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
            <BriefcaseBusiness className="h-4 w-4" /> Professional
          </button>
          <button type="button" onClick={() => { setContext('personal'); setError('') }} aria-pressed={context === 'personal'}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${context === 'personal' ? 'bg-violet-700 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
            <Heart className="h-4 w-4" /> Personal
          </button>
        </div>
  )

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-8 pt-2 text-slate-100 sm:px-6 sm:pt-3">
      {loading ? (
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#101b30] p-6 text-slate-300" role="status">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading your profile...
        </div>
      ) : context === 'personal' ? (
        <div className="space-y-4">
          <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#101b30] shadow-lg">
            <div className="flex h-16 items-center justify-end bg-gradient-to-r from-fuchsia-800 via-violet-800 to-indigo-800 px-3 sm:h-20 sm:px-5">
              {profileToggle}
            </div>
            <div className="flex items-center gap-4 px-5 pb-5 sm:gap-6 sm:px-6">
              <div className="-mt-12 flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-[#101b30] bg-[#253451] text-violet-200 shadow-lg sm:-mt-14 sm:h-32 sm:w-32">
                {personalAvatarUrl
                  ? <img src={personalAvatarUrl} alt="Your personal profile picture" className="h-full w-full object-cover" />
                  : <UserRound className="h-12 w-12" aria-label="Personal profile picture not set" />}
              </div>
              <div className="min-w-0 flex-1 pt-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="break-words text-xl font-bold sm:text-2xl">{profile?.display_name || 'Your name goes here'}</h2>
                  <span className="rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-2.5 py-1 text-xs font-semibold text-fuchsia-200">Personal</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-violet-300">
                  <AtSign className="h-3.5 w-3.5" /> {profile?.username || 'Choose a username'}
                </div>
                {personalProfile?.jam_url && (
                  <div className="mt-2 flex max-w-lg items-center gap-2.5" aria-label="My Jam">
                    {jamTrack?.artwork ? (
                      <img src={jamTrack.artwork} alt="Album artwork" className="h-10 w-10 shrink-0 rounded-md object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-violet-500/20 text-violet-200"><Music2 className="h-5 w-5" /></div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-fuchsia-300">My Jam</p>
                      {jamLoading ? <p className="text-xs text-slate-300">Finding your song…</p> : jamTrack ? (
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
                {jamTrack && jamError && <p role="alert" className="mt-1 text-xs text-rose-300">{jamError}</p>}
              </div>
              {profile && (
                <div className="flex shrink-0 flex-col items-stretch gap-2 self-start pt-3">
                  <button type="button" onClick={() => setSocialsOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-lg border border-fuchsia-400/40 bg-fuchsia-500/10 px-3 py-2 text-xs font-semibold text-fuchsia-100 transition hover:bg-fuchsia-500/20">
                    <ExternalLink className="h-3.5 w-3.5" /> My Socials
                  </button>
                  <Link href="/social/network/manage" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold transition hover:bg-white/10">
                    <BriefcaseBusiness className="h-3.5 w-3.5" /> Manage My Connections
                  </Link>
                  <Link href="/social/profile/personal" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold transition hover:bg-white/10">
                    <Pencil className="h-3.5 w-3.5" /> Edit Profile
                  </Link>
                </div>
              )}
            </div>
          </section>
          <section className="rounded-2xl border border-white/10 bg-[#101b30] p-5 shadow-lg sm:p-6">
            <h3 className="text-base font-bold">Bio</h3>
            {personalError
              ? <p role="alert" className="mt-3 text-sm text-rose-300">{personalError}</p>
              : <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-300">{personalProfile?.bio || 'Add a personal bio to introduce yourself to your connections.'}</p>}
          </section>
          {profilePosts}
        </div>
      ) : (
        <div className="space-y-4">
          <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#101b30] shadow-lg">
            <div className="flex h-16 items-center justify-end bg-gradient-to-r from-violet-700 via-indigo-700 to-blue-800 px-3 sm:h-20 sm:px-5">
              {profileToggle}
            </div>
            <div className="flex items-center gap-4 px-5 pb-5 sm:gap-6 sm:px-6">
              <div className="-mt-12 h-28 w-28 shrink-0 overflow-hidden rounded-full border-4 border-[#101b30] bg-[#253451] text-violet-200 shadow-lg sm:-mt-14 sm:h-32 sm:w-32">
                {avatarUrl ? <img src={avatarUrl} alt="Your professional profile picture" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center"><UserRound className="h-12 w-12" /></div>}
              </div>
              <div className="min-w-0 flex-1 pt-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="break-words text-xl font-bold sm:text-2xl">{profile?.display_name || 'Your name goes here'}</h2>
                  <span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-2.5 py-1 text-xs font-semibold text-violet-200">Professional</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                  <span className="inline-flex items-center gap-1 text-violet-300"><AtSign className="h-3.5 w-3.5" /> {profile?.username || 'Choose a username'}</span>
                  {currentRoleLabel && <span className="text-slate-300"><span className="mr-2 text-slate-500">·</span>{currentRoleLabel}</span>}
                  {profile?.linkedin_url && (() => {
                    try {
                      const linkedIn = new URL(profile.linkedin_url)
                      if (linkedIn.protocol !== 'https:' || !['linkedin.com', 'www.linkedin.com'].includes(linkedIn.hostname.toLowerCase())) return null
                      return <a href={linkedIn.toString()} target="_blank" rel="noopener noreferrer" aria-label="View LinkedIn profile" title="LinkedIn" className="inline-flex items-center justify-center rounded-md border border-white/20 p-1 text-violet-200 transition hover:border-violet-400/50 hover:bg-white/10 hover:text-white">
                        <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.35V9h3.414v1.561h.049c.476-.9 1.637-1.85 3.37-1.85 3.602 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                      </a>
                    } catch { return null }
                  })()}
                </div>
              </div>
              {profile && (
                <div className="flex shrink-0 flex-col items-stretch gap-2 self-start pt-3">
                  <Link href="/social/profile/professional" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold transition hover:bg-white/10">
                    <Pencil className="h-3.5 w-3.5" /> Edit Profile
                  </Link>
                  <Link href="/social/network/manage" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold transition hover:bg-white/10">
                    <BriefcaseBusiness className="h-3.5 w-3.5" /> Manage My Connections
                  </Link>
                </div>
              )}
            </div>
          </section>

          {error && <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-800">{error}</p>}
            <div className="space-y-4">
              <section className="flex min-h-0 flex-col rounded-2xl border border-white/10 bg-[#101b30] p-5 shadow-lg sm:p-6">
                <h3 className="shrink-0 text-base font-bold">About</h3>
                <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-300 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]">
                  {profile?.bio || 'Add a bio to introduce yourself to the Aether community.'}
                </p>
                <Link href="/social/profile/professional#about" className="mt-2 inline-flex shrink-0 items-center gap-1 self-start text-xs font-semibold text-violet-300 hover:text-violet-200">
                  Continue reading <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <div className="mt-1 flex justify-end">
                  <button type="button" onClick={() => void downloadResume()} disabled={!profile || exporting}
                    title="Opens a print-ready resume; choose Save as PDF in the print dialog"
                    className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50">
                    {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                    {exporting ? 'Preparing Resume…' : 'Download Aether Resume'}
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/10 pt-3 text-xs text-slate-400">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-violet-200"><ShieldCheck className="h-4 w-4" /> Aether Verified</span>
                  {aetherLoading ? (
                    <span className="inline-flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading verification...</span>
                  ) : aetherError ? (
                    <span role="status" className="text-amber-200">{aetherError}</span>
                  ) : (['Political', 'Business'] as const).map(category => {
                    const entries = aetherExperience.filter(item => item.product === category)
                    return (
                      <span key={category} className="inline-flex flex-wrap items-center gap-1.5">
                        {entries.length ? <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" aria-label="Verified" /> : <span aria-label="Not verified" className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-slate-500 text-[10px]">—</span>}
                        <span className="text-slate-200">{category}</span>
                        {entries.length ? (
                          <span className="text-emerald-200">· {entries.map(item => `${aetherRoleLabel(item.role)} (${aetherDuration(item.months)})`).join(' · ')}</span>
                        ) : ' · Pending'}
                      </span>
                    )
                  })}
                </div>
              </section>
              <section className="min-w-0 rounded-2xl border border-white/10 bg-[#101b30] p-5 shadow-lg sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-bold">Experience &amp; skills</h3>
                  {experience.length > 0 && <span className="text-xs text-slate-400">{experience.length} {experience.length === 1 ? 'position' : 'positions'}</span>}
                </div>
                {experienceError ? (
                  <p className="mt-3 text-sm text-amber-200">{experienceError}</p>
                ) : experience.length > 0 ? (
                  <div className="mt-3 grid grid-cols-1 gap-x-8 sm:grid-cols-2">
                    {experience.map(item => (
                      <article key={item.id} className="min-w-0 border-b border-white/10 py-3">
                        <p className="break-words text-sm font-semibold text-white">{item.company_name}</p>
                        <p className="mt-1 break-words text-sm text-slate-300">{item.job_title}</p>
                        <p className="mt-1 text-xs text-slate-400">{monthLabel(item.start_date)} – {item.is_current ? 'Present' : monthLabel(item.end_date)}</p>
                        <Link href={`/social/profile/professional#experience-${item.id}`}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-violet-300 hover:text-violet-200">
                          Learn more about my experience here <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-300">Add your first position to build your professional history. Skills are coming next.</p>
                )}
              </section>
              <section className="min-w-0 rounded-2xl border border-white/10 bg-[#101b30] p-5 shadow-lg sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-bold">Education &amp; Certifications</h3>
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
                          <p className="mt-1 text-xs text-slate-400">
                            {item.entry_type === 'certification'
                              ? [item.issue_date ? `Issued ${monthLabel(item.issue_date)}` : null, item.expiration_date ? `Expires ${monthLabel(item.expiration_date)}` : null].filter(Boolean).join(' · ')
                              : [item.start_date ? monthLabel(item.start_date) : null, item.end_date ? monthLabel(item.end_date) : null].filter(Boolean).join(' – ')}
                          </p>
                        )}
                        {item.description && <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-300">{item.description}</p>}
                        {item.credential_url && /^https?:\/\//i.test(item.credential_url) && <a href={item.credential_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs font-semibold text-violet-300 hover:underline">View credential ↗</a>}
                      </article>
                    ))}
                  </div>
                ) : <p className="mt-3 text-sm text-slate-300">No education or certifications added yet.</p>}
                <Link href="/social/profile/professional#education" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-violet-300 hover:text-violet-200">Learn about my education <ArrowRight className="h-3.5 w-3.5" /></Link>
              </section>
            </div>
            {profilePosts}
        </div>
      )}
      {expandedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          role="dialog" aria-modal="true" aria-label="Enlarged post image"
          onMouseDown={event => { if (event.target === event.currentTarget) setExpandedImage(null) }}>
          <button type="button" onClick={() => setExpandedImage(null)} aria-label="Close image"
            className="absolute right-5 top-5 rounded-full bg-white/15 p-3 text-white hover:bg-white/25"><X className="h-5 w-5" /></button>
          <img src={expandedImage} alt="Enlarged post attachment" className="max-h-[90vh] max-w-full object-contain" />
        </div>
      )}
      {socialsOpen && context === 'personal' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 py-8" onMouseDown={event => { if (event.target === event.currentTarget) setSocialsOpen(false) }}>
          <section role="dialog" aria-modal="true" aria-labelledby="personal-socials-title" className="w-full max-w-md rounded-2xl border border-white/15 bg-[#101b30] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="personal-socials-title" className="text-xl font-bold text-white">Find Me Elsewhere</h2>
                <p className="mt-1 text-sm text-slate-400">My other corners of the internet.</p>
              </div>
              <button type="button" onClick={() => setSocialsOpen(false)} aria-label="Close socials" className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            {personalSocials.length ? (
              <div className="mt-5 space-y-2">
                {personalSocials.map(social => (
                  <a key={social.label} href={social.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-violet-200 transition hover:border-violet-400/40 hover:bg-white/10 hover:text-white">
                    {social.label}<ExternalLink className="h-4 w-4 shrink-0" />
                  </a>
                ))}
              </div>
            ) : <p className="mt-5 text-sm text-slate-300">No socials added yet. Add them in Edit Profile.</p>}
          </section>
        </div>
      )}
    </main>
  )
}
