import { supabaseAdmin } from '../../../lib/supabase'

function isAdmin(req) {
  return req.cookies['admin_session'] === process.env.ADMIN_PASSWORD
}

export default async function handler(req, res) {
  // GET — liste des sessions pour une checklist (admin only)
  if (req.method === 'GET') {
    if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' })
    const { checklist_id } = req.query
    if (!checklist_id) return res.status(400).json({ error: 'checklist_id manquant' })

    const { data: sessions, error } = await supabaseAdmin
      .from('checklist_sessions')
      .select('id, token, creator_name, created_at, checklist_id')
      .eq('checklist_id', checklist_id)
      .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ error: error.message })

    // Charger les checks pour chaque session
    const sessionIds = sessions.map(s => s.id)
    let checks = []
    if (sessionIds.length > 0) {
      const { data } = await supabaseAdmin
        .from('checklist_checks')
        .select('session_id, item_key, is_checked')
        .in('session_id', sessionIds)
      checks = data || []
    }

    const sessionsWithProgress = sessions.map(s => {
      const sessionChecks = checks.filter(c => c.session_id === s.id)
      const checkedCount = sessionChecks.filter(c => c.is_checked).length
      return { ...s, checks: sessionChecks, checkedCount }
    })

    return res.status(200).json(sessionsWithProgress)
  }

  // POST — créer une session (admin only)
  if (req.method === 'POST') {
    if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' })
    const { checklist_id, creator_name } = req.body
    if (!checklist_id || !creator_name) return res.status(400).json({ error: 'Champs manquants' })

    const { data, error } = await supabaseAdmin
      .from('checklist_sessions')
      .insert([{ checklist_id, creator_name }])
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json(data)
  }

  res.status(405).end()
}
