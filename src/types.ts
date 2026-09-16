export type QuestionType = 'single' | 'multiple' | 'truefalse'

export type Question = {
  id: string
  type: QuestionType
  question: string
  options: string[]
  correct: number[]
  points: number
  explanation?: string
}

export type Lesson = {
  id: string
  order: number
  title: string
  description: string
  videoUrl: string
  videoDurationMinutes: number
  requireFullWatch: boolean
  passingScore: number
  questions: Question[]
}

export type QuizAttempt = {
  answers: Record<string, number[]>
  score: number
  totalPoints: number
  passed: boolean
  completedAt: string
}

export type UserProgress = {
  lessonId: string
  videoCompleted: boolean
  quizAttempt: QuizAttempt | null
}

export type User = {
  id: string
  name: string
  email: string
  password: string
  role: 'user' | 'admin'
  department: string
  startDate: string
  progress: UserProgress[]
}
