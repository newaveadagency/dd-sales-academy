import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getVideos, getVideoById, getVideoProgress, isVideoUnlocked, markVideoWatched } from '../lib/supabase'
import { useToast, ToastContainer } from '../hooks/useToast'

// ── VIDEO LIBRARY ──────────────────────────────────────────────
export function VideoLibrary() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const { showToast, toasts } = useToast()
  const [videos, setVideos] = useState([])
  const [progress, setProgress] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const [v, p] = await Promise.all([getVideos(), getVideoProgress(profile?.id)])
      setVideos(v.data || [])
      setProgress(p.data || [])
      setLoading(false)
    }
    if (profile) load()
  }, [profile])

  const getProgress = (videoId) => progress.find(p => p.video_id === videoId)

  const filteredVideos = videos.filter(v => {
    const unlocked = isVideoUnlocked(v, profile?.enrolled_at)
    const prog = getProgress(v.id)
    const watched = prog && prog.progress_percent >= 80
    if (filter === 'available') return unlocked && !watched
    if (filter === 'watched') return watched
    if (filter === 'locked') return !unlocked
    return true
  })

  // Group by module
  const modules = [...new Set(videos.map(v => v.module_id))].map(moduleId => {
    const moduleVideos = filteredVideos.filter(v => v.module_id === moduleId)
    if (moduleVideos.length === 0) return null
    return { moduleId, title: moduleVideos[0]?.modules?.title || `Modul ${moduleId}`, videos: moduleVideos }
  }).filter(Boolean)

  if (loading) return <div className="loading-screen"><div className="spinner"/></div>

  return (
    <div className="page-content">
      <ToastContainer toasts={toasts} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 6 }}>Video lekcije</div>
          <h2 style={{ fontFamily: 'DM Serif Display', fontSize: 28 }}>Knjižnica edukacija</h2>
        </div>
        <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {[['all','Sve'], ['available','Dostupno'], ['watched','Završeno'], ['locked','Zaključano']].map(([val, lbl]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className="btn"
              style={{
                background: filter === val ? 'var(--gold)' : 'var(--card)',
                color: filter === val ? 'var(--black)' : 'var(--dim)',
                fontWeight: filter === val ? 700 : 400,
                border: '1px solid transparent',
                padding: '7px 16px',
                fontSize: 11,
              }}
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {modules.map(mod => (
        <div key={mod.moduleId} style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, letterSpacing: 2, color: 'var(--gold)', background: 'var(--gold-glow)', border: '1px solid var(--border)', padding: '3px 10px' }}>
              MODUL
            </div>
            <div style={{ fontSize: 18, fontWeight: 500 }}>{mod.title}</div>
            <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--dim)' }}>
              {mod.videos.filter(v => getProgress(v.id)?.progress_percent >= 80).length}/{mod.videos.length} završeno
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 2 }}>
            {mod.videos.map(video => {
              const unlocked = isVideoUnlocked(video, profile?.enrolled_at)
              const prog = getProgress(video.id)
              const watched = prog && prog.progress_percent >= 80
              return (
                <VideoCard
                  key={video.id}
                  video={video}
                  unlocked={unlocked}
                  progress={prog?.progress_percent || 0}
                  watched={watched}
                  onClick={() => {
                    if (!unlocked) { showToast('Ova lekcija još nije otključana 🔒'); return }
                    navigate(`/videos/${video.id}`)
                  }}
                />
              )
            })}
          </div>
        </div>
      ))}

      {modules.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 32px', color: 'var(--dim)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
          <div style={{ fontSize: 16 }}>Nema lekcija u ovoj kategoriji</div>
        </div>
      )}
    </div>
  )
}

function VideoCard({ video, unlocked, progress, watched, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--card)', cursor: unlocked ? 'pointer' : 'not-allowed',
        opacity: unlocked ? 1 : 0.45, transition: 'transform 0.2s, box-shadow 0.2s',
        position: 'relative',
      }}
      onMouseEnter={e => { if (unlocked) { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.4)' }}}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
    >
      <div style={{ paddingTop: '56.25%', background: 'var(--panel)', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
          {video.emoji || '🎯'}
        </div>
        {!unlocked && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🔒</div>
        )}
        {watched && (
          <div style={{ position: 'absolute', top: 10, left: 10, background: 'var(--green)', color: '#fff', fontSize: 10, padding: '3px 8px', letterSpacing: 1 }}>✓ Odgledano</div>
        )}
        <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.75)', fontSize: 11, padding: '2px 6px', letterSpacing: 1 }}>
          {Math.floor((video.duration_seconds || 0) / 60)}:{String((video.duration_seconds || 0) % 60).padStart(2,'0')}
        </div>
        {progress > 0 && progress < 80 && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'var(--faint)' }}>
            <div style={{ height: '100%', background: 'var(--gold)', width: `${progress}%` }} />
          </div>
        )}
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 6 }}>
          Tjedan {video.week_number} · Lekcija {video.lesson_number}
        </div>
        <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.4, marginBottom: 8 }}>{video.title}</div>
        <div style={{ fontSize: 12, color: 'var(--dim)', display: 'flex', gap: 12 }}>
          <span>{Math.ceil((video.duration_seconds || 0) / 60)} min</span>
          <span>{video.category || 'Lekcija'}</span>
        </div>
      </div>
    </div>
  )
}

// ── VIDEO PLAYER ───────────────────────────────────────────────
export function VideoPlayer() {
  const { id } = useParams()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const { showToast, toasts } = useToast()
  const [video, setVideo] = useState(null)
  const [videos, setVideos] = useState([])
  const [progress, setProgress] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const [v, all, p] = await Promise.all([
        getVideoById(id),
        getVideos(),
        getVideoProgress(profile?.id)
      ])
      setVideo(v.data)
      setVideos(all.data || [])
      setProgress(p.data || [])
      setLoading(false)
    }
    if (profile) load()
  }, [id, profile])

  const handleMarkWatched = async () => {
    await markVideoWatched(profile.id, id, 100)
    showToast('Lekcija označena kao završena ✓')
  }

  const moduleVideos = videos.filter(v => v.module_id === video?.module_id)
  const currentIndex = moduleVideos.findIndex(v => v.id === id)
  const nextVideo = moduleVideos[currentIndex + 1]

  if (loading) return <div className="loading-screen"><div className="spinner"/></div>
  if (!video) return <div className="page-content" style={{ color: 'var(--dim)' }}>Video nije pronađen.</div>

  return (
    <div className="page-content">
      <ToastContainer toasts={toasts} />

      <div onClick={() => navigate('/videos')} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--dim)', cursor: 'pointer', marginBottom: 24, width: 'fit-content', transition: 'color 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--dim)'}
      >
        ← Natrag na lekcije
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
        <div>
          {/* Player */}
          <div style={{ background: '#000', width: '100%', paddingTop: '56.25%', position: 'relative', marginBottom: 24 }}>
            {video.vimeo_id ? (
              <iframe
                src={`https://player.vimeo.com/video/${video.vimeo_id}?dnt=1&pip=0&byline=0&portrait=0&title=0`}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                allow="autoplay; fullscreen"
                allowFullScreen
                title={video.title}
              />
            ) : (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                <div style={{ fontSize: 64 }}>{video.emoji || '▶'}</div>
                <p style={{ color: 'var(--dim)', fontSize: 13, letterSpacing: 1 }}>Video se reproducira u zaštićenom modu</p>
              </div>
            )}
          </div>

          <h2 style={{ fontFamily: 'DM Serif Display', fontSize: 26, marginBottom: 8 }}>{video.title}</h2>
          <div style={{ fontSize: 13, color: 'var(--dim)', display: 'flex', gap: 20, marginBottom: 16 }}>
            <span>Tjedan {video.week_number}</span>
            <span>{Math.ceil((video.duration_seconds || 0) / 60)} min</span>
            <span>{video.category}</span>
          </div>
          <p style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--dim)', marginBottom: 24 }}>{video.description}</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-gold" onClick={handleMarkWatched}>Označi kao završeno</button>
            {nextVideo && (
              <button className="btn btn-ghost" onClick={() => navigate(`/videos/${nextVideo.id}`)}>Sljedeća lekcija →</button>
            )}
          </div>
        </div>

        {/* Playlist */}
        <div>
          <div style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 14 }}>
            {video.modules?.title || 'Modul'}
          </div>
          {moduleVideos.map((v, i) => {
            const unlocked = isVideoUnlocked(v, profile?.enrolled_at)
            const prog = progress.find(p => p.video_id === v.id)
            const isActive = v.id === id
            return (
              <div
                key={v.id}
                onClick={() => { if (unlocked) navigate(`/videos/${v.id}`) }}
                style={{
                  display: 'flex', gap: 12, padding: 12,
                  background: isActive ? 'var(--gold-glow)' : 'var(--card)',
                  marginBottom: 2,
                  borderLeft: isActive ? '2px solid var(--gold)' : '2px solid transparent',
                  cursor: unlocked ? 'pointer' : 'not-allowed',
                  opacity: unlocked ? 1 : 0.5,
                  alignItems: 'center',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => { if (!isActive && unlocked) e.currentTarget.style.background = '#222' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'var(--card)' }}
              >
                <div style={{ fontFamily: 'Bebas Neue', fontSize: 18, color: isActive ? 'var(--gold)' : 'var(--dim)', minWidth: 24 }}>
                  {unlocked ? (i + 1) : '🔒'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{v.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--dim)', marginTop: 2 }}>
                    {Math.ceil((v.duration_seconds || 0) / 60)} min
                    {prog?.progress_percent >= 80 ? ' · ✓ Završeno' : ''}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--dim)', flexShrink: 0 }}>
                  {Math.floor((v.duration_seconds || 0) / 60)}:{String((v.duration_seconds || 0) % 60).padStart(2,'0')}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
