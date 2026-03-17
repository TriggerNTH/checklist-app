import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Head from 'next/head'
import { supabaseAdmin } from '../../../lib/supabase'

export default function EditChecklist({ checklist }) {
  const router = useRouter()
  const [title, setTitle] = useState(checklist.title)
  const [slug, setSlug] = useState(checklist.slug)
  const [description, setDescription] = useState(checklist.description || '')
  const [owner, setOwner] = useState(checklist.owner || '')
  const [items, setItems] = useState(checklist.items?.map(i => i.label || i) || [''])
  const [newFile, setNewFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const isHtml = checklist.type === 'html'

  function addItem() { setItems([...items, '']) }
  function updateItem(i, val) { const n = [...items]; n[i] = val; setItems(n) }
  function removeItem(i) { setItems(items.filter((_, idx) => idx !== i)) }

  function handleKeyDown(e, i) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addItem()
      setTimeout(() => document.querySelectorAll('.item-input')[i + 1]?.focus(), 10)
    }
    if (e.key === 'Backspace' && items[i] === '' && items.length > 1) {
      e.preventDefault()
      removeItem(i)
      setTimeout(() => document.querySelectorAll('.item-input')[i - 1]?.focus(), 10)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const body = { title, slug, description, owner }

    if (isHtml) {
      if (newFile) {
        body.html_content = await newFile.text()
      }
    } else {
      body.items = items.filter(i => i.trim()).map(label => ({ label }))
    }

    const res = await fetch('/api/checklists/' + checklist.id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Erreur.'); setSaving(false); return }
    router.push('/admin')
  }

  return (
    <>
      <Head><title>Modifier — {checklist.title}</title></Head>
      <div className="min-h-screen bg-cream font-body">
        <div className="max-w-2xl mx-auto px-6 py-12">
          <div className="flex items-center gap-4 mb-10">
            <Link href="/admin" className="text-muted hover:text-charcoal transition-colors">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
            </Link>
            <h1 className="font-display text-3xl text-charcoal">Modifier</h1>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${isHtml ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
              {isHtml ? 'HTML' : 'Checklist'}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted mb-2">Titre</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} required
                className="w-full px-4 py-3 rounded-xl border border-border bg-white text-charcoal text-base focus:outline-none focus:border-accent transition-colors" />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-muted mb-2">URL</label>
              <div className="flex">
                <span className="px-3 py-3 bg-gray-50 border border-r-0 border-border rounded-l-xl text-muted text-sm font-mono">/c/</span>
                <input type="text" value={slug} onChange={e => setSlug(e.target.value)} required
                  className="flex-1 px-4 py-3 rounded-r-xl border border-border bg-white text-charcoal font-mono text-sm focus:outline-none focus:border-accent transition-colors" />
              </div>
            </div>

            {/* HTML : option re-upload */}
            {isHtml && (
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted mb-2">Remplacer le fichier HTML <span className="normal-case tracking-normal">(optionnel)</span></label>
                <label className={`flex items-center gap-3 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-all
                  ${newFile ? 'border-green-300 bg-green-50' : 'border-border hover:border-accent/50'}`}>
                  <input type="file" accept=".html" className="hidden" onChange={e => setNewFile(e.target.files[0])} />
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                  <span className="text-sm text-charcoal">{newFile ? newFile.name : 'Choisir un nouveau fichier .html'}</span>
                </label>
              </div>
            )}

            <div>
              <label className="block text-xs uppercase tracking-widest text-muted mb-2">Propriétaire de la campagne <span className="normal-case tracking-normal">(optionnel)</span></label>
              <input type="text" value={owner} onChange={e => setOwner(e.target.value)}
                placeholder="Sébastien, Samuel..."
                className="w-full px-4 py-3 rounded-xl border border-border bg-white text-charcoal text-base focus:outline-none focus:border-accent transition-colors placeholder:text-muted/40" />
            </div>

            {/* Checklist : items */}
            {!isHtml && (
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted mb-2">Items</label>
                <div className="space-y-2">
                  {items.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-muted/40 text-sm w-5 text-right">{i + 1}</span>
                      <input type="text" value={item} onChange={e => updateItem(i, e.target.value)} onKeyDown={e => handleKeyDown(e, i)}
                        className="item-input flex-1 px-4 py-2.5 rounded-xl border border-border bg-white text-charcoal text-sm focus:outline-none focus:border-accent transition-colors" />
                      {items.length > 1 && (
                        <button type="button" onClick={() => removeItem(i)} className="text-muted/40 hover:text-red-400 transition-colors">
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addItem} className="mt-3 text-sm text-muted hover:text-accent transition-colors">+ Ajouter un item</button>
              </div>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving}
                className="px-6 py-3 rounded-xl bg-charcoal text-cream text-sm font-medium hover:bg-charcoal/80 transition-colors disabled:opacity-50">
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
              <Link href="/admin" className="px-6 py-3 rounded-xl border border-border text-muted text-sm hover:border-charcoal hover:text-charcoal transition-colors">
                Annuler
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

export async function getServerSideProps({ req, params }) {
  const session = req.cookies['admin_session']
  if (session !== process.env.ADMIN_PASSWORD) {
    return { redirect: { destination: '/admin/login', permanent: false } }
  }
  const { data } = await supabaseAdmin.from('checklists').select('*').eq('id', params.id).single()
  if (!data) return { notFound: true }
  return { props: { checklist: data } }
}
