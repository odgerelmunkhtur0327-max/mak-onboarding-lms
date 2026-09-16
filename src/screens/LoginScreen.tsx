import { useState } from 'react'
import type { User } from '../types'

export default function LoginScreen({ onLogin }: { onLogin: (email: string, password: string) => Promise<User | null> }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const user = await onLogin(email.trim(), password)
      if (!user) setError('И-мэйл эсвэл нууц үг буруу байна.')
    } catch {
      setError('Холболтын алдаа гарлаа. Дахин оролдоно уу.')
    } finally {
      setLoading(false)
    }
  }

  const inp: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: '14px 18px',
    fontFamily: 'var(--font-sans)',
    fontSize: 15,
    color: '#f1f5f9',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#0f1117' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg, #1a56db, #7c3aed)', marginBottom: 20, fontSize: 28 }}>
            🎓
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: '#f1f5f9', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
            "Монголын Алт" МАК ХХК
          </h1>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'rgba(241,245,249,0.45)', margin: 0 }}>
            Шинэ ажилтны сургалтын систем
          </p>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '32px 28px' }}>
          <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 18, fontWeight: 700, color: '#f1f5f9', margin: '0 0 24px' }}>
            Нэвтрэх
          </h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, color: 'rgba(241,245,249,0.5)', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>
                И-МЭЙЛ
              </label>
              <input
                type="email"
                required
                placeholder="tanii.email@mak.mn"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={inp}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(26,86,219,0.6)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
            </div>
            <div>
              <label style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, color: 'rgba(241,245,249,0.5)', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>
                НУУЦ ҮГ
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={inp}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(26,86,219,0.6)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
            </div>

            {error && (
              <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: 10, padding: '10px 14px', fontFamily: 'var(--font-sans)', fontSize: 13, color: '#f87171' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600,
                color: '#fff', background: loading ? 'rgba(26,86,219,0.5)' : 'linear-gradient(135deg, #1a56db, #7c3aed)',
                border: 'none', borderRadius: 12, padding: '14px', cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.2s, transform 0.15s', marginTop: 4,
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'scale(1.02)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
            >
              {loading ? 'Нэвтэрж байна...' : 'Нэвтрэх →'}
            </button>
          </form>
        </div>

        {/* Demo hint */}
        <div style={{ marginTop: 20, padding: '14px 18px', background: 'rgba(26,86,219,0.06)', border: '1px solid rgba(26,86,219,0.15)', borderRadius: 12 }}>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'rgba(241,245,249,0.4)', margin: '0 0 8px', fontWeight: 600, letterSpacing: '0.06em' }}>
            DEMO ДАНС
          </p>
          {[
            { label: 'Ажилтан', email: 'user@mak.mn', pass: 'user123' },
            { label: 'Админ', email: 'admin@mak.mn', pass: 'admin123' },
          ].map(d => (
            <button
              key={d.email}
              onClick={() => { setEmail(d.email); setPassword(d.pass) }}
              style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', fontFamily: 'var(--font-sans)', fontSize: 12, color: 'rgba(241,245,249,0.5)', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#93c5fd')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(241,245,249,0.5)')}
            >
              {d.label}: {d.email} / {d.pass}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
