import { projectId, publicAnonKey } from '../../utils/supabase/info'

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-13fc189e`

let availability: boolean | null = null

/**
 * The Make edge function is deployed separately from the frontend. Keep the
 * application usable when a restored project has source code but no deployed
 * function yet.
 */
async function isAvailable(): Promise<boolean> {
  if (availability !== null) return availability

  try {
    const res = await fetch(`${BASE}/health`, {
      headers: { Accept: 'application/json', apikey: publicAnonKey, Authorization: `Bearer ${publicAnonKey}` },
    })
    availability = res.ok
  } catch {
    availability = false
  }

  return availability
}

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  if (!(await isAvailable())) {
    throw new Error('Supabase edge function is unavailable')
  }

  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', apikey: publicAnonKey, Authorization: `Bearer ${publicAnonKey}` },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    availability = false
    throw new Error('Supabase edge function is unavailable')
  }

  if (!res.ok) {
    if (res.status === 404 || res.status >= 500) availability = false
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(err.error ?? `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  isAvailable,
  // Lessons
  getLessons: () => req<any[] | null>('GET', '/lessons'),
  bulkSaveLessons: (lessons: any[]) => req<{ ok: boolean }>('POST', '/lessons/bulk', lessons),
  saveLesson: (lesson: any) => req<{ ok: boolean }>('PUT', `/lessons/${lesson.id}`, lesson),
  deleteLesson: (id: string) => req<{ ok: boolean }>('DELETE', `/lessons/${id}`),

  // Auth
  login: (email: string, password: string) => req<{ user: any }>('POST', '/auth/login', { email, password }),

  // Users
  seedUsers: (users: any[]) => req<{ seeded: boolean }>('POST', '/users/seed', users),
  getUsers: () => req<any[]>('GET', '/users'),
  addUser: (user: any) => req<{ ok: boolean }>('POST', '/users', user),
  deleteUser: (id: string) => req<{ ok: boolean }>('DELETE', `/users/${id}`),

  // Progress
  getProgress: (userId: string) => req<any[]>('GET', `/progress/${userId}`),
  getAllProgress: () => req<Record<string, any[]>>('GET', '/progress'),
  markVideoCompleted: (userId: string, lessonId: string) =>
    req<{ ok: boolean }>('POST', '/progress/video', { userId, lessonId }),
  saveQuizAttempt: (userId: string, lessonId: string, attempt: any) =>
    req<{ ok: boolean }>('POST', '/progress/quiz', { userId, lessonId, attempt }),
}
