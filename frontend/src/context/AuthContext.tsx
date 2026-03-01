import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import axios from 'axios'

const apiHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
const API_BASE_URL = `http://${apiHost}:8000`

interface User {
  id: number
  name: string
  email: string
  is_admin: boolean
  is_active: boolean
  department_id: number | null
  semester: number | null
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  isAdmin: boolean
}

interface RegisterData {
  name: string
  email: string
  password: string
  department_id?: number
  semester?: number
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // On mount, restore from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('ktu_token')
    const savedUser = localStorage.getItem('ktu_user')
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const res = await axios.post(`${API_BASE_URL}/auth/login`, { email, password })
    const { access_token, user: userData } = res.data
    setToken(access_token)
    setUser(userData)
    localStorage.setItem('ktu_token', access_token)
    localStorage.setItem('ktu_user', JSON.stringify(userData))
  }

  const register = async (data: RegisterData) => {
    const res = await axios.post(`${API_BASE_URL}/auth/register`, data)
    const { access_token, user: userData } = res.data
    setToken(access_token)
    setUser(userData)
    localStorage.setItem('ktu_token', access_token)
    localStorage.setItem('ktu_user', JSON.stringify(userData))
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('ktu_token')
    localStorage.removeItem('ktu_user')
  }

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      login,
      register,
      logout,
      isAuthenticated: !!token && !!user,
      isAdmin: !!user?.is_admin,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
