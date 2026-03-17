function isAdmin(req) {
  return req.cookies['admin_session'] === process.env.ADMIN_PASSWORD
}

export default async function handler(req, res) {
  const { createClient } = require('@supabase/supabase-js')
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  // GET — liste des sessions pour une checklist (admin only)
  if (req.method === 'GET') {
    if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' })
    const { checklist_id } = req.query
    if (!checklist_id) return res.status(400).json({ error: 'checklist_id manquant' })

    const { data: sessions, error } = await supabaseAdmin
      .from('checklist_sessions')
      .select('id, token, creator_name, creator_slug, created_at, checklist_id, checklists(slug)')
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

    // Générer un slug propre depuis le nom
    function slugify(str) {
      return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    }

    // Gérer les doublons : jean, jean-2, jean-3...
    let baseSlug = slugify(creator_name)
    let creator_slug = baseSlug
    let attempt = 1
    while (true) {
      const { data: existing } = await supabaseAdmin
        .from('checklist_sessions')
        .select('id')
        .eq('checklist_id', checklist_id)
        .eq('creator_slug', creator_slug)
        .single()
      if (!existing) break
      attempt++
      creator_slug = `${baseSlug}-${attempt}`
    }

    const { data, error } = await supabaseAdmin
      .from('checklist_sessions')
      .insert([{ checklist_id, creator_name, creator_slug }])
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json(data)
  }

  res.status(405).end()
}
