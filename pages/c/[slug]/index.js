import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'

function injectTrackingScript(html) {
  const script = `<script>
(function() {
  function syncChecks() {
    var boxes = document.querySelectorAll('input[type="checkbox"]');
    // Envoyer le total au parent
    window.parent.postMessage({ type: 'TOTAL_ITEMS', total: boxes.length }, '*');
    boxes.forEach(function(box, idx) {
      box.addEventListener('change', function() {
        window.parent.postMessage({ type: 'CHECK_CHANGE', itemKey: String(idx), isChecked: box.checked }, '*');
      });
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncChecks);
  } else {
    syncChecks();
  }
})();
<\/script>`
  if (html.includes('</body>')) return html.replace('</body>', script + '</body>')
  return html + script
}

function HtmlPage({ checklist, sessionId, initialChecks }) {
  const iframeRef = useRef(null)
  const [injectedHtml] = useState(() => injectTrackingScript(checklist.html_content))

  useEffect(() => {
    if (!sessionId) return
    function handleMessage(e) {
      if (e.data?.type === 'TOTAL_ITEMS') {
        fetch('/api/sessions/total', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId, total_items: e.data.total })
        })
        return
      }
      if (e.data?.type !== 'CHECK_CHANGE') return
      fetch('/api/checks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, item_key: e.data.itemKey, is_checked: e.data.isChecked })
      })
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [sessionId])

  function handleIframeLoad() {
    if (!initialChecks?.length || !iframeRef.current) return
    try {
      const doc = iframeRef.current.contentDocument
      if (!doc) return
      const boxes = doc.querySelectorAll('input[type="checkbox"]')
      initialChecks.forEach(c => {
        const idx = parseInt(c.item_key)
        if (boxes[idx]) boxes[idx].checked = c.is_checked
      })
    } catch(e) {}
  }

  return (
    <>
      <Head><title>{checklist.title}</title></Head>
      <iframe
        ref={iframeRef}
        srcDoc={injectedHtml}
        onLoad={handleIframeLoad}
        style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    </>
  )
}

function ChecklistPageView({ checklist, sessionId, initialChecks }) {
  const [checked, setChecked] = useState({})
  const [saving, setSaving] = useState(null)

  useEffect(() => {
    if (sessionId && initialChecks?.length) {
      const state = {}
      initialChecks.forEach(c => { state[c.item_key] = c.is_checked })
      setChecked(state)
    } else if (!sessionId) {
      const saved = localStorage.getItem('cl-' + checklist.id)
      if (saved) setChecked(JSON.parse(saved))
    }
  }, [checklist.id, sessionId, initialChecks])

  async function toggle(i) {
    const key = String(i)
    const next = { ...checked, [key]: !checked[key] }
    setChecked(next)
    if (sessionId) {
      setSaving(i)
      await fetch('/api/checks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, item_key: key, is_checked: next[key] })
      })
      setSaving(null)
    } else {
      localStorage.setItem('cl-' + checklist.id, JSON.stringify(next))
    }
  }

  const items = checklist.items || []
  const doneCount = items.filter((_, i) => checked[String(i)]).length
  const progress = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0

  return (
    <>
      <Head><title>{checklist.title}</title></Head>
      <div className="min-h-screen bg-cream font-body">
        <div className="fixed top-0 left-0 right-0 z-10 bg-cream/90 backdrop-blur border-b border-border">
          <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest text-muted">Checklist</span>
            <div className="flex items-center gap-3">
              {saving !== null && <span className="text-xs text-muted animate-pulse">Sauvegarde...</span>}
              <span className="text-xs text-muted">{doneCount}/{items.length}</span>
            </div>
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
                  ${checked[String(i)] ? 'border-yellow-200 bg-yellow-50/50' : 'border-border bg-white hover:border-yellow-300'}`}
              >
                <input type="checkbox" className="custom-checkbox mt-0.5"
                  checked={!!checked[String(i)]} onChange={() => toggle(i)} />
                <span className={`text-base leading-snug select-none transition-all
                  ${checked[String(i)] ? 'line-through text-muted' : 'text-charcoal'}`}>
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

export default function SlugPage({ checklist, notFound, sessionId, initialChecks }) {
  if (notFound) return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 text-center">
      <p className="font-display text-3xl text-charcoal mb-2">Introuvable</p>
      <p className="text-muted">Ce lien n'existe pas ou a expiré.</p>
    </div>
  )
  if (!checklist) return null
  if (checklist.type === 'html') return <HtmlPage checklist={checklist} sessionId={sessionId} initialChecks={initialChecks} />
  return <ChecklistPageView checklist={checklist} sessionId={sessionId} initialChecks={initialChecks} />
}

export async function getServerSideProps({ params, query }) {
  const { createClient } = require('@supabase/supabase-js')
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  const { data: checklist } = await supabase
    .from('checklists')
    .select('*')
    .eq('slug', params.slug)
    .single()

  if (!checklist) return { props: { notFound: true, checklist: null, sessionId: null, initialChecks: [] } }

  let sessionId = null
  let initialChecks = []

  if (query.s) {
    const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    const { data: session } = await adminClient
      .from('checklist_sessions')
      .select('id')
      .eq('token', query.s)
      .eq('checklist_id', checklist.id)
      .single()

    if (session) {
      sessionId = session.id
      const { data: checks } = await adminClient
        .from('checklist_checks')
        .select('item_key, is_checked')
        .eq('session_id', session.id)
      initialChecks = checks || []
    }
  }

  return { props: { checklist, notFound: false, sessionId, initialChecks } }
}
