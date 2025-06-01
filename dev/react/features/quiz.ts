import type { DefineFeature } from '../../../packages/crepe/src/feature/shared'
import type { QuizOption, QuizAttrs } from '../types/quiz'

import { commandsCtx } from '../../../packages/kit/src/core'
import { $nodeSchema, $command, $component } from '../../../packages/utils/src'
import { QuizComponent } from '../components/quiz-component'

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
  toMarkdown: {
    match: (node) => node.type.name === 'quiz',
    runner: (state, node) => {
      // Serialize as a custom HTML block for now
      state.addNode(
        'html',
        undefined,
        `<div data-type="quiz" data-question="${node.attrs.question}" data-options='${JSON.stringify(node.attrs.options)}'></div>`
      )
    },
  },
  parseMarkdown: {
    match: (node) =>
      node.type === 'html' &&
      typeof node.value === 'string' &&
      node.value.includes('data-type="quiz"'),
    runner: (state, node, type) => {
      // This is a stub: you can implement parsing from HTML string if needed
      state.openNode(type, {
        question: 'What is the correct answer?',
        options: [
          { id: '1', text: 'Option A', isCorrect: false },
          { id: '2', text: 'Option B', isCorrect: true },
          { id: '3', text: 'Option C', isCorrect: false },
        ],
        selectedAnswer: null,
        showResult: false,
      })
      state.closeNode()
    },
  },
}))

// Simple command to insert a quiz
export const insertQuizCommand = $command('InsertQuiz', (ctx) => () => {
  return (state, dispatch) => {
    const quizType = quizSchema.type(ctx)
    const quizNode = quizType.create()

    if (dispatch) {
      dispatch(state.tr.replaceSelectionWith(quizNode))
    }
    return true
  }
})

// Quiz component registration
export const quizComponent = $component('quiz', () => ({
  component: QuizComponent,
  as: 'div',
}))

// Quiz feature registration
export const quizFeature: DefineFeature = (editor) => {
  editor.use(quizSchema).use(insertQuizCommand).use(quizComponent)
}

// Custom slash menu builder function
export const customSlashMenu = (builder: any) => {
  builder.addGroup('custom', 'Custom').addItem('quiz', {
    label: 'Quiz',
    icon: '<svg width="20" height="20" fill="none" viewBox="0 0 20 20"><rect width="20" height="20" rx="4" fill="#FFD600"/><text x="10" y="15" text-anchor="middle" font-size="12" fill="#222">Quiz</text></svg>',
    onRun: (ctx: any) => {
      const commands = ctx.get(commandsCtx)
      commands.call(insertQuizCommand.key)
    },
  })
}

export type { QuizOption, QuizAttrs }
