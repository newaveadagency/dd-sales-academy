import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: true,
    detectSessionInUrl: false
  }
})

// ── AUTH ──────────────────────────────────────────────
export const signIn = (email, password) =>
  supabase.auth.signInWithPassword({ email, password })

export const signOut = () => supabase.auth.signOut()

export const getCurrentUser = () => supabase.auth.getUser()

// ── MEMBERS ──────────────────────────────────────────
export const getMemberProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return { data, error }
}

export const updateMemberProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
  return { data, error }
}

// ── VIDEOS ────────────────────────────────────────────
export const getVideos = async () => {
  const { data, error } = await supabase
    .from('videos')
    .select('*, modules(title, order_index)')
    .eq('status', 'published')
    .order('week_number', { ascending: true })
  return { data, error }
}

export const getVideoById = async (id) => {
  const { data, error } = await supabase
    .from('videos')
    .select('*, modules(title)')
    .eq('id', id)
    .single()
  return { data, error }
}

// Check if video is unlocked for a member based on their enrollment date
export const isVideoUnlocked = (video, enrolledAt) => {
  if (video.status !== 'published') return false
  if (!video.unlock_after_days) return true
  const enrollDate = new Date(enrolledAt)
  const unlockDate = new Date(enrollDate)
  unlockDate.setDate(unlockDate.getDate() + video.unlock_after_days)
  return new Date() >= unlockDate
}

export const markVideoWatched = async (userId, videoId, progress) => {
  const { data, error } = await supabase
    .from('video_progress')
    .upsert({
      user_id: userId,
      video_id: videoId,
      progress_percent: progress,
      watched_at: new Date().toISOString()
    }, { onConflict: 'user_id,video_id' })
  return { data, error }
}

export const getVideoProgress = async (userId) => {
  const { data, error } = await supabase
    .from('video_progress')
    .select('*')
    .eq('user_id', userId)
  return { data, error }
}

// ── CHAT ──────────────────────────────────────────────
export const getChatMessages = async (limit = 50) => {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*, profiles(full_name, is_admin, avatar_color)')
    .order('created_at', { ascending: true })
    .limit(limit)
  return { data, error }
}

export const sendChatMessage = async (userId, message) => {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({ user_id: userId, message, created_at: new Date().toISOString() })
  return { data, error }
}

export const deleteChatMessage = async (messageId) => {
  const { data, error } = await supabase
    .from('chat_messages')
    .delete()
    .eq('id', messageId)
  return { data, error }
}

// Subscribe to new messages (real-time)
export const subscribeToChat = (callback) => {
  return supabase
    .channel('chat_messages')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'chat_messages'
    }, async (payload) => {
      // Fetch full message with profile
      const { data } = await supabase
        .from('chat_messages')
        .select('*, profiles(full_name, is_admin, avatar_color)')
        .eq('id', payload.new.id)
        .single()
      if (data) callback(data)
    })
    .subscribe()
}

// ── ZOOM SESSIONS ─────────────────────────────────────
export const getZoomSessions = async () => {
  const { data, error } = await supabase
    .from('zoom_sessions')
    .select('*')
    .order('session_date', { ascending: true })
  return { data, error }
}

export const createZoomSession = async (session) => {
  const { data, error } = await supabase
    .from('zoom_sessions')
    .insert(session)
  return { data, error }
}

// ── ADMIN ─────────────────────────────────────────────
export const getAllMembers = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
  return { data, error }
}

export const updateMemberStatus = async (userId, status) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ status })
    .eq('id', userId)
  return { data, error }
}

export const getAllVideosAdmin = async () => {
  const { data, error } = await supabase
    .from('videos')
    .select('*, modules(title)')
    .order('week_number', { ascending: true })
  return { data, error }
}

export const createVideo = async (video) => {
  const { data, error } = await supabase
    .from('videos')
    .insert(video)
    .select()
  return { data, error }
}

export const updateVideo = async (id, updates) => {
  const { data, error } = await supabase
    .from('videos')
    .update(updates)
    .eq('id', id)
  return { data, error }
}

export const deleteVideo = async (id) => {
  const { data, error } = await supabase
    .from('videos')
    .delete()
    .eq('id', id)
  return { data, error }
}

export const getLeads = async () => {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
  return { data, error }
}

export const createLead = async (lead) => {
  const { data, error } = await supabase
    .from('leads')
    .insert(lead)
  return { data, error }
}

export const getPayments = async () => {
  const { data, error } = await supabase
    .from('payments')
    .select('*, profiles(full_name)')
    .order('created_at', { ascending: false })
  return { data, error }
}

export const getAdminStats = async () => {
  const [members, payments, videos, leads] = await Promise.all([
    supabase.from('profiles').select('id, status, created_at'),
    supabase.from('payments').select('amount, created_at, status'),
    supabase.from('videos').select('id, status'),
    supabase.from('leads').select('id, status, created_at')
  ])
  return {
    totalMembers: members.data?.filter(m => m.status === 'active').length || 0,
    totalRevenue: payments.data?.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0) || 0,
    totalVideos: videos.data?.filter(v => v.status === 'published').length || 0,
    newLeads: leads.data?.filter(l => l.status === 'new').length || 0
  }
}
