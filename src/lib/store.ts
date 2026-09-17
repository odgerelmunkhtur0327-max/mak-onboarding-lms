import { sb } from './supabase'
import type { Lesson, User, UserProgress, QuizAttempt } from '../types'

// ── Session (only the user ID persisted locally) ──────────────────────────────
const SESSION_KEY = 'mak_uid'
function getSession(): string | null {
  try { return localStorage.getItem(SESSION_KEY) } catch { return null }
}
function setSession(id: string) {
  try { localStorage.setItem(SESSION_KEY, id) } catch {}
}
function clearSession() {
  try { localStorage.removeItem(SESSION_KEY) } catch {}
}
let _currentUserId: string | null = getSession()
let _currentUser: User | null = null

// In-memory caches for synchronous reads
let _lessons: Lesson[] = []
let _users: User[] = []

// ── Default seed data ─────────────────────────────────────────────────────────
const DEFAULT_LESSONS: Lesson[] = [
  {
    id: 'lesson-1', order: 1,
    title: '"Монголын Алт" МАК ХХК-ийн Эрхэм Зорилго ба Үнэт Зүйлс',
    description: 'Компанийн түүх, эрхэм зорилго, үнэт зүйлс болон байгууллагын соёлын талаар суралцана.',
    videoUrl: '', videoDurationMinutes: 12, requireFullWatch: true, passingScore: 85,
    questions: [
      { id: 'l1q1', type: 'single', question: '"Монголын Алт" МАК ХХК хэдэн онд байгуулагдсан бэ?', options: ['2000 он', '2003 он', '2005 он', '2010 он'], correct: [2], points: 1, explanation: '"Монголын Алт" МАК ХХК 2005 онд үүсгэн байгуулагдсан.' },
      { id: 'l1q2', type: 'single', question: '"Монголын Алт" МАК ХХК-ийн эрхэм зорилго аль нь вэ?', options: ['Ашгаа нэмэгдүүлэх', 'Хэрэглэгчдийн амьдралыг дэлгэрүүлэх', 'Зах зээлд нэгдүгээр байр эзэлэх', 'Олон улсад тэлэх'], correct: [1], points: 1, explanation: 'Манай эрхэм зорилго бол хэрэглэгчдийн амьдралыг дэлгэрүүлэх явдал.' },
      { id: 'l1q3', type: 'multiple', question: 'МАК-ийн үнэт зүйлсэд аль аль нь багтдаг вэ? (бүгдийг сонгоно уу)', options: ['Шударга байдал', 'Хамтын ажиллагаа', 'Өрсөлдөөн', 'Инноваци', 'Хариуцлага'], correct: [0, 1, 3, 4], points: 2, explanation: 'Өрсөлдөөн нь МАК-ийн үнэт зүйлсэд ордоггүй.' },
      { id: 'l1q4', type: 'truefalse', question: 'МАК-д алдаанаас суралцах нь ухрал гэж үздэг.', options: ['Үнэн', 'Худал'], correct: [1], points: 1, explanation: 'МАК-д алдаанаас суралцах нь өсөлт гэж үздэг, ухрал биш.' },
      { id: 'l1q5', type: 'single', question: '"Монголын Алт" МАК ХХК хэдэн ажилтантай вэ?', options: ['100 гаруй', '300 гаруй', '500 гаруй', '1000 гаруй'], correct: [2], points: 1, explanation: '"Монголын Алт" МАК ХХК 500 гаруй ажилтантай.' },
    ],
  },
  {
    id: 'lesson-2', order: 2,
    title: 'Ажлын Дүрэм, Журам ба Ёс Зүй',
    description: 'Ажлын цаг, ирц, чөлөөний журам болон байгууллагын ёс зүйн хэм хэмжээг судалдаг.',
    videoUrl: '', videoDurationMinutes: 15, requireFullWatch: true, passingScore: 85,
    questions: [
      { id: 'l2q1', type: 'single', question: 'МАК-ийн ажлын цаг хэд вэ?', options: ['08:00–17:00', '09:00–18:00', '08:30–17:30', '09:30–18:30'], correct: [1], points: 1, explanation: 'Ажлын цаг 09:00–18:00.' },
      { id: 'l2q2', type: 'single', question: 'Жилийн ээлжийн амралт хэдэн өдөр вэ?', options: ['10 өдөр', '12 өдөр', '15 өдөр', '20 өдөр'], correct: [2], points: 1, explanation: 'Жилийн ээлжийн амралт 15 ажлын өдөр.' },
      { id: 'l2q3', type: 'truefalse', question: 'Компанийн дотоод мэдээллийг нийгмийн сүлжээнд нийтлэж болно.', options: ['Үнэн', 'Худал'], correct: [1], points: 1, explanation: 'Компанийн дотоод мэдээллийг гадагшлуулахыг хатуу хориглоно.' },
      { id: 'l2q4', type: 'single', question: 'Яаралтай чөлөөний үед яах вэ?', options: ['HR системд оруулна', 'Шууд удирдлагад утсаар мэдэгдэнэ', 'Мессежээр явуулна', 'Дараа нь тайлбарлана'], correct: [1], points: 1, explanation: 'Яаралтай тохиолдолд шууд удирдлагад утсаар мэдэгдэнэ.' },
      { id: 'l2q5', type: 'multiple', question: 'Нууцлалын зөрчилд аль аль нь хамаарах вэ?', options: ['Хэрэглэгчийн мэдээлэл гадагшлуулах', 'Ажлын тайлан найздаа илгээх', 'Компанийн стратеги задруулах', 'Ажлын цагаа бүртгүүлэх'], correct: [0, 1, 2], points: 2, explanation: 'Ажлын цагаа бүртгүүлэх нь нууцлалын зөрчил биш.' },
    ],
  },
  {
    id: 'lesson-3', order: 3,
    title: 'Дотоод Систем ба Хэрэглэгчийн Үйлчилгээ',
    description: 'MAK-ERP систем, харилцааны хэрэгслүүд болон хэрэглэгчийн үйлчилгээний стандартыг судалдаг.',
    videoUrl: '', videoDurationMinutes: 10, requireFullWatch: false, passingScore: 85,
    questions: [
      { id: 'l3q1', type: 'single', question: 'МАК-ийн корпорат харилцааны гол хэрэгсэл аль нь вэ?', options: ['Slack', 'WhatsApp', 'Microsoft Teams', 'Telegram'], correct: [2], points: 1, explanation: 'Корпорат харилцааны гол хэрэгсэл Microsoft Teams.' },
      { id: 'l3q2', type: 'single', question: 'IT асуудалд яаж хандах вэ?', options: ['Өөрсдөө засна', 'helpdesk@mak.mn эсвэл дотоод 1100', 'Удирдлагад хэлнэ', 'Компьютерыг унтрааж дахин асаана'], correct: [1], points: 1, explanation: 'IT асуудалд helpdesk@mak.mn эсвэл дотоод 1100-д хандана.' },
      { id: 'l3q3', type: 'single', question: 'Хэрэглэгчийн гомдолд хэдэн цагийн дотор хариу өгөх вэ?', options: ['30 минут', '1 цаг', '2 цаг', '24 цаг'], correct: [2], points: 1, explanation: 'Хэрэглэгчийн гомдолд 2 цагийн дотор хариу өгнө.' },
      { id: 'l3q4', type: 'truefalse', question: 'Ажлын цагаас гадуур Teams-д хариулах үүрэгтэй.', options: ['Үнэн', 'Худал'], correct: [1], points: 1, explanation: 'Ажлын цагаас гадуур Teams-д хариулах үүрэг байхгүй.' },
      { id: 'l3q5', type: 'single', question: 'Жилд хэдэн цагийн сургалтын эрх олгодог вэ?', options: ['20 цаг', '30 цаг', '40 цаг', '60 цаг'], correct: [2], points: 1, explanation: 'Жилд 40 цагийн сургалтын эрх олгодог.' },
    ],
  },
]

const DEFAULT_USERS = [
  { id: 'admin-seed-1', name: 'Системийн Администратор', email: 'admin@mak.mn', password: 'admin123', role: 'admin' as const, department: 'IT', startDate: '2023-01-01' },
  { id: 'user-seed-1', name: 'Батболд Нарантуяа', email: 'user@mak.mn', password: 'user123', role: 'user' as const, department: 'Маркетинг', startDate: new Date().toISOString().slice(0, 10) },
]

// ── Password hashing (SHA-256 via Web Crypto API) ─────────────────────────────
async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// ── DB row → frontend shape converters ───────────────────────────────────────
function mapProgress(p: any): UserProgress {
  return {
    lessonId: p.course_id,
    videoCompleted: p.video_completed,
    quizAttempt: p.passed !== null ? {
      answers: p.quiz_answers ?? {},
      score: p.score ?? 0,
      totalPoints: p.total_points ?? 0,
      passed: p.passed,
      completedAt: p.completed_at ?? new Date().toISOString(),
    } : null,
  }
}

function mapUser(u: any, progress: UserProgress[] = []): User {
  return {
    id: u.id,
    name: u.full_name,
    email: u.email,
    password: '',
    role: u.role === 'admin' ? 'admin' : 'user',
    department: u.department,
    startDate: u.start_date,
    progress,
  }
}

function mapLesson(c: any, questions: any[], options: any[]): Lesson {
  const qs = questions.filter(q => q.course_id === c.id)
  return {
    id: c.id,
    order: c.sort_order,
    title: c.title,
    description: c.description,
    videoUrl: c.video_url,
    videoDurationMinutes: c.video_duration_minutes,
    requireFullWatch: c.require_full_watch,
    passingScore: c.passing_score,
    questions: qs.map(q => {
      const opts = options.filter(o => o.question_id === q.id).sort((a: any, b: any) => a.sort_order - b.sort_order)
      return {
        id: q.id, type: q.question_type, question: q.question_text,
        options: opts.map((o: any) => o.option_text),
        correct: q.correct_option_indexes, points: q.points,
        explanation: q.explanation ?? undefined,
      }
    }),
  }
}

// ── Supabase fetch helpers ────────────────────────────────────────────────────
async function fetchLessonsFromDB(): Promise<Lesson[]> {
  const { data: courses, error } = await sb.from('courses').select('*').order('sort_order')
  if (error) throw error
  if (!courses?.length) return []

  const courseIds = courses.map((c: any) => c.id)
  const { data: questions } = await sb.from('questions').select('*').in('course_id', courseIds).order('sort_order')
  const questionIds = (questions ?? []).map((q: any) => q.id)
  const { data: options } = questionIds.length
    ? await sb.from('question_options').select('*').in('question_id', questionIds).order('sort_order')
    : { data: [] }

  return courses.map((c: any) => mapLesson(c, questions ?? [], options ?? []))
}

async function upsertLessonToDB(lesson: Lesson): Promise<void> {
  const { error: ce } = await sb.from('courses').upsert({
    id: lesson.id, sort_order: lesson.order, title: lesson.title,
    description: lesson.description ?? '', video_url: lesson.videoUrl ?? '',
    video_duration_minutes: lesson.videoDurationMinutes ?? 0,
    require_full_watch: lesson.requireFullWatch ?? true,
    passing_score: Math.max(85, lesson.passingScore ?? 85),
    updated_at: new Date().toISOString(),
  })
  if (ce) throw ce

  await sb.from('questions').delete().eq('course_id', lesson.id)

  if (lesson.questions.length > 0) {
    const { error: qe } = await sb.from('questions').insert(
      lesson.questions.map((q, i) => ({
        id: q.id, course_id: lesson.id, sort_order: i, question_type: q.type,
        question_text: q.question, correct_option_indexes: q.correct,
        points: q.points ?? 1, explanation: q.explanation ?? null,
      }))
    )
    if (qe) throw qe

    const optRows = lesson.questions.flatMap(q =>
      q.options.map((text, i) => ({ question_id: q.id, sort_order: i, option_text: text }))
    )
    if (optRows.length) {
      const { error: oe } = await sb.from('question_options').insert(optRows)
      if (oe) throw oe
    }
  }
}

// ── DB readiness flag ────────────────────────────────────────────────────────
export let dbReady = false

// ── Store ─────────────────────────────────────────────────────────────────────
export const store = {

  async init(): Promise<void> {
    try {
      // Load lessons — if this succeeds, Supabase is accessible
      const lessons = await fetchLessonsFromDB()
      dbReady = true
      if (lessons.length === 0) {
        for (const l of DEFAULT_LESSONS) await upsertLessonToDB(l)
        _lessons = [...DEFAULT_LESSONS]
      } else {
        _lessons = lessons
      }
    } catch {
      dbReady = false
      _lessons = [...DEFAULT_LESSONS]
    }

    try {
      // Seed default users if table is empty
      const { count } = await sb.from('users').select('id', { count: 'exact', head: true })
      if (!count) {
        for (const u of DEFAULT_USERS) {
          const hash = await sha256(u.password)
          await sb.from('users').upsert({
            id: u.id, email: u.email.toLowerCase(), full_name: u.name,
            password_hash: hash, role: u.role === 'admin' ? 'admin' : 'employee',
            department: u.department, start_date: u.startDate,
          })
        }
      }
    } catch {}

    // Restore session
    try {
      if (_currentUserId) {
        _currentUser = await this._fetchUser(_currentUserId)
        if (!_currentUser) {
          _currentUserId = null
          clearSession()
        }
      }
    } catch {
      _currentUserId = null
      clearSession()
    }
  },

  async _fetchUser(userId: string): Promise<User | null> {
    const { data: u } = await sb.from('users').select('*').eq('id', userId).maybeSingle()
    if (!u) return null
    const { data: prog } = await sb.from('user_progress').select('*').eq('user_id', userId)
    return mapUser(u, (prog ?? []).map(mapProgress))
  },

  // ── Auth ────────────────────────────────────────────────────────────────────
  async loginAsync(email: string, password: string): Promise<User | null> {
    try {
      const { data: u } = await sb.from('users').select('*').eq('email', email.trim().toLowerCase()).maybeSingle()
      if (!u) return null
      const hash = await sha256(password)
      if (u.password_hash !== hash && u.password_hash !== password) return null
      const { data: prog } = await sb.from('user_progress').select('*').eq('user_id', u.id)
      const user = mapUser(u, (prog ?? []).map(mapProgress))
      _currentUserId = u.id
      _currentUser = user
      setSession(u.id)
      return user
    } catch (e) {
      console.error('loginAsync:', e)
      return null
    }
  },

  logout() {
    _currentUserId = null
    _currentUser = null
    clearSession()
  },

  currentUser(): User | null { return _currentUser },

  // ── Lessons ─────────────────────────────────────────────────────────────────
  getLessons(): Lesson[] {
    return [..._lessons].map(l => ({ ...l, passingScore: Math.max(85, l.passingScore) })).sort((a, b) => a.order - b.order)
  },

  async saveLesson(lesson: Lesson): Promise<void> {
    lesson = { ...lesson, passingScore: Math.max(85, lesson.passingScore) }
    try { await upsertLessonToDB(lesson) } catch (e) { console.error('saveLesson:', e) }
    const idx = _lessons.findIndex(l => l.id === lesson.id)
    if (idx >= 0) _lessons[idx] = lesson
    else _lessons.push(lesson)
  },

  async deleteLesson(id: string): Promise<void> {
    try {
      await sb.from('questions').delete().eq('course_id', id)
      await sb.from('courses').delete().eq('id', id)
    } catch (e) { console.error('deleteLesson:', e) }
    _lessons = _lessons.filter(l => l.id !== id)
  },

  // ── Progress ────────────────────────────────────────────────────────────────
  getUserProgress(userId: string, lessonId: string): UserProgress | undefined {
    return _currentUser?.progress.find(p => p.lessonId === lessonId)
  },

  async markVideoCompleted(userId: string, lessonId: string): Promise<void> {
    try {
      const { data: existing } = await sb.from('user_progress').select('*').eq('user_id', userId).eq('course_id', lessonId).maybeSingle()
      await sb.from('user_progress').upsert({
        user_id: userId, course_id: lessonId, video_completed: true,
        quiz_answers: existing?.quiz_answers ?? null,
        score: existing?.score ?? null, total_points: existing?.total_points ?? null,
        passed: existing?.passed ?? null, completed_at: existing?.completed_at ?? null,
        updated_at: new Date().toISOString(),
      })
    } catch (e) { console.error('markVideoCompleted:', e) }
    if (_currentUser?.id === userId) {
      let p = _currentUser.progress.find(p => p.lessonId === lessonId)
      if (!p) { p = { lessonId, videoCompleted: false, quizAttempt: null }; _currentUser.progress.push(p) }
      p.videoCompleted = true
    }
  },

  async saveQuizAttempt(userId: string, lessonId: string, attempt: QuizAttempt): Promise<void> {
    try {
      const { data: existing } = await sb.from('user_progress').select('video_completed').eq('user_id', userId).eq('course_id', lessonId).maybeSingle()
      await sb.from('user_progress').upsert({
        user_id: userId, course_id: lessonId,
        video_completed: existing?.video_completed ?? true,
        quiz_answers: attempt.answers ?? {}, score: attempt.score ?? 0,
        total_points: attempt.totalPoints ?? 0, passed: attempt.passed ?? false,
        completed_at: attempt.completedAt ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    } catch (e) { console.error('saveQuizAttempt:', e) }
    if (_currentUser?.id === userId) {
      let p = _currentUser.progress.find(p => p.lessonId === lessonId)
      if (!p) { p = { lessonId, videoCompleted: true, quizAttempt: null }; _currentUser.progress.push(p) }
      p.quizAttempt = attempt
    }
  },

  // ── Users (admin) ───────────────────────────────────────────────────────────
  getUsers(): User[] {
    return _users.filter(u => u.role === 'user')
  },

  async getUsersWithProgress(): Promise<User[]> {
    try {
      const { data: users, error } = await sb.from('users').select('*').order('created_at')
      if (error) throw error
      const { data: allProg } = await sb.from('user_progress').select('*')
      const byUser: Record<string, UserProgress[]> = {}
      for (const p of allProg ?? []) {
        if (!byUser[p.user_id]) byUser[p.user_id] = []
        byUser[p.user_id].push(mapProgress(p))
      }
      _users = (users ?? []).map((u: any) => mapUser(u, byUser[u.id] ?? []))
    } catch (e) { console.error('getUsersWithProgress:', e) }
    return _users.filter(u => u.role === 'user')
  },

  async addUser(user: User): Promise<void> {
    try {
      const hash = await sha256(user.password || 'user123')
      await sb.from('users').upsert({
        id: user.id, email: user.email.trim().toLowerCase(), full_name: user.name,
        password_hash: hash, role: user.role === 'admin' ? 'admin' : 'employee',
        department: user.department ?? '', start_date: user.startDate ?? new Date().toISOString().slice(0, 10),
        updated_at: new Date().toISOString(),
      })
    } catch (e) { console.error('addUser:', e) }
    const fresh = { ...user, progress: [] }
    const idx = _users.findIndex(u => u.id === fresh.id || u.email.toLowerCase() === fresh.email.toLowerCase())
    if (idx >= 0) _users[idx] = fresh
    else _users.push(fresh)
  },

  async deleteUser(id: string): Promise<void> {
    try { await sb.from('users').delete().eq('id', id) } catch (e) { console.error('deleteUser:', e) }
    _users = _users.filter(u => u.id !== id)
  },
}
