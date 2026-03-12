import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Head from 'next/head'

// Page HTML plein écran
function HtmlPage({ checklist }) {
  return (
    <>
      <Head><title>{checklist.title}</title></Head>
      <iframe
        srcDoc={checklist.html_content}
        style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    </>
  )
}

// Page checklist interactive
function ChecklistPageView({ checklist }) {
  const [checked, setChecked] = useState({})

  useEffect(() => {
    const saved = localStorage.getItem('cl-' + checklist.id)
    if (saved) setChecked(JSON.parse(saved))
  }, [checklist.id])

  function toggle(i) {
    const next = { ...checked, [i]: !checked[i] }
    setChecked(next)
    localStorage.setItem('cl-' + checklist.id, JSON.stringify(next))
  }

  const items = checklist.items || []
  const doneCount = items.filter((_, i) => checked[i]).length
  const progress = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0

  return (
    <>
      <Head><title>{checklist.title}</title></Head>
      <div className="min-h-screen bg-cream font-body">
        <div className="fixed top-0 left-0 right-0 z-10 bg-cream/90 backdrop-blur border-b border-border">
          <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest text-muted">Checklist</span>
            <span className="text-xs text-muted">{doneCount}/{items.length}</span>
          </div>
          <div style={{ height: 2, background: '#E4E4DF' }}>
            <div style={{ width: progress + '%', height: '100%', background: '#C97D2E', transition: 'width 0.4s ease' }} />
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-6 pt-28 pb-24">
          <div className="mb-10">
            <h1 className="font-display text-4xl md:text-5xl text-charcoal leading-tight mb-3">{checklist.title}</h1>
            {checklist.description && <p className="text-muted text-base">{checklist.description}</p>}
          </div>

          {doneCount === items.length && items.length > 0 && (
            <div className="mb-8 p-4 rounded-xl border border-yellow-200 bg-yellow-50 flex items-center gap-3">
              <span className="text-xl">✓</span>
              <p className="text-sm font-medium text-yellow-800">Tout est complété !</p>
            </div>
          )}

          <div className="space-y-3">
            {items.map((item, i) => (
              <label key={i}
                className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all
                  ${checked[i] ? 'border-yellow-200 bg-yellow-50/50' : 'border-border bg-white hover:border-yellow-300'}`}
              >
                <input type="checkbox" className="custom-checkbox mt-0.5"
                  checked={!!checked[i]} onChange={() => toggle(i)} />
                <span className={`text-base leading-snug select-none transition-all
                  ${checked[i] ? 'line-through text-muted' : 'text-charcoal'}`}>
                  {item.label || item}
                </span>
              </label>
            ))}
          </div>

          <div className="mt-16 pt-8 border-t border-border text-center">
            <p className="text-xs text-muted/60">{progress}% complété</p>
          </div>
        </div>
      </div>
    </>
  )
}

export default function SlugPage({ checklist, notFound }) {
  if (notFound) return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 text-center">
      <p className="font-display text-3xl text-charcoal mb-2">Introuvable</p>
      <p className="text-muted">Ce lien n'existe pas ou a expiré.</p>
    </div>
  )

  if (!checklist) return null

  if (checklist.type === 'html') return <HtmlPage checklist={checklist} />
  return <ChecklistPageView checklist={checklist} />
}

export async function getServerSideProps({ params }) {
  const { data } = await supabase
    .from('checklists')
    .select('*')
    .eq('slug', params.slug)
    .single()

  if (!data) return { props: { notFound: true, checklist: null } }
  return { props: { checklist: data, notFound: false } }
}
