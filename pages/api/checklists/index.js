import { supabaseAdmin } from '../../../lib/supabase'

function isAdmin(req) {
  return req.cookies['admin_session'] === process.env.ADMIN_PASSWORD
}

export default async function handler(req, res) {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'POST') {
    const { title, slug, description, items } = req.body
    if (!title || !slug || !items?.length) return res.status(400).json({ error: 'Champs manquants' })

    const { data, error } = await supabaseAdmin
      .from('checklists')
      .insert([{ title, slug, description, items }])
      .select()
      .single()

    if (error) {
      if (error.code === '23505') return res.status(400).json({ error: 'Ce slug est déjà utilisé.' })
      return res.status(500).json({ error: error.message })
    }
    return res.status(201).json(data)
  }

  res.status(405).end()
}
