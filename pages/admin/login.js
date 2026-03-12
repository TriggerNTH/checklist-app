import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

export default function Login() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      router.push('/admin')
    } else {
      setError('Mot de passe incorrect.')
      setLoading(false)
    }
  }

  return (
    <>
      <Head><title>Admin — Connexion</title></Head>
      <div className="min-h-screen bg-cream font-body flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="mb-10 text-center">
            <h1 className="font-display text-4xl text-charcoal mb-2">Admin</h1>
            <p className="text-muted text-sm">Accès réservé</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoFocus
              className="w-full px-4 py-3 rounded-xl border border-border bg-white text-charcoal text-base focus:outline-none focus:border-accent transition-colors placeholder:text-muted/40"
            />
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <button type="submit" disabled={loading || !password}
              className="w-full py-3 rounded-xl bg-charcoal text-cream text-base font-medium hover:bg-charcoal/80 transition-colors disabled:opacity-50">
              {loading ? 'Connexion...' : 'Entrer'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
