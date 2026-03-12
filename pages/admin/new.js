import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Head from 'next/head'

function slugify(str) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export default function NewChecklist() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [items, setItems] = useState([''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleTitleChange(val) { setTitle(val); setSlug(slugify(val)) }
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
    setLoading(true)
    setError('')
    const cleanItems = items.filter(i => i.trim()).map(label => ({ label }))
    if (!cleanItems.length) { setError('Ajoute au moins un item.'); setLoading(false); return }
    const res = await fetch('/api/checklists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, slug, description, items: cleanItems }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Erreur.'); setLoading(false); return }
    router.push('/admin')
  }

  return (
    <>
      <Head><title>Nouvelle checklist</title></Head>
      <div className="min-h-screen bg-cream font-body">
        <div className="max-w-2xl mx-auto px-6 py-12">
          <div className="flex items-center gap-4 mb-10">
            <Link href="/admin" className="text-muted hover:text-charcoal transition-colors">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
            </Link>
            <h1 className="font-display text-3xl text-charcoal">Nouvelle checklist</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted mb-2">Titre</label>
              <input type="text" value={title} onChange={e => handleTitleChange(e.target.value)} required
                placeholder="Onboarding client Dupont"
                className="w-full px-4 py-3 rounded-xl border border-border bg-white text-charcoal text-base focus:outline-none focus:border-accent transition-colors placeholder:text-muted/40" />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-muted mb-2">URL</label>
              <div className="flex">
                <span className="px-3 py-3 bg-gray-50 border border-r-0 border-border rounded-l-xl text-muted text-sm font-mono">/c/</span>
                <input type="text" value={slug} onChange={e => setSlug(e.target.value)} required
                  className="flex-1 px-4 py-3 rounded-r-xl border border-border bg-white text-charcoal font-mono text-sm focus:outline-none focus:border-accent transition-colors" />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-muted mb-2">Description <span className="normal-case tracking-normal">(optionnel)</span></label>
              <input type="text" value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Instructions..."
                className="w-full px-4 py-3 rounded-xl border border-border bg-white text-charcoal text-base focus:outline-none focus:border-accent transition-colors placeholder:text-muted/40" />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-muted mb-2">Items</label>
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-muted/40 text-sm w-5 text-right">{i + 1}</span>
                    <input type="text" value={item} onChange={e => updateItem(i, e.target.value)} onKeyDown={e => handleKeyDown(e, i)}
                      placeholder={`Étape ${i + 1}...`}
                      className="item-input flex-1 px-4 py-2.5 rounded-xl border border-border bg-white text-charcoal text-sm focus:outline-none focus:border-accent transition-colors placeholder:text-muted/30" />
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(i)} className="text-muted/40 hover:text-red-400 transition-colors">
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" onClick={addItem} className="mt-3 text-sm text-muted hover:text-accent transition-colors">+ Ajouter un item</button>
              <p className="text-xs text-muted/40 mt-1">Entrée pour ajouter · Retour arrière sur une ligne vide pour supprimer</p>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={loading || !title || !slug}
                className="px-6 py-3 rounded-xl bg-charcoal text-cream text-sm font-medium hover:bg-charcoal/80 transition-colors disabled:opacity-50">
                {loading ? 'Création...' : 'Créer la checklist'}
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

export async function getServerSideProps({ req }) {
  const session = req.cookies['admin_session']
  if (session !== process.env.ADMIN_PASSWORD) {
    return { redirect: { destination: '/admin/login', permanent: false } }
  }
  return { props: {} }
}
