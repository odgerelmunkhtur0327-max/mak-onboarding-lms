import type { User, Lesson } from '../../types'
import { store } from '../../lib/store'

type Props = {
  user: User
  lessons: Lesson[]
  onSelectLesson: (lesson: Lesson) => void
  onLogout: () => void
}

function lessonStatus(user: User, lesson: Lesson) {
  const prog = user.progress.find(p => p.lessonId === lesson.id)
  if (!prog) return 'pending'
  if (prog.quizAttempt?.passed) return 'passed'
  if (prog.videoCompleted || (prog.quizAttempt && !prog.quizAttempt.passed)) return 'in_progress'
  return 'pending'
}

function overallProgress(user: User, lessons: Lesson[]) {
  const passed = lessons.filter(l => {
    const p = user.progress.find(pr => pr.lessonId === l.id)
    return p?.quizAttempt?.passed
  }).length
  return { passed, total: lessons.length, pct: Math.round((passed / lessons.length) * 100) }
}

const STATUS_COLORS = {
  passed: { bg: 'rgba(22,163,74,0.12)', border: 'rgba(22,163,74,0.3)', badge: '#16a34a', badgeBg: 'rgba(22,163,74,0.15)', label: 'Дууссан', icon: '✓' },
  in_progress: { bg: 'rgba(26,86,219,0.08)', border: 'rgba(26,86,219,0.25)', badge: '#3b82f6', badgeBg: 'rgba(59,130,246,0.12)', label: 'Үргэлжилж байна', icon: '▶' },
  pending: { bg: 'rgba(255,255,255,0.02)', border: 'rgba(255,255,255,0.08)', badge: 'rgba(241,245,249,0.4)', badgeBg: 'rgba(255,255,255,0.05)', label: 'Эхлээгүй', icon: '○' },
}

export default function UserHome({ user, lessons, onSelectLesson, onLogout }: Props) {
  const { passed, total, pct } = overallProgress(user, lessons)
  const allPassed = passed === total

  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', display: 'flex', flexDirection: 'column' }}>
      {/* Nav */}
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(15,17,23,0.9)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>🎓</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
            &quot;Монголын Алт&quot; МАК <span style={{ color: '#3b82f6' }}>ХХК</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'rgba(241,245,249,0.5)', display: 'none' }} className="sm:inline">
            {user.name}
          </span>
          <button
            onClick={onLogout}
            style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500, color: 'rgba(241,245,249,0.5)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 999, padding: '6px 16px', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(220,38,38,0.3)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(241,245,249,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
          >
            Гарах
          </button>
        </div>
      </header>

      <main style={{ flex: 1, maxWidth: 900, margin: '0 auto', width: '100%', padding: '40px 24px' }}>
        {/* Welcome + Overall Progress */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, letterSpacing: '-0.025em', color: '#f1f5f9', margin: '0 0 6px' }}>
            Тавтай морил, <span style={{ color: '#3b82f6' }}>{user.name.split(' ')[0]}</span>!
          </h1>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'rgba(241,245,249,0.45)', margin: '0 0 28px' }}>
            {user.department} · Эхлэх огноо: {user.startDate}
          </p>

          {/* Overall progress card */}
          <div style={{ background: allPassed ? 'rgba(22,163,74,0.08)' : 'rgba(26,86,219,0.08)', border: `1px solid ${allPassed ? 'rgba(22,163,74,0.2)' : 'rgba(26,86,219,0.2)'}`, borderRadius: 18, padding: '24px 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, color: allPassed ? '#4ade80' : '#60a5fa', letterSpacing: '0.1em', marginBottom: 4 }}>
                  {allPassed ? '🎉 СУРГАЛТ ДУУССАН' : 'НИЙТ ЯВЦ'}
                </div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 500, color: '#f1f5f9' }}>
                  {passed} / {total} хичээл дууссан
                </div>
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 900, color: allPassed ? '#4ade80' : '#60a5fa', lineHeight: 1 }}>
                {pct}%
              </div>
            </div>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, borderRadius: 999, background: allPassed ? 'linear-gradient(90deg,#16a34a,#4ade80)' : 'linear-gradient(90deg,#1a56db,#7c3aed)', transition: 'width 1s ease' }} />
            </div>
          </div>
        </div>

        {/* Lesson cards */}
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, color: 'rgba(241,245,249,0.4)', letterSpacing: '0.12em', marginBottom: 16 }}>
          СУРГАЛТЫН ХИЧЭЭЛҮҮД
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {lessons.map((lesson, idx) => {
            const status = lessonStatus(user, lesson)
            const prog = user.progress.find(p => p.lessonId === lesson.id)
            const col = STATUS_COLORS[status]
            const prevPassed = idx === 0 || lessonStatus(user, lessons[idx - 1]) === 'passed'
            // An optional lesson remains directly accessible. Once an admin
            // marks it as required, the normal prerequisite lock applies.
            const isRequired = lesson.requireFullWatch === true
            const locked = isRequired && !prevPassed && status === 'pending'

            return (
              <div
                key={lesson.id}
                onClick={() => !locked && onSelectLesson(lesson)}
                style={{
                  background: col.bg,
                  border: `1px solid ${col.border}`,
                  borderRadius: 18,
                  padding: '24px 24px',
                  cursor: locked ? 'not-allowed' : 'pointer',
                  opacity: locked ? 0.5 : 1,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 20,
                  flexWrap: 'wrap',
                }}
                onMouseEnter={e => { if (!locked) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.25)' } }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
              >
                {/* Number */}
                <div style={{ width: 48, height: 48, borderRadius: 14, background: col.badgeBg, border: `1.5px solid ${col.badge}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: col.badge, flexShrink: 0 }}>
                  {locked ? '🔒' : col.icon}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.01em' }}>
                      {lesson.order}. {lesson.title}
                    </span>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, color: col.badge, background: col.badgeBg, border: `1px solid ${col.badge}33`, borderRadius: 999, padding: '2px 10px', letterSpacing: '0.06em' }}>
                      {col.label}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'rgba(241,245,249,0.5)', marginBottom: 8 }}>
                    {lesson.description}
                  </div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'rgba(241,245,249,0.4)', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span>🎬</span> {lesson.videoDurationMinutes} мин
                    </span>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'rgba(241,245,249,0.4)', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span>📝</span> {lesson.questions.length} асуулт
                    </span>
                    {prog?.videoCompleted && (
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span>✓</span> Видео үзсэн
                      </span>
                    )}
                    {prog?.quizAttempt && (
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: prog.quizAttempt.passed ? '#4ade80' : '#f87171', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span>{prog.quizAttempt.passed ? '✓' : '✗'}</span>
                        Оноо: {prog.quizAttempt.score}/{prog.quizAttempt.totalPoints} ({Math.round(prog.quizAttempt.score / prog.quizAttempt.totalPoints * 100)}%)
                      </span>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                {!locked && (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="rgba(241,245,249,0.3)" strokeWidth="1.5">
                    <path d="M5 10h10M10 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            )
          })}
        </div>

        {allPassed && (
          <div style={{ marginTop: 32, textAlign: 'center', padding: '32px', background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.15)', borderRadius: 18 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🏆</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: '#4ade80', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
              Сургалтыг амжилттай дуусгалаа!
            </h3>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'rgba(241,245,249,0.5)', margin: 0 }}>
              HR хэлтсийн ажилтан таны гэрчилгээг бэлдэж байна. Ажлын амжилт хүсье!
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
