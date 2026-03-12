import { supabaseAdmin } from '../../../lib/supabase'

function isAdmin(req) {
  return req.cookies['admin_session'] === process.env.ADMIN_PASSWORD
}

export default async function handler(req, res) {
  const { id } = req.query

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin.from('checklists').select('*').eq('id', id).single()
    if (error) return res.status(404).json(null)
    return res.status(200).json(data)
  }

  if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'PATCH') {
    const { title, slug, description, items, html_content } = req.body
    const updateData = { title, slug, description, updated_at: new Date().toISOString() }
    if (items !== undefined) updateData.items = items
    if (html_content !== undefined) updateData.html_content = html_content

    const { data, error } = await supabaseAdmin
      .from('checklists')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    if (error) {
      if (error.code === '23505') return res.status(400).json({ error: 'Ce slug est déjà utilisé.' })
      return res.status(500).json({ error: error.message })
    }
    return res.status(200).json(data)
  }

  if (req.method === 'DELETE') {
    const { error } = await supabaseAdmin.from('checklists').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  res.status(405).end()
}
