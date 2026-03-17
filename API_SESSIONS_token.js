import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req, res) {
  const { token } = req.query

  // GET — récupérer une session par token (public)
  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('checklist_sessions')
      .select('id, token, creator_name, checklist_id, created_at')
      .eq('token', token)
      .single()

    if (error || !data) return res.status(404).json({ error: 'Session introuvable' })
    return res.status(200).json(data)
  }

  // DELETE — supprimer une session (admin only)
  if (req.method === 'DELETE') {
    const adminSession = req.cookies['admin_session']
    if (adminSession !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' })

    const { error } = await supabaseAdmin
      .from('checklist_sessions')
      .delete()
      .eq('token', token)

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  res.status(405).end()
}
