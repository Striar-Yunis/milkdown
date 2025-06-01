import { NodeSelection } from '@milkdown/prose/state'

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

export class QuizComponent {
  dom: HTMLElement
  node: any
  view: any
  getPos: () => number
  
  // Ephemeral UI state - not persisted to markdown
  private selectedAnswer: string | null = null
  private showResult: boolean = false

  constructor(node: any, view: any, getPos: () => number) {
    this.node = node
    this.view = view
    this.getPos = getPos
    this.dom = document.createElement('div')
    this.render()
  }

  render() {
    const { question, options } = this.node.attrs || {}
    
    const selectedClass = this.selectedAnswer ? 'selected' : ''
    const correctAnswer = options.find((o: QuizOption) => o.isCorrect)?.text || ''
    
    this.dom.innerHTML = `
      <div class="quiz-component ${selectedClass}">
        <div class="quiz-question">${question}</div>
        <div class="quiz-options">
          ${options.map((option: QuizOption) => `
            <div class="quiz-option ${this.selectedAnswer === option.id ? 'selected' : ''} ${this.showResult && option.isCorrect ? 'correct' : ''}" 
                 data-option-id="${option.id}">
              ${this.selectedAnswer === option.id ? '●' : '○'} ${option.text}
              ${this.showResult && option.isCorrect ? ' ✓' : ''}
            </div>
          `).join('')}
        </div>
        ${this.showResult ? `<div class="quiz-result">Correct answer: ${correctAnswer}</div>` : ''}
      </div>
    `

    // Add basic styles
    this.dom.style.cssText = `
      border: 1px solid #ddd; 
      border-radius: 4px; 
      padding: 12px; 
      margin: 8px 0;
      cursor: pointer;
    `

    // Add click handlers
    this.dom.querySelectorAll('.quiz-option').forEach(el => {
      el.addEventListener('click', (e) => {
        const optionId = (e.target as HTMLElement).dataset.optionId
        if (optionId) this.selectAnswer(optionId)
      })
    })

    // Add selection handler for the whole component
    this.dom.addEventListener('click', (e) => {
      // Select the node when clicked (but not when clicking options)
      if (!(e.target as HTMLElement).classList.contains('quiz-option')) {
        this.selectNode()
      }
    })
  }

  selectAnswer = (answerId: string) => {
    // Update local state only - don't persist to markdown
    this.selectedAnswer = answerId
    this.showResult = true
    this.render()
  }

  selectNode() {
    const pos = this.getPos()
    if (typeof pos !== 'number') return
    
    const { tr } = this.view.state
    const selection = NodeSelection.create(this.view.state.doc, pos)
    this.view.dispatch(tr.setSelection(selection))
  }

  updateAttributes(attrs: Partial<QuizAttrs>) {
    const pos = this.getPos()
    if (typeof pos !== 'number') return
    
    const tr = this.view.state.tr.setNodeMarkup(pos, undefined, {
      ...this.node.attrs,
      ...attrs,
    })
    this.view.dispatch(tr)
  }

  destroy() {
    // Cleanup if needed
  }
}