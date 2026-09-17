import { useState, useCallback, useEffect } from 'react'
import { store, dbReady } from './lib/store'
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

function DbBanner() {
  const [dismissed, setDismissed] = useState(false)
  if (dbReady || dismissed) return null
  return (
    <div style={{ position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 999, maxWidth: 560, width: 'calc(100% - 32px)', background: '#1c1a14', border: '1px solid rgba(245,158,11,0.4)', borderRadius: 14, padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'flex-start', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
      <span style={{ fontSize: 20, flexShrink: 0 }}>⚠️</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: '#fbbf24', marginBottom: 4 }}>Supabase холболт тохируулагдаагүй</div>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'rgba(241,245,249,0.55)', lineHeight: 1.6 }}>
          Өгөгдөл Supabase-д хадгалагдахын тулд доорх SQL-г <strong style={{ color: '#f1f5f9' }}>Supabase Dashboard → SQL Editor</strong>-т ажиллуулна уу:
        </div>
        <pre style={{ marginTop: 8, fontFamily: 'monospace', fontSize: 11, color: '#86efac', background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '8px 10px', overflow: 'auto', whiteSpace: 'pre-wrap' }}>{`alter table public.courses          disable row level security;
alter table public.questions        disable row level security;
alter table public.question_options disable row level security;
alter table public.users            disable row level security;
alter table public.user_progress    disable row level security;
grant usage on schema public to anon;
grant all on all tables in schema public to anon;
grant all on all sequences in schema public to anon;`}</pre>
      </div>
      <button onClick={() => setDismissed(true)} style={{ background: 'none', border: 'none', color: 'rgba(241,245,249,0.4)', cursor: 'pointer', fontSize: 18, flexShrink: 0, lineHeight: 1 }}>×</button>
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
    return <><LoginScreen onLogin={handleLogin} /><DbBanner /></>
  }

  if (screen.kind === 'admin') {
    return <><AdminPanel onLogout={handleLogout} /><DbBanner /></>
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
