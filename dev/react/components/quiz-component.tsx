import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { NodeSelection } from 'prosemirror-state'

import type { QuizOption, QuizAttrs } from '../types/quiz'

import { QuizEditModal } from './quiz-edit-modal'
import { QuizReactView } from './quiz-react-view'

// Functional node view for Quiz
export function QuizComponent(node: any, view: any, getPos: () => number) {
  const dom = document.createElement('div')
  let reactRoot: any = null
  let editing = false
  let isSelected = false
  let currentNode = node

  function render() {
    if (!reactRoot) {
      reactRoot = createRoot(dom)
    }
    const { question, options, selectedAnswer, showResult } =
      currentNode.attrs || {}
    reactRoot.render(
      <div
        tabIndex={0}
        style={{
          outline: isSelected ? '2px solid #007bff' : 'none',
          cursor: 'pointer',
        }}
        onClick={(e) => {
          e.stopPropagation()
          // Focus and select the node in the editor
          if (dom && typeof dom.focus === 'function') dom.focus()
          if (!isSelected) {
            // Force selection in the editor
            const pos = getPos()
            if (typeof pos === 'number') {
              const { state, dispatch } = view
              const tr = state.tr.setSelection(
                new NodeSelection(state.doc.resolve(pos))
              )
              dispatch(tr)
            }
          }
        }}
      >
        <QuizReactView
          question={question}
          options={options}
          selectedAnswer={selectedAnswer}
          showResult={showResult}
          onSelect={selectAnswer}
          onEdit={openEdit}
          isSelected={isSelected}
        />
        {isSelected && !editing && (
          <button
            className="quiz-edit-btn"
            onClick={(e) => {
              e.stopPropagation()
              openEdit()
            }}
            style={{
              marginTop: '12px',
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              display: 'block',
            }}
          >
            Edit Quiz
          </button>
        )}
        {editing && (
          <QuizEditModal
            question={question}
            options={options}
            onSave={saveEdit}
            onCancel={closeEdit}
          />
        )}
      </div>
    )
  }

  function selectAnswer(answerId: string) {
    updateAttributes({ selectedAnswer: answerId, showResult: true })
  }

  function openEdit() {
    editing = true
    render()
  }

  function closeEdit() {
    editing = false
    render()
  }

  function saveEdit(question: string, options: QuizOption[]) {
    updateAttributes({ question, options })
    editing = false
    render()
  }

  function updateAttributes(attrs: Partial<QuizAttrs>) {
    const pos = getPos()
    if (typeof pos !== 'number') return
    const tr = view.state.tr.setNodeMarkup(pos, undefined, {
      ...currentNode.attrs,
      ...attrs,
    })
    view.dispatch(tr)
  }

  render()

  return {
    dom,
    update(
      node: any,
      decorations: any,
      innerDecorations: any,
      selected: boolean
    ) {
      currentNode = node
      isSelected = selected
      render()
      return true
    },
    destroy() {
      if (reactRoot) {
        reactRoot.unmount()
        reactRoot = null
      }
    },
  }
}
