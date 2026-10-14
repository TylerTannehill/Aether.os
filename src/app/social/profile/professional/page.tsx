'use client'

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowDown, ArrowLeft, Check, Loader2, Pencil, Plus, ShieldCheck, UserRound, Camera, Trash2, X } from 'lucide-react'

type SocialProfile = {
  id: string
  auth_user_id: string
  display_name: string | null
  username: string | null
  bio: string | null
  avatar_path: string | null
}

type Experience = {
  id: string
  profile_id: string
  company_name: string
  job_title: string
  employment_type: string | null
  location: string | null
  location_type: string | null
  start_date: string
  end_date: string | null
  is_current: boolean
  description: string | null
}


type EducationType = 'high_school' | 'college' | 'certification'

type Education = {
  id: string
  profile_id: string
  entry_type: EducationType
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

type EducationFields = {
  entry_type: EducationType
  institution_name: string
  degree: string
  field_of_study: string
  issuing_organization: string
  start_date: string
  end_date: string
  issue_date: string
  expiration_date: string
  credential_url: string
  description: string
}

const blankEducation: EducationFields = {
  entry_type: 'high_school', institution_name: '', degree: '', field_of_study: '',
  issuing_organization: '', start_date: '', end_date: '', issue_date: '',
  expiration_date: '', credential_url: '', description: ''
}

const educationLabels: Record<EducationType, string> = {
  high_school: 'High School',
  college: 'College / University',
  certification: 'Certification'
}

function toMonth(value: string | null) {
  return value ? value.slice(0, 7) : ''
}

function toDate(value: string) {
  return value ? `${value}-01` : null
}

function sortEducationNewestFirst(rows: Education[]): Education[] {
  return [...rows].sort((a, b) => {
    const dateA = a.entry_type === 'certification' ? a.issue_date : a.start_date
    const dateB = b.entry_type === 'certification' ? b.issue_date : b.start_date
    if (!dateA && !dateB) return a.display_order - b.display_order
    if (!dateA) return 1
    if (!dateB) return -1
    return dateB.localeCompare(dateA) || a.display_order - b.display_order
  })
}

type Fields = {
  company_name: string
  job_title: string
  employment_type: string
  location: string
  location_type: string
  start_date: string
  end_date: string
  is_current: boolean
  description: string
}

const blank: Fields = {
  company_name: '', job_title: '', employment_type: '', location: '',
  location_type: '', start_date: '', end_date: '', is_current: false, description: ''
}

function monthLabel(value: string | null) {
  if (!value) return 'Present'
  const [year, month] = value.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export default function ProfessionalDetailsPage() {
  const [supabase] = useState(() => createClient())
  const [profileId, setProfileId] = useState<string | null>(null)
  const [profile, setProfile] = useState<SocialProfile | null>(null)
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [avatarBusy, setAvatarBusy] = useState(false)
  const [avatarError, setAvatarError] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [identityEditing, setIdentityEditing] = useState(false)
  const [items, setItems] = useState<Experience[]>([])

  const [education, setEducation] = useState<Education[]>([])
  const [educationError, setEducationError] = useState('')
  const [educationBusy, setEducationBusy] = useState(false)
  const [educationOpen, setEducationOpen] = useState(false)
  const [educationEditingId, setEducationEditingId] = useState<string | null>(null)
  const [educationFields, setEducationFields] = useState<EducationFields>({ ...blankEducation })
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [fields, setFields] = useState<Fields>({ ...blank })
  const [error, setError] = useState('')

  async function refresh(id: string) {
    const { data, error: readError } = await supabase.from('social_professional_experience')
      .select('id, profile_id, company_name, job_title, employment_type, location, location_type, start_date, end_date, is_current, description')
      .eq('profile_id', id).order('is_current', { ascending: false }).order('start_date', { ascending: false })
    if (readError) throw new Error(readError.message)
    setItems((data ?? []) as Experience[])
  }

  useEffect(() => {
    let active = true
    async function load() {
      const { data: auth, error: authError } = await supabase.auth.getUser()
      if (!active) return
      if (authError || !auth.user) {
        window.location.replace('/login-social')
        return
      }
      const { data: profile, error: profileError } = await supabase.from('social_profiles')
        .select('id, auth_user_id, display_name, username, bio, avatar_path').eq('auth_user_id', auth.user.id).maybeSingle()
      if (!active) return
      if (profileError) setError(profileError.message)
      else if (!profile) setError('Create your Social profile first.')
      else {
        setProfileId(profile.id)
        setProfile(profile as SocialProfile)
        setName(profile.display_name ?? '')
        setUsername(profile.username ?? '')
        setBio(profile.bio ?? '')
        const { data, error: readError } = await supabase.from('social_professional_experience')
          .select('id, profile_id, company_name, job_title, employment_type, location, location_type, start_date, end_date, is_current, description')
          .eq('profile_id', profile.id).order('is_current', { ascending: false }).order('start_date', { ascending: false })
        if (!active) return
        if (readError) setError(readError.message)
        else setItems((data ?? []) as Experience[])

        const { data: educationRows, error: educationReadError } = await supabase
          .from('social_professional_education')
          .select('id, profile_id, entry_type, institution_name, degree, field_of_study, issuing_organization, start_date, end_date, issue_date, expiration_date, credential_url, description, display_order')
          .eq('profile_id', profile.id)
          .order('display_order', { ascending: true })
          .order('created_at', { ascending: true })
        if (!active) return
        if (educationReadError) setEducationError(educationReadError.message)
        else setEducation(sortEducationNewestFirst((educationRows ?? []) as Education[]))
      }
      if (active) setLoading(false)
    }
    void load()
    return () => { active = false }
  }, [supabase])

  async function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !profile || avatarBusy) return
    setAvatarError('')
    const extensions: Record<string, string> = {
      'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp'
    }
    const extension = extensions[file.type]
    if (!extension) {
      setAvatarError('Choose a JPEG, PNG, or WebP image.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Profile pictures must be 5 MB or smaller.')
      return
    }
    setAvatarBusy(true)
    const newPath = `${profile.auth_user_id}/${crypto.randomUUID()}.${extension}`
    try {
      const { data: auth, error: authError } = await supabase.auth.getUser()
      if (authError || auth.user?.id !== profile.auth_user_id) throw new Error('Please sign in again.')
      const { error: uploadError } = await supabase.storage
        .from('social-avatars').upload(newPath, file, { contentType: file.type, upsert: false })
      if (uploadError) throw new Error(uploadError.message)
      const { data, error: updateError } = await supabase.from('social_profiles')
        .update({ avatar_path: newPath, updated_at: new Date().toISOString() })
        .eq('id', profile.id).eq('auth_user_id', auth.user.id)
        .select('id, auth_user_id, display_name, username, bio, avatar_path').single()
      if (updateError) {
        await supabase.storage.from('social-avatars').remove([newPath])
        throw new Error(updateError.message)
      }
      const oldPath = profile.avatar_path
      setProfile(data as SocialProfile)
      if (oldPath && oldPath !== newPath && oldPath.startsWith(`${profile.auth_user_id}/`)) {
        await supabase.storage.from('social-avatars').remove([oldPath])
      }
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : 'Unable to upload profile picture.')
    } finally {
      setAvatarBusy(false)
    }
  }

  async function removeAvatar() {
    if (!profile?.avatar_path || avatarBusy) return
    setAvatarBusy(true)
    setAvatarError('')
    try {
      const { data: auth, error: authError } = await supabase.auth.getUser()
      if (authError || auth.user?.id !== profile.auth_user_id) throw new Error('Please sign in again.')
      const oldPath = profile.avatar_path
      const { data, error: updateError } = await supabase.from('social_profiles')
        .update({ avatar_path: null, updated_at: new Date().toISOString() })
        .eq('id', profile.id).eq('auth_user_id', auth.user.id)
        .select('id, auth_user_id, display_name, username, bio, avatar_path').single()
      if (updateError) throw new Error(updateError.message)
      setProfile(data as SocialProfile)
      if (oldPath.startsWith(`${profile.auth_user_id}/`)) {
        const { error: removeError } = await supabase.storage.from('social-avatars').remove([oldPath])
        if (removeError) setAvatarError('Picture removed from your profile, but storage cleanup failed.')
      }
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : 'Unable to remove profile picture.')
    } finally {
      setAvatarBusy(false)
    }
  }

  const avatarUrl = profile?.avatar_path
    ? supabase.storage.from('social-avatars').getPublicUrl(profile.avatar_path).data.publicUrl
    : null

  async function saveProfessionalProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!profile || profileSaving) return
    const cleanName = name.trim()
    const cleanUsername = username.trim().toLowerCase()
    const cleanBio = bio.trim()
    if (cleanUsername && !/^[a-z0-9_]{3,30}$/.test(cleanUsername)) {
      setError('Username must be 3–30 lowercase letters, numbers, or underscores.')
      return
    }
    if (cleanName.length > 80 || cleanBio.length > 500) {
      setError('Name must be at most 80 characters and bio at most 500.')
      return
    }
    setProfileSaving(true)
    setError('')
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user || auth.user.id !== profile.auth_user_id) {
      setError('Session expired. Please sign in again.')
      setProfileSaving(false)
      return
    }
    const { data, error: updateError } = await supabase.from('social_profiles')
      .update({ display_name: cleanName || null, username: cleanUsername || null,
        bio: cleanBio || null, updated_at: new Date().toISOString() })
      .eq('id', profile.id).eq('auth_user_id', auth.user.id)
      .select('id, auth_user_id, display_name, username, bio, avatar_path').single()
    if (updateError) setError(updateError.code === '23505' ? 'That username is already taken.' : updateError.message)
    else {
      setProfile(data as SocialProfile)
      setName(data.display_name ?? '')
      setUsername(data.username ?? '')
      setBio(data.bio ?? '')
      setIdentityEditing(false)
    }
    setProfileSaving(false)
  }

  function cancelIdentityEdit() {
    if (!profile) return
    setName(profile.display_name ?? '')
    setUsername(profile.username ?? '')
    setBio(profile.bio ?? '')
    setIdentityEditing(false)
    setError('')
  }

  function openNew() {
    setFields({ ...blank }); setEditingId(null); setEditorOpen(true); setError('')
  }

  function openEdit(item: Experience) {
    setFields({
      company_name: item.company_name, job_title: item.job_title,
      employment_type: item.employment_type ?? '', location: item.location ?? '',
      location_type: item.location_type ?? '', start_date: item.start_date.slice(0, 7),
      end_date: item.end_date?.slice(0, 7) ?? '', is_current: item.is_current,
      description: item.description ?? ''
    })
    setEditingId(item.id); setEditorOpen(true); setError('')
  }

  function change<K extends keyof Fields>(key: K, value: Fields[K]) {
    setFields(old => ({ ...old, [key]: value }))
  }

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!profileId || busy) return
    if (!fields.company_name.trim() || !fields.job_title.trim() || !fields.start_date) {
      setError('Company, title, and start month are required.'); return
    }
    if (!fields.is_current && fields.end_date && fields.end_date < fields.start_date) {
      setError('End month must be after start month.'); return
    }
    setBusy(true); setError('')
    const payload = {
      company_name: fields.company_name.trim(), job_title: fields.job_title.trim(),
      employment_type: fields.employment_type || null, location: fields.location.trim() || null,
      location_type: fields.location_type || null,
      start_date: fields.start_date + '-01',
      end_date: fields.is_current || !fields.end_date ? null : fields.end_date + '-01',
      is_current: fields.is_current, description: fields.description.trim() || null,
      updated_at: new Date().toISOString()
    }
    const result = editingId
      ? await supabase.from('social_professional_experience').update(payload)
          .eq('id', editingId).eq('profile_id', profileId).select('id').single()
      : await supabase.from('social_professional_experience')
          .insert({ ...payload, profile_id: profileId }).select('id').single()
    if (result.error) setError(result.error.message)
    else {
      try {
        await refresh(profileId)
        setEditorOpen(false); setEditingId(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Saved, but refresh failed.')
      }
    }
    setBusy(false)
  }

  async function remove(item: Experience) {
    if (!profileId || busy || !window.confirm(`Delete ${item.job_title} at ${item.company_name}?`)) return
    setBusy(true); setError('')
    const { data, error: deleteError } = await supabase.from('social_professional_experience')
      .delete().eq('id', item.id).eq('profile_id', profileId).select('id')
    if (deleteError) setError(deleteError.message)
    else if (!data?.length) setError('Unable to delete this experience.')
    else {
      setItems(old => old.filter(row => row.id !== item.id))
      if (editingId === item.id) { setEditorOpen(false); setEditingId(null) }
    }
    setBusy(false)
  }


  async function refreshEducation(id: string) {
    const { data, error: readError } = await supabase
      .from('social_professional_education')
      .select('id, profile_id, entry_type, institution_name, degree, field_of_study, issuing_organization, start_date, end_date, issue_date, expiration_date, credential_url, description, display_order')
      .eq('profile_id', id)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true })
    if (readError) throw new Error(readError.message)
    setEducation(sortEducationNewestFirst((data ?? []) as Education[]))
  }

  function addEducation() {
    setEducationFields({ ...blankEducation })
    setEducationEditingId(null)
    setEducationError('')
    setEducationOpen(true)
  }

  function editEducation(item: Education) {
    setEducationFields({
      entry_type: item.entry_type,
      institution_name: item.institution_name,
      degree: item.degree ?? '',
      field_of_study: item.field_of_study ?? '',
      issuing_organization: item.issuing_organization ?? '',
      start_date: toMonth(item.start_date),
      end_date: toMonth(item.end_date),
      issue_date: toMonth(item.issue_date),
      expiration_date: toMonth(item.expiration_date),
      credential_url: item.credential_url ?? '',
      description: item.description ?? ''
    })
    setEducationEditingId(item.id)
    setEducationError('')
    setEducationOpen(true)
  }

  function changeEducation<K extends keyof EducationFields>(key: K, value: EducationFields[K]) {
    setEducationFields(old => ({ ...old, [key]: value }))
  }

  async function saveEducation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!profileId || educationBusy) return
    const f = educationFields
    if (!f.institution_name.trim()) {
      setEducationError(f.entry_type === 'certification' ? 'Certification name is required.' : 'School name is required.')
      return
    }
    if (f.entry_type !== 'certification' && f.start_date && f.end_date && f.end_date < f.start_date) {
      setEducationError('End month cannot be earlier than start month.')
      return
    }
    if (f.entry_type === 'certification' && f.issue_date && f.expiration_date && f.expiration_date < f.issue_date) {
      setEducationError('Expiration month cannot be earlier than issue month.')
      return
    }
    const url = f.credential_url.trim()
    if (f.entry_type === 'certification' && url) {
      try {
        const parsed = new URL(url)
        if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') throw new Error('Invalid protocol')
      } catch {
        setEducationError('Credential URL must be a valid http:// or https:// link.')
        return
      }
    }
    const isCert = f.entry_type === 'certification'
    const isCollege = f.entry_type === 'college'
    const payload = {
      entry_type: f.entry_type,
      institution_name: f.institution_name.trim(),
      degree: isCollege ? f.degree.trim() || null : null,
      field_of_study: isCollege ? f.field_of_study.trim() || null : null,
      issuing_organization: isCert ? f.issuing_organization.trim() || null : null,
      start_date: isCert ? null : toDate(f.start_date),
      end_date: isCert ? null : toDate(f.end_date),
      issue_date: isCert ? toDate(f.issue_date) : null,
      expiration_date: isCert ? toDate(f.expiration_date) : null,
      credential_url: isCert ? url || null : null,
      description: f.description.trim() || null,
      updated_at: new Date().toISOString()
    }
    setEducationBusy(true)
    setEducationError('')
    try {
      const result = educationEditingId
        ? await supabase.from('social_professional_education').update(payload)
            .eq('id', educationEditingId).eq('profile_id', profileId).select('id').single()
        : await supabase.from('social_professional_education')
            .insert({ ...payload, profile_id: profileId, display_order: education.length })
            .select('id').single()
      if (result.error) throw new Error(result.error.message)
      await refreshEducation(profileId)
      setEducationOpen(false)
      setEducationEditingId(null)
    } catch (err) {
      setEducationError(err instanceof Error ? err.message : 'Unable to save education.')
    } finally {
      setEducationBusy(false)
    }
  }

  async function deleteEducation(item: Education) {
    if (!profileId || educationBusy || !window.confirm(`Delete ${item.institution_name}?`)) return
    setEducationBusy(true)
    setEducationError('')
    try {
      const { data, error: deleteError } = await supabase.from('social_professional_education')
        .delete().eq('id', item.id).eq('profile_id', profileId).select('id')
      if (deleteError) throw new Error(deleteError.message)
      if (!data?.length) throw new Error('Unable to delete this entry.')
      setEducation(old => old.filter(row => row.id !== item.id))
      if (educationEditingId === item.id) {
        setEducationOpen(false)
        setEducationEditingId(null)
      }
    } catch (err) {
      setEducationError(err instanceof Error ? err.message : 'Unable to delete entry.')
    } finally {
      setEducationBusy(false)
    }
  }

  const input = 'w-full rounded-lg border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none focus:border-violet-400'
  const label = 'mb-1 block text-xs font-semibold text-slate-300'

  const experienceEditor = (
    <div className="mb-4 rounded-xl border border-violet-400/30 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold">{editingId ? 'Edit experience' : 'Add experience'}</h2>
              <button type="button" disabled={busy} onClick={() => { setEditorOpen(false); setError('') }} aria-label="Close editor"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={save} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label htmlFor="company" className={label}>Company *</label><input id="company" required maxLength={160} className={input} value={fields.company_name} onChange={e => change('company_name', e.target.value)} /></div>
                <div><label htmlFor="job" className={label}>Job title *</label><input id="job" required maxLength={160} className={input} value={fields.job_title} onChange={e => change('job_title', e.target.value)} /></div>
                <div><label htmlFor="type" className={label}>Employment type</label><select id="type" className={input} value={fields.employment_type} onChange={e => change('employment_type', e.target.value)}>
                  <option value="">Not specified</option>{['Full-time', 'Part-time', 'Contract', 'Self-employed', 'Freelance', 'Internship', 'Volunteer', 'Other'].map(v => <option key={v}>{v}</option>)}
                </select></div>
                <div><label htmlFor="location" className={label}>Location</label><input id="location" className={input} maxLength={160} value={fields.location} onChange={e => change('location', e.target.value)} placeholder="City, State" /></div>
                <div><label htmlFor="arrangement" className={label}>Work arrangement</label><select id="arrangement" className={input} value={fields.location_type} onChange={e => change('location_type', e.target.value)}>
                  <option value="">Not specified</option>{['On-site', 'Hybrid', 'Remote'].map(v => <option key={v}>{v}</option>)}
                </select></div>
                <div><label htmlFor="start" className={label}>Start month *</label><input id="start" type="month" required className={input} value={fields.start_date} onChange={e => change('start_date', e.target.value)} /></div>
                <div className="flex items-center gap-2 sm:col-span-2"><input id="current" type="checkbox" checked={fields.is_current} onChange={e => change('is_current', e.target.checked)} className="accent-violet-500" /><label htmlFor="current" className="text-sm">I currently work here</label></div>
                {!fields.is_current && <div><label htmlFor="end" className={label}>End month</label><input id="end" type="month" className={input} value={fields.end_date} onChange={e => change('end_date', e.target.value)} /></div>}
              </div>
              <div><label htmlFor="highlights" className={label}>Highlights & accomplishments</label>
                <textarea id="highlights" rows={4} maxLength={4000} className={input} value={fields.description} onChange={e => change('description', e.target.value)} placeholder="What did you accomplish?" />
                <p className="mt-1 text-right text-xs text-slate-500">{fields.description.length}/4000</p>
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold hover:bg-violet-500 disabled:opacity-50">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{editingId ? 'Save changes' : 'Add experience'}
                </button>
                <button type="button" disabled={busy} onClick={() => { setEditorOpen(false); setError('') }} className="rounded-lg border border-white/20 px-4 py-2 text-sm hover:bg-white/10">Cancel</button>
              </div>
            </form>
            </div>
  )

  const educationEditor = (
    <div className="mb-4 rounded-xl border border-violet-400/30 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-bold">{educationEditingId ? 'Edit entry' : 'Add education or certification'}</h3>
                  <button type="button" disabled={educationBusy} onClick={() => setEducationOpen(false)} aria-label="Close education editor"><X className="h-4 w-4" /></button>
                </div>
                <form onSubmit={saveEducation} className="space-y-3">
                  <fieldset>
                    <legend className={label}>Entry type</legend>
                    <div className="flex flex-wrap gap-4">
                      {(['high_school', 'college', 'certification'] as EducationType[]).map(type => (
                        <label key={type} className="inline-flex items-center gap-2 text-sm text-slate-200">
                          <input type="radio" name="education-type" checked={educationFields.entry_type === type}
                            onChange={() => changeEducation('entry_type', type)} className="accent-violet-500" />
                          {educationLabels[type]}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <div>
                    <label htmlFor="education-name" className={label}>
                      {educationFields.entry_type === 'certification' ? 'Certification name *' : 'School / Institution name *'}
                    </label>
                    <input id="education-name" required maxLength={200} className={input}
                      placeholder={educationFields.entry_type === 'certification' ? 'Enter the credential name' : 'Enter the school name'}
                      value={educationFields.institution_name} onChange={e => changeEducation('institution_name', e.target.value)} />
                  </div>
                  {educationFields.entry_type === 'college' && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div><label htmlFor="education-degree" className={label}>Degree (optional)</label>
                        <input id="education-degree" maxLength={200} className={input} value={educationFields.degree}
                          onChange={e => changeEducation('degree', e.target.value)} placeholder="Bachelor's, Master's, MBA..." /></div>
                      <div><label htmlFor="education-field" className={label}>Field of study (optional)</label>
                        <input id="education-field" maxLength={200} className={input} value={educationFields.field_of_study}
                          onChange={e => changeEducation('field_of_study', e.target.value)} placeholder="Write it in your own words" /></div>
                    </div>
                  )}
                  {educationFields.entry_type === 'certification' ? (
                    <>
                      <div><label htmlFor="education-issuer" className={label}>Issuing organization (optional)</label>
                        <input id="education-issuer" maxLength={200} className={input} value={educationFields.issuing_organization}
                          onChange={e => changeEducation('issuing_organization', e.target.value)} /></div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div><label htmlFor="education-issued" className={label}>Issue month (optional)</label>
                          <input id="education-issued" type="month" className={input} value={educationFields.issue_date}
                            onChange={e => changeEducation('issue_date', e.target.value)} /></div>
                        <div><label htmlFor="education-expires" className={label}>Expiration month (optional)</label>
                          <input id="education-expires" type="month" className={input} value={educationFields.expiration_date}
                            onChange={e => changeEducation('expiration_date', e.target.value)} /></div>
                      </div>
                      <div><label htmlFor="education-url" className={label}>Credential URL (optional)</label>
                        <input id="education-url" type="url" maxLength={2000} className={input}
                          placeholder="https://..." value={educationFields.credential_url}
                          onChange={e => changeEducation('credential_url', e.target.value)} /></div>
                    </>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div><label htmlFor="education-start" className={label}>Start month (optional)</label>
                        <input id="education-start" type="month" className={input} value={educationFields.start_date}
                          onChange={e => changeEducation('start_date', e.target.value)} /></div>
                      <div><label htmlFor="education-end" className={label}>Graduation / End month (optional)</label>
                        <input id="education-end" type="month" className={input} value={educationFields.end_date}
                          onChange={e => changeEducation('end_date', e.target.value)} /></div>
                    </div>
                  )}
                  <div><label htmlFor="education-description" className={label}>Additional details (optional)</label>
                    <textarea id="education-description" rows={3} maxLength={4000} className={input}
                      value={educationFields.description} onChange={e => changeEducation('description', e.target.value)}
                      placeholder="Anything else you'd like to share" /></div>
                  <div className="flex flex-wrap gap-2">
                    <button type="submit" disabled={educationBusy} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold hover:bg-violet-500 disabled:opacity-50">
                      {educationBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      {educationEditingId ? 'Save changes' : 'Add entry'}
                    </button>
                    <button type="button" disabled={educationBusy} onClick={() => setEducationOpen(false)}
                      className="rounded-lg border border-white/20 px-4 py-2 text-sm hover:bg-white/10">Cancel</button>
                  </div>
                </form>
              </div>
  )


  return (
    <main className="mx-auto w-full max-w-4xl px-4 pb-10 pt-4 text-slate-100 sm:px-6">
      <Link href="/social/profile" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-violet-300 hover:text-violet-200">
        <ArrowLeft className="h-4 w-4" /> Back to Profile
      </Link>
      <section aria-labelledby="professional-hero-title" className="mb-5 rounded-2xl border border-white/10 bg-[#101b30] px-5 py-7 shadow-lg sm:px-8 sm:py-9">
        <div className="grid items-center gap-5 sm:grid-cols-[150px_minmax(0,1fr)_150px]">
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp"
              onChange={uploadAvatar} className="sr-only" aria-label="Choose a professional profile picture" />
            <button type="button" disabled={!profile || avatarBusy} onClick={() => avatarInputRef.current?.click()}
              aria-label={avatarUrl ? 'Replace profile picture' : 'Upload profile picture'}
              className="group relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-violet-400/50 bg-[#263451] text-violet-200 transition hover:border-violet-300 disabled:cursor-not-allowed disabled:opacity-60">
              {avatarUrl ? <img src={avatarUrl} alt="Your professional profile picture" className="h-full w-full object-cover" /> : <UserRound className="h-10 w-10" />}
              <span className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                {avatarBusy ? <Loader2 className="h-6 w-6 animate-spin" /> : <Camera className="h-6 w-6" />}
              </span>
            </button>
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 sm:justify-start">
              <button type="button" disabled={!profile || avatarBusy} onClick={() => avatarInputRef.current?.click()}
                className="text-xs font-semibold text-violet-300 hover:text-violet-200 disabled:opacity-50">
                {avatarBusy ? 'Working...' : avatarUrl ? 'Replace photo' : 'Upload photo'}
              </button>
              {avatarUrl && <button type="button" disabled={avatarBusy} onClick={() => void removeAvatar()}
                className="text-xs font-semibold text-rose-300 hover:text-rose-200 disabled:opacity-50">Remove</button>}
            </div>
            {avatarError && <p role="alert" className="max-w-48 text-xs text-rose-300">{avatarError}</p>}
          </div>
          <div className="text-center">
            <h1 id="professional-hero-title" className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Share who you are.</h1>
            <nav aria-label="Jump to professional profile sections" className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              {([['About', 'about'], ['Experience', 'experience'], ['Education', 'education']] as const).map(([title, id]) => (
                <a key={id} href={`#${id}`}
                  className="inline-flex items-center gap-2 rounded-lg border border-violet-400/30 bg-violet-500/10 px-4 py-2 text-sm font-semibold text-violet-100 transition hover:border-violet-400/60 hover:bg-violet-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400">
                  {title} <ArrowDown className="h-3.5 w-3.5" />
                </a>
              ))}
            </nav>
          </div>
          <div className="hidden sm:block" aria-hidden="true" />
        </div>
      </section>
      {error && <p role="alert" className="mb-4 rounded-lg border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}
      {loading ? <div className="flex items-center gap-2 text-sm text-slate-300"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div> : (
        <div className="space-y-4">
          {profile && <section id="about" className="scroll-mt-24 rounded-xl border border-white/10 bg-[#101b30] p-4 sm:p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-bold">About</h2>
              {!identityEditing && <button type="button" onClick={() => { setIdentityEditing(true); setError('') }}
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold hover:bg-white/10">
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>}
            </div>
            {identityEditing ? (
              <form onSubmit={saveProfessionalProfile} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><label htmlFor="pro-name" className={label}>Display name</label>
                    <input id="pro-name" maxLength={80} className={input} value={name} onChange={e => setName(e.target.value)} /></div>
                  <div><label htmlFor="pro-username" className={label}>Username</label>
                    <input id="pro-username" maxLength={30} autoCapitalize="none" spellCheck={false} className={input} value={username} onChange={e => setUsername(e.target.value)} />
                    <p className="mt-1 text-xs text-slate-400">3–30 lowercase letters, numbers, or underscores.</p></div>
                </div>
                <div><label htmlFor="pro-bio" className={label}>Professional bio</label>
                  <textarea id="pro-bio" rows={4} maxLength={500} className={input} value={bio} onChange={e => setBio(e.target.value)} />
                  <p className="mt-1 text-right text-xs text-slate-500">{bio.length}/500</p></div>
                <div className="flex flex-wrap gap-2">
                  <button type="submit" disabled={profileSaving} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold hover:bg-violet-500 disabled:opacity-50">
                    {profileSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    {profileSaving ? 'Saving...' : 'Save professional identity'}
                  </button>
                  <button type="button" disabled={profileSaving} onClick={cancelIdentityEdit}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2 text-sm hover:bg-white/10 disabled:opacity-50">
                    <X className="h-4 w-4" /> Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-300">{profile.bio || 'No professional bio added yet.'}</p>
                <div className="border-t border-white/10 pt-3 text-xs text-slate-400">
                  <span className="font-semibold text-slate-200">{profile.display_name || 'No display name yet'}</span>
                  <span className="mx-2">·</span>
                  <span>{profile.username ? `@${profile.username}` : 'No username yet'}</span>
                </div>
              </div>
            )}
            <div className="mt-5 border-t border-white/10 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                    <ShieldCheck className="h-4 w-4 text-violet-300" /> Aether Verified
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Political and Business experience verified through Aether organizations.
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 text-xs text-slate-300">
                  <span>Show Aether Experience</span>
                  <input
                    type="checkbox"
                    role="switch"
                    checked={false}
                    disabled
                    aria-label="Show Aether Experience (not yet available)"
                    className="h-4 w-4 accent-violet-500 disabled:opacity-50"
                  />
                </label>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Off by default. Automatic verification and profile visibility are coming later.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {(['Political', 'Business'] as const).map(category => (
                  <div key={category} className="rounded-lg border border-white/10 bg-slate-950/30 p-3">
                    <div className="flex items-center gap-2">
                      <span aria-label="Not verified" className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-500 text-xs text-slate-400">—</span>
                      <span className="text-sm font-semibold text-slate-100">{category} Experience</span>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">Role: Not yet connected</p>
                    <p className="mt-1 text-xs text-slate-400">Time: Not yet available</p>
                  </div>
                ))}
              </div>
            </div>
          </section>}
          <section id="experience" className="scroll-mt-24 rounded-xl border border-white/10 bg-[#101b30] p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-bold">Experience <span className="text-sm font-normal text-slate-400">({items.length})</span></h2>
              {profileId && !editorOpen && <button type="button" onClick={openNew}
                className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold hover:bg-violet-500">
                <Plus className="h-4 w-4" /> Add experience
              </button>}
            </div>
            {editorOpen && editingId === null && experienceEditor}
            {items.length === 0 ? <div className="rounded-lg border border-dashed border-white/15 p-6 text-center">
              <p className="text-sm text-slate-300">No experience added yet.</p>
              {profileId && !editorOpen && <button type="button" onClick={openNew} className="mt-2 text-sm font-semibold text-violet-300 hover:underline">Add your first role</button>}
            </div> : <div className="divide-y divide-white/10">{items.map(item => <article key={item.id} className="py-4 first:pt-0 last:pb-0">
              {editorOpen && editingId === item.id ? experienceEditor : <>
              <div className="flex items-start justify-between gap-3">
                <div><h3 className="font-semibold">{item.job_title}</h3><p className="text-sm text-slate-300">{item.company_name}{item.employment_type ? ` · ${item.employment_type}` : ''}</p>
                  <p className="mt-1 text-xs text-slate-400">{monthLabel(item.start_date)} – {item.is_current ? 'Present' : monthLabel(item.end_date)}{item.location ? ` · ${item.location}` : ''}{item.location_type ? ` · ${item.location_type}` : ''}</p></div>
                <div className="flex shrink-0 gap-1">
                  <button type="button" disabled={busy} onClick={() => openEdit(item)} aria-label={`Edit ${item.job_title}`} className="rounded-lg p-2 hover:bg-white/10"><Pencil className="h-4 w-4" /></button>
                  <button type="button" disabled={busy} onClick={() => void remove(item)} aria-label={`Delete ${item.job_title}`} className="rounded-lg p-2 text-rose-300 hover:bg-rose-500/10"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              {item.description && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-300">{item.description}</p>}
              </>}
            </article>)}</div>}
          </section>

          <section id="education" className="scroll-mt-24 rounded-xl border border-white/10 bg-[#101b30] p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-bold">Education &amp; Certifications <span className="text-sm font-normal text-slate-400">({education.length})</span></h2>
                <p className="mt-1 text-xs text-slate-400">Optional. Add as many schools, degrees, or certifications as you'd like.</p>
              </div>
              {profileId && !educationOpen && (
                <button type="button" onClick={addEducation}
                  className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold hover:bg-violet-500">
                  <Plus className="h-4 w-4" /> Add entry
                </button>
              )}
            </div>
            {educationError && <p role="alert" className="mb-3 rounded-lg border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200">{educationError}</p>}
            {educationOpen && educationEditingId === null && educationEditor}
            {education.length === 0 ? (
              <p className="text-sm text-slate-300">No education or certifications added. This section is entirely optional.</p>
            ) : (
              <div className="divide-y divide-white/10">
                {education.map(item => (
                  <article key={item.id} className="py-4 first:pt-0 last:pb-0">
                    {educationOpen && educationEditingId === item.id ? educationEditor : <>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="mb-1 text-xs font-semibold text-violet-300">{educationLabels[item.entry_type]}</p>
                        <h3 className="break-words font-semibold">{item.institution_name}</h3>
                        {item.entry_type === 'college' && (item.degree || item.field_of_study) && (
                          <p className="mt-1 text-sm text-slate-300">{[item.degree, item.field_of_study].filter(Boolean).join(' · ')}</p>
                        )}
                        {item.entry_type === 'certification' && item.issuing_organization && (
                          <p className="mt-1 text-sm text-slate-300">{item.issuing_organization}</p>
                        )}
                        {item.entry_type === 'certification' ? (
                          (item.issue_date || item.expiration_date) && (
                            <p className="mt-1 text-xs text-slate-400">
                              {item.issue_date ? `Issued ${monthLabel(item.issue_date)}` : ''}
                              {item.expiration_date ? ` · Expires ${monthLabel(item.expiration_date)}` : ''}
                            </p>
                          )
                        ) : (
                          (item.start_date || item.end_date) && (
                            <p className="mt-1 text-xs text-slate-400">
                              {[item.start_date ? monthLabel(item.start_date) : null, item.end_date ? monthLabel(item.end_date) : null].filter(Boolean).join(' – ')}
                            </p>
                          )
                        )}
                        {item.credential_url && /^https?:\/\//i.test(item.credential_url) && (
                          <a href={item.credential_url} target="_blank" rel="noopener noreferrer"
                            className="mt-2 inline-block break-all text-xs font-semibold text-violet-300 hover:underline">View credential ↗</a>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button type="button" disabled={educationBusy} onClick={() => editEducation(item)}
                          aria-label={`Edit ${item.institution_name}`} className="rounded-lg p-2 hover:bg-white/10"><Pencil className="h-4 w-4" /></button>
                        <button type="button" disabled={educationBusy} onClick={() => void deleteEducation(item)}
                          aria-label={`Delete ${item.institution_name}`} className="rounded-lg p-2 text-rose-300 hover:bg-rose-500/10"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                    {item.description && <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-300">{item.description}</p>}
                    </>}
                  </article>
                ))}
              </div>
            )}
          </section>
          <p className="text-xs text-slate-500">Professional experience and education are visible to signed-in Social members. Skills and resumes will be added separately.</p>
        </div>
      )}
      <style jsx global>{`
        input[type="month"]::-webkit-calendar-picker-indicator,
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(1);
          opacity: 1;
          cursor: pointer;
        }
      `}</style>
    </main>
  )
}
