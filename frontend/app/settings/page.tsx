'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/authContext'
import { verifyToken } from '@/lib/api/auth'
import { encrypt } from '@/lib/crypto'
import './settings.css'

export default function SettingsPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const { isAuthenticated, isInitialized, login, logout } = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.trim()) {
      setError('')
      setIsVerifying(true)
      
      try {
        // 加密密码
        const encryptedPassword = encrypt(password)
        
        // 验证 token 是否正确
        await verifyToken({ adminToken: encryptedPassword })
        
        // 验证成功，执行登录
        login(password)
        setPassword('')
      } catch (err: unknown) {
        // 验证失败，显示错误
        console.log('验证失败:', err)
        setError('密码错误，请重试')
      } finally {
        setIsVerifying(false)
      }
    }
  }

  const handleLogout = () => {
    logout()
    setPassword('')
  }

  return (
    <main className="settings-main">
      <div className="settings-container">
        {/* 认证区域 */}
        <section className="settings-section">
          <div className="section-content">
            {!isInitialized ? (
              <div className="login-status">
                <span className="status-text">加载中...</span>
              </div>
            ) : isAuthenticated ? (
              <div className="login-status">
                <div className="status-indicator">
                  <span className="status-text">已登录，你可以编辑数据</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="btn btn-logout"
                >
                  登出
                </button>
              </div>
            ) : (
              <form onSubmit={handleLogin} className="login-form">
                <div className="form-group">
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="输入密码以进行管理"
                    className="form-input password-input"
                    disabled={isVerifying}
                  />
                  {error && (
                    <p className="error-message">
                      {error}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={!password || isVerifying}
                  className="btn btn-login"
                >
                  {isVerifying ? '验证中...' : '登录'}
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
