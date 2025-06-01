import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import type { QuizOption, QuizAttrs } from '../types/quiz'

interface QuizReactViewProps {
  question: string
  options: QuizOption[]
  selectedAnswer?: string
  showResult: boolean
  onSelect: (answerId: string) => void
}

// Simple React component using useState patterns
const QuizReactView: React.FC<QuizReactViewProps> = ({
  question,
  options,
  selectedAnswer,
  showResult,
  onSelect,
}) => {
  const correctAnswer = options.find(o => o.isCorrect)?.text || ''

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '12px', margin: '8px 0' }}>
      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{question}</div>
      <div>
        {options.map((option) => (
          <div
            key={option.id}
            onClick={() => onSelect(option.id)}
            style={{
              padding: '8px',
              margin: '4px 0',
              border: `1px solid ${selectedAnswer === option.id ? '#007bff' : '#ddd'}`,
              borderRadius: '4px',
              cursor: 'pointer',
              backgroundColor: selectedAnswer === option.id ? '#e3f2fd' : '#fff',
            }}
          >
            {selectedAnswer === option.id ? '●' : '○'} {option.text}
            {showResult && option.isCorrect && ' ✓'}
          </div>
        ))}
      </div>
      {showResult && (
        <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#e8f5e8', borderRadius: '4px' }}>
          Correct answer: {correctAnswer}
        </div>
      )}
    </div>
  )
}

export class QuizComponent {
  dom: HTMLElement
  node: any
  view: any
  getPos: () => number
  reactRoot: any = null

  constructor(node: any, view: any, getPos: () => number) {
    this.node = node
    this.view = view
    this.getPos = getPos
    this.dom = document.createElement('div')
    this.render()
  }

  render() {
    if (!this.reactRoot) {
      this.reactRoot = createRoot(this.dom)
    }

    const { question, options, selectedAnswer, showResult } = this.node.attrs || {}

    this.reactRoot.render(
      <QuizReactView
        question={question}
        options={options}
        selectedAnswer={selectedAnswer}
        showResult={showResult}
        onSelect={this.selectAnswer}
      />
    )
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
    if (this.reactRoot) {
      this.reactRoot.unmount()
      this.reactRoot = null
    }
  }
}