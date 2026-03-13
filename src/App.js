import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import MemberSidebar, { AdminSidebar } from './components/Sidebar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import { VideoLibrary, VideoPlayer } from './pages/Videos'
import Chat from './pages/Chat'
import {
  AdminOverview, AdminUploadVideo, AdminVideos,
  AdminMembers, AdminChat, AdminLeads, AdminRevenue, AdminSettings
} from './pages/Admin'
import './index.css'

// ── LOADING SCREEN ──
const LoadingScreen = () => (
  <div className="loading-screen">
    <div style={{ fontFamily: 'Bebas Neue', fontSize: 32, letterSpacing: 6, color: 'var(--gold)' }}>D&D SALES</div>
    <div className="spinner" />
  </div>
)

// ── PROTECTED ROUTE ──
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, profile, loading, isAdmin, isActive } = useAuth()
  if (loading || (user && !profile)) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (requireAdmin && !isAdmin) return <Navigate to="/dashboard" replace />
  if (!requireAdmin && !isAdmin && profile && !isActive) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 24, textAlign: 'center' }}>
      <div style={{ fontFamily: 'Bebas Neue', fontSize: 28, letterSpacing: 4, color: 'var(--gold)' }}>D&D Sales</div>
      <h2 style={{ fontFamily: 'DM Serif Display', fontSize: 24 }}>Vaš račun nije aktivan</h2>
      <p style={{ color: 'var(--dim)', maxWidth: 400 }}>Molimo kontaktirajte podršku ili dovršite uplatu.</p>
      <a href="mailto:info@ddsales.hr" className="btn btn-gold">Kontaktirajte podršku</a>
    </div>
  )
  return children
}

// ── MEMBER LAYOUT ──
const MemberLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <div className="app-layout">
      <MemberSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      {mobileOpen && <div onClick={() => setMobileOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 49 }} />}
      <div className="sidebar-main">
        <header className="topbar">
          <button onClick={() => setMobileOpen(true)} style={{ display: 'none', background: 'none', border: 'none', color: 'var(--white)', fontSize: 20, cursor: 'pointer' }} id="mobile-menu-btn">
            ☰
          </button>
          <div style={{ fontFamily: 'Bebas Neue', fontSize: 18, letterSpacing: 3, color: 'rgba(245,242,236,0.4)' }}>D&amp;D SALES</div>
        </header>
        {children}
      </div>
    </div>
  )
}

// ── ADMIN LAYOUT ──
const AdminLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <div className="app-layout">
      <AdminSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      {mobileOpen && <div onClick={() => setMobileOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 49 }} />}
      <div className="sidebar-main">
        <header className="topbar">
          <div style={{ fontFamily: 'Bebas Neue', fontSize: 18, letterSpacing: 3, color: 'rgba(245,242,236,0.4)' }}>D&amp;D ADMIN</div>
          <button className="btn btn-gold btn-sm" onClick={() => window.location.href = '/admin/upload'}>+ Novi video</button>
        </header>
        {children}
      </div>
    </div>
  )
}

// ── SESSIONS PLACEHOLDER ──
const Sessions = () => (
  <div className="page-content">
    <div style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8 }}>Live sesije</div>
    <h2 style={{ fontFamily: 'DM Serif Display', fontSize: 28, marginBottom: 24 }}>Zoom <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>Roleplay sesije</em></h2>
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '60px 40px', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📹</div>
      <div style={{ fontFamily: 'Bebas Neue', fontSize: 20, letterSpacing: 3, color: 'var(--gold)', marginBottom: 8 }}>SLJEDEĆA SESIJA</div>
      <p style={{ color: 'var(--dim)', fontSize: 16, marginBottom: 32 }}>Svake nedjelje u 18:00h. Detalji se šalju emailom 24 sata prije.</p>
      <a href="https://zoom.us" target="_blank" rel="noreferrer" className="btn btn-gold" style={{ padding: '14px 36px', fontSize: 13 }}>Otvori Zoom</a>
    </div>
  </div>
)

// ── APP ──
function AppRoutes() {
  const { user, isAdmin, loading, profile } = useAuth()
  
  if (loading) return <LoadingScreen />

  return (
    <Routes>
      <Route path="/login" element={
        !user ? <Login /> : <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />
      } />
      <Route path="/" element={
        <Navigate to={!user ? '/login' : isAdmin ? '/admin' : '/dashboard'} replace />
      } />

      <Route path="/dashboard" element={
        !user ? <Navigate to="/login" replace /> :
        <MemberLayout><Dashboard /></MemberLayout>
      }/>
      <Route path="/videos" element={
        !user ? <Navigate to="/login" replace /> :
        <MemberLayout><VideoLibrary /></MemberLayout>
      }/>
      <Route path="/videos/:id" element={
        !user ? <Navigate to="/login" replace /> :
        <MemberLayout><VideoPlayer /></MemberLayout>
      }/>
      <Route path="/chat" element={
        !user ? <Navigate to="/login" replace /> :
        <MemberLayout><Chat /></MemberLayout>
      }/>
      <Route path="/sessions" element={
        !user ? <Navigate to="/login" replace /> :
        <MemberLayout><Sessions /></MemberLayout>
      }/>

      <Route path="/admin" element={
        !user ? <Navigate to="/login" replace /> :
        <AdminLayout><AdminOverview /></AdminLayout>
      }/>
      <Route path="/admin/upload" element={
        !user ? <Navigate to="/login" replace /> :
        <AdminLayout><AdminUploadVideo /></AdminLayout>
      }/>
      <Route path="/admin/videos" element={
        !user ? <Navigate to="/login" replace /> :
        <AdminLayout><AdminVideos /></AdminLayout>
      }/>
      <Route path="/admin/members" element={
        !user ? <Navigate to="/login" replace /> :
        <AdminLayout><AdminMembers /></AdminLayout>
      }/>
      <Route path="/admin/chat" element={
        !user ? <Navigate to="/login" replace /> :
        <AdminLayout><AdminChat /></AdminLayout>
      }/>
      <Route path="/admin/leads" element={
        !user ? <Navigate to="/login" replace /> :
        <AdminLayout><AdminLeads /></AdminLayout>
      }/>
      <Route path="/admin/revenue" element={
        !user ? <Navigate to="/login" replace /> :
        <AdminLayout><AdminRevenue /></AdminLayout>
      }/>
      <Route path="/admin/settings" element={
        !user ? <Navigate to="/login" replace /> :
        <AdminLayout><AdminSettings /></AdminLayout>
      }/>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
