import { $nodeSchema, $command, $component } from '@milkdown/utils'
import { commandsCtx } from '@milkdown/kit/core'
import type { DefineFeature } from '../../../packages/crepe/src/feature/shared'
import {
  QuizComponent,
  type QuizOption,
  type QuizAttrs,
} from '../components/quiz-component'

// Simplified Quiz node schema - basic functionality only
export const quizSchema = $nodeSchema('quiz', () => ({
  group: 'block',
  content: '',
  atom: true,
  attrs: {
    question: { default: 'What is the correct answer?' },
    options: {
      default: [
        { id: '1', text: 'Option A', isCorrect: false },
        { id: '2', text: 'Option B', isCorrect: true },
        { id: '3', text: 'Option C', isCorrect: false },
      ] as QuizOption[],
    },
    selectedAnswer: { default: null },
    showResult: { default: false },
  },
  parseDOM: [
    {
      tag: 'div[data-type="quiz"]',
      getAttrs: (dom) => {
        const element = dom as HTMLElement
        try {
          return {
            question: element.dataset.question || 'What is the correct answer?',
            options: JSON.parse(element.dataset.options || '[]'),
            selectedAnswer: element.dataset.selectedAnswer || null,
            showResult: element.dataset.showResult === 'true',
          }
        } catch {
          return null
        }
      },
    },
  ],
  toDOM: (node) => [
    'div',
    {
      'data-type': 'quiz',
      'data-question': node.attrs.question,
      'data-options': JSON.stringify(node.attrs.options),
      'data-selected-answer': node.attrs.selectedAnswer || '',
      'data-show-result': node.attrs.showResult.toString(),
    },
  ],
}))

// Simple command to insert a quiz
export const insertQuizCommand = $command(
  'InsertQuiz',
  (ctx) => () => {
    return (state, dispatch) => {
      const quizType = quizSchema.type(ctx)
      const quizNode = quizType.create()
      
      if (dispatch) {
        dispatch(state.tr.replaceSelectionWith(quizNode))
      }
      return true
    }
  }
)

// Quiz component registration
export const quizComponent = $component('quiz', () => ({
  component: QuizComponent,
  as: 'div',
}))

// Quiz feature registration
export const quizFeature: DefineFeature = (editor) => {
  editor.use(quizSchema).use(insertQuizCommand).use(quizComponent)
}

export type { QuizOption, QuizAttrs }
