import React, { useState, useRef } from 'react'
import ReactDOM from 'react-dom'
import { createRoot } from 'react-dom/client'

import { toolbar } from '../packages/crepe/src/feature/toolbar'
import { Crepe, blockEdit } from '../packages/crepe/src/index'
import {
  Milkdown,
  MilkdownProvider,
  useEditor,
} from '../packages/integrations/react/src'
import { editorViewCtx, commandsCtx } from '../packages/kit/src/core'
import { toggleMark } from '../packages/kit/src/prose/commands'
import {
  $markSchema,
  $command,
  $nodeSchema,
  $component,
} from '../packages/utils/src'
import '../packages/crepe/src/theme/common/style.css'
import '../packages/crepe/src/theme/frame/style.css'

// Highlight mark schema
const highlightSchema = $markSchema('highlight', () => ({
  attrs: {
    color: {
      default: 'yellow',
      validate: 'string',
    },
  },
  parseDOM: [
    {
      tag: 'mark[data-highlight]',
      getAttrs: (node) => ({
        color: (node as HTMLElement).style.backgroundColor || 'yellow',
      }),
    },
  ],
  toDOM: (mark) => [
    'mark',
    {
      'data-highlight': 'true',
      style: `background-color: ${mark.attrs.color}`,
      class: 'milkdown-highlight',
    },
  ],
}))

const toggleHighlightCommand = $command(
  'ToggleHighlight',
  (ctx) =>
    (color = 'yellow') => {
      return toggleMark(highlightSchema.type(ctx), { color })
    }
)

function isHighlightActive(ctx, selection) {
  const highlightType = highlightSchema.type(ctx)
  const { from, to } = selection
  const view = ctx.get(editorViewCtx)
  if (!view || !view.state) return false
  const { doc } = view.state
  let hasHighlight = false
  doc.nodesBetween(from, to, (node) => {
    if (hasHighlight) return false
    if (node.marks.some((mark) => mark.type === highlightType)) {
      hasHighlight = true
      return false
    }
  })
  return hasHighlight
}

const highlightToolbarItem = {
  key: 'highlight',
  icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="m13.498.795.149-.149a1.207 1.207 0 1 1 1.707 1.708l-.149.148a1.5 1.5 0 0 1-.059 2.059L4.854 14.854a.5.5 0 0 1-.233.131l-4 1a.5.5 0 0 1-.606-.606l1-4a.5.5 0 0 1 .131-.232l9.642-9.642a.5.5 0 0 0-.642.056L6.854 4.854a.5.5 0 1 1-.708-.708L9.44.854A1.5 1.5 0 0 1 11.5.796a1.5 1.5 0 0 1 1.998-.001z"/></svg>`,
  tooltip: 'Highlight selected text',
  onClick: (ctx) => {
    const commands = ctx.get(commandsCtx)
    commands.call(toggleHighlightCommand.key)
  },
  isActive: (ctx, selection) => {
    return isHighlightActive(ctx, selection)
  },
  isDisabled: (ctx, selection) => {
    return selection.empty
  },
}

const createHighlightItem = (color, name) => ({
  key: `highlight-${color.replace('#', '')}`,
  icon: `<span style="background-color: ${color}; padding: 2px 6px; border-radius: 3px; font-weight: bold; font-size: 12px; color: ${
    color === 'yellow' || color === '#ffff00' ? '#333' : '#fff'
  };">A</span>`,
  tooltip: `Highlight with ${name}`,
  onClick: (ctx) => {
    const commands = ctx.get(commandsCtx)
    commands.call(toggleHighlightCommand.key, color)
  },
  isActive: (ctx, selection) => {
    const highlightType = highlightSchema.type(ctx)
    const view = ctx.get(editorViewCtx)
    if (!view || !view.state) return false
    const { from, to } = selection
    let hasColorHighlight = false
    view.state.doc.nodesBetween(from, to, (node) => {
      if (hasColorHighlight) return false
      const mark = node.marks.find((m) => m.type === highlightType)
      if (mark && mark.attrs.color === color) {
        hasColorHighlight = true
        return false
      }
    })
    return hasColorHighlight
  },
  isDisabled: (ctx, selection) => selection.empty,
})

// --- Custom Schema Feature ---
const customSchemaFeature = (editor) => {
  editor.use(quizSchema).use(highlightSchema).use(insertQuizCommand)
  return {
    nodeView: {
      quiz: (node, view, getPos, decorations, ctx) => {
        return new QuizComponent(node, view, getPos, ctx)
      },
    },
  }
}

const highlightFeature = (editor) => {
  editor.use(highlightSchema).use(toggleHighlightCommand)
}

// --- Quiz Section Example ---

import type { DefineFeature } from '../packages/crepe/src/feature/shared'

// Quiz option and attributes
interface QuizOption {
  id: string
  text: string
  isCorrect: boolean
}
interface QuizAttrs {
  question: string
  options: QuizOption[]
  selectedAnswer?: string
  showResult: boolean
}

// Quiz node schema
const quizSchema = $nodeSchema('quiz', () => ({
  group: 'block',
  content: '',
  atom: true, // Ensure node view is always used for this leaf block node
  selectable: true, // Ensure node view is attached and node is selectable
  attrs: {
    question: { default: 'Enter your question here' },
    options: {
      default: [
        { id: '1', text: 'Option A', isCorrect: false },
        { id: '2', text: 'Option B', isCorrect: true },
        { id: '3', text: 'Option C', isCorrect: false },
      ],
    },
    selectedAnswer: { default: null },
    showResult: { default: false },
  },
  parseDOM: [
    {
      tag: 'div[data-type="quiz"]',
      getAttrs: (dom) => {
        const element = dom as HTMLElement
        return {
          question: element.dataset.question || 'Enter your question here',
          options: JSON.parse(element.dataset.options || '[]'),
          selectedAnswer: element.dataset.selectedAnswer || null,
          showResult: element.dataset.showResult === 'true',
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
      class: 'milkdown-quiz',
    },
    // No content hole for leaf nodes - this fixes the drag-and-drop error
  ],
  markdown: {
    serialize: 'quiz-block',
    parse: 'quiz-block',
  },
  toMarkdown: {
    match: (node) => node.type.name === 'quiz',
    runner: (state, node) => {
      state.addNode(
        'html',
        undefined,
        `<div data-type="quiz" data-attrs='${encodeURIComponent(
          JSON.stringify({
            question: node.attrs.question,
            options: node.attrs.options,
            selectedAnswer: node.attrs.selectedAnswer,
            showResult: node.attrs.showResult,
          })
        )}'></div>`
      )
    },
  },
  fromMarkdown: {
    match: (node) =>
      node.type === 'html' &&
      typeof node.value === 'string' &&
      node.value.includes('data-type="quiz"'),
    runner: (state, node, type) => {
      if (typeof node.value === 'string') {
        const match = node.value.match(/data-attrs='([^']+)'/)
        const attrs = match ? JSON.parse(decodeURIComponent(match[1])) : {}
        state.addNode(type, attrs)
      }
    },
  },
  parseMarkdown: {
    match: (node) =>
      node.type === 'html' &&
      typeof node.value === 'string' &&
      node.value.includes('data-type="quiz"'),
    runner: (state, node, type) => {
      if (typeof node.value === 'string') {
        const match = node.value.match(/data-attrs='([^']+)'/)
        const attrs = match ? JSON.parse(decodeURIComponent(match[1])) : {}
        state.addNode(type, attrs)
      }
    },
  },
}))

// Command to insert a quiz
const insertQuizCommand = $command('InsertQuiz', (ctx) => (attrs) => {
  return (state, dispatch) => {
    const quizType = quizSchema.type(ctx)
    const { tr, selection } = state
    const patchAttrs = typeof attrs === 'object' && attrs !== null ? attrs : {}
    const quizNode = quizType.create({
      question: 'What is the correct answer?',
      options: [
        { id: '1', text: 'Option A', isCorrect: false },
        { id: '2', text: 'Option B', isCorrect: true },
        { id: '3', text: 'Option C', isCorrect: false },
        { id: '4', text: 'Option D', isCorrect: false },
      ],
      selectedAnswer: null,
      showResult: false,
      ...patchAttrs,
    })

    // If selection is inside a paragraph, replace the parent block
    const $from = selection.$from
    const parent = $from.node($from.depth)
    if (parent.type.name === 'paragraph') {
      const pos = $from.before($from.depth)
      if (dispatch) {
        dispatch(tr.replaceWith(pos, pos + parent.nodeSize, quizNode))
      }
      return true
    }

    if (dispatch) {
      dispatch(tr.replaceSelectionWith(quizNode))
    }
    return true
  }
})

// --- React Quiz Node View ---
function QuizReactView({
  question,
  options,
  selectedAnswer,
  showResult,
  onSelect,
  onEdit,
  isSelected,
}: {
  question: string
  options: any[]
  selectedAnswer: string | null
  showResult: boolean
  onSelect: (id: string) => void
  onEdit: () => void
  isSelected: boolean
}) {
  return (
    <div 
      className="quiz-component"
      style={{
        border: '2px solid #e1e5e9',
        borderRadius: '8px',
        padding: '16px',
        margin: '8px 0',
        backgroundColor: isSelected ? '#f8f9fa' : '#fff',
        borderColor: isSelected ? '#007bff' : '#e1e5e9',
      }}
    >
      <div 
        className="quiz-question"
        style={{
          fontSize: '16px',
          fontWeight: 'bold',
          marginBottom: '12px',
          color: '#333',
        }}
      >
        {question}
      </div>
      <div className="quiz-options">
        {options.map((option) => (
          <div
            key={option.id}
            className={`quiz-option${selectedAnswer === option.id ? ' selected' : ''}`}
            style={{
              padding: '10px',
              margin: '4px 0',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              backgroundColor: selectedAnswer === option.id ? '#e3f2fd' : '#fff',
              borderColor: selectedAnswer === option.id ? '#2196f3' : '#ddd',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
            }}
            onClick={() => onSelect(option.id)}
          >
            <span style={{ marginRight: '8px', color: selectedAnswer === option.id ? '#2196f3' : '#666' }}>
              {selectedAnswer === option.id ? '●' : '○'}
            </span>
            {option.text}
            {showResult && option.isCorrect && (
              <span style={{ marginLeft: 'auto', color: '#4caf50', fontWeight: 'bold' }}>✓</span>
            )}
          </div>
        ))}
      </div>
      {showResult && (
        <div 
          className="quiz-result"
          style={{
            marginTop: '12px',
            padding: '8px 12px',
            backgroundColor: '#e8f5e8',
            borderRadius: '4px',
            color: '#2e7d32',
            fontWeight: 'bold',
          }}
        >
          Correct answer: {options.filter((o) => o.isCorrect).map((o) => o.text).join(', ')}
        </div>
      )}
      {isSelected && (
        <button
          className="quiz-edit-btn"
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
          style={{
            marginTop: '12px',
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: '#white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
          }}
        >
          Edit Quiz
        </button>
      )}
    </div>
  )
}

// --- QuizComponent using React ---
class QuizComponent {
  dom: HTMLElement
  node: any
  view: any
  getPos: () => number
  ctx: any
  reactRoot: any = null
  modalRoot: HTMLDivElement | null = null
  popupEl: HTMLDivElement | null = null
  selected: boolean = false

  constructor(node: any, view: any, getPos: () => number, ctx: any) {
    this.node = node
    this.view = view
    this.getPos = getPos
    this.ctx = ctx
    this.dom = document.createElement('div')
    this.render()
    this.setupSelectionObserver()
  }

  render() {
    if (!this.reactRoot) {
      this.reactRoot = createRoot(this.dom)
    }
    const { question, options, selectedAnswer, showResult } =
      this.node.attrs || {}
    this.reactRoot.render(
      <QuizReactView
        question={question}
        options={options}
        selectedAnswer={selectedAnswer}
        showResult={showResult}
        onSelect={this.selectAnswer}
        onEdit={this.openEditModal}
        isSelected={this.selected}
      />
    )
  }

  selectAnswer = (answerId: string) => {
    const options = Array.isArray(this.node.attrs?.options)
      ? this.node.attrs.options
      : []
    const selected = options.find((o: any) => o.id === answerId)
    if (selected && selected.isCorrect) {
      this.showPopup('🎉 Correct! Well done!')
    } else {
      this.showPopup('❌ Not quite right, try again!')
    }
    this.updateAttributes({ selectedAnswer: answerId, showResult: true })
  }

  updateAttributes(attrs: Partial<any>) {
    const pos = this.getPos()
    if (typeof pos !== 'number') return
    const baseAttrs =
      typeof this.node.attrs === 'object' && this.node.attrs !== null
        ? this.node.attrs
        : {}
    const patchAttrs = typeof attrs === 'object' && attrs !== null ? attrs : {}
    const tr = this.view.state.tr.setNodeMarkup(pos, undefined, {
      ...baseAttrs,
      ...patchAttrs,
    })
    this.view.dispatch(tr)
  }

  setupSelectionObserver() {
    document.addEventListener('selectionchange', this.updateSelection)
    setTimeout(() => this.updateSelection(), 100)
  }

  updateSelection = () => {
    const selection = this.view.state.selection
    const pos = this.getPos()
    this.selected = false
    if (
      selection.from <= pos &&
      selection.to >= pos + (this.node.nodeSize || 1)
    ) {
      this.selected = true
    }
    this.render()
  }

  openEditModal = () => {
    if (this.modalRoot) return
    this.modalRoot = document.createElement('div')
    document.body.appendChild(this.modalRoot)
    const { question, options } = this.node.attrs || {}
    const closeModal = () => {
      if (this.modalRoot) {
        document.body.removeChild(this.modalRoot)
        this.modalRoot = null
      }
    }
    const save = (newQuestion: string, newOptions: any[]) => {
      this.updateAttributes({ question: newQuestion, options: newOptions })
      closeModal()
    }
    const modalRoot = createRoot(this.modalRoot)
    modalRoot.render(
      <QuizEditModal
        question={question}
        options={options}
        onSave={save}
        onCancel={closeModal}
      />
    )
  }

  showPopup(message: string) {
    if (this.popupEl) {
      this.popupEl.remove()
      this.popupEl = null
    }
    this.popupEl = document.createElement('div')
    this.popupEl.className = 'quiz-popup'
    this.popupEl.textContent = message
    document.body.appendChild(this.popupEl)
    const rect = this.dom.getBoundingClientRect()
    this.popupEl.style.position = 'absolute'
    this.popupEl.style.left = `${rect.left + window.scrollX + 20}px`
    this.popupEl.style.top = `${rect.top + window.scrollY - 40}px`
    this.popupEl.style.background = message.includes('🎉') ? '#4caf50' : '#f44336'
    this.popupEl.style.color = '#fff'
    this.popupEl.style.padding = '8px 16px'
    this.popupEl.style.borderRadius = '6px'
    this.popupEl.style.zIndex = '9999'
    this.popupEl.style.fontSize = '14px'
    this.popupEl.style.fontWeight = 'bold'
    this.popupEl.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)'
    this.popupEl.style.pointerEvents = 'none'
    setTimeout(() => {
      if (this.popupEl) {
        this.popupEl.remove()
        this.popupEl = null
      }
    }, 2000)
  }

  destroy() {
    if (this.reactRoot) {
      this.reactRoot.unmount()
      this.reactRoot = null
    }
    if (this.modalRoot) {
      document.body.removeChild(this.modalRoot)
      this.modalRoot = null
    }
    if (this.popupEl) {
      this.popupEl.remove()
      this.popupEl = null
    }
    document.removeEventListener('selectionchange', this.updateSelection)
  }
}

// React modal for editing quiz
function QuizEditModal({
  question,
  options,
  onSave,
  onCancel,
}: {
  question: string
  options: any[]
  onSave: (q: string, o: any[]) => void
  onCancel: () => void
}) {
  const [q, setQ] = React.useState(question)
  const [opts, setOpts] = React.useState(options)
  const updateOption = (idx: number, key: string, value: any) => {
    setOpts((opts) =>
      opts.map((o, i) => (i === idx ? { ...o, [key]: value } : o))
    )
  }
  const addOption = () => {
    setOpts((opts) => [
      ...opts,
      { id: Date.now().toString(), text: '', isCorrect: false },
    ])
  }
  const removeOption = (idx: number) => {
    setOpts((opts) => opts.filter((_, i) => i !== idx))
  }
  return (
    <div
      className="quiz-modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.3)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        className="quiz-modal"
        style={{
          background: '#fff',
          padding: 24,
          borderRadius: 8,
          minWidth: 320,
          maxWidth: 400,
        }}
      >
        <h3>Edit Quiz</h3>
        <div style={{ marginBottom: 12 }}>
          <label>Question:</label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <label>Options:</label>
          {opts.map((opt, idx) => (
            <div
              key={opt.id}
              style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}
            >
              <input
                value={opt.text}
                onChange={(e) => updateOption(idx, 'text', e.target.value)}
                style={{ flex: 1 }}
              />
              <label style={{ marginLeft: 8 }}>
                <input
                  type="checkbox"
                  checked={!!opt.isCorrect}
                  onChange={(e) =>
                    updateOption(idx, 'isCorrect', e.target.checked)
                  }
                />{' '}
                Correct
              </label>
              <button
                onClick={() => removeOption(idx)}
                style={{ marginLeft: 8 }}
              >
                🗑️
              </button>
            </div>
          ))}
          <button onClick={addOption} style={{ marginTop: 8 }}>
            Add Option
          </button>
        </div>
        <div
          style={{
            marginTop: 16,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
          }}
        >
          <button onClick={onCancel}>Cancel</button>
          <button
            onClick={() => onSave(q, opts)}
            style={{ background: '#222', color: '#fff' }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

// Register the quiz node view as a Crepe component
const quizComponent = $component('quiz', (ctx) => {
  return {
    component: QuizComponent,
    as: 'div',
    shouldUpdate: (prev, next) => prev.attrs !== next.attrs,
  }
})

// Feature to register quiz schema, command, and component
const quizFeature = (editor) => {
  editor.use(quizSchema).use(insertQuizCommand).use(quizComponent)
}

// --- Placeholders for missing features ---
// TODO: Replace with your actual quiz feature and custom slash menu implementations
const customSlashMenu = (builder) => {
  builder.addGroup('custom', 'Custom').addItem('quiz', {
    label: 'Quiz',
    icon: '<svg width="20" height="20" fill="none" viewBox="0 0 20 20"><rect width="20" height="20" rx="4" fill="#FFD600"/><text x="10" y="15" text-anchor="middle" font-size="12" fill="#222">Quiz</text></svg>',
    onRun: (ctx) => {
      const commands = ctx.get(commandsCtx)
      commands.call(insertQuizCommand.key)
    },
  })
}

// Add to CrepeEditor
const CrepeEditor = () => {
  useEditor((root) => {
    const crepe = new Crepe({ root })
    crepe
      .addFeature(quizFeature)
      .addFeature(highlightFeature)
      .addFeature(toolbar, {
        customItems: [
          highlightToolbarItem,
          createHighlightItem('yellow', 'Yellow'),
          createHighlightItem('#ffcccc', 'Pink'),
          createHighlightItem('#ccffcc', 'Green'), 
          createHighlightItem('#ccccff', 'Blue'),
          createHighlightItem('#ffcc99', 'Orange'),
        ],
      })
      .addFeature(blockEdit, {
        buildMenu: customSlashMenu,
      })
    return crepe
  })
  return <Milkdown />
}

export const MilkdownEditorWrapper = () => (
  <MilkdownProvider>
    <CrepeEditor />
  </MilkdownProvider>
)
