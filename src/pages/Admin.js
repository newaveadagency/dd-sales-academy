import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  getAdminStats, getAllMembers, getAllVideosAdmin,
  createVideo, updateVideo, deleteVideo,
  getLeads, getPayments, getAllVideosAdmin as getVids,
  createZoomSession, getZoomSessions, getChatMessages, deleteChatMessage
} from '../lib/supabase'
import { useToast, ToastContainer } from '../hooks/useToast'

// ── KPI CARD ──
const KPI = ({ val, lbl, delta, deltaUp }) => (
  <div style={{ background: 'var(--card)', padding: '20px 24px', borderTop: '2px solid transparent', transition: 'border-color 0.25s', cursor: 'default' }}
    onMouseEnter={e => e.currentTarget.style.borderTopColor = 'var(--gold)'}
    onMouseLeave={e => e.currentTarget.style.borderTopColor = 'transparent'}
  >
    <div style={{ fontFamily: 'Bebas Neue', fontSize: 38, lineHeight: 1, color: 'var(--gold)' }}>{val}</div>
    <div style={{ fontSize: 11, color: 'var(--dim)', letterSpacing: 1, marginTop: 4 }}>{lbl}</div>
    {delta && <div style={{ fontSize: 11, marginTop: 6, color: deltaUp ? 'var(--green)' : 'var(--red)' }}>{delta}</div>}
  </div>
)

// ── ADMIN OVERVIEW ──
export function AdminOverview() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({})
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const [s, m] = await Promise.all([getAdminStats(), getAllMembers()])
      setStats(s)
      setMembers((m.data || []).slice(0, 5))
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="loading-screen"><div className="spinner"/></div>

  return (
    <div className="page-content">
      <h1 style={{ fontFamily: 'DM Serif Display', fontSize: 28, marginBottom: 4 }}>
        Dobro jutro, <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>D&D.</em>
      </h1>
      <p style={{ color: 'var(--dim)', fontSize: 14, marginBottom: 28 }}>
        {new Date().toLocaleDateString('hr', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, marginBottom: 28 }}>
        <KPI val={stats.totalMembers} lbl="Aktivnih članova" delta="↑ Raste" deltaUp />
        <KPI val={`${stats.totalRevenue?.toLocaleString()}€`} lbl="Ukupni prihod" />
        <KPI val={stats.totalVideos} lbl="Videa objavljeno" />
        <KPI val={stats.newLeads} lbl="Novi leadovi" delta="↑ Ovaj tjedan" deltaUp />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border-soft)', padding: 24 }}>
          <div style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
            <span>Nedavni članovi</span>
            <span onClick={() => navigate('/admin/members')} style={{ color: 'var(--dim)', cursor: 'pointer', fontSize: 11 }}>Svi →</span>
          </div>
          <table className="data-table">
            <thead><tr><th>Ime</th><th>Status</th><th>Napredak</th><th>Upisan</th></tr></thead>
            <tbody>
              {members.map(m => (
                <tr key={m.id}>
                  <td style={{ fontWeight: 500 }}>{m.full_name}</td>
                  <td><span className={`badge badge-${m.status || 'active'}`}>{m.status || 'Aktivan'}</span></td>
                  <td>{m.progress_percent || 0}%</td>
                  <td style={{ fontSize: 12, color: 'var(--dim)' }}>{new Date(m.created_at).toLocaleDateString('hr')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border-soft)', padding: 24 }}>
          <div style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 16 }}>Brze akcije</div>
          {[
            ['+ Novi video', () => navigate('/admin/upload'), 'btn-gold'],
            ['👥 Upravljaj članovima', () => navigate('/admin/members'), 'btn-ghost'],
            ['💬 Chat moderacija', () => navigate('/admin/chat'), 'btn-ghost'],
            ['📹 Nova Zoom sesija', () => navigate('/admin/sessions'), 'btn-ghost'],
            ['📋 Pregledaj leadove', () => navigate('/admin/leads'), 'btn-ghost'],
          ].map(([lbl, fn, cls]) => (
            <button key={lbl} className={`btn ${cls}`} onClick={fn} style={{ width: '100%', textAlign: 'center', marginBottom: 8 }}>{lbl}</button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── UPLOAD VIDEO ──
export function AdminUploadVideo() {
  const navigate = useNavigate()
  const { showToast, toasts } = useToast()
  const [form, setForm] = useState({
    title: '', description: '', vimeo_id: '', week_number: 1,
    lesson_number: 1, module_id: 1, category: '', emoji: '🎯',
    duration_seconds: 0, unlock_after_days: 0, status: 'published'
  })
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async (status) => {
    setSaving(true)
    const { data, error } = await createVideo({ ...form, status })
    setSaving(false)
    if (error) { showToast('Greška pri objavi: ' + error.message, 'error'); return }
    showToast(status === 'published' ? 'Lekcija uspješno objavljena! ✓' : 'Spremljeno kao draft')
    setTimeout(() => navigate('/admin/videos'), 1200)
  }

  return (
    <div className="page-content">
      <ToastContainer toasts={toasts} />
      <h2 style={{ fontFamily: 'DM Serif Display', fontSize: 28, marginBottom: 6 }}>
        Objavi <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>novu lekciju</em>
      </h2>
      <p style={{ color: 'var(--dim)', fontSize: 14, marginBottom: 28 }}>Dodajte video, opišite lekciju i postavite kada se otključava.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        <div>
          {/* Upload zone */}
          <div style={{ border: '2px dashed rgba(201,168,76,0.25)', padding: '40px 32px', textAlign: 'center', marginBottom: 24, cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.background = 'var(--gold-glow)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.25)'; e.currentTarget.style.background = 'transparent' }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎬</div>
            <h3 style={{ fontSize: 16, fontWeight: 500, marginBottom: 6 }}>Povucite video ovdje ili kliknite</h3>
            <p style={{ fontSize: 13, color: 'var(--dim)' }}>MP4, MOV · Max 4GB · Preporučeno 1080p</p>
            <p style={{ fontSize: 12, color: 'var(--dim)', marginTop: 8 }}>ili unesite Vimeo ID ispod</p>
          </div>

          <div style={{ background: 'var(--card)', border: '1px solid var(--border-soft)', padding: 24 }}>
            <div style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 20 }}>Detalji lekcije</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Naziv lekcije *</label>
                <input className="form-input" type="text" placeholder="npr. High Ticket Closing" value={form.title} onChange={e => set('title', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Vimeo Video ID *</label>
                <input className="form-input" type="text" placeholder="npr. 123456789" value={form.vimeo_id} onChange={e => set('vimeo_id', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Modul</label>
                <select className="form-select" value={form.module_id} onChange={e => set('module_id', parseInt(e.target.value))}>
                  <option value={1}>Modul 01 – Temelji & Mindset</option>
                  <option value={2}>Modul 02 – Napredne tehnike</option>
                  <option value={3}>Modul 03 – Skaliranje & Sistem</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Tjedan programa</label>
                <input className="form-input" type="number" min="1" max="12" value={form.week_number} onChange={e => set('week_number', parseInt(e.target.value))} />
              </div>
              <div className="form-group">
                <label className="form-label">Emoji ikona</label>
                <input className="form-input" type="text" placeholder="🎯" value={form.emoji} onChange={e => set('emoji', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Trajanje (sekunde)</label>
                <input className="form-input" type="number" placeholder="npr. 2340" value={form.duration_seconds} onChange={e => set('duration_seconds', parseInt(e.target.value))} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Opis lekcije</label>
              <textarea className="form-textarea" placeholder="Kratki opis što će polaznici naučiti..." value={form.description} onChange={e => set('description', e.target.value)} />
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn btn-gold" onClick={() => handleSave('published')} disabled={saving || !form.title || !form.vimeo_id}>
                {saving ? 'Objavljujem...' : 'Objavi lekciju'}
              </button>
              <button className="btn btn-ghost" onClick={() => handleSave('draft')} disabled={saving}>
                Spremi draft
              </button>
              <button className="btn btn-ghost" onClick={() => navigate('/admin/videos')}>Odustani</button>
            </div>
          </div>
        </div>

        <div>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border-soft)', padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 16 }}>Zaštita sadržaja</div>
            {[
              ['DRM zaštita (Vimeo)', true],
              ['Onemogući download', true],
              ['Zahtijeva prijavu', true],
              ['Watermark s imenom gledatelja', false],
            ].map(([lbl, checked]) => (
              <label key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, marginBottom: 12 }}>
                <input type="checkbox" defaultChecked={checked} style={{ accentColor: 'var(--gold)', width: 14, height: 14 }} /> {lbl}
              </label>
            ))}
          </div>

          <div style={{ background: 'var(--card)', border: '1px solid var(--border-soft)', padding: 20 }}>
            <div style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 12 }}>Drip otključavanje</div>
            <p style={{ fontSize: 13, color: 'var(--dim)', lineHeight: 1.7, marginBottom: 14 }}>
              Lekcija se otključava automatski X dana nakon upisa člana.
            </p>
            <div className="form-group">
              <label className="form-label">Otključati nakon (dana od upisa)</label>
              <input className="form-input" type="number" placeholder="0 = odmah" min="0" max="90" value={form.unlock_after_days} onChange={e => set('unlock_after_days', parseInt(e.target.value) || 0)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── ADMIN VIDEOS LIST ──
export function AdminVideos() {
  const navigate = useNavigate()
  const { showToast, toasts } = useToast()
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getVids().then(({ data }) => { setVideos(data || []); setLoading(false) })
  }, [])

  const handleDelete = async (id) => {
    if (!window.confirm('Brisanje lekcije?')) return
    await deleteVideo(id)
    setVideos(prev => prev.filter(v => v.id !== id))
    showToast('Lekcija obrisana')
  }

  if (loading) return <div className="loading-screen"><div className="spinner"/></div>

  return (
    <div className="page-content">
      <ToastContainer toasts={toasts} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'DM Serif Display', fontSize: 28 }}>Video <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>lekcije</em></h2>
        <button className="btn btn-gold" onClick={() => navigate('/admin/upload')}>+ Novi video</button>
      </div>
      {videos.map(video => (
        <div key={video.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 14, background: 'var(--card)', marginBottom: 2, transition: 'background 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.background = '#222'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--card)'}
        >
          <div style={{ width: 72, height: 44, background: 'var(--panel)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
            {video.emoji || '🎯'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{video.title}</div>
            <div style={{ fontSize: 11, color: 'var(--dim)', display: 'flex', gap: 14 }}>
              <span>Tj. {video.week_number}</span>
              <span>{Math.ceil((video.duration_seconds || 0) / 60)} min</span>
            </div>
          </div>
          <span className={`badge badge-${video.status}`}>{video.status}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => showToast('Uređivanje...')}>Uredi</button>
            <button className="btn btn-red btn-sm" onClick={() => handleDelete(video.id)}>Briši</button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── ADMIN MEMBERS ──
export function AdminMembers() {
  const { showToast, toasts } = useToast()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllMembers().then(({ data }) => { setMembers(data || []); setLoading(false) })
  }, [])

  if (loading) return <div className="loading-screen"><div className="spinner"/></div>

  return (
    <div className="page-content">
      <ToastContainer toasts={toasts} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: 'DM Serif Display', fontSize: 28 }}>Upravljanje <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>Članovima</em></h2>
          <p style={{ color: 'var(--dim)', fontSize: 14, marginTop: 4 }}>{members.filter(m => m.status === 'active').length} aktivnih · {members.length} ukupno</p>
        </div>
        <button className="btn btn-gold" onClick={() => showToast('Otvori modal za dodavanje')}>+ Dodaj člana</button>
      </div>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border-soft)', overflow: 'hidden' }}>
        <table className="data-table">
          <thead><tr><th>Ime</th><th>Email</th><th>Status</th><th>Napredak</th><th>Upisan</th><th>Akcije</th></tr></thead>
          <tbody>
            {members.map(m => (
              <tr key={m.id}>
                <td style={{ fontWeight: 500 }}>{m.full_name}</td>
                <td style={{ fontSize: 12, color: 'var(--dim)' }}>{m.email}</td>
                <td><span className={`badge badge-${m.status || 'active'}`}>{m.status || 'aktivan'}</span></td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 60, height: 3, background: 'var(--faint)' }}>
                      <div style={{ height: '100%', background: 'var(--gold)', width: `${m.progress_percent || 0}%` }} />
                    </div>
                    <span style={{ fontSize: 11 }}>{m.progress_percent || 0}%</span>
                  </div>
                </td>
                <td style={{ fontSize: 12, color: 'var(--dim)' }}>{new Date(m.created_at).toLocaleDateString('hr')}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => showToast(`Email poslan: ${m.full_name}`)}>Email</button>
                    <button className="btn btn-red btn-sm" onClick={() => showToast(`Suspendiran: ${m.full_name}`, 'error')}>Suspendiraj</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── ADMIN CHAT ──
export function AdminChat() {
  const { user, profile } = useAuth()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const bottomRef = useRef(null)

  const loadMessages = async () => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*, profiles(full_name, is_admin, avatar_color)')
      .order('created_at', { ascending: true })
      .limit(100)
    setMessages(data || [])
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  useEffect(() => {
    loadMessages()
    const channel = supabase
      .channel('admin-chat-room')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, () => loadMessages())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  const handleSend = async () => {
    if (!newMessage.trim()) return
    const text = newMessage.trim()
    setNewMessage('')
    await supabase.from('chat_messages').insert({ user_id: user.id, message: text })
  }

  const handleDelete = async (id) => {
    await supabase.from('chat_messages').delete().eq('id', id)
    loadMessages()
  }

  const formatTime = (ts) => new Date(ts).toLocaleTimeString('hr', { hour: '2-digit', minute: '2-digit' })

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 58px)', gap: 0 }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--card)', border: '1px solid var(--border-soft)', margin: 24, marginRight: 0 }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)' }} />
          <h3 style={{ fontSize: 15, fontWeight: 500 }}>D&D Sales – Grupni chat</h3>
          <div style={{ marginLeft: 'auto', fontSize: 11, color: '#c0392b', background: 'rgba(192,57,43,0.1)', padding: '3px 10px', border: '1px solid rgba(192,57,43,0.2)' }}>ADMIN MOD</div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {messages.map(msg => {
            const isOwn = msg.user_id === user?.id
            const isMsgAdmin = msg.profiles?.is_admin
            return (
              <div key={msg.id} style={{ display: 'flex', gap: 12, flexDirection: isOwn ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: isMsgAdmin ? '#c0392b' : (msg.profiles?.avatar_color || '#3a6b8a'),
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, flexShrink: 0
                }}>
                  {msg.profiles?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
                </div>
                <div style={{ maxWidth: '65%' }}>
                  <div style={{ fontSize: 11, color: 'var(--dim)', marginBottom: 4, textAlign: isOwn ? 'right' : 'left' }}>
                    {msg.profiles?.full_name || 'Korisnik'}
                    {isMsgAdmin && <span style={{ background: '#c0392b', color: '#fff', fontSize: 9, padding: '1px 5px', marginLeft: 6 }}>MENTOR</span>}
                  </div>
                  <div style={{
                    background: isOwn ? 'var(--gold-glow)' : 'var(--panel)',
                    border: `1px solid ${isOwn ? 'var(--border)' : 'var(--border-soft)'}`,
                    padding: '10px 14px', fontSize: 14, lineHeight: 1.6
                  }}>
                    {msg.message}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(245,242,236,0.2)', marginTop: 4, display: 'flex', gap: 10, justifyContent: isOwn ? 'flex-end' : 'flex-start' }}>
                    {formatTime(msg.created_at)}
                    {!isOwn && <span onClick={() => handleDelete(msg.id)} style={{ color: '#c0392b', cursor: 'pointer' }}>Ukloni</span>}
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
            placeholder="Pišite kao Mentor... (Enter za slanje)"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }}}
          />
          <button className="btn btn-gold" onClick={handleSend} disabled={!newMessage.trim()}>Pošalji</button>
        </div>
      </div>

      <div style={{ width: 220, padding: 24, paddingLeft: 16 }}>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border-soft)', padding: 20 }}>
          <div style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 12 }}>Admin opcije</div>
          <div style={{ fontSize: 13, color: 'var(--dim)', lineHeight: 1.7 }}>
            Pišete kao <strong style={{ color: 'var(--white)' }}>{profile?.full_name}</strong> s MENTOR oznakom vidljivom svim članovima.
          </div>
        </div>
      </div>
    </div>
  )
}

// ── ADMIN LEADS ──
export function AdminLeads() {
  const { showToast, toasts } = useToast()
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getLeads().then(({ data }) => { setLeads(data || []); setLoading(false) })
  }, [])

  if (loading) return <div className="loading-screen"><div className="spinner"/></div>

  return (
    <div className="page-content">
      <ToastContainer toasts={toasts} />
      <h2 style={{ fontFamily: 'DM Serif Display', fontSize: 28, marginBottom: 24 }}>Leadovi & <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>1on1 pozivi</em></h2>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border-soft)', overflow: 'hidden' }}>
        <table className="data-table">
          <thead><tr><th>Ime</th><th>Email</th><th>Izvor</th><th>Status</th><th>Datum</th><th>Akcija</th></tr></thead>
          <tbody>
            {leads.map(lead => (
              <tr key={lead.id}>
                <td style={{ fontWeight: 500 }}>{lead.full_name}</td>
                <td style={{ fontSize: 12, color: 'var(--dim)' }}>{lead.email}</td>
                <td style={{ fontSize: 12, color: 'var(--dim)' }}>{lead.source || 'Web forma'}</td>
                <td><span className={`badge badge-${lead.status === 'new' ? 'pending' : 'active'}`}>{lead.status || 'Novi'}</span></td>
                <td style={{ fontSize: 12, color: 'var(--dim)' }}>{new Date(lead.created_at).toLocaleDateString('hr')}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-gold btn-sm" onClick={() => showToast('Zakazivanje poziva...')}>Zakaži poziv</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => showToast('Email poslan ✓')}>Email</button>
                  </div>
                </td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--dim)' }}>Nema leadova još</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── ADMIN REVENUE ──
export function AdminRevenue() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPayments().then(({ data }) => { setPayments(data || []); setLoading(false) })
  }, [])

  const total = payments.filter(p => p.status === 'paid').reduce((s, p) => s + (p.amount || 0), 0)

  if (loading) return <div className="loading-screen"><div className="spinner"/></div>

  return (
    <div className="page-content">
      <h2 style={{ fontFamily: 'DM Serif Display', fontSize: 28, marginBottom: 24 }}>Prihodi & <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>Financije</em></h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, marginBottom: 28 }}>
        <KPI val={`${total.toLocaleString()}€`} lbl="Ukupni prihod" />
        <KPI val={payments.filter(p => p.status === 'paid').length} lbl="Uspješnih uplata" />
        <KPI val="997€" lbl="Cijena programa" />
      </div>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border-soft)', overflow: 'hidden' }}>
        <table className="data-table">
          <thead><tr><th>Datum</th><th>Član</th><th>Iznos</th><th>Status</th><th>Metoda</th></tr></thead>
          <tbody>
            {payments.map(p => (
              <tr key={p.id}>
                <td style={{ fontSize: 12, color: 'var(--dim)' }}>{new Date(p.created_at).toLocaleDateString('hr')}</td>
                <td style={{ fontWeight: 500 }}>{p.profiles?.full_name || '—'}</td>
                <td style={{ color: p.status === 'paid' ? 'var(--green)' : 'var(--red)', fontWeight: 500 }}>
                  {p.status === 'paid' ? '+' : ''}{p.amount}€
                </td>
                <td><span className={`badge badge-${p.status === 'paid' ? 'published' : 'inactive'}`}>{p.status}</span></td>
                <td style={{ fontSize: 12, color: 'var(--dim)' }}>{p.payment_method || 'Kartica'}</td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--dim)' }}>Nema uplata još</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── ADMIN SETTINGS ──
export function AdminSettings() {
  const { showToast, toasts } = useToast()
  return (
    <div className="page-content">
      <ToastContainer toasts={toasts} />
      <h2 style={{ fontFamily: 'DM Serif Display', fontSize: 28, marginBottom: 24 }}>Postavke <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>platforme</em></h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {[
          { title: 'Opće postavke', fields: [['Naziv platforme', 'D&D Sales Academy'], ['Email podrške', 'info@ddsales.hr'], ['Cijena programa (€)', '997']] },
        ].map(section => (
          <div key={section.title} style={{ background: 'var(--card)', border: '1px solid var(--border-soft)', padding: 24 }}>
            <div style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 20 }}>{section.title}</div>
            {section.fields.map(([lbl, val]) => (
              <div key={lbl} className="form-group">
                <label className="form-label">{lbl}</label>
                <input className="form-input" type="text" defaultValue={val} />
              </div>
            ))}
            <button className="btn btn-gold" onClick={() => showToast('Postavke spremljene ✓')}>Spremi</button>
          </div>
        ))}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border-soft)', padding: 24 }}>
          <div style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 20 }}>Integracije</div>
          {[['Vimeo Pro', true], ['Stripe', true], ['Zoom', false], ['Mailchimp', false]].map(([name, connected]) => (
            <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-soft)' }}>
              <span style={{ fontSize: 13 }}>{name}</span>
              {connected
                ? <span className="badge badge-active">Spojeno</span>
                : <button className="btn btn-ghost btn-sm" onClick={() => showToast(`${name} OAuth...`)}>Spoji</button>
              }
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
