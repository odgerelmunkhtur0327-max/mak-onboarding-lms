import { useState, useCallback, useEffect } from 'react'
import { store } from './lib/store'
import type { User, Lesson } from './types'
import LoginScreen from './screens/LoginScreen'
import UserHome from './screens/user/UserHome'
import LessonView from './screens/user/LessonView'
import AdminPanel from './screens/admin/AdminPanel'

type Screen =
  | { kind: 'login' }
  | { kind: 'user-home' }
  | { kind: 'lesson'; lesson: Lesson }
  | { kind: 'admin' }

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
      <div style={{ fontSize: 48 }}>🎓</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
        &quot;Монголын Алт&quot; МАК <span style={{ color: '#3b82f6' }}>ХХК</span>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', animation: `pulse-ring 1.2s ease ${i * 0.2}s infinite` }} />
        ))}
      </div>
      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'rgba(241,245,249,0.35)' }}>
        Системд холбогдож байна...
      </div>
    </div>
  )
}

export default function App() {
  const [ready, setReady] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [screen, setScreen] = useState<Screen>({ kind: 'login' })
  const [, setRefresh] = useState(0)

  useEffect(() => {
    store.init().then(() => {
      const u = store.currentUser()
      setUser(u)
      setScreen(u ? (u.role === 'admin' ? { kind: 'admin' } : { kind: 'user-home' }) : { kind: 'login' })
      setReady(true)
    })
  }, [])

  const handleLogin = useCallback(async (email: string, password: string): Promise<User | null> => {
    const u = await store.loginAsync(email, password)
    if (u) {
      setUser(u)
      setScreen(u.role === 'admin' ? { kind: 'admin' } : { kind: 'user-home' })
    }
    return u
  }, [])

  const handleLogout = useCallback(() => {
    store.logout()
    setUser(null)
    setScreen({ kind: 'login' })
  }, [])

  const handleProgressUpdate = useCallback(() => {
    setRefresh(r => r + 1)
  }, [])

  if (!ready) return <LoadingScreen />

  if (!user || screen.kind === 'login') {
    return <LoginScreen onLogin={handleLogin} />
  }

  if (screen.kind === 'admin') {
    return <AdminPanel onLogout={handleLogout} />
  }

  if (screen.kind === 'lesson') {
    const freshUser = store.currentUser() ?? user
    return (
      <LessonView
        lesson={screen.lesson}
        user={freshUser}
        onBack={() => setScreen({ kind: 'user-home' })}
        onProgressUpdate={handleProgressUpdate}
      />
    )
  }

  const freshUser = store.currentUser() ?? user
  const lessons = store.getLessons()
  return (
    <UserHome
      key={freshUser.progress.length}
      user={freshUser}
      lessons={lessons}
      onSelectLesson={lesson => setScreen({ kind: 'lesson', lesson })}
      onLogout={handleLogout}
    />
  )
}
