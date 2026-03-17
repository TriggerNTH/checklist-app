import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Head from 'next/head'
import { supabaseAdmin } from '../../lib/supabase'

// Modal pour inviter un créateur
function InviteModal({ checklist, baseUrl, onClose }) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [copied, setCopied] = useState(false)

  async function handleInvite(e) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checklist_id: checklist.id, creator_name: name.trim() })
    })
    const data = await res.json()
    if (res.ok) {
      setResult({ ...data, link: `${baseUrl}/c/${checklist.slug}/${data.creator_slug}` })
    }
    setLoading(false)
  }

  function copyLink() {
    navigator.clipboard.writeText(result.link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-display text-xl text-charcoal">Inviter un créateur</h2>
            <p className="text-xs text-muted mt-0.5 truncate">{checklist.title}</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-charcoal transition-colors p-1">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {!result ? (
          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted mb-2">Nom du créateur</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Jean Dupont"
                autoFocus
                className="w-full px-4 py-3 rounded-xl border border-border bg-cream text-charcoal text-base focus:outline-none focus:border-accent transition-colors placeholder:text-muted/40"
              />
            </div>
            <button type="submit" disabled={loading || !name.trim()}
              className="w-full px-5 py-3 rounded-xl bg-charcoal text-cream text-sm font-medium hover:bg-charcoal/80 transition-colors disabled:opacity-50">
              {loading ? 'Génération...' : 'Générer le lien'}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-green-50 border border-green-200 flex items-center gap-2">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-green-600 flex-shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
              <p className="text-sm text-green-700">Lien créé pour <strong>{result.creator_name}</strong></p>
            </div>
            <div className="p-3 rounded-xl border border-border bg-cream">
              <p className="text-xs text-muted mb-1.5 uppercase tracking-widest">Lien à envoyer</p>
              <p className="font-mono text-xs text-charcoal break-all leading-relaxed">{result.link}</p>
            </div>
            <button onClick={copyLink}
              className={`w-full px-5 py-3 rounded-xl text-sm font-medium transition-colors ${copied ? 'bg-green-600 text-white' : 'bg-charcoal text-cream hover:bg-charcoal/80'}`}>
              {copied ? '✓ Copié !' : 'Copier le lien'}
            </button>
            <button onClick={() => { setResult(null); setName('') }}
              className="w-full px-5 py-2.5 rounded-xl border border-border text-muted text-sm hover:border-charcoal hover:text-charcoal transition-colors">
              Inviter un autre créateur
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Ligne de session dans le dashboard
function SessionRow({ session, itemCount }) {
  const progress = itemCount > 0 ? Math.round((session.checkedCount / itemCount) * 100) : 0
  const date = new Date(session.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
        <span className="text-blue-600 font-medium" style={{ fontSize: 10 }}>{session.creator_name[0].toUpperCase()}</span>
      </div>
      <span className="text-xs text-charcoal flex-1 truncate">{session.creator_name}</span>
      <div className="flex items-center gap-2">
        <div className="w-16 h-1 rounded-full bg-gray-100 overflow-hidden">
          <div style={{ width: progress + '%', height: '100%', background: progress === 100 ? '#16a34a' : '#C97D2E' }} />
        </div>
        <span className="text-xs text-muted w-8 text-right">{progress}%</span>
      </div>
      <span className="text-xs text-muted/50 w-10 text-right flex-shrink-0">{date}</span>
      <a href={`/c/${session.checklist_slug}/${session.creator_slug}`} target="_blank"
        className="text-muted hover:text-blue-500 transition-colors flex-shrink-0" title="Voir la checklist du créateur">
        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"/></svg>
      </a>
    </div>
  )
}

// Carte checklist
function ChecklistCard({ cl, baseUrl, onInvite, onDelete, onCopy, copied, sessions }) {
  const [expanded, setExpanded] = useState(false)
  const url = baseUrl + '/c/' + cl.slug
  const itemCount = cl.items?.length || 0
  const sessionList = sessions[cl.id] || []

  return (
    <div className="bg-white border border-border rounded-2xl overflow-hidden hover:border-accent/30 transition-colors">
      <div className="p-5 flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium text-charcoal truncate">{cl.title}</p>
            <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium
              ${cl.type === 'html' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
              {cl.type === 'html' ? 'HTML' : 'Checklist'}
            </span>
            {cl.owner && (
              <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 font-medium">
                {cl.owner}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted font-mono truncate">{url}</span>
            {cl.type === 'checklist' && <>
              <span className="text-xs text-muted/40">·</span>
              <span className="text-xs text-muted flex-shrink-0">{itemCount} items</span>
            </>}
            {sessionList.length > 0 && <>
              <span className="text-xs text-muted/40">·</span>
              <button onClick={() => setExpanded(!expanded)}
                className="text-xs text-blue-500 hover:text-blue-700 transition-colors flex-shrink-0">
                {sessionList.length} créateur{sessionList.length > 1 ? 's' : ''} {expanded ? '↑' : '↓'}
              </button>
            </>}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Inviter */}
          <button onClick={() => onInvite(cl)} title="Inviter un créateur"
            className="p-2 rounded-lg text-muted hover:text-blue-500 hover:bg-blue-50 transition-colors">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z"/></svg>
          </button>
          {/* Copier */}
          <button onClick={() => onCopy(url, cl.id)} title="Copier le lien"
            className={`p-2 rounded-lg transition-colors ${copied === cl.id ? 'text-accent' : 'text-muted hover:text-charcoal hover:bg-cream'}`}>
            {copied === cl.id
              ? <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
              : <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
            }
          </button>
          {/* Voir */}
          <a href={'/c/' + cl.slug} target="_blank" title="Voir"
            className="p-2 rounded-lg text-muted hover:text-charcoal hover:bg-cream transition-colors">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"/></svg>
          </a>
          {/* Éditer */}
          <Link href={'/admin/edit/' + cl.id} title="Éditer"
            className="p-2 rounded-lg text-muted hover:text-charcoal hover:bg-cream transition-colors">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/></svg>
          </Link>
          {/* Supprimer */}
          <button onClick={() => onDelete(cl.id)} title="Supprimer"
            className="p-2 rounded-lg text-muted hover:text-red-500 hover:bg-red-50 transition-colors">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
          </button>
        </div>
      </div>

      {/* Sessions panel */}
      {expanded && sessionList.length > 0 && (
        <div className="px-5 pb-4 border-t border-border/50 pt-3">
          <p className="text-xs uppercase tracking-widest text-muted mb-2">Progression créateurs</p>
          <div className="space-y-0.5">
            {sessionList.map(s => (
              <SessionRow key={s.id} session={s} itemCount={itemCount} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Admin({ checklists: initial, baseUrl }) {
  const [checklists, setChecklists] = useState(initial || [])
  const [sessions, setSessions] = useState({})
  const [copied, setCopied] = useState(null)
  const [inviteTarget, setInviteTarget] = useState(null)
  const [ownerFilter, setOwnerFilter] = useState('Tous')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const router = useRouter()

  // Charger les sessions pour toutes les checklists
  useEffect(() => {
    async function loadSessions() {
      const results = {}
      await Promise.all(checklists.map(async cl => {
        const res = await fetch('/api/sessions?checklist_id=' + cl.id)
        if (res.ok) results[cl.id] = await res.json()
      }))
      setSessions(results)
    }
    if (checklists.length > 0) loadSessions()
  }, [checklists])

  // Après une invitation, recharger les sessions de cette checklist
  async function refreshSessions(checklistId) {
    const res = await fetch('/api/sessions?checklist_id=' + checklistId)
    if (res.ok) {
      const data = await res.json()
      setSessions(prev => ({ ...prev, [checklistId]: data }))
    }
  }

  function handleDelete(id) { setConfirmDelete(id) }
  async function confirmDeleteAction() {
    await fetch('/api/checklists/' + confirmDelete, { method: 'DELETE' })
    setChecklists(checklists.filter(c => c.id !== confirmDelete))
    setConfirmDelete(null)
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

  // Extraire les owners uniques
  const owners = ['Tous', ...Array.from(new Set(checklists.map(c => c.owner).filter(Boolean))).sort()]
  const filtered = ownerFilter === 'Tous' ? checklists : checklists.filter(c => c.owner === ownerFilter)

  return (
    <>
      <Head><title>Admin — Checklists</title></Head>
      <div className="min-h-screen bg-cream font-body">
        <div className="max-w-3xl mx-auto px-6 py-12">

          <div className="flex items-end justify-between mb-8">
            <div>
              <h1 className="font-display text-4xl text-charcoal">Mes checklists</h1>
              <p className="text-muted text-sm mt-1">{filtered.length} checklist{filtered.length !== 1 ? 's' : ''}</p>
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

          {/* Filtre par owner */}
          {owners.length > 1 && (
            <div className="flex gap-2 mb-6 flex-wrap">
              {owners.map(o => (
                <button key={o} onClick={() => setOwnerFilter(o)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    ownerFilter === o
                      ? 'bg-charcoal text-cream'
                      : 'bg-white border border-border text-muted hover:border-charcoal hover:text-charcoal'
                  }`}>
                  {o}
                </button>
              ))}
            </div>
          )}

          {filtered.length === 0 && (
            <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl">
              <p className="text-muted mb-4">Aucune checklist pour l'instant</p>
              <Link href="/admin/new" className="text-accent text-sm font-medium hover:underline">Créer la première →</Link>
            </div>
          )}

          <div className="space-y-3">
            {filtered.map(cl => (
              <ChecklistCard
                key={cl.id}
                cl={cl}
                baseUrl={baseUrl}
                onInvite={setInviteTarget}
                onDelete={handleDelete}
                onCopy={handleCopy}
                copied={copied}
                sessions={sessions}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Modal invitation */}
      {inviteTarget && (
        <InviteModal
          checklist={inviteTarget}
          baseUrl={baseUrl}
          onClose={() => { setInviteTarget(null); refreshSessions(inviteTarget.id) }}
        />
      )}

      {/* Modal confirmation suppression */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h2 className="font-display text-xl text-charcoal mb-2">Supprimer ?</h2>
            <p className="text-sm text-muted mb-5">Cette action supprimera aussi toutes les sessions et données de tracking associées.</p>
            <div className="flex gap-3">
              <button onClick={confirmDeleteAction}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors">
                Supprimer
              </button>
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border text-muted text-sm hover:border-charcoal hover:text-charcoal transition-colors">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
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
