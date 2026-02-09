'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { encrypt, decrypt } from '@/lib/crypto'

type AuthContextType = {
  adminToken: string | null
  isAuthenticated: boolean
  isInitialized: boolean
  login: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const STORAGE_KEY = 'admin_token'

export function AuthProvider({ children }: { children: ReactNode }) {
  // 初始状态始终为 null/false，避免 SSR 水合不匹配
  const [adminToken, setAdminToken] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // 客户端挂载后从 localStorage 恢复状态
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        // 解密存储的 token
        const decrypted = decrypt(stored)
        // 从外部系统（localStorage）同步状态到 React - 这是 useEffect 的正确用途
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAdminToken(decrypted)
        setIsAuthenticated(true)
      } catch (error) {
        console.error('解密 token 失败:', error)
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    setIsInitialized(true)
  }, [])

  const login = (token: string) => {
    // 加密后存储
    const encrypted = encrypt(token)
    localStorage.setItem(STORAGE_KEY, encrypted)
    setAdminToken(token)
    setIsAuthenticated(true)
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY)
    setAdminToken(null)
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ adminToken, isAuthenticated, isInitialized, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
