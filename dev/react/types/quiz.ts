export interface QuizOption {
  id: string
  text: string
  isCorrect: boolean
}

export interface QuizAttrs {
  question: string
  options: QuizOption[]
  // Note: selectedAnswer and showResult are not part of persisted attributes
  // They are ephemeral UI state only
}