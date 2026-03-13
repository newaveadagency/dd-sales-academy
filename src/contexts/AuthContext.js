import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})
export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        supabase.from('profiles').select('*').eq('id', session.user.id).single()
          .then(({ data }) => { setProfile(data); setLoading(false) })
      } else {
        setLoading(false)
      }
    })
  }, [])

  const signIn = async (email, password) => {
    const result = await supabase.auth.signInWithPassword({ email, password })
    if (result.data?.user) {
      setUser(result.data.user)
      const { data: p } = await supabase.from('profiles').select('*').eq('id', result.data.user.id).single()
      setProfile(p)
    }
    return result
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const isAdmin = profile?.is_admin === true
  const isActive = profile?.status === 'active' || isAdmin

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut, isAdmin, isActive }}>
      {children}
    </AuthContext.Provider>
  )
}
