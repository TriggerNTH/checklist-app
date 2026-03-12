import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Head from 'next/head'
import { supabaseAdmin } from '../../lib/supabase'

export default function Admin({ checklists: initial, baseUrl }) {
  const [checklists, setChecklists] = useState(initial || [])
  const [copied, setCopied] = useState(null)
  const router = useRouter()

  async function handleDelete(id) {
    if (!confirm('Supprimer cette checklist ?')) return
    await fetch('/api/checklists/' + id, { method: 'DELETE' })
    setChecklists(checklists.filter(c => c.id !== id))
  }

  function handleCopy(url, id) {
    navigator.clipboard.writeText(url)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  async function handleLogout() {
    await fetch('/api/admin/login', { method: 'DELETE' })
    router.push('/admin/login')
  }

  return (
    <>
      <Head><title>Admin — Checklists</title></Head>
      <div className="min-h-screen bg-cream font-body">
        <div className="max-w-3xl mx-auto px-6 py-12">

          <div className="flex items-end justify-between mb-12">
            <div>
              <h1 className="font-display text-4xl text-charcoal">Mes checklists</h1>
              <p className="text-muted text-sm mt-1">{checklists.length} checklist{checklists.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleLogout}
                className="px-4 py-2.5 rounded-xl border border-border text-muted text-sm hover:border-charcoal hover:text-charcoal transition-colors">
                Déconnexion
              </button>
              <Link href="/admin/upload"
                className="px-5 py-2.5 rounded-xl border border-border text-charcoal text-sm font-medium hover:bg-charcoal hover:text-cream hover:border-charcoal transition-colors">
                Upload HTML
              </Link>
              <Link href="/admin/new"
                className="px-5 py-2.5 rounded-xl bg-charcoal text-cream text-sm font-medium hover:bg-charcoal/80 transition-colors">
                + Nouvelle
              </Link>
            </div>
          </div>

          {checklists.length === 0 && (
            <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl">
              <p className="text-muted mb-4">Aucune checklist pour l'instant</p>
              <Link href="/admin/new" className="text-accent text-sm font-medium hover:underline">Créer la première →</Link>
            </div>
          )}

          <div className="space-y-3">
            {checklists.map(cl => {
              const url = baseUrl + '/c/' + cl.slug
              return (
                <div key={cl.id} className="bg-white border border-border rounded-2xl p-5 flex items-center justify-between gap-4 hover:border-accent/30 transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-charcoal truncate">{cl.title}</p>
                      <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium
                        ${cl.type === 'html' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                        {cl.type === 'html' ? 'HTML' : 'Checklist'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted font-mono truncate">{url}</span>
                      {cl.type === 'checklist' && <>
                        <span className="text-xs text-muted/40">·</span>
                        <span className="text-xs text-muted flex-shrink-0">{cl.items?.length || 0} items</span>
                      </>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Copier */}
                    <button onClick={() => handleCopy(url, cl.id)} title="Copier le lien"
                      className={`p-2 rounded-lg transition-colors ${copied === cl.id ? 'text-accent' : 'text-muted hover:text-charcoal hover:bg-cream'}`}>
                      {copied === cl.id
                        ? <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                        : <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      }
                    </button>
                    {/* Voir */}
                    <a href={'/c/' + cl.slug} target="_blank" title="Voir"
                      className="p-2 rounded-lg text-muted hover:text-charcoal hover:bg-cream transition-colors">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
                    </a>
                    {/* Éditer */}
                    <Link href={'/admin/edit/' + cl.id} title="Éditer"
                      className="p-2 rounded-lg text-muted hover:text-charcoal hover:bg-cream transition-colors">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                    </Link>
                    {/* Supprimer */}
                    <button onClick={() => handleDelete(cl.id)} title="Supprimer"
                      className="p-2 rounded-lg text-muted hover:text-red-500 hover:bg-red-50 transition-colors">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}

export async function getServerSideProps({ req }) {
  const session = req.cookies['admin_session']
  if (session !== process.env.ADMIN_PASSWORD) {
    return { redirect: { destination: '/admin/login', permanent: false } }
  }
  const { data } = await supabaseAdmin.from('checklists').select('*').order('created_at', { ascending: false })
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  return { props: { checklists: data || [], baseUrl } }
}
