import { useState, useEffect, useRef, useCallback } from 'react'
import type { Lesson, User, Question, QuizAttempt } from '../../types'
import { store } from '../../lib/store'
import { detectVideoType, getEmbedUrl } from '../../lib/videoUtils'

// ── Video Player ────────────────────────────────────────────────────────────

function VideoPlayer({
  lesson,
  onCompleted,
  alreadyCompleted,
}: {
  lesson: Lesson
  onCompleted: () => void
  alreadyCompleted: boolean
}) {
  const [watchedPct, setWatchedPct] = useState(alreadyCompleted ? 100 : 0)
  const [done, setDone] = useState(alreadyCompleted)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const totalSeconds = lesson.videoDurationMinutes * 60
  const videoType = detectVideoType(lesson.videoUrl)
  const embedUrl = getEmbedUrl(lesson.videoUrl)

  // Timer-based progress for when video is playing
  const startTimer = useCallback(() => {
    if (done || timerRef.current) return
    const tick = 1 // seconds per interval
    timerRef.current = setInterval(() => {
      setWatchedPct(prev => {
        const next = Math.min(100, prev + (tick / totalSeconds) * 100)
        if (next >= 100) {
          setDone(true)
          onCompleted()
          if (timerRef.current) clearInterval(timerRef.current)
          timerRef.current = null
        }
        return next
      })
    }, 1000)
  }, [done, totalSeconds, onCompleted])

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }, [])

  useEffect(() => () => stopTimer(), [stopTimer])

  // Mark done immediately if not requireFullWatch
  useEffect(() => {
    if (!lesson.requireFullWatch && !done) {
      setDone(true)
      setWatchedPct(100)
      onCompleted()
    }
  }, [lesson.requireFullWatch, done, onCompleted])

  const noVideo = videoType === 'none'

  return (
    <div style={{ background: '#000', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
      {/* Video area */}
      <div style={{ position: 'relative', paddingBottom: noVideo ? undefined : '56.25%', height: noVideo ? 220 : undefined, background: '#080c14' }}>
        {videoType === 'youtube' || videoType === 'vimeo' || videoType === 'sharepoint' ? (
          <iframe
            src={embedUrl!}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            onLoad={() => { if (lesson.requireFullWatch) startTimer() }}
            title={lesson.title}
          />
        ) : videoType === 'mp4' ? (
          <video
            src={lesson.videoUrl}
            controls
            style={{ width: '100%', height: '100%', display: 'block' }}
            onPlay={() => { if (lesson.requireFullWatch) startTimer() }}
            onPause={stopTimer}
            onEnded={() => { stopTimer(); setDone(true); setWatchedPct(100); onCompleted() }}
          />
        ) : (
          /* Placeholder when no URL set */
          <div style={{ height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <div style={{ fontSize: 48 }}>🎬</div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'rgba(241,245,249,0.4)', textAlign: 'center', lineHeight: 1.5, maxWidth: 260 }}>
              Видео холбоос тохируулагдаагүй байна.<br />
              <span style={{ fontSize: 12, color: 'rgba(241,245,249,0.3)' }}>Админ панелиас YouTube/Vimeo URL нэмнэ үү.</span>
            </div>
            {!done && (
              <button
                onClick={() => { startTimer(); if (!lesson.requireFullWatch) { setDone(true); setWatchedPct(100); onCompleted() } }}
                style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: '#fff', background: 'rgba(26,86,219,0.6)', border: 'none', borderRadius: 999, padding: '8px 20px', cursor: 'pointer', marginTop: 4 }}
              >
                {lesson.requireFullWatch ? `Симуляц эхлэх (${lesson.videoDurationMinutes} мин)` : 'Үргэлжлүүлэх →'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Watch progress bar (only if requireFullWatch) */}
      {lesson.requireFullWatch && (
        <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: done ? '#4ade80' : 'rgba(241,245,249,0.5)', fontWeight: 500 }}>
              {done ? '✓ Видео үзэж дууссан — шалгалт нээлттэй' : `Шалгалтын хэсэг нээгдэхийн тулд видеог үзнэ үү`}
            </span>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700, color: done ? '#4ade80' : '#60a5fa' }}>
              {Math.round(watchedPct)}%
            </span>
          </div>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${watchedPct}%`, borderRadius: 999, background: done ? 'linear-gradient(90deg,#16a34a,#4ade80)' : 'linear-gradient(90deg,#1a56db,#60a5fa)', transition: 'width 0.5s ease' }} />
          </div>
        </div>
      )}
    </div>
  )
}

// ── Quiz Module ─────────────────────────────────────────────────────────────

type AnswerMap = Record<string, number[]>

function calcScore(questions: Question[], answers: AnswerMap) {
  let score = 0
  let total = 0
  for (const q of questions) {
    total += q.points
    const sel = answers[q.id] ?? []
    const correct = [...q.correct].sort()
    const selSorted = [...sel].sort()
    if (JSON.stringify(selSorted) === JSON.stringify(correct)) score += q.points
  }
  return { score, total }
}

function QuizQuestion({
  question,
  answers,
  onAnswer,
  revealed,
}: {
  question: Question
  answers: AnswerMap
  onAnswer: (qId: string, selected: number[]) => void
  revealed: boolean
}) {
  const sel = answers[question.id] ?? []
  const isSelected = (i: number) => sel.includes(i)
  const toggle = (i: number) => {
    if (revealed) return
    if (question.type === 'single' || question.type === 'truefalse') {
      onAnswer(question.id, [i])
    } else {
      const next = sel.includes(i) ? sel.filter(x => x !== i) : [...sel, i]
      onAnswer(question.id, next)
    }
  }

  // Submitted answers are intentionally kept neutral: employees receive their
  // final score, but the interface never exposes the correct answer choices.
  const optBg = (i: number) => isSelected(i)
    ? (revealed ? 'rgba(59,130,246,0.10)' : 'rgba(26,86,219,0.18)')
    : (revealed ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)')
  const optBorder = (i: number) => isSelected(i)
    ? '1.5px solid #3b82f6'
    : (revealed ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(255,255,255,0.08)')

  const isTF = question.type === 'truefalse'

  return (
    <div>
      <div style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.12)', borderRadius: 16, padding: '20px 24px', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 6, padding: '3px 8px', flexShrink: 0, marginTop: 2 }}>
            {question.type === 'single' ? 'НЭГ' : question.type === 'multiple' ? 'ОЛОН' : 'ҮН/ХУД'} · {question.points}п
          </span>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 600, color: '#f1f5f9', margin: 0, lineHeight: 1.5 }}>
            {question.question}
          </p>
        </div>
      </div>

      <div style={{ display: isTF ? 'flex' : 'flex', flexDirection: isTF ? 'row' : 'column', gap: 10 }}>
        {question.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => toggle(i)}
            style={{
              flex: isTF ? 1 : undefined,
              background: optBg(i), border: optBorder(i), borderRadius: 12,
              padding: isTF ? '14px 16px' : '14px 18px', textAlign: 'left',
              cursor: revealed ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 12,
              transition: 'background 0.15s, border-color 0.15s',
              justifyContent: isTF ? 'center' : undefined,
            }}
            onMouseEnter={e => { if (!revealed) e.currentTarget.style.background = 'rgba(59,130,246,0.12)' }}
            onMouseLeave={e => { if (!revealed) e.currentTarget.style.background = optBg(i) }}
          >
            {!isTF && (
              <span style={{
                width: 28, height: 28, borderRadius: question.type === 'multiple' ? 7 : '50%',
                border: `1.5px solid ${isSelected(i) ? '#3b82f6' : 'rgba(255,255,255,0.2)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, flexShrink: 0,
                color: isSelected(i) ? '#60a5fa' : 'rgba(241,245,249,0.4)',
                background: isSelected(i) && !revealed ? 'rgba(59,130,246,0.15)' : 'transparent',
              }}>
                {question.type === 'multiple' ? (isSelected(i) ? '✓' : '') : String.fromCharCode(65 + i)}
              </span>
            )}
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: isTF ? 600 : 400, color: '#f1f5f9', lineHeight: 1.4 }}>
              {isTF ? (i === 0 ? '✓  Үнэн' : '✗  Худал') : opt}
            </span>
          </button>
        ))}
      </div>

    </div>
  )
}

function QuizModule({
  lesson,
  existingAttempt,
  onSubmit,
}: {
  lesson: Lesson
  existingAttempt: QuizAttempt | null
  onSubmit: (attempt: QuizAttempt) => void
}) {
  // A failed attempt is recorded for reporting, but it must not prefill or
  // reveal answers when the employee returns to retry the quiz.
  const completedAttempt = existingAttempt?.passed ? existingAttempt : null
  const [answers, setAnswers] = useState<AnswerMap>(completedAttempt?.answers ?? {})
  const [current, setCurrent] = useState(0)
  const [revealed, setRevealed] = useState(!!completedAttempt)
  const [submitted, setSubmitted] = useState(!!completedAttempt)

  const questions = lesson.questions
  const q = questions[current]
  const answeredCount = Object.keys(answers).filter(k => answers[k].length > 0).length
  const allAnswered = answeredCount === questions.length

  const handleAnswer = (qId: string, sel: number[]) => {
    setAnswers(prev => ({ ...prev, [qId]: sel }))
  }

  const handleSubmit = () => {
    const { score, total } = calcScore(questions, answers)
    const pct = (score / total) * 100
    const attempt: QuizAttempt = {
      answers,
      score,
      totalPoints: total,
      passed: pct >= lesson.passingScore,
      completedAt: new Date().toISOString(),
    }
    setRevealed(true)
    setSubmitted(true)
    onSubmit(attempt)
  }

  const { score: curScore, total: curTotal } = submitted ? calcScore(questions, answers) : { score: 0, total: 0 }
  const pct = submitted ? Math.round((curScore / curTotal) * 100) : 0
  const passed = pct >= lesson.passingScore

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, color: '#f59e0b', letterSpacing: '0.1em', marginBottom: 4 }}>
            БАТАТГАЛЫН ШАЛГАЛТ
          </div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'rgba(241,245,249,0.5)' }}>
            Тэнцэх оноо: {lesson.passingScore}% · Нийт: {questions.length} асуулт
          </div>
        </div>
        {submitted && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 900, color: passed ? '#4ade80' : '#f87171', lineHeight: 1 }}>
              {pct}%
            </div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: passed ? '#4ade80' : '#f87171', fontWeight: 600 }}>
              {passed ? '✓ ТЭНЦСЭН' : '✗ ТЭНЦЭЭГҮЙ'}
            </div>
          </div>
        )}
      </div>

      {/* Question nav */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {questions.map((qq, i) => {
          const isAnswered = (answers[qq.id] ?? []).length > 0
          const isActive = i === current
          return (
            <button
              key={qq.id}
              onClick={() => setCurrent(i)}
              style={{
                width: 36, height: 36, borderRadius: 9, border: isActive ? '2px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)',
                background: isActive ? 'rgba(245,158,11,0.12)' : isAnswered ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700,
                color: isActive ? '#f59e0b' : isAnswered ? '#60a5fa' : 'rgba(241,245,249,0.4)',
                transition: 'all 0.15s',
              }}
            >
              {i + 1}
            </button>
          )
        })}
      </div>

      {/* Current question */}
      <div key={current} style={{ animation: 'slide-up 0.3s ease forwards', marginBottom: 24 }}>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, color: 'rgba(241,245,249,0.35)', letterSpacing: '0.1em', marginBottom: 12 }}>
          АСУУЛТ {current + 1} / {questions.length}
        </div>
        <QuizQuestion
          question={q}
          answers={answers}
          onAnswer={handleAnswer}
          revealed={revealed}
        />
      </div>

      {/* Prev / Next */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', marginBottom: submitted ? 0 : 20 }}>
        <button
          onClick={() => setCurrent(c => c - 1)}
          disabled={current === 0}
          style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500, color: current === 0 ? 'rgba(241,245,249,0.2)' : 'rgba(241,245,249,0.6)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 999, padding: '10px 22px', cursor: current === 0 ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
        >
          ← Өмнөх
        </button>
        <div style={{ display: 'flex', gap: 10 }}>
          {current < questions.length - 1 ? (
            <button
              onClick={() => setCurrent(c => c + 1)}
              style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: '#fff', background: 'linear-gradient(135deg,#1a56db,#7c3aed)', border: 'none', borderRadius: 999, padding: '10px 24px', cursor: 'pointer', transition: 'transform 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              Дараагийн →
            </button>
          ) : !submitted ? (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered}
              style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: '#fff', background: allAnswered ? 'linear-gradient(135deg,#16a34a,#059669)' : 'rgba(22,163,74,0.25)', border: 'none', borderRadius: 999, padding: '10px 24px', cursor: allAnswered ? 'pointer' : 'not-allowed', transition: 'transform 0.15s, background 0.2s' }}
              onMouseEnter={e => { if (allAnswered) e.currentTarget.style.transform = 'scale(1.03)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
            >
              {allAnswered ? 'Шалгалт дуусгах ✓' : `${answeredCount}/${questions.length} хариулсан`}
            </button>
          ) : null}
        </div>
      </div>

      {submitted && (
        <div style={{ marginTop: 16, padding: '20px 24px', background: passed ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.08)', border: `1px solid ${passed ? 'rgba(22,163,74,0.2)' : 'rgba(220,38,38,0.2)'}`, borderRadius: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 28 }}>{passed ? '🎉' : '📚'}</span>
            <div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 700, color: passed ? '#4ade80' : '#f87171', marginBottom: 4 }}>
                {passed ? 'Баяр хүргэе! Та тэнцлээ.' : 'Хичээлийг дахин үзэж оролдоно уу.'}
              </div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'rgba(241,245,249,0.5)' }}>
                Оноо: {curScore}/{curTotal} · {pct}% · Тэнцэх босго: {lesson.passingScore}%
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main LessonView ─────────────────────────────────────────────────────────

export default function LessonView({
  lesson,
  user,
  onBack,
  onProgressUpdate,
}: {
  lesson: Lesson
  user: User
  onBack: () => void
  onProgressUpdate: () => void
}) {
  const existingProg = store.getUserProgress(user.id, lesson.id)
  const [videoCompleted, setVideoCompleted] = useState(existingProg?.videoCompleted ?? false)
  const [tab, setTab] = useState<'video' | 'quiz'>('video')

  const handleVideoCompleted = useCallback(() => {
    if (!videoCompleted) {
      store.markVideoCompleted(user.id, lesson.id)
      setVideoCompleted(true)
      onProgressUpdate()
    }
  }, [videoCompleted, user.id, lesson.id, onProgressUpdate])

  const handleQuizSubmit = (attempt: QuizAttempt) => {
    store.saveQuizAttempt(user.id, lesson.id, attempt)
    onProgressUpdate()
  }

  // Only an explicit `true` locks the quiz. This keeps lessons marked as
  // optional open even when older remote data contains an unset value.
  const quizLocked = lesson.requireFullWatch === true && !videoCompleted

  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', display: 'flex', flexDirection: 'column' }}>
      {/* Nav */}
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(15,17,23,0.9)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50, flexShrink: 0 }}>
        <button
          onClick={onBack}
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 999, padding: '6px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(241,245,249,0.6)', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500, transition: 'all 0.2s', flexShrink: 0 }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#f1f5f9' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(241,245,249,0.6)' }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 2L4 7l5 5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Буцах
        </button>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {lesson.order}. {lesson.title}
          </div>
        </div>
        {/* Tab switcher */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: 999, padding: 3, gap: 2, flexShrink: 0 }}>
          {(['video', 'quiz'] as const).map(t => (
            <button
              key={t}
              onClick={() => { if (t === 'quiz' && quizLocked) return; setTab(t) }}
              style={{
                fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 999, border: 'none', cursor: t === 'quiz' && quizLocked ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                background: tab === t ? (t === 'video' ? 'rgba(26,86,219,0.8)' : 'rgba(22,163,74,0.8)') : 'transparent',
                color: tab === t ? '#fff' : t === 'quiz' && quizLocked ? 'rgba(241,245,249,0.2)' : 'rgba(241,245,249,0.5)',
              }}
            >
              {t === 'video' ? '🎬 Видео' : `📝 Шалгалт${quizLocked ? ' 🔒' : ''}`}
            </button>
          ))}
        </div>
      </header>

      <main style={{ flex: 1, maxWidth: 860, margin: '0 auto', width: '100%', padding: '28px 24px' }}>
        {tab === 'video' ? (
          <div>
            <VideoPlayer
              lesson={lesson}
              onCompleted={handleVideoCompleted}
              alreadyCompleted={videoCompleted}
            />
            <div style={{ marginTop: 20, padding: '18px 22px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: '#f1f5f9', margin: '0 0 8px', letterSpacing: '-0.01em' }}>
                {lesson.title}
              </h3>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'rgba(241,245,249,0.5)', margin: '0 0 14px', lineHeight: 1.6 }}>
                {lesson.description}
              </p>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'rgba(241,245,249,0.4)' }}>🕐 {lesson.videoDurationMinutes} минут</span>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'rgba(241,245,249,0.4)' }}>📝 {lesson.questions.length} асуулт</span>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'rgba(241,245,249,0.4)' }}>🎯 Тэнцэх: {lesson.passingScore}%</span>
                {lesson.requireFullWatch && <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#f59e0b' }}>⚠ Видео дуустал үзэх шаардлагатай</span>}
              </div>
              {videoCompleted && (
                <button
                  onClick={() => setTab('quiz')}
                  style={{ marginTop: 16, fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, color: '#fff', background: 'linear-gradient(135deg,#16a34a,#059669)', border: 'none', borderRadius: 999, padding: '12px 28px', cursor: 'pointer', transition: 'transform 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  Шалгалт өгөх →
                </button>
              )}
            </div>
          </div>
        ) : (
          <QuizModule
            lesson={lesson}
            existingAttempt={existingProg?.quizAttempt ?? null}
            onSubmit={handleQuizSubmit}
          />
        )}
      </main>
    </div>
  )
}
