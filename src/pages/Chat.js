import React, { useEffect, useState, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function Chat() {
  const { profile, user } = useAuth()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef(null)

  const loadMessages = async () => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*, profiles(full_name, is_admin, avatar_color)')
      .order('created_at', { ascending: true })
      .limit(100)
    setMessages(data || [])
    setLoading(false)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  useEffect(() => {
    loadMessages()

    const channel = supabase
      .channel('chat-room')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages'
      }, () => {
        loadMessages()
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  const handleSend = async () => {
    if (!newMessage.trim()) return
    const text = newMessage.trim()
    setNewMessage('')
    await supabase.from('chat_messages').insert({
      user_id: user.id,
      message: text
    })
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const formatTime = (ts) => new Date(ts).toLocaleTimeString('hr', { hour: '2-digit', minute: '2-digit' })

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 58px)', gap: 0 }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--card)', border: '1px solid var(--border-soft)', margin: 24, marginRight: 0 }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)' }} />
          <h3 style={{ fontSize: 15, fontWeight: 500 }}>D&D Sales – Grupni chat</h3>
          <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--dim)' }}>Real-time</div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {loading && <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>}

          {messages.map(msg => {
            const isOwn = msg.user_id === user?.id
            const isAdmin = msg.profiles?.is_admin
            return (
              <div key={msg.id} style={{ display: 'flex', gap: 12, flexDirection: isOwn ? 'row-reverse' : 'row' }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: isAdmin ? '#c0392b' : (msg.profiles?.avatar_color || '#3a6b8a'),
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, flexShrink: 0
                }}>
                  {msg.profiles?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
                </div>
                <div style={{ maxWidth: '65%' }}>
                  <div style={{ fontSize: 11, color: 'var(--dim)', marginBottom: 4, textAlign: isOwn ? 'right' : 'left' }}>
                    {msg.profiles?.full_name || 'Korisnik'}
                    {isAdmin && <span style={{ background: '#c0392b', color: '#fff', fontSize: 9, padding: '1px 5px', marginLeft: 6, letterSpacing: 1 }}>MENTOR</span>}
                  </div>
                  <div style={{
                    background: isOwn ? 'var(--gold-glow)' : 'var(--panel)',
                    border: `1px solid ${isOwn ? 'var(--border)' : 'var(--border-soft)'}`,
                    padding: '10px 14px', fontSize: 14, lineHeight: 1.6
                  }}>
                    {msg.message}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(245,242,236,0.2)', marginTop: 4, textAlign: isOwn ? 'right' : 'left' }}>
                    {formatTime(msg.created_at)}
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
          <input
            className="form-input"
            type="text"
            placeholder="Napišite poruku... (Enter za slanje)"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="btn btn-gold" onClick={handleSend} disabled={!newMessage.trim()}>
            Pošalji
          </button>
        </div>
      </div>

      <div style={{ width: 260, padding: 24, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 16, flexShrink: 0 }}>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border-soft)', padding: 20 }}>
          <div style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 16 }}>Pravila chata</div>
          {['Postavljajte pitanja slobodno', 'Dijelite uspjehe i iskustva', 'Pomažite jedni drugima', 'Bez spam i promocija'].map((r, i) => (
            <div key={i} style={{ fontSize: 13, color: 'var(--dim)', padding: '8px 0', borderBottom: '1px solid var(--border-soft)', lineHeight: 1.5 }}>
              {i < 3 ? '✓' : '✗'} {r}
            </div>
          ))}
        </div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border-soft)', padding: 20 }}>
          <div style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 12 }}>Vaš profil</div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{profile?.full_name}</div>
          <div style={{ fontSize: 12, color: 'var(--dim)', marginTop: 4 }}>{user?.email}</div>
        </div>
      </div>
    </div>
  )
}
