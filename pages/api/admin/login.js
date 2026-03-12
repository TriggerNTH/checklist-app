import { serialize } from 'cookie'

export default function handler(req, res) {
  if (req.method === 'POST') {
    const { password } = req.body
    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    res.setHeader('Set-Cookie', serialize('admin_session', process.env.ADMIN_PASSWORD, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    }))
    return res.status(200).json({ ok: true })
  }

  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', serialize('admin_session', '', { maxAge: 0, path: '/' }))
    return res.status(200).json({ ok: true })
  }

  res.status(405).end()
}
