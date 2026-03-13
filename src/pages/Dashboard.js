import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getVideos, getVideoProgress, getZoomSessions, isVideoUnlocked } from '../lib/supabase'

export default function Dashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [videos, setVideos] = useState([])
  const [progress, setProgress] = useState([])
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const [v, p, s] = await Promise.all([
        getVideos(),
        getVideoProgress(profile?.id),
        getZoomSessions()
      ])
      setVideos(v.data || [])
      setProgress(p.data || [])
      setSessions((s.data || []).filter(s => new Date(s.session_date) >= new Date()).slice(0, 3))
      setLoading(false)
    }
    if (profile) load()
  }, [profile])

  const watchedCount = progress.filter(p => p.progress_percent >= 80).length
  const totalVideos = videos.length
  const progressPct = totalVideos > 0 ? Math.round((watchedCount / totalVideos) * 100) : 0

  // Last watched / in progress
  const inProgress = videos
    .map(v => ({ ...v, prog: progress.find(p => p.video_id === v.id) }))
    .filter(v => v.prog && v.prog.progress_percent < 80)
    .slice(0, 3)

  if (loading) return (
    <div className="loading-screen"><div className="spinner"/></div>
  )

  return (
    <div className="page-content">
      {/* Welcome */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: 'DM Serif Display', fontSize: 32, lineHeight: 1.2 }}>
            Dobro došli, <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>{profile?.full_name?.split(' ')[0]}.</em>
          </h1>
          <p style={{ color: 'var(--dim)', fontSize: 15, marginTop: 8 }}>Nastavite gdje ste stali.</p>
        </div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '16px 28px', textAlign: 'center', minWidth: 130 }}>
          <div style={{ fontFamily: 'Bebas Neue', fontSize: 48, color: 'var(--gold)', lineHeight: 1 }}>{progressPct}%</div>
          <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--dim)', marginTop: 4 }}>Napredak</div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, marginBottom: 32 }}>
        {[
          { val: watchedCount, lbl: 'Lekcija završeno' },
          { val: totalVideos, lbl: 'Ukupno lekcija' },
          { val: sessions.length, lbl: 'Live sesija' },
          { val: profile?.days_streak || 0, lbl: 'Dana zaredom' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'var(--card)', padding: '20px 24px', borderTop: '2px solid transparent', transition: 'border-color 0.3s', cursor: 'default' }}
            onMouseEnter={e => e.currentTarget.style.borderTopColor = 'var(--gold)'}
            onMouseLeave={e => e.currentTarget.style.borderTopColor = 'transparent'}
          >
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 40, color: 'var(--gold)', lineHeight: 1 }}>{s.val}</div>
            <div style={{ fontSize: 11, color: 'var(--dim)', letterSpacing: 1, marginTop: 4 }}>{s.lbl}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        {/* Continue watching */}
        <div>
          <div style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
            <span>Nastavite gledati</span>
            <span onClick={() => navigate('/videos')} style={{ color: 'var(--dim)', cursor: 'pointer', fontSize: 11 }}>Sve lekcije →</span>
          </div>

          {inProgress.length === 0 && (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border-soft)', padding: 32, textAlign: 'center', color: 'var(--dim)', fontSize: 14 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🎯</div>
              Počnite s prvom lekcijom!
              <br/>
              <button className="btn btn-gold" style={{ marginTop: 16 }} onClick={() => navigate('/videos')}>
                Idi na lekcije
              </button>
            </div>
          )}

          {inProgress.map(video => (
            <div
              key={video.id}
              onClick={() => navigate(`/videos/${video.id}`)}
              style={{ background: 'var(--card)', border: '1px solid var(--border-soft)', padding: 16, display: 'flex', gap: 14, marginBottom: 2, cursor: 'pointer', transition: 'background 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#222'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--card)'}
            >
              <div style={{ width: 90, height: 54, background: 'var(--panel)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                {video.emoji || '🎯'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{video.title}</div>
                <div style={{ fontSize: 12, color: 'var(--dim)' }}>Tjedan {video.week_number} · {Math.ceil((video.duration_seconds || 0) / 60)} min ostalo</div>
                <div style={{ height: 2, background: 'var(--faint)', marginTop: 10 }}>
                  <div style={{ height: '100%', background: 'var(--gold)', width: `${video.prog?.progress_percent || 0}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Upcoming sessions */}
        <div>
          <div style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 16 }}>
            Nadolazeće sesije
          </div>
          {sessions.length === 0 && (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border-soft)', padding: 24, color: 'var(--dim)', fontSize: 13, textAlign: 'center' }}>
              Nema zakazanih sesija
            </div>
          )}
          {sessions.map(session => {
            const d = new Date(session.session_date)
            const daysLeft = Math.ceil((d - new Date()) / 86400000)
            return (
              <div key={session.id} style={{ background: 'var(--card)', border: '1px solid var(--border-soft)', padding: '14px 18px', marginBottom: 2, display: 'flex', gap: 14, alignItems: 'center' }}>
                <div>
                  <div style={{ fontFamily: 'Bebas Neue', fontSize: 32, color: 'var(--gold)', lineHeight: 1 }}>{d.getDate()}</div>
                  <div style={{ fontSize: 9, letterSpacing: 1, color: 'var(--dim)', textAlign: 'center' }}>{d.toLocaleString('hr', { month: 'short' }).toUpperCase()}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{session.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--dim)', marginTop: 2 }}>Nedjelja · {session.time || '18:00'}h · Zoom</div>
                </div>
                <div style={{ fontSize: 9, letterSpacing: 1, border: '1px solid var(--gold)', color: 'var(--gold)', padding: '3px 8px', whiteSpace: 'nowrap' }}>
                  Za {daysLeft}d
                </div>
              </div>
            )
          })}
          <button className="btn btn-ghost" style={{ width: '100%', textAlign: 'center', marginTop: 8, fontSize: 11 }} onClick={() => navigate('/sessions')}>
            Sve sesije →
          </button>
        </div>
      </div>
    </div>
  )
}
