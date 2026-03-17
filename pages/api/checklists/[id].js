// v2
import { supabaseAdmin } from '../../../lib/supabase'

function isAdmin(req) {
  return req.cookies['admin_session'] === process.env.ADMIN_PASSWORD
}

export default async function handler(req, res) {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'POST') {
    const { type = 'checklist', title, slug, description, items, html_content, owner } = req.body
    if (!title || !slug) return res.status(400).json({ error: 'Champs manquants' })
    if (type === 'checklist' && !items?.length) return res.status(400).json({ error: 'Ajoute au moins un item.' })
    if (type === 'html' && !html_content) return res.status(400).json({ error: 'Contenu HTML manquant.' })

    const { data, error } = await supabaseAdmin
      .from('checklists')
      .insert([{ type, title, slug, description, items: items || [], html_content: html_content || null, owner: owner || null }])
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
