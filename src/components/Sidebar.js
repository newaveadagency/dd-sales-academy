import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const MemberSidebar = ({ mobileOpen, onClose }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile, signOut } = useAuth()

  const navItems = [
    { label: 'Dashboard', icon: '⊞', path: '/dashboard' },
    { label: 'Video lekcije', icon: '▶', path: '/videos', badge: null },
    { label: 'Grupni chat', icon: '💬', path: '/chat' },
    { label: 'Live sesije', icon: '📹', path: '/sessions' },
    { label: 'Materijali', icon: '📁', path: '/materials' },
  ]

  const initials = profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'

  const go = (path) => { navigate(path); onClose?.() }

  return (
    <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
      <div style={{ padding: '24px 24px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontFamily: 'Bebas Neue', fontSize: 22, letterSpacing: 4, color: 'var(--gold)' }}>
          D&amp;D <span style={{ color: 'rgba(245,242,236,0.35)' }}>SALES</span>
        </div>
        <div style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(201,168,76,0.45)', marginTop: 2 }}>
          Members Area
        </div>
      </div>

      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: profile?.avatar_color || 'var(--gold)', color: 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
          {initials}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{profile?.full_name || 'Član'}</div>
          <div style={{ fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', background: 'var(--gold-glow)', color: 'var(--gold)', border: '1px solid var(--border)', padding: '2px 7px', display: 'inline-block', marginTop: 3 }}>
            Aktivan član
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        <div style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(245,242,236,0.18)', padding: '12px 24px 6px' }}>
          Navigacija
        </div>
        {navItems.map(item => (
          <div
            key={item.path}
            onClick={() => go(item.path)}
            style={{
              display: 'flex', alignItems: 'center', gap: 11,
              padding: '10px 24px', fontSize: 13, cursor: 'pointer',
              borderLeft: `2px solid ${location.pathname === item.path ? 'var(--gold)' : 'transparent'}`,
              background: location.pathname === item.path ? 'var(--gold-glow)' : 'transparent',
              color: location.pathname === item.path ? 'var(--gold)' : 'var(--dim)',
              transition: 'all 0.18s',
            }}
          >
            <span style={{ fontSize: 15, width: 18, textAlign: 'center' }}>{item.icon}</span>
            {item.label}
          </div>
        ))}
      </nav>

      <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: 11, color: 'var(--dim)', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
          <span>Napredak programa</span>
          <span style={{ color: 'var(--gold)' }}>{profile?.progress_percent || 0}%</span>
        </div>
        <div style={{ height: 3, background: 'var(--faint)' }}>
          <div style={{ height: '100%', background: 'var(--gold)', width: `${profile?.progress_percent || 0}%`, transition: 'width 0.6s' }} />
        </div>
        <button onClick={signOut} className="btn btn-ghost" style={{ marginTop: 16, width: '100%', textAlign: 'center', fontSize: 11 }}>
          Odjava
        </button>
      </div>
    </aside>
  )
}

export const AdminSidebar = ({ mobileOpen, onClose }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { signOut } = useAuth()

  const sections = [
    {
      label: 'Pregled',
      items: [
        { label: 'Overview', icon: '⊞', path: '/admin' },
        { label: 'Prihodi', icon: '₠', path: '/admin/revenue' },
      ]
    },
    {
      label: 'Sadržaj',
      items: [
        { label: 'Video lekcije', icon: '▶', path: '/admin/videos' },
        { label: 'Objavi video', icon: '↑', path: '/admin/upload' },
      ]
    },
    {
      label: 'Zajednica',
      items: [
        { label: 'Članovi', icon: '👥', path: '/admin/members' },
        { label: 'Chat moderacija', icon: '💬', path: '/admin/chat' },
        { label: 'Zoom sesije', icon: '📹', path: '/admin/sessions' },
      ]
    },
    {
      label: 'Ostalo',
      items: [
        { label: 'Leadovi', icon: '📋', path: '/admin/leads' },
        { label: 'Postavke', icon: '⚙', path: '/admin/settings' },
      ]
    }
  ]

  const go = (path) => { navigate(path); onClose?.() }

  return (
    <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
      <div style={{ padding: '24px 24px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontFamily: 'Bebas Neue', fontSize: 22, letterSpacing: 4, color: 'var(--gold)' }}>D&amp;D Sales</div>
        <div style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(201,168,76,0.45)', marginTop: 2 }}>Admin Panel</div>
      </div>
      <div style={{ margin: '12px 24px', background: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.25)', color: '#e74c3c', fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', padding: '5px 10px', display: 'inline-block' }}>
        ● Super Admin
      </div>
      <nav style={{ flex: 1, overflowY: 'auto' }}>
        {sections.map(section => (
          <div key={section.label}>
            <div style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(245,242,236,0.18)', padding: '14px 24px 6px' }}>
              {section.label}
            </div>
            {section.items.map(item => (
              <div
                key={item.path}
                onClick={() => go(item.path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 11,
                  padding: '10px 24px', fontSize: 13, cursor: 'pointer',
                  borderLeft: `2px solid ${location.pathname === item.path ? 'var(--gold)' : 'transparent'}`,
                  background: location.pathname === item.path ? 'var(--gold-glow)' : 'transparent',
                  color: location.pathname === item.path ? 'var(--gold)' : 'var(--dim)',
                  transition: 'all 0.18s',
                }}
              >
                <span style={{ fontSize: 15, width: 18, textAlign: 'center' }}>{item.icon}</span>
                {item.label}
              </div>
            ))}
          </div>
        ))}
      </nav>
      <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
        <button onClick={signOut} className="btn btn-ghost" style={{ width: '100%', textAlign: 'center', fontSize: 11 }}>
          Odjava
        </button>
      </div>
    </aside>
  )
}

export default MemberSidebar
