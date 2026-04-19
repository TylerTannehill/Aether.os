'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type List = {
  id: string
  name: string
  created_at?: string | null
}

export default function ListsPage() {
  const [lists, setLists] = useState<List[]>([])
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLists()
  }, [])

  async function fetchLists() {
    setLoading(true)

    const { data, error } = await supabase
      .from('lists')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error) {
      setLists(data || [])
    }

    setLoading(false)
  }

  async function createList() {
    if (!name.trim()) return

    const { error } = await supabase.from('lists').insert({ name })

    if (!error) {
      setName('')
      fetchLists()
    }
  }

  return (
    <div className="page-wrap">
      <section className="hero">
        <h2 className="hero-title">Lists & Call Packs</h2>
        <p className="hero-text">
          Organize targets, open saved outreach packs, and move through campaign operations with precision.
        </p>
      </section>

      <section className="card">
        <div className="card-header">
          <h3 className="card-title">Lists</h3>
          <div className="meta">Showing {lists.length} lists</div>
        </div>

        <div className="card-body">
          <div className="action-row">
            <input
              className="input"
              style={{ maxWidth: 260 }}
              placeholder="New list name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button className="button button-primary" onClick={createList}>
              Create List
            </button>
            <Link href="/" className="button">
              Back to Contacts
            </Link>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3}>Loading lists...</td>
                  </tr>
                ) : lists.length === 0 ? (
                  <tr>
                    <td colSpan={3}>No lists yet</td>
                  </tr>
                ) : (
                  lists.map((list) => (
                    <tr key={list.id}>
                      <td>{list.name}</td>
                      <td>
                        {list.created_at
                          ? new Date(list.created_at).toLocaleString()
                          : '—'}
                      </td>
                      <td>
                        <Link href={`/lists/${list.id}`} className="button button-primary">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}