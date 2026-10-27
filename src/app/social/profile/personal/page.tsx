'use client'

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import Link from 'next/link'
import { ArrowLeft, Camera, Check, Loader2, Trash2, UserRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Identity = {
  id: string
  auth_user_id: string
  display_name: string | null
  username: string | null
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

type SocialKey = 'facebook' | 'instagram' | 'x' | 'tiktok' | 'youtube' | 'website'
const socialFields: { key: SocialKey; label: string; placeholder: string; hosts?: string[] }[] = [
  { key: 'facebook', label: 'Facebook', placeholder: 'https://www.facebook.com/yourname', hosts: ['facebook.com', 'www.facebook.com', 'm.facebook.com'] },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://www.instagram.com/yourname', hosts: ['instagram.com', 'www.instagram.com'] },
  { key: 'x', label: 'X / Twitter', placeholder: 'https://x.com/yourname', hosts: ['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com'] },
  { key: 'tiktok', label: 'TikTok', placeholder: 'https://www.tiktok.com/@yourname', hosts: ['tiktok.com', 'www.tiktok.com'] },
  { key: 'youtube', label: 'YouTube', placeholder: 'https://www.youtube.com/@yourname', hosts: ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'] },
  { key: 'website', label: 'Personal website', placeholder: 'https://yourwebsite.com' },
]

export default function PersonalProfileEditorPage() {
  const [supabase] = useState(() => createClient())
  const [identity, setIdentity] = useState<Identity | null>(null)
  const [personal, setPersonal] = useState<PersonalProfile | null>(null)
  const [bio, setBio] = useState('')
  const [jamUrl, setJamUrl] = useState('')
  const [socialUrls, setSocialUrls] = useState<Record<SocialKey, string>>({ facebook: '', instagram: '', x: '', tiktok: '', youtube: '', website: '' })
  const [savingSocials, setSavingSocials] = useState(false)
  const [socialsError, setSocialsError] = useState('')
  const [savingJam, setSavingJam] = useState(false)
  const [jamError, setJamError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [photoError, setPhotoError] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const { data: auth, error: authError } = await supabase.auth.getUser()
        if (!active) return
        if (authError || !auth.user) {
          window.location.replace('/login-social')
          return
        }
        const { data: profile, error: profileError } = await supabase
          .from('social_profiles')
          .select('id, auth_user_id, display_name, username')
          .eq('auth_user_id', auth.user.id)
          .maybeSingle()
        if (profileError) throw new Error(profileError.message)
        if (!profile) throw new Error('Create your Social profile first.')
        const { data: details, error: detailsError } = await supabase
          .from('social_personal_profiles')
          .select('profile_id, bio, avatar_path, jam_url, facebook_url, instagram_url, x_url, tiktok_url, youtube_url, website_url')
          .eq('profile_id', profile.id)
          .maybeSingle()
        if (detailsError) throw new Error(detailsError.message)
        if (!active) return
        setIdentity(profile as Identity)
        setPersonal((details as PersonalProfile | null) ?? { profile_id: profile.id, bio: null, avatar_path: null, jam_url: null, facebook_url: null, instagram_url: null, x_url: null, tiktok_url: null, youtube_url: null, website_url: null })
        setBio(details?.bio ?? '')
        setJamUrl(details?.jam_url ?? '')
        setSocialUrls({ facebook: details?.facebook_url ?? '', instagram: details?.instagram_url ?? '', x: details?.x_url ?? '', tiktok: details?.tiktok_url ?? '', youtube: details?.youtube_url ?? '', website: details?.website_url ?? '' })
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Unable to load your personal profile.')
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [supabase])

  async function verifyOwner() {
    if (!identity) throw new Error('Your profile is not loaded.')
    const { data: auth, error: authError } = await supabase.auth.getUser()
    if (authError || auth.user?.id !== identity.auth_user_id) throw new Error('Session expired. Please sign in again.')
    return identity
  }

  async function saveBio(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!identity || saving) return
    const cleanBio = bio.trim()
    if (cleanBio.length > 500) { setError('Bio must be 500 characters or fewer.'); return }
    setSaving(true)
    setError('')

    try {
      const owner = await verifyOwner()
      const { data, error: saveError } = await supabase
        .from('social_personal_profiles')
        .upsert({ profile_id: owner.id, bio: cleanBio || null }, { onConflict: 'profile_id' })
        .select('profile_id, bio, avatar_path, jam_url, facebook_url, instagram_url, x_url, tiktok_url, youtube_url, website_url')
        .single()
      if (saveError) throw new Error(saveError.message)
      setPersonal(data as PersonalProfile)
      setBio(data.bio ?? '')

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save your bio.')
    } finally {
      setSaving(false)
    }
  }

  async function saveJam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!identity || savingJam) return
    const cleanUrl = jamUrl.trim()
    if (cleanUrl) {
      try {
        const parsed = new URL(cleanUrl)
        const validHost = parsed.hostname === 'music.apple.com' || parsed.hostname === 'itunes.apple.com'
        if (parsed.protocol !== 'https:' || !validHost) throw new Error('Invalid Apple Music link')
      } catch {
        setJamError('Paste a valid Apple Music song URL (https://music.apple.com/...).')
        return
      }
    }
    setSavingJam(true)
    setJamError('')
    try {
      const owner = await verifyOwner()
      const { data, error: saveError } = await supabase
        .from('social_personal_profiles')
        .upsert({ profile_id: owner.id, jam_url: cleanUrl || null }, { onConflict: 'profile_id' })
        .select('profile_id, bio, avatar_path, jam_url, facebook_url, instagram_url, x_url, tiktok_url, youtube_url, website_url')
        .single()
      if (saveError) throw new Error(saveError.message)
      setPersonal(data as PersonalProfile)
      setJamUrl(data.jam_url ?? '')
    } catch (err) {
      setJamError(err instanceof Error ? err.message : 'Unable to save your song link.')
    } finally {
      setSavingJam(false)
    }
  }

  async function saveSocials(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!identity || savingSocials) return
    setSocialsError('')
    const cleaned = {} as Record<SocialKey, string | null>
    for (const field of socialFields) {
      const value = socialUrls[field.key].trim()
      if (!value) { cleaned[field.key] = null; continue }
      try {
        const parsed = new URL(value)
        if (parsed.protocol !== 'https:' || !parsed.hostname || (field.hosts && !field.hosts.includes(parsed.hostname.toLowerCase()))) {
          throw new Error('Invalid URL')
        }
        cleaned[field.key] = parsed.toString()
      } catch {
        setSocialsError(`Enter a valid HTTPS ${field.label} URL, or leave the field blank.`)
        return
      }
    }
    setSavingSocials(true)
    try {
      const owner = await verifyOwner()
      const { data, error: saveError } = await supabase.from('social_personal_profiles')
        .upsert({ profile_id: owner.id, facebook_url: cleaned.facebook, instagram_url: cleaned.instagram,
          x_url: cleaned.x, tiktok_url: cleaned.tiktok, youtube_url: cleaned.youtube, website_url: cleaned.website }, { onConflict: 'profile_id' })
        .select('profile_id, bio, avatar_path, jam_url, facebook_url, instagram_url, x_url, tiktok_url, youtube_url, website_url')
        .single()
      if (saveError) throw new Error(saveError.message)
      setPersonal(data as PersonalProfile)
      setSocialUrls({ facebook: data.facebook_url ?? '', instagram: data.instagram_url ?? '',
        x: data.x_url ?? '', tiktok: data.tiktok_url ?? '', youtube: data.youtube_url ?? '', website: data.website_url ?? '' })
    } catch (err) {
      setSocialsError(err instanceof Error ? err.message : 'Unable to save your social links.')
    } finally { setSavingSocials(false) }
  }

  async function uploadPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !identity || uploading) return
    setPhotoError('')

    const extensions: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
    const extension = extensions[file.type]
    if (!extension) { setPhotoError('Choose a JPEG, PNG, or WebP image.'); return }
    if (file.size > 5 * 1024 * 1024) { setPhotoError('Profile pictures must be 5 MB or smaller.'); return }
    setUploading(true)
    let newPath: string | null = null
    try {
      const owner = await verifyOwner()
      // Same existing storage bucket as Professional, but a separate personal file path.
      newPath = `${owner.auth_user_id}/personal-${crypto.randomUUID()}.${extension}`
      const { error: uploadError } = await supabase.storage.from('social-avatars')
        .upload(newPath, file, { contentType: file.type, upsert: false })
      if (uploadError) throw new Error(uploadError.message)
      const oldPath = personal?.avatar_path ?? null
      const { data, error: saveError } = await supabase
        .from('social_personal_profiles')
        .upsert({ profile_id: owner.id, avatar_path: newPath }, { onConflict: 'profile_id' })
        .select('profile_id, bio, avatar_path, jam_url, facebook_url, instagram_url, x_url, tiktok_url, youtube_url, website_url')
        .single()
      if (saveError) {
        await supabase.storage.from('social-avatars').remove([newPath])
        throw new Error(saveError.message)
      }
      setPersonal(data as PersonalProfile)
      // Only clean up personal uploads; never delete a professional avatar.
      if (oldPath?.startsWith(`${owner.auth_user_id}/personal-`) && oldPath !== newPath) {
        await supabase.storage.from('social-avatars').remove([oldPath])
      }

    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Unable to upload your photo.')
    } finally {
      setUploading(false)
    }
  }

  async function removePhoto() {
    if (!identity || !personal?.avatar_path || uploading) return
    setUploading(true)
    setPhotoError('')

    try {
      const owner = await verifyOwner()
      const oldPath = personal.avatar_path
      const { data, error: saveError } = await supabase.from('social_personal_profiles')
        .update({ avatar_path: null })
        .eq('profile_id', owner.id)
        .select('profile_id, bio, avatar_path, jam_url, facebook_url, instagram_url, x_url, tiktok_url, youtube_url, website_url')
        .single()
      if (saveError) throw new Error(saveError.message)
      setPersonal(data as PersonalProfile)
      if (oldPath.startsWith(`${owner.auth_user_id}/personal-`)) {
        const { error: removeError } = await supabase.storage.from('social-avatars').remove([oldPath])
        if (removeError) setPhotoError('Photo removed from your profile, but storage cleanup failed.')
      }

    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Unable to remove your photo.')
    } finally {
      setUploading(false)
    }
  }

  async function deleteSocialAccount() {
    if (!identity || deleting || deleteConfirmation !== 'DELETE SOCIAL') return
    setDeleting(true)
    setDeleteError('')
    try {
      await verifyOwner()
      const response = await fetch('/api/social/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: 'DELETE SOCIAL' }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || result.success !== true) {
        throw new Error(result.error || 'Unable to delete your Social account.')
      }
      await supabase.auth.signOut()
      window.location.replace('/login-social')
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Unable to delete your Social account.')
      setDeleting(false)
    }
  }

  const photoUrl = personal?.avatar_path
    ? supabase.storage.from('social-avatars').getPublicUrl(personal.avatar_path).data.publicUrl
    : null
  const fieldClass = 'w-full rounded-lg border border-white/20 bg-slate-950/60 px-3 py-3 text-sm text-white outline-none focus:border-violet-400'

  return (
    <main className="mx-auto w-full max-w-4xl px-4 pb-10 pt-4 text-slate-100 sm:px-6">
      <Link href="/social/profile" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-violet-300 hover:text-violet-200">
        <ArrowLeft className="h-4 w-4" /> Back to Profile
      </Link>
      <section className="mb-5 rounded-2xl border border-white/10 bg-[#101b30] px-5 py-7 shadow-lg sm:px-8 sm:py-9">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Your Personal Profile</h1>
        <p className="mt-2 text-sm text-slate-300">Your photo and bio are separate from your Professional profile.</p>
        {identity && <p className="mt-3 text-sm text-violet-200">{identity.display_name || 'Your name'}{identity.username ? ` · @${identity.username}` : ''}</p>}
      </section>

      {error && <p role="alert" className="mb-4 rounded-lg border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}

      {loading ? <p className="flex items-center gap-2 text-sm text-slate-300"><Loader2 className="h-4 w-4 animate-spin" /> Loading your profile...</p> : identity && (
        <div className="space-y-4">
          <section className="rounded-xl border border-white/10 bg-[#101b30] p-5">
            <h2 className="mb-4 font-bold">Personal profile picture</h2>
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadPhoto} className="sr-only" aria-label="Choose a personal profile picture" />
            <div className="flex flex-wrap items-center gap-5">
              <button type="button" disabled={uploading} onClick={() => inputRef.current?.click()} aria-label="Upload or replace personal picture" className="group relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-violet-400/50 bg-[#263451] text-violet-200 hover:border-violet-300 disabled:opacity-50">
                {photoUrl ? <img src={photoUrl} alt="Your personal profile picture" className="h-full w-full object-cover" /> : <UserRound className="h-12 w-12" />}
                <span className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                  {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Camera className="h-6 w-6" />}
                </span>
              </button>
              <div className="space-y-2">
                <button type="button" disabled={uploading} onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold hover:bg-violet-500 disabled:opacity-50">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  {uploading ? 'Working...' : photoUrl ? 'Replace photo' : 'Upload photo'}
                </button>
                {photoUrl && <button type="button" disabled={uploading} onClick={() => void removePhoto()} className="ml-3 text-sm font-semibold text-rose-300 hover:text-rose-200 disabled:opacity-50">Remove</button>}
                <p className="text-xs text-slate-400">JPEG, PNG, or WebP. Maximum 5 MB.</p>
              </div>
            </div>
            {photoError && <p role="alert" className="mt-3 text-sm text-rose-300">{photoError}</p>}
          </section>

          <section className="rounded-xl border border-white/10 bg-[#101b30] p-5">
            <h2 className="mb-4 font-bold">Personal bio</h2>
            <form onSubmit={saveBio} className="space-y-3">
              <label htmlFor="personal-bio" className="block text-xs font-semibold text-slate-300">Tell your connections a little about yourself</label>
              <textarea id="personal-bio" rows={5} maxLength={500} value={bio} onChange={e => setBio(e.target.value)} className={fieldClass} placeholder="Write your personal bio..." />
              <p className="text-right text-xs text-slate-400">{bio.length}/500</p>
              <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold hover:bg-violet-500 disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {saving ? 'Saving...' : 'Save personal bio'}
              </button>
            </form>
          </section>

          <section className="rounded-xl border border-white/10 bg-[#101b30] p-5">
            <h2 className="mb-4 font-bold">My Jam</h2>
            <form onSubmit={saveJam} className="space-y-3">
              <label htmlFor="personal-jam-url" className="block text-xs font-semibold text-slate-300">Apple Music song URL</label>
              <input id="personal-jam-url" type="url" inputMode="url" value={jamUrl} onChange={e => setJamUrl(e.target.value)} className={fieldClass} placeholder="https://music.apple.com/..." />
              <p className="text-xs text-slate-400">Paste a link to a song from Apple Music. Clear the field and save to remove your jam. The player will appear on your Personal profile once we build it.</p>
              {jamError && <p role="alert" className="text-sm text-rose-300">{jamError}</p>}
              <button type="submit" disabled={savingJam} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold hover:bg-violet-500 disabled:opacity-50">
                {savingJam ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {savingJam ? 'Saving...' : 'Save My Jam'}
              </button>
            </form>
          </section>
          <section className="rounded-xl border border-white/10 bg-[#101b30] p-5">
            <h2 className="mb-2 font-bold">My Socials</h2>
            <p className="mb-4 text-xs text-slate-400">Add the places your personal connections can find you elsewhere. All fields are optional. Clear a field and save to remove that link.</p>
            <form onSubmit={saveSocials} className="space-y-4">
              {socialFields.map(field => (
                <div key={field.key} className="space-y-1.5">
                  <label htmlFor={`personal-social-${field.key}`} className="block text-xs font-semibold text-slate-300">{field.label}</label>
                  <input id={`personal-social-${field.key}`} type="url" inputMode="url" value={socialUrls[field.key]}
                    onChange={event => setSocialUrls(previous => ({ ...previous, [field.key]: event.target.value }))}
                    className={fieldClass} placeholder={field.placeholder} />
                </div>
              ))}
              {socialsError && <p role="alert" className="text-sm text-rose-300">{socialsError}</p>}
              <button type="submit" disabled={savingSocials} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold hover:bg-violet-500 disabled:opacity-50">
                {savingSocials ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {savingSocials ? 'Saving...' : 'Save My Socials'}
              </button>
            </form>
          </section>

          <section className="rounded-xl border border-rose-500/30 bg-[#101b30] p-5">
            <h2 className="flex items-center gap-2 font-bold text-rose-300"><Trash2 className="h-4 w-4" /> Delete Aether Social Account</h2>
            <p className="mt-2 text-sm text-slate-300">Permanently delete your Aether Social profile and associated Social content. This does not delete your Political or Business memberships. Some records may be retained for safety or legal obligations.</p>
            <button type="button" onClick={() => { setDeleteOpen(true); setDeleteConfirmation(''); setDeleteError('') }} className="mt-4 rounded-lg border border-rose-400/50 px-4 py-2 text-sm font-semibold text-rose-200 hover:bg-rose-500/10">
              Delete Social Account
            </button>
          </section>
        </div>
      )}

      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" role="presentation">
          <div role="dialog" aria-modal="true" aria-labelledby="delete-social-title" className="w-full max-w-md rounded-2xl border border-rose-400/40 bg-[#101b30] p-6 shadow-2xl">
            <h2 id="delete-social-title" className="text-xl font-bold text-white">Permanently delete Social?</h2>
            <p className="mt-3 text-sm text-slate-300">This permanently removes your Aether Social profile and associated Social content. You cannot undo this action. Your Political and Business access will not be deleted.</p>
            <label htmlFor="delete-social-confirm" className="mt-5 block text-sm font-semibold text-slate-200">Type DELETE SOCIAL to confirm</label>
            <input id="delete-social-confirm" autoComplete="off" value={deleteConfirmation} disabled={deleting} onChange={e => setDeleteConfirmation(e.target.value)} className="mt-2 w-full rounded-lg border border-white/20 bg-slate-950/70 px-3 py-3 text-sm text-white outline-none focus:border-rose-400" />
            {deleteError && <p role="alert" className="mt-3 text-sm text-rose-300">{deleteError}</p>}
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button type="button" disabled={deleting} onClick={() => setDeleteOpen(false)} className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-slate-200 disabled:opacity-50">Cancel</button>
              <button type="button" disabled={deleting || deleteConfirmation !== 'DELETE SOCIAL'} onClick={() => void deleteSocialAccount()} className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-500 disabled:opacity-40">
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                {deleting ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
