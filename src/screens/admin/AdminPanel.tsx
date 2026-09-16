import { useState, useEffect } from 'react'
import { store } from '../../lib/store'
import type { Lesson, Question, QuestionType, User } from '../../types'

type AdminTab = 'lessons' | 'quizzes' | 'users'

// ── Helpers ─────────────────────────────────────────────────────────────────

const newId = () => Math.random().toString(36).slice(2, 10)

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  const map: Record<string, { bg: string; text: string }> = {
    blue: { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa' },
    green: { bg: 'rgba(22,163,74,0.15)', text: '#4ade80' },
    red: { bg: 'rgba(220,38,38,0.15)', text: '#f87171' },
    yellow: { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24' },
    gray: { bg: 'rgba(255,255,255,0.06)', text: 'rgba(241,245,249,0.5)' },
  }
  const c = map[color] ?? map.gray
  return (
    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: c.text, background: c.bg, borderRadius: 999, padding: '3px 10px' }}>
      {children}
    </span>
  )
}

function Inp({ label, value, onChange, type = 'text', placeholder = '' }: { label: string; value: string | number; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, color: 'rgba(241,245,249,0.4)', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', fontFamily: 'var(--font-sans)', fontSize: 14, color: '#f1f5f9', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
        onFocus={e => (e.currentTarget.style.borderColor = 'rgba(26,86,219,0.5)')}
        onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
      />
    </div>
  )
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10 }}>
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'rgba(241,245,249,0.7)' }}>{label}</span>
      <button
        onClick={() => onChange(!value)}
        style={{ width: 44, height: 24, borderRadius: 999, background: value ? '#1a56db' : 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.25s' }}
      >
        <div style={{ position: 'absolute', top: 3, left: value ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.25s' }} />
      </button>
    </div>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={onClose}>
      <div style={{ background: '#151820', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, width: '100%', maxWidth: 580, maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: '#f1f5f9', margin: 0, letterSpacing: '-0.01em' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 999, width: 32, height: 32, cursor: 'pointer', color: 'rgba(241,245,249,0.5)', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>
        <div style={{ padding: '24px' }}>{children}</div>
      </div>
    </div>
  )
}

// ── Lesson Editor ────────────────────────────────────────────────────────────

function LessonEditor({ lesson, onSave, onClose }: { lesson: Lesson | null; onSave: () => void; onClose: () => void }) {
  const isNew = !lesson
  const [form, setForm] = useState<Lesson>(lesson ?? {
    id: newId(),
    order: store.getLessons().length + 1,
    title: '',
    description: '',
    videoUrl: '',
    videoDurationMinutes: 10,
    requireFullWatch: true,
    passingScore: 85,
    questions: [],
  })

  const set = <K extends keyof Lesson>(k: K, v: Lesson[K]) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = () => {
    if (!form.title.trim()) return
    store.saveLesson(form)
    onSave()
    onClose()
  }

  return (
    <Modal title={isNew ? 'Шинэ хичээл нэмэх' : 'Хичээл засах'} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Inp label="ХИЧЭЭЛИЙН НЭР" value={form.title} onChange={v => set('title', v)} placeholder="Жишээ: МАК-ийн эрхэм зорилго" />
        <div>
          <label style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, color: 'rgba(241,245,249,0.4)', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>ТАЙЛБАР</label>
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            rows={2}
            placeholder="Хичээлийн агуулгын товч тайлбар"
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', fontFamily: 'var(--font-sans)', fontSize: 14, color: '#f1f5f9', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
          />
        </div>
        <Inp label="ВИДЕО ХОЛБООС (YouTube / Vimeo / SharePoint / MP4)" value={form.videoUrl} onChange={v => set('videoUrl', v)} placeholder="https://www.youtube.com/watch?v=..." />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Inp label="ҮРГЭЛЖЛЭХ ХУГАЦАА (МИН)" value={form.videoDurationMinutes} onChange={v => set('videoDurationMinutes', Number(v))} type="number" />
          <Inp label="ТЭНЦЭХ ОНОО (%)" value={form.passingScore} onChange={v => set('passingScore', Math.max(85, Number(v)))} type="number" />
        </div>
        <Toggle label="Видеог дуустал үзэх шаардлагатай" value={form.requireFullWatch} onChange={v => set('requireFullWatch', v)} />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8, borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 16 }}>
          <button onClick={onClose} style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500, color: 'rgba(241,245,249,0.6)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 20px', cursor: 'pointer' }}>Цуцлах</button>
          <button onClick={handleSave} style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, color: '#fff', background: 'linear-gradient(135deg,#1a56db,#7c3aed)', border: 'none', borderRadius: 10, padding: '10px 24px', cursor: 'pointer' }}>Хадгалах</button>
        </div>
      </div>
    </Modal>
  )
}

// ── Question Editor ──────────────────────────────────────────────────────────

function QuestionEditor({ question, onSave, onClose }: { question: Question | null; onSave: (q: Question) => void; onClose: () => void }) {
  const [form, setForm] = useState<Question>(question ?? {
    id: newId(),
    type: 'single',
    question: '',
    options: ['', '', '', ''],
    correct: [],
    points: 1,
    explanation: '',
  })

  const set = <K extends keyof Question>(k: K, v: Question[K]) => setForm(f => ({ ...f, [k]: v }))

  const setOption = (i: number, v: string) => {
    const opts = [...form.options]
    opts[i] = v
    set('options', opts)
  }

  const removeOption = (index: number) => {
    if (form.options.length <= 2) return
    const options = form.options.filter((_, i) => i !== index)
    const correct = form.correct
      .filter(i => i !== index)
      .map(i => i > index ? i - 1 : i)
    setForm(f => ({ ...f, options, correct }))
  }

  const toggleCorrect = (i: number) => {
    if (form.type === 'single' || form.type === 'truefalse') {
      set('correct', [i])
    } else {
      const next = form.correct.includes(i) ? form.correct.filter(x => x !== i) : [...form.correct, i]
      set('correct', next)
    }
  }

  const handleTypeChange = (t: QuestionType) => {
    const opts = t === 'truefalse' ? ['Үнэн', 'Худал'] : form.options.length >= 2 ? form.options : ['', '', '', '']
    setForm(f => ({ ...f, type: t, options: opts, correct: [] }))
  }

  const handleSave = () => {
    if (!form.question.trim() || form.correct.length === 0) return
    onSave(form)
    onClose()
  }

  const isTF = form.type === 'truefalse'
  const displayOpts = isTF ? ['Үнэн', 'Худал'] : form.options

  return (
    <Modal title={question ? 'Асуулт засах' : 'Шинэ асуулт нэмэх'} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Type selector */}
        <div>
          <label style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, color: 'rgba(241,245,249,0.4)', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>АСУУЛТЫН ТӨРӨЛ</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {([['single', 'Нэг сонголт'], ['multiple', 'Олон сонголт'], ['truefalse', 'Үнэн/Худал']] as [QuestionType, string][]).map(([t, label]) => (
              <button
                key={t}
                onClick={() => handleTypeChange(t)}
                style={{ flex: 1, fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, padding: '9px 6px', borderRadius: 10, border: `1.5px solid ${form.type === t ? '#1a56db' : 'rgba(255,255,255,0.08)'}`, background: form.type === t ? 'rgba(26,86,219,0.15)' : 'transparent', color: form.type === t ? '#60a5fa' : 'rgba(241,245,249,0.4)', cursor: 'pointer' }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, color: 'rgba(241,245,249,0.4)', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>АСУУЛТ</label>
          <textarea
            value={form.question}
            onChange={e => set('question', e.target.value)}
            rows={2}
            placeholder="Асуулт бичнэ үү..."
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', fontFamily: 'var(--font-sans)', fontSize: 14, color: '#f1f5f9', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, color: 'rgba(241,245,249,0.4)', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>
            ХАРИУЛТУУД {form.type === 'multiple' ? '(зөв хариултуудыг тэмдэглэнэ үү)' : '(зөв хариултыг тэмдэглэнэ үү)'}
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {displayOpts.map((opt, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  onClick={() => toggleCorrect(i)}
                  style={{ width: 30, height: 30, borderRadius: form.type === 'multiple' ? 8 : '50%', border: `1.5px solid ${form.correct.includes(i) ? '#16a34a' : 'rgba(255,255,255,0.15)'}`, background: form.correct.includes(i) ? 'rgba(22,163,74,0.2)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: form.correct.includes(i) ? '#4ade80' : 'rgba(241,245,249,0.3)', fontSize: 14, fontWeight: 700 }}
                >
                  {form.correct.includes(i) ? '✓' : ''}
                </button>
                {isTF ? (
                  <div style={{ flex: 1, padding: '8px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 9, fontFamily: 'var(--font-sans)', fontSize: 14, color: '#f1f5f9' }}>{opt}</div>
                ) : (
                  <>
                  <input
                    value={opt}
                    onChange={e => setOption(i, e.target.value)}
                    placeholder={`Хариулт ${String.fromCharCode(65 + i)}`}
                    style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, padding: '8px 12px', fontFamily: 'var(--font-sans)', fontSize: 14, color: '#f1f5f9', outline: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(i)}
                    disabled={form.options.length <= 2}
                    title={form.options.length <= 2 ? 'Дор хаяж 2 хариулт шаардлагатай' : 'Хариулт устгах'}
                    style={{ width: 34, height: 34, borderRadius: 9, border: '1px solid rgba(220,38,38,0.22)', background: 'rgba(220,38,38,0.08)', color: form.options.length <= 2 ? 'rgba(248,113,113,0.3)' : '#f87171', cursor: form.options.length <= 2 ? 'not-allowed' : 'pointer', fontSize: 18, lineHeight: 1, flexShrink: 0 }}
                  >
                    ×
                  </button>
                  </>
                )}
              </div>
            ))}
          </div>
          {!isTF && (
            <button
              onClick={() => set('options', [...form.options, ''])}
              style={{ marginTop: 8, fontFamily: 'var(--font-sans)', fontSize: 12, color: '#60a5fa', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}
            >
              + Хариулт нэмэх
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Inp label="ОНОО" value={form.points} onChange={v => set('points', Number(v))} type="number" />
          <Inp label="ТАЙЛБАР (заалт)" value={form.explanation ?? ''} onChange={v => set('explanation', v)} placeholder="Зөв хариултын тайлбар" />
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8, borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 16 }}>
          <button onClick={onClose} style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500, color: 'rgba(241,245,249,0.6)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 20px', cursor: 'pointer' }}>Цуцлах</button>
          <button
            onClick={handleSave}
            disabled={!form.question.trim() || form.correct.length === 0}
            style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, color: '#fff', background: form.question.trim() && form.correct.length > 0 ? 'linear-gradient(135deg,#1a56db,#7c3aed)' : 'rgba(26,86,219,0.25)', border: 'none', borderRadius: 10, padding: '10px 24px', cursor: form.question.trim() && form.correct.length > 0 ? 'pointer' : 'not-allowed' }}
          >
            Хадгалах
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ── Tabs ─────────────────────────────────────────────────────────────────────

function LessonsTab({ onRefresh }: { onRefresh: () => void }) {
  const [lessons, setLessons] = useState(store.getLessons())
  const [editing, setEditing] = useState<Lesson | null | undefined>(undefined)

  const refresh = () => { setLessons(store.getLessons()); onRefresh() }

  const handleDelete = (id: string) => {
    if (!confirm('Энэ хичээлийг устгах уу?')) return
    store.deleteLesson(id)
    refresh()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: '#f1f5f9', margin: 0, letterSpacing: '-0.01em' }}>Хичээлүүд</h2>
        <button
          onClick={() => setEditing(null)}
          style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: '#fff', background: 'linear-gradient(135deg,#1a56db,#7c3aed)', border: 'none', borderRadius: 999, padding: '9px 20px', cursor: 'pointer' }}
        >
          + Хичээл нэмэх
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {lessons.map(lesson => (
          <div key={lesson.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(26,86,219,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, color: '#60a5fa', flexShrink: 0 }}>
              {lesson.order}
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600, color: '#f1f5f9', marginBottom: 4 }}>{lesson.title}</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Badge color="blue">{lesson.videoDurationMinutes} мин</Badge>
                <Badge color="yellow">{lesson.questions.length} асуулт</Badge>
                <Badge color={lesson.requireFullWatch ? 'red' : 'gray'}>{lesson.requireFullWatch ? 'Бүтэн үзэх' : 'Чөлөөтэй'}</Badge>
                <Badge color="gray">Тэнцэх: {lesson.passingScore}%</Badge>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button onClick={() => setEditing(lesson)} style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 500, color: '#60a5fa', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, padding: '7px 14px', cursor: 'pointer' }}>Засах</button>
              <button onClick={() => handleDelete(lesson.id)} style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 500, color: '#f87171', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.15)', borderRadius: 8, padding: '7px 14px', cursor: 'pointer' }}>Устгах</button>
            </div>
          </div>
        ))}
      </div>

      {editing !== undefined && (
        <LessonEditor lesson={editing} onSave={refresh} onClose={() => setEditing(undefined)} />
      )}
    </div>
  )
}

function QuizzesTab() {
  const [lessons, setLessons] = useState(store.getLessons())
  const [selectedLessonId, setSelectedLessonId] = useState(lessons[0]?.id ?? '')
  const [editingQ, setEditingQ] = useState<Question | null | undefined>(undefined)

  const lesson = lessons.find(l => l.id === selectedLessonId)

  const refresh = () => setLessons(store.getLessons())

  const handleSaveQ = (q: Question) => {
    if (!lesson) return
    const idx = lesson.questions.findIndex(x => x.id === q.id)
    const updated: Lesson = {
      ...lesson,
      questions: idx >= 0
        ? lesson.questions.map(x => x.id === q.id ? q : x)
        : [...lesson.questions, q],
    }
    store.saveLesson(updated)
    refresh()
  }

  const handleDeleteQ = (qId: string) => {
    if (!lesson || !confirm('Энэ асуултыг устгах уу?')) return
    store.saveLesson({ ...lesson, questions: lesson.questions.filter(q => q.id !== qId) })
    refresh()
  }

  const TYPE_LABELS: Record<string, string> = { single: 'Нэг', multiple: 'Олон', truefalse: 'Үн/Худ' }
  const TYPE_COLORS: Record<string, string> = { single: 'blue', multiple: 'yellow', truefalse: 'green' }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: '#f1f5f9', margin: 0, letterSpacing: '-0.01em' }}>Асуулт</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <select
            value={selectedLessonId}
            onChange={e => setSelectedLessonId(e.target.value)}
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 14px', fontFamily: 'var(--font-sans)', fontSize: 13, color: '#f1f5f9', outline: 'none', cursor: 'pointer' }}
          >
            {lessons.map(l => <option key={l.id} value={l.id} style={{ background: '#151820' }}>{l.order}. {l.title}</option>)}
          </select>
          <button
            onClick={() => setEditingQ(null)}
            style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: '#fff', background: 'linear-gradient(135deg,#1a56db,#7c3aed)', border: 'none', borderRadius: 999, padding: '9px 20px', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            + Асуулт нэмэх
          </button>
        </div>
      </div>

      {lesson ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {lesson.questions.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(241,245,249,0.3)', fontFamily: 'var(--font-sans)', fontSize: 14 }}>
              Энэ хичээлд асуулт байхгүй байна. + товч дарж нэмнэ үү.
            </div>
          )}
          {lesson.questions.map((q, idx) => (
            <div key={q.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px 18px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 800, color: '#f59e0b', flexShrink: 0, marginTop: 2 }}>
                {idx + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, color: '#f1f5f9', marginBottom: 8, lineHeight: 1.45 }}>{q.question}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                  <Badge color={TYPE_COLORS[q.type]}>{TYPE_LABELS[q.type]}</Badge>
                  <Badge color="gray">{q.points} оноо</Badge>
                  <Badge color="green">{q.correct.length} зөв хариулт</Badge>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {q.options.map((o, i) => (
                    <span key={i} style={{ fontFamily: 'var(--font-sans)', fontSize: 12, padding: '3px 10px', borderRadius: 999, background: q.correct.includes(i) ? 'rgba(22,163,74,0.15)' : 'rgba(255,255,255,0.05)', color: q.correct.includes(i) ? '#4ade80' : 'rgba(241,245,249,0.4)', border: `1px solid ${q.correct.includes(i) ? 'rgba(22,163,74,0.25)' : 'rgba(255,255,255,0.06)'}` }}>
                      {q.correct.includes(i) ? '✓ ' : ''}{o}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button onClick={() => setEditingQ(q)} style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 500, color: '#60a5fa', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}>Засах</button>
                <button onClick={() => handleDeleteQ(q.id)} style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 500, color: '#f87171', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.15)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}>Устгах</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: 40, color: 'rgba(241,245,249,0.3)', fontFamily: 'var(--font-sans)' }}>Хичээл байхгүй байна.</div>
      )}

      {editingQ !== undefined && (
        <QuestionEditor question={editingQ} onSave={handleSaveQ} onClose={() => setEditingQ(undefined)} />
      )}
    </div>
  )
}

function UsersTab() {
  const [users, setUsers] = useState(store.getUsers())
  const [loadingUsers, setLoadingUsers] = useState(true)
  const lessons = store.getLessons()
  const [addingUser, setAddingUser] = useState(false)
  const [newUser, setNewUser] = useState({ name: '', email: '', department: '', password: 'user123' })

  const refresh = () => {
    setLoadingUsers(true)
    store.getUsersWithProgress().then(u => { setUsers(u); setLoadingUsers(false) })
  }

  useEffect(() => { refresh() }, [])

  const handleAdd = () => {
    if (!newUser.name || !newUser.email) return
    store.addUser({
      id: newId(),
      name: newUser.name,
      email: newUser.email,
      password: newUser.password || 'user123',
      role: 'user',
      department: newUser.department,
      startDate: new Date().toISOString().slice(0, 10),
      progress: [],
    })
    setNewUser({ name: '', email: '', department: '', password: 'user123' })
    setAddingUser(false)
    refresh()
  }

  const totalPts = (user: User) => {
    let s = 0, t = 0
    for (const p of user.progress) {
      if (p.quizAttempt) { s += p.quizAttempt.score; t += p.quizAttempt.totalPoints }
    }
    return t > 0 ? Math.round((s / t) * 100) : null
  }

  const completedCount = (user: User) => user.progress.filter(p => p.quizAttempt?.passed).length

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: '#f1f5f9', margin: 0, letterSpacing: '-0.01em' }}>Ажилтнууд</h2>
        <button onClick={() => setAddingUser(true)} style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: '#fff', background: 'linear-gradient(135deg,#1a56db,#7c3aed)', border: 'none', borderRadius: 999, padding: '9px 20px', cursor: 'pointer' }}>
          + Ажилтан нэмэх
        </button>
      </div>

      {loadingUsers && (
        <div style={{ textAlign: 'center', padding: '16px', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'rgba(241,245,249,0.35)', marginBottom: 12 }}>
          Supabase-аас мэдээлэл татаж байна...
        </div>
      )}
      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Нийт ажилтан', value: users.length, color: '#60a5fa' },
          { label: 'Дууссан', value: users.filter(u => completedCount(u) === lessons.length).length, color: '#4ade80' },
          { label: 'Явцтай', value: users.filter(u => completedCount(u) > 0 && completedCount(u) < lessons.length).length, color: '#fbbf24' },
          { label: 'Эхлээгүй', value: users.filter(u => completedCount(u) === 0).length, color: 'rgba(241,245,249,0.4)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px 18px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, color: s.color, lineHeight: 1, marginBottom: 6 }}>{s.value}</div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'rgba(241,245,249,0.4)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Users table */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr repeat(3, 40px) 80px 80px', gap: 0, padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)' }}>
          {['НЭР', 'ХЭЛТЭС', 'ЭХЭЛСЭН ОГНОО', '1', '2', '3', 'ОНОО', ''].map((h, i) => (
            <div key={i} style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, color: 'rgba(241,245,249,0.35)', letterSpacing: '0.08em', textAlign: i >= 3 ? 'center' : 'left' }}>{h}</div>
          ))}
        </div>

        {users.map((user, idx) => {
          const pct = totalPts(user)
          const done = completedCount(user)
          return (
            <div key={user.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr repeat(3, 40px) 80px 80px', gap: 0, padding: '14px 16px', borderBottom: idx < users.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>{user.name}</div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'rgba(241,245,249,0.35)' }}>{user.email}</div>
              </div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'rgba(241,245,249,0.55)' }}>{user.department || '—'}</div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'rgba(241,245,249,0.4)' }}>{user.startDate}</div>
              {lessons.map(l => {
                const p = user.progress.find(pr => pr.lessonId === l.id)
                const pass = p?.quizAttempt?.passed
                return (
                  <div key={l.id} style={{ textAlign: 'center', fontSize: 16 }}>
                    {pass ? '✅' : p?.videoCompleted ? '▶️' : '⬜'}
                  </div>
                )
              })}
              <div style={{ textAlign: 'center' }}>
                {pct !== null ? (
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 700, color: pct >= 75 ? '#4ade80' : '#f87171' }}>
                    {pct}%
                  </span>
                ) : <span style={{ color: 'rgba(241,245,249,0.25)', fontSize: 13 }}>—</span>}
              </div>
              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={() => { if (confirm(`${user.name}-ийг устгах уу?`)) { store.deleteUser(user.id); refresh() } }}
                  style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#f87171', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.15)', borderRadius: 6, padding: '5px 10px', cursor: 'pointer' }}
                >
                  Устгах
                </button>
              </div>
            </div>
          )
        })}

        {users.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px', color: 'rgba(241,245,249,0.3)', fontFamily: 'var(--font-sans)', fontSize: 14 }}>
            Ажилтан бүртгэгдээгүй байна.
          </div>
        )}
      </div>

      {addingUser && (
        <Modal title="Шинэ ажилтан нэмэх" onClose={() => setAddingUser(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Inp label="НЭР" value={newUser.name} onChange={v => setNewUser(u => ({ ...u, name: v }))} placeholder="Нэр овог" />
            <Inp label="И-МЭЙЛ" value={newUser.email} onChange={v => setNewUser(u => ({ ...u, email: v }))} placeholder="email@mak.mn" type="email" />
            <Inp label="ХЭЛТЭС" value={newUser.department} onChange={v => setNewUser(u => ({ ...u, department: v }))} placeholder="Маркетинг, Санхүү..." />
            <Inp label="НУУЦ ҮГ" value={newUser.password} onChange={v => setNewUser(u => ({ ...u, password: v }))} placeholder="user123" />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8, borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 16 }}>
              <button onClick={() => setAddingUser(false)} style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500, color: 'rgba(241,245,249,0.6)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 20px', cursor: 'pointer' }}>Цуцлах</button>
              <button onClick={handleAdd} style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, color: '#fff', background: 'linear-gradient(135deg,#1a56db,#7c3aed)', border: 'none', borderRadius: 10, padding: '10px 24px', cursor: 'pointer' }}>Нэмэх</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ── Admin Panel Shell ────────────────────────────────────────────────────────

export default function AdminPanel({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<AdminTab>('lessons')
  const [refresh, setRefresh] = useState(0)

  const TABS: { key: AdminTab; label: string; icon: string }[] = [
    { key: 'lessons', label: 'Хичээл', icon: '🎬' },
    { key: 'quizzes', label: 'Асуулт', icon: '📝' },
    { key: 'users', label: 'Ажилтнууд', icon: '👥' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '0 28px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(15,17,23,0.95)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>⚙️</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
            &quot;Монголын Алт&quot; МАК <span style={{ color: '#3b82f6' }}>ХХК</span> — Админ
          </span>
        </div>
        <button
          onClick={onLogout}
          style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500, color: 'rgba(241,245,249,0.5)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 999, padding: '6px 16px', cursor: 'pointer' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(241,245,249,0.5)')}
        >
          Гарах
        </button>
      </header>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <aside style={{ width: 220, borderRight: '1px solid rgba(255,255,255,0.07)', padding: '20px 16px', flexShrink: 0, background: 'rgba(255,255,255,0.01)' }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, color: 'rgba(241,245,249,0.3)', letterSpacing: '0.1em', marginBottom: 12, paddingLeft: 8 }}>ЦЭС</div>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', borderRadius: 12, border: 'none', background: tab === t.key ? 'rgba(26,86,219,0.15)' : 'transparent', color: tab === t.key ? '#60a5fa' : 'rgba(241,245,249,0.55)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: tab === t.key ? 600 : 400, textAlign: 'left', marginBottom: 4, transition: 'all 0.2s' }}
              onMouseEnter={e => { if (tab !== t.key) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
              onMouseLeave={e => { if (tab !== t.key) e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{ fontSize: 16 }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </aside>

        {/* Content */}
        <main key={refresh} style={{ flex: 1, padding: '28px 32px', minWidth: 0, overflowY: 'auto' }}>
          {tab === 'lessons' && <LessonsTab onRefresh={() => setRefresh(r => r + 1)} />}
          {tab === 'quizzes' && <QuizzesTab />}
          {tab === 'users' && <UsersTab />}
        </main>
      </div>
    </div>
  )
}
