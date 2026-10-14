'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AtSign, Check, Loader2, Pencil, UserRound, X } from 'lucide-react'

type Profile = {
  id: string
  auth_user_id: string
  username: string | null
  display_name: string | null
  bio: string | null
}

export default function SocialProfilePage() {
  const [supabase] = useState(() => createClient())
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')

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
        .select('id, auth_user_id, username, display_name, bio')
        .eq('auth_user_id', auth.user.id)
        .maybeSingle()

      if (!active) return
      if (fetchError) {
        setError(fetchError.message)
      } else if (data) {
        setProfile(data as Profile)
        setDisplayName(data.display_name ?? '')
        setUsername(data.username ?? '')
        setBio(data.bio ?? '')
      } else {
        // Existing Aether users may not have a Social profile yet.
        const { data: created, error: createError } = await supabase
          .from('social_profiles')
          .insert({ auth_user_id: auth.user.id })
          .select('id, auth_user_id, username, display_name, bio')
          .single()

        if (!active) return
        if (createError) {
          setError(createError.message)
        } else {
          setProfile(created as Profile)
          setEditing(true)
        }
      }
      setLoading(false)
    }

    void load()
    return () => { active = false }
  }, [supabase])

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!profile || saving) return

    const cleanName = displayName.trim()
    const cleanUsername = username.trim().toLowerCase()
    const cleanBio = bio.trim()

    if (cleanUsername && !/^[a-z0-9_]{3,30}$/.test(cleanUsername)) {
      setError('Username must be 3–30 characters: lowercase letters, numbers, or underscores.')
      return
    }
    if (cleanName.length > 80 || cleanBio.length > 500) {
      setError('Display name must be at most 80 characters and bio at most 500.')
      return
    }

    setSaving(true)
    setError('')
    setNotice('')

    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user || auth.user.id !== profile.auth_user_id) {
      setSaving(false)
      setError('Your session has expired. Please sign in again.')
      return
    }

    const { data, error: updateError } = await supabase
      .from('social_profiles')
      .update({
        display_name: cleanName || null,
        username: cleanUsername || null,
        bio: cleanBio || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)
      .eq('auth_user_id', auth.user.id)
      .select('id, auth_user_id, username, display_name, bio')
      .single()

    setSaving(false)
    if (updateError) {
      setError(updateError.code === '23505' ? 'That username is already taken.' : updateError.message)
      return
    }

    setProfile(data as Profile)
    setEditing(false)
    setNotice('Profile saved.')
  }

  function cancelEdit() {
    if (!profile) return
    setDisplayName(profile.display_name ?? '')
    setUsername(profile.username ?? '')
    setBio(profile.bio ?? '')
    setError('')
    setEditing(false)
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 text-slate-100 sm:px-6">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-400">Aether Social</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">My Profile</h1>
        <p className="mt-2 text-sm text-slate-400">Your identity across Aether Social.</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-8 text-slate-300">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading your profile...
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#101b30] shadow-xl">
          <div className="h-28 bg-gradient-to-r from-violet-700/70 via-indigo-700/50 to-blue-700/50 sm:h-36" />
          <div className="px-5 pb-7 sm:px-8">
            <div className="-mt-10 mb-5 flex items-end justify-between gap-3">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-[#101b30] bg-[#253451] text-violet-200">
                <UserRound className="h-9 w-9" />
              </div>
              {!editing && profile && (
                <button type="button" onClick={() => { setEditing(true); setNotice('') }}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold transition hover:bg-white/10">
                  <Pencil className="h-4 w-4" /> Edit Profile
                </button>
              )}
            </div>

            {error && <p role="alert" className="mb-4 rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}
            {notice && <p role="status" className="mb-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">{notice}</p>}

            {profile && !editing && (
              <div>
                <h2 className="text-2xl font-bold">{profile.display_name || 'Your name goes here'}</h2>
                <p className="mt-1 flex items-center gap-1 text-sm text-violet-300">
                  <AtSign className="h-4 w-4" /> {profile.username || 'Choose a username'}
                </p>
                <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-slate-300">
                  {profile.bio || 'Add a bio to introduce yourself to the Aether community.'}
                </p>
              </div>
            )}

            {profile && editing && (
              <form onSubmit={saveProfile} className="space-y-5">
                <div>
                  <label htmlFor="social-name" className="mb-2 block text-sm font-semibold">Display name</label>
                  <input id="social-name" value={displayName} onChange={e => setDisplayName(e.target.value)}
                    maxLength={80} placeholder="How you'd like to be known"
                    className="w-full rounded-xl border border-white/20 bg-black/20 px-4 py-3 text-white outline-none focus:border-violet-400" />
                </div>
                <div>
                  <label htmlFor="social-username" className="mb-2 block text-sm font-semibold">Username</label>
                  <input id="social-username" value={username} onChange={e => setUsername(e.target.value)}
                    maxLength={30} autoCapitalize="none" autoComplete="off" spellCheck={false}
                    placeholder="your_username"
                    className="w-full rounded-xl border border-white/20 bg-black/20 px-4 py-3 text-white outline-none focus:border-violet-400" />
                  <p className="mt-2 text-xs text-slate-400">3–30 characters, lowercase letters, numbers, and underscores. Optional for now.</p>
                </div>
                <div>
                  <label htmlFor="social-bio" className="mb-2 block text-sm font-semibold">Bio</label>
                  <textarea id="social-bio" value={bio} onChange={e => setBio(e.target.value)}
                    maxLength={500} rows={5} placeholder="Tell people a little about yourself..."
                    className="w-full resize-y rounded-xl border border-white/20 bg-black/20 px-4 py-3 text-white outline-none focus:border-violet-400" />
                  <p className="mt-1 text-right text-xs text-slate-400">{bio.length}/500</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button type="submit" disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-500 disabled:opacity-50">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    {saving ? 'Saving...' : 'Save Profile'}
                  </button>
                  <button type="button" onClick={cancelEdit} disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold transition hover:bg-white/10 disabled:opacity-50">
                    <X className="h-4 w-4" /> Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      <p className="mt-5 text-xs leading-6 text-slate-500">
        Profile pictures, public profiles, professional history, and personal/professional visibility controls are coming later.
      </p>
    </main>
  )
}
