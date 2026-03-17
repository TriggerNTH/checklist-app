export default async function handler(req, res) {
  const { createClient } = require('@supabase/supabase-js')
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  // GET — récupérer tous les checks d'une session
  if (req.method === 'GET') {
    const { session_id } = req.query
    if (!session_id) return res.status(400).json({ error: 'session_id manquant' })

    const { data, error } = await supabaseAdmin
      .from('checklist_checks')
      .select('item_key, is_checked, updated_at')
      .eq('session_id', session_id)

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data || [])
  }

  // POST — sauvegarder l'état d'un item (upsert)
  if (req.method === 'POST') {
    const { session_id, item_key, is_checked } = req.body
    if (!session_id || item_key === undefined || is_checked === undefined) {
      return res.status(400).json({ error: 'Champs manquants' })
    }

    const { data, error } = await supabaseAdmin
      .from('checklist_checks')
      .upsert(
        { session_id, item_key: String(item_key), is_checked, updated_at: new Date().toISOString() },
        { onConflict: 'session_id,item_key' }
      )
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  res.status(405).end()
}
