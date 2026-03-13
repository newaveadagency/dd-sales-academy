import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function Login() {
const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        supabase.from('profiles').select('is_admin').eq('id', session.user.id).single()
          .then(({ data }) => {
            navigate(data?.is_admin ? '/admin' : '/dashboard', { replace: true })
          })
      }
    })
  }, [navigate])

  const handleSubmit = async (e) => {
  e.preventDefault()
  setLoading(true)
  setError('')
  
  console.log('1. Pokušavam prijavu...')
  const { data, error } = await signIn(email, password)
  console.log('2. data:', JSON.stringify(data))
  console.log('3. error:', JSON.stringify(error))
  
  if (error) {
    setError('Greška: ' + error.message)
    setLoading(false)
    return
  }

  console.log('4. Navigiram...')
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', data.user.id).single()
navigate(profile?.is_admin ? '/admin' : '/dashboard', { replace: true })
}

  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontFamily: 'Bebas Neue', fontSize: 36, letterSpacing: 6, color: 'var(--gold)' }}>D&amp;D Sales</div>
          <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--dim)', marginTop: 4 }}>Members Area</div>
        </div>
        <div style={{ background: 'var(--dark)', border: '1px solid var(--border)', padding: '40px 36px' }}>
          <div style={{ borderTop: '3px solid var(--gold)', marginBottom: 28, paddingTop: 28 }}>
            <h2 style={{ fontFamily: 'DM Serif Display', fontSize: 24, marginBottom: 6 }}>Prijava</h2>
            <p style={{ fontSize: 13, color: 'var(--dim)' }}>Unesite vaše podatke za pristup edukaciji.</p>
          </div>
          {error && (
            <div style={{ background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.3)', color: '#e74c3c', padding: '10px 14px', fontSize: 13, marginBottom: 20 }}>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email adresa</label>
              <input className="form-input" type="email" placeholder="vas@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="form-group" style={{ marginBottom: 28 }}>
              <label className="form-label">Lozinka</label>
              <input className="form-input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-gold" style={{ width: '100%', textAlign: 'center', padding: 14, fontSize: 13 }} disabled={loading}>
              {loading ? 'Prijavljivanje...' : 'Prijavi se'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
