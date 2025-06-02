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

  // Ephemeral state - not persisted to markdown
  let selectedAnswer: string | null = null
  let showResult: boolean = false

  function render() {
    if (!reactRoot) {
      reactRoot = createRoot(dom)
    }
    const { question, options } = currentNode.attrs || {}
    
    reactRoot.render(
      <div
        tabIndex={0}
        style={{
          outline: isSelected ? '2px solid #007bff' : 'none',
          cursor: 'pointer',
        }}
        onClick={(e) => {
          e.stopPropagation()
          selectNode()
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
    // Update local state only - don't persist to markdown
    selectedAnswer = answerId
    showResult = true
    render()
  }

  function selectNode() {
    const pos = getPos()
    if (typeof pos === 'number') {
      const { state, dispatch } = view
      const tr = state.tr.setSelection(
        NodeSelection.create(state.doc, pos)
      )
      dispatch(tr)
    }
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
