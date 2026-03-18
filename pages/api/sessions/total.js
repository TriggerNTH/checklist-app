import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { session_id, total_items } = req.body
  if (!session_id || !total_items) return res.status(400).json({ error: 'Champs manquants' })

  // On ne met à jour que si pas encore défini (éviter d'écraser avec une valeur erronée)
  const { data: existing } = await supabaseAdmin
    .from('checklist_sessions')
    .select('total_items')
    .eq('id', session_id)
    .single()

  if (!existing?.total_items) {
    await supabaseAdmin
      .from('checklist_sessions')
      .update({ total_items })
      .eq('id', session_id)
  }

  return res.status(200).json({ ok: true })
}
