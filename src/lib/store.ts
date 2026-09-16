import type { Lesson, User, UserProgress, QuizAttempt } from '../types'
import { api } from './api'

const KEY = 'mak_lms'

const DEFAULT_LESSONS: Lesson[] = [
  {
    id: 'lesson-1',
    order: 1,
    title: '"Монголын Алт" МАК ХХК-ийн Эрхэм Зорилго ба Үнэт Зүйлс',
    description: 'Компанийн түүх, эрхэм зорилго, үнэт зүйлс болон байгууллагын соёлын талаар суралцана.',
    videoUrl: '',
    videoDurationMinutes: 12,
    requireFullWatch: true,
    passingScore: 85,
    questions: [
      {
        id: 'l1q1',
        type: 'single',
        question: '"Монголын Алт" МАК ХХК хэдэн онд байгуулагдсан бэ?',
        options: ['2000 он', '2003 он', '2005 он', '2010 он'],
        correct: [2],
        points: 1,
        explanation: '"Монголын Алт" МАК ХХК 2005 онд үүсгэн байгуулагдсан.',
      },
      {
        id: 'l1q2',
        type: 'single',
        question: '"Монголын Алт" МАК ХХК-ийн эрхэм зорилго аль нь вэ?',
        options: [
          'Ашгаа нэмэгдүүлэх',
          'Хэрэглэгчдийн амьдралыг дэлгэрүүлэх',
          'Зах зээлд нэгдүгээр байр эзэлэх',
          'Олон улсад тэлэх',
        ],
        correct: [1],
        points: 1,
        explanation: 'Манай эрхэм зорилго бол хэрэглэгчдийн амьдралыг дэлгэрүүлэх явдал.',
      },
      {
        id: 'l1q3',
        type: 'multiple',
        question: 'МАК-ийн үнэт зүйлсэд аль аль нь багтдаг вэ? (бүгдийг сонгоно уу)',
        options: ['Шударга байдал', 'Хамтын ажиллагаа', 'Өрсөлдөөн', 'Инноваци', 'Хариуцлага'],
        correct: [0, 1, 3, 4],
        points: 2,
        explanation: 'Өрсөлдөөн нь МАК-ийн үнэт зүйлсэд ордоггүй.',
      },
      {
        id: 'l1q4',
        type: 'truefalse',
        question: 'МАК-д алдаанаас суралцах нь ухрал гэж үздэг.',
        options: ['Үнэн', 'Худал'],
        correct: [1],
        points: 1,
        explanation: 'МАК-д алдаанаас суралцах нь өсөлт гэж үздэг, ухрал биш.',
      },
      {
        id: 'l1q5',
        type: 'single',
        question: '"Монголын Алт" МАК ХХК хэдэн ажилтантай вэ?',
        options: ['100 гаруй', '300 гаруй', '500 гаруй', '1000 гаруй'],
        correct: [2],
        points: 1,
        explanation: '"Монголын Алт" МАК ХХК 500 гаруй ажилтантай.',
      },
    ],
  },
  {
    id: 'lesson-2',
    order: 2,
    title: 'Ажлын Дүрэм, Журам ба Ёс Зүй',
    description: 'Ажлын цаг, ирц, чөлөөний журам болон байгууллагын ёс зүйн хэм хэмжээг судалдаг.',
    videoUrl: '',
    videoDurationMinutes: 15,
    requireFullWatch: true,
    passingScore: 85,
    questions: [
      {
        id: 'l2q1',
        type: 'single',
        question: 'МАК-ийн ажлын цаг хэд вэ?',
        options: ['08:00–17:00', '09:00–18:00', '08:30–17:30', '09:30–18:30'],
        correct: [1],
        points: 1,
        explanation: 'Ажлын цаг 09:00–18:00.',
      },
      {
        id: 'l2q2',
        type: 'single',
        question: 'Жилийн ээлжийн амралт хэдэн өдөр вэ?',
        options: ['10 өдөр', '12 өдөр', '15 өдөр', '20 өдөр'],
        correct: [2],
        points: 1,
        explanation: 'Жилийн ээлжийн амралт 15 ажлын өдөр.',
      },
      {
        id: 'l2q3',
        type: 'truefalse',
        question: 'Компанийн дотоод мэдээллийг нийгмийн сүлжээнд нийтлэж болно.',
        options: ['Үнэн', 'Худал'],
        correct: [1],
        points: 1,
        explanation: 'Компанийн дотоод мэдээллийг гадагшлуулахыг хатуу хориглоно.',
      },
      {
        id: 'l2q4',
        type: 'single',
        question: 'Яаралтай чөлөөний үед яах вэ?',
        options: ['HR системд оруулна', 'Шууд удирдлагад утсаар мэдэгдэнэ', 'Мессежээр явуулна', 'Дараа нь тайлбарлана'],
        correct: [1],
        points: 1,
        explanation: 'Яаралтай тохиолдолд шууд удирдлагад утсаар мэдэгдэнэ.',
      },
      {
        id: 'l2q5',
        type: 'multiple',
        question: 'Нууцлалын зөрчилд аль аль нь хамаарах вэ?',
        options: [
          'Хэрэглэгчийн мэдээлэл гадагшлуулах',
          'Ажлын тайлан найздаа илгээх',
          'Компанийн стратеги задруулах',
          'Ажлын цагаа бүртгүүлэх',
        ],
        correct: [0, 1, 2],
        points: 2,
        explanation: 'Ажлын цагаа бүртгүүлэх нь нууцлалын зөрчил биш.',
      },
    ],
  },
  {
    id: 'lesson-3',
    order: 3,
    title: 'Дотоод Систем ба Хэрэглэгчийн Үйлчилгээ',
    description: 'MAK-ERP систем, харилцааны хэрэгслүүд болон хэрэглэгчийн үйлчилгээний стандартыг судалдаг.',
    videoUrl: '',
    videoDurationMinutes: 10,
    requireFullWatch: false,
    passingScore: 85,
    questions: [
      {
        id: 'l3q1',
        type: 'single',
        question: 'МАК-ийн корпорат харилцааны гол хэрэгсэл аль нь вэ?',
        options: ['Slack', 'WhatsApp', 'Microsoft Teams', 'Telegram'],
        correct: [2],
        points: 1,
        explanation: 'Корпорат харилцааны гол хэрэгсэл Microsoft Teams.',
      },
      {
        id: 'l3q2',
        type: 'single',
        question: 'IT асуудалд яаж хандах вэ?',
        options: [
          'Өөрсдөө засна',
          'helpdesk@mak.mn эсвэл дотоод 1100',
          'Удирдлагад хэлнэ',
          'Компьютерыг унтрааж дахин асаана',
        ],
        correct: [1],
        points: 1,
        explanation: 'IT асуудалд helpdesk@mak.mn эсвэл дотоод 1100-д хандана.',
      },
      {
        id: 'l3q3',
        type: 'single',
        question: 'Хэрэглэгчийн гомдолд хэдэн цагийн дотор хариу өгөх вэ?',
        options: ['30 минут', '1 цаг', '2 цаг', '24 цаг'],
        correct: [2],
        points: 1,
        explanation: 'Хэрэглэгчийн гомдолд 2 цагийн дотор хариу өгнө.',
      },
      {
        id: 'l3q4',
        type: 'truefalse',
        question: 'Ажлын цагаас гадуур Teams-д хариулах үүрэгтэй.',
        options: ['Үнэн', 'Худал'],
        correct: [1],
        points: 1,
        explanation: 'Ажлын цагаас гадуур Teams-д хариулах үүрэг байхгүй.',
      },
      {
        id: 'l3q5',
        type: 'single',
        question: 'Жилд хэдэн цагийн сургалтын эрх олгодог вэ?',
        options: ['20 цаг', '30 цаг', '40 цаг', '60 цаг'],
        correct: [2],
        points: 1,
        explanation: 'Жилд 40 цагийн сургалтын эрх олгодог.',
      },
    ],
  },
]

const DEFAULT_USERS: User[] = [
  {
    id: 'admin-1',
    name: 'Системийн Администратор',
    email: 'admin@mak.mn',
    password: 'admin123',
    role: 'admin',
    department: 'IT',
    startDate: '2023-01-01',
    progress: [],
  },
  {
    id: 'user-1',
    name: 'Батболд Нарантуяа',
    email: 'user@mak.mn',
    password: 'user123',
    role: 'user',
    department: 'Маркетинг',
    startDate: new Date().toISOString().slice(0, 10),
    progress: [],
  },
  {
    id: 'user-2',
    name: 'Анхзаяа Дорж',
    email: 'ankhzaya@mak.mn',
    password: 'user123',
    role: 'user',
    department: 'Санхүү',
    startDate: '2024-11-15',
    progress: [
      {
        lessonId: 'lesson-1',
        videoCompleted: true,
        quizAttempt: {
          answers: { l1q1: [2], l1q2: [1], l1q3: [0, 1, 3, 4], l1q4: [1], l1q5: [2] },
          score: 6,
          totalPoints: 6,
          passed: true,
          completedAt: '2024-11-16T09:30:00Z',
        },
      },
      {
        lessonId: 'lesson-2',
        videoCompleted: true,
        quizAttempt: {
          answers: { l2q1: [1], l2q2: [2], l2q3: [1], l2q4: [1], l2q5: [0, 2] },
          score: 5,
          totalPoints: 6,
          passed: true,
          completedAt: '2024-11-16T11:00:00Z',
        },
      },
    ],
  },
]

type StoreData = {
  lessons: Lesson[]
  users: User[]
  currentUserId: string | null
}

function load(): StoreData {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { lessons: DEFAULT_LESSONS, users: DEFAULT_USERS, currentUserId: null }
}

function save(data: StoreData) {
  localStorage.setItem(KEY, JSON.stringify(data))
}

let _data = load()

export const store = {
  // ── Initialization: sync from Supabase ──────────────────────────────────
  async init(): Promise<void> {
    // Restored projects can have the frontend source before the edge function
    // is deployed. In that case, stay in local mode without noisy fetch errors.
    if (!(await api.isAvailable())) return

    try {
      // Seed users if Supabase has none yet
      await api.seedUsers(DEFAULT_USERS)

      // Fetch lessons from Supabase
      const remoteLessons = await api.getLessons()
      if (remoteLessons && remoteLessons.length > 0) {
        _data.lessons = remoteLessons
      } else {
        // First run: push localStorage defaults to Supabase
        await api.bulkSaveLessons(_data.lessons)
      }

      // If user is logged in, fetch their fresh progress from Supabase
      if (_data.currentUserId) {
        const remoteProgress = await api.getProgress(_data.currentUserId)
        const user = _data.users.find(u => u.id === _data.currentUserId)
        if (user && remoteProgress) {
          user.progress = remoteProgress
        }
      }

      save(_data)
    } catch {
      // Keep the locally saved training data available if the service drops.
    }
  },

  // ── Auth ──────────────────────────────────────────────────────────────────
  async loginAsync(email: string, password: string): Promise<User | null> {
    try {
      const { user } = await api.login(email, password)
      if (user) {
        // Fetch progress from Supabase
        const remoteProgress = await api.getProgress(user.id).catch(() => [])
        user.progress = remoteProgress ?? []
        // Merge into local users list
        const idx = _data.users.findIndex(u => u.id === user.id)
        if (idx >= 0) _data.users[idx] = { ..._data.users[idx], ...user }
        else _data.users.push(user)
        _data.currentUserId = user.id
        save(_data)
        return _data.users.find(u => u.id === user.id) ?? user
      }
    } catch {
      // Fall back to localStorage login when the remote service is unavailable.
    }
    // localStorage fallback
    const user = _data.users.find(u => u.email === email && u.password === password)
    if (user) { _data.currentUserId = user.id; save(_data) }
    return user ?? null
  },

  logout() {
    _data.currentUserId = null
    save(_data)
  },

  currentUser(): User | null {
    if (!_data.currentUserId) return null
    return _data.users.find(u => u.id === _data.currentUserId) ?? null
  },

  // ── Lessons ──────────────────────────────────────────────────────────────
  getLessons(): Lesson[] {
    // The organization-wide passing policy is 85%; normalize older cached data.
    return _data.lessons
      .map(lesson => ({ ...lesson, passingScore: Math.max(85, lesson.passingScore) }))
      .sort((a, b) => a.order - b.order)
  },

  saveLesson(lesson: Lesson) {
    lesson = { ...lesson, passingScore: Math.max(85, lesson.passingScore) }
    const idx = _data.lessons.findIndex(l => l.id === lesson.id)
    if (idx >= 0) _data.lessons[idx] = lesson
    else _data.lessons.push(lesson)
    save(_data)
    api.saveLesson(lesson).catch(() => undefined)
  },

  deleteLesson(id: string) {
    _data.lessons = _data.lessons.filter(l => l.id !== id)
    save(_data)
    api.deleteLesson(id).catch(() => undefined)
  },

  // ── Progress ──────────────────────────────────────────────────────────────
  getUserProgress(userId: string, lessonId: string): UserProgress | undefined {
    const user = _data.users.find(u => u.id === userId)
    return user?.progress.find(p => p.lessonId === lessonId)
  },

  markVideoCompleted(userId: string, lessonId: string) {
    const user = _data.users.find(u => u.id === userId)
    if (!user) return
    let prog = user.progress.find(p => p.lessonId === lessonId)
    if (!prog) { prog = { lessonId, videoCompleted: false, quizAttempt: null }; user.progress.push(prog) }
    prog.videoCompleted = true
    save(_data)
    api.markVideoCompleted(userId, lessonId).catch(() => undefined)
  },

  saveQuizAttempt(userId: string, lessonId: string, attempt: QuizAttempt) {
    const user = _data.users.find(u => u.id === userId)
    if (!user) return
    let prog = user.progress.find(p => p.lessonId === lessonId)
    if (!prog) { prog = { lessonId, videoCompleted: true, quizAttempt: null }; user.progress.push(prog) }
    prog.quizAttempt = attempt
    save(_data)
    api.saveQuizAttempt(userId, lessonId, attempt).catch(() => undefined)
  },

  // ── Users (admin) ─────────────────────────────────────────────────────────
  getUsers(): User[] {
    return _data.users.filter(u => u.role === 'user')
  },

  // Fetch all users with their Supabase progress (admin report)
  async getUsersWithProgress(): Promise<User[]> {
    try {
      const [remoteUsers, allProgress] = await Promise.all([
        api.getUsers(),
        api.getAllProgress(),
      ])
      // Merge remote users + their progress into local state
      for (const ru of remoteUsers) {
        const local = _data.users.find(u => u.id === ru.id)
        const progress = allProgress[ru.id] ?? []
        if (local) { local.progress = progress }
        else { _data.users.push({ ...ru, password: '', progress }) }
      }
      save(_data)
    } catch {
      // The locally cached report remains available offline.
    }
    return _data.users.filter(u => u.role === 'user')
  },

  addUser(user: User) {
    // Every newly created employee starts with a completely empty lesson state.
    // Remove a stale local record with the same ID/email before creating it.
    const freshUser: User = { ...user, progress: [] }
    _data.users = _data.users.filter(existing =>
      existing.id !== freshUser.id && existing.email.toLowerCase() !== freshUser.email.toLowerCase(),
    )
    _data.users.push(freshUser)
    save(_data)
    api.addUser(freshUser).catch(() => undefined)
  },

  deleteUser(id: string) {
    _data.users = _data.users.filter(u => u.id !== id)
    save(_data)
    api.deleteUser(id).catch(() => undefined)
  },

  reset() {
    _data = { lessons: DEFAULT_LESSONS, users: DEFAULT_USERS, currentUserId: null }
    save(_data)
  },
}
