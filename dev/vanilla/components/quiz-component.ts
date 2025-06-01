export interface QuizOption {
  id: string
  text: string
  isCorrect: boolean
}

export interface QuizAttrs {
  question: string
  options: QuizOption[]
  selectedAnswer?: string
  showResult: boolean
}

export class QuizComponent {
  dom: HTMLElement
  node: any
  view: any
  getPos: () => number

  constructor(node: any, view: any, getPos: () => number) {
    this.node = node
    this.view = view
    this.getPos = getPos
    this.dom = document.createElement('div')
    this.render()
  }

  render() {
    const { question, options, selectedAnswer, showResult } = this.node.attrs || {}
    
    const selectedClass = selectedAnswer ? 'selected' : ''
    const correctAnswer = options.find((o: QuizOption) => o.isCorrect)?.text || ''
    
    this.dom.innerHTML = `
      <div class="quiz-component ${selectedClass}">
        <div class="quiz-question">${question}</div>
        <div class="quiz-options">
          ${options.map((option: QuizOption) => `
            <div class="quiz-option ${selectedAnswer === option.id ? 'selected' : ''} ${showResult && option.isCorrect ? 'correct' : ''}" 
                 data-option-id="${option.id}">
              ${selectedAnswer === option.id ? '●' : '○'} ${option.text}
              ${showResult && option.isCorrect ? ' ✓' : ''}
            </div>
          `).join('')}
        </div>
        ${showResult ? `<div class="quiz-result">Correct answer: ${correctAnswer}</div>` : ''}
      </div>
    `

    // Add basic styles
    this.dom.style.cssText = `
      border: 1px solid #ddd; 
      border-radius: 4px; 
      padding: 12px; 
      margin: 8px 0;
    `

    // Add click handlers
    this.dom.querySelectorAll('.quiz-option').forEach(el => {
      el.addEventListener('click', (e) => {
        const optionId = (e.target as HTMLElement).dataset.optionId
        if (optionId) this.selectAnswer(optionId)
      })
    })
  }

  selectAnswer = (answerId: string) => {
    this.updateAttributes({ selectedAnswer: answerId, showResult: true })
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