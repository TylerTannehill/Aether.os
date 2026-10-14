'use client'

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import Link from 'next/link'
import { ArrowLeft, Camera, Check, Loader2, UserRound } from 'lucide-react'
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
}

export default function PersonalProfileEditorPage() {
  const [supabase] = useState(() => createClient())
  const [identity, setIdentity] = useState<Identity | null>(null)
  const [personal, setPersonal] = useState<PersonalProfile | null>(null)
  const [bio, setBio] = useState('')
  const [jamUrl, setJamUrl] = useState('')
  const [savingJam, setSavingJam] = useState(false)
  const [jamError, setJamError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [photoError, setPhotoError] = useState('')
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
          .select('profile_id, bio, avatar_path, jam_url')
          .eq('profile_id', profile.id)
          .maybeSingle()
        if (detailsError) throw new Error(detailsError.message)
        if (!active) return
        setIdentity(profile as Identity)
        setPersonal((details as PersonalProfile | null) ?? { profile_id: profile.id, bio: null, avatar_path: null, jam_url: null })
        setBio(details?.bio ?? '')
        setJamUrl(details?.jam_url ?? '')
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
        .select('profile_id, bio, avatar_path, jam_url')
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
        .select('profile_id, bio, avatar_path, jam_url')
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
        .select('profile_id, bio, avatar_path, jam_url')
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
        .select('profile_id, bio, avatar_path, jam_url')
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
        </div>
      )}
    </main>
  )
}
