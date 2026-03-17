// v2
import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Head from 'next/head'

function slugify(str) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export default function UploadHtml() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [owner, setOwner] = useState('')

  function handleFile(f) {
    if (!f || !f.name.endsWith('.html')) {
      setError('Le fichier doit être un .html')
      return
    }
    setFile(f)
    setError('')
    if (!title) {
      const name = f.name.replace('.html', '')
      setTitle(name)
      setSlug(slugify(name))
    }
  }

  function handleTitleChange(val) {
    setTitle(val)
    setSlug(slugify(val))
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    handleFile(f)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file) { setError('Sélectionne un fichier HTML.'); return }
    setLoading(true)
    setError('')

    const htmlContent = await file.text()

    const res = await fetch('/api/checklists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'html', title, slug, html_content: htmlContent, items: [], owner }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Erreur.'); setLoading(false); return }
    router.push('/admin')
  }

  return (
    <>
      <Head><title>Upload HTML</title></Head>
      <div className="min-h-screen bg-cream font-body">
        <div className="max-w-2xl mx-auto px-6 py-12">
          <div className="flex items-center gap-4 mb-10">
            <Link href="/admin" className="text-muted hover:text-charcoal transition-colors">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
            </Link>
            <h1 className="font-display text-3xl text-charcoal">Upload HTML</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Zone de drop */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input').click()}
              className={`relative flex flex-col items-center justify-center gap-3 p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-all
                ${dragOver ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50 hover:bg-cream'}
                ${file ? 'border-green-300 bg-green-50' : ''}`}
            >
              <input id="file-input" type="file" accept=".html" className="hidden"
                onChange={e => handleFile(e.target.files[0])} />

              {file ? (
                <>
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                    <svg width="20" height="20" fill="none" stroke="#16a34a" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  </div>
                  <p className="font-medium text-charcoal text-sm">{file.name}</p>
                  <p className="text-xs text-muted">{(file.size / 1024).toFixed(1)} Ko · Clique pour changer</p>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-xl bg-cream border border-border flex items-center justify-center">
                    <svg width="20" height="20" fill="none" stroke="#8A8A84" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                  </div>
                  <p className="font-medium text-charcoal text-sm">Glisse ton fichier ici</p>
                  <p className="text-xs text-muted">ou clique pour parcourir · .html uniquement</p>
                </>
              )}
            </div>

            {/* Titre */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted mb-2">Titre</label>
              <input type="text" value={title} onChange={e => handleTitleChange(e.target.value)} required
                placeholder="Ma page personnalisée"
                className="w-full px-4 py-3 rounded-xl border border-border bg-white text-charcoal text-base focus:outline-none focus:border-accent transition-colors placeholder:text-muted/40" />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted mb-2">URL</label>
              <div className="flex">
                <span className="px-3 py-3 bg-gray-50 border border-r-0 border-border rounded-l-xl text-muted text-sm font-mono">/c/</span>
                <input type="text" value={slug} onChange={e => setSlug(e.target.value)} required
                  className="flex-1 px-4 py-3 rounded-r-xl border border-border bg-white text-charcoal font-mono text-sm focus:outline-none focus:border-accent transition-colors" />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-muted mb-2">Propriétaire de la campagne <span className="normal-case tracking-normal">(optionnel)</span></label>
              <input type="text" value={owner} onChange={e => setOwner(e.target.value)}
                placeholder="Sébastien, Samuel..."
                className="w-full px-4 py-3 rounded-xl border border-border bg-white text-charcoal text-base focus:outline-none focus:border-accent transition-colors placeholder:text-muted/40" />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={loading || !file || !title || !slug}
                className="px-6 py-3 rounded-xl bg-charcoal text-cream text-sm font-medium hover:bg-charcoal/80 transition-colors disabled:opacity-50">
                {loading ? 'Upload...' : 'Publier la page'}
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
