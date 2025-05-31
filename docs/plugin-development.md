# Crepe Plugin Development Guide

This guide shows how to create custom plugins for the Crepe editor to extend both the toolbar and slash menu functionality.

## Quick Start

```typescript
import { CrepeBuilder } from '@milkdown/crepe/builder'
import { toolbar, blockEdit } from '@milkdown/crepe'
import { ToolbarItemPresets, type ToolbarItem, type GroupBuilder } from '@milkdown/crepe'

const builder = new CrepeBuilder({ root: '#editor' })

// Add custom toolbar items
builder.addFeature(toolbar, {
  customItems: [
    ToolbarItemPresets.requiresSelection({
      key: 'highlight',
      icon: '🎨',
      tooltip: 'Highlight text',
      onClick: (ctx) => {
        // Your custom logic
      }
    })
  ]
})

// Add custom slash menu items
builder.addFeature(blockEdit, {
  buildMenu: (builder: GroupBuilder) => {
    builder.addGroup('custom', 'My Plugins')
      .addItem('widget', {
        label: 'Custom Widget',
        icon: '⭐',
        onRun: (ctx) => {
          // Your custom logic
        }
      })
  }
})

const editor = builder.create()
```

## Toolbar Plugins

You can add custom toolbar items by providing a `customItems` array in the toolbar feature configuration. Here's a complete example implementing text highlighting:

```typescript
import { CrepeBuilder } from '@milkdown/crepe/builder'
import { toolbar, type ToolbarItem } from '@milkdown/crepe/feature/toolbar'
import { $markSchema, $command } from '@milkdown/utils'
import { toggleMark } from '@milkdown/kit/prose/commands'
import { editorViewCtx, commandsCtx } from '@milkdown/kit/core'
import type { DefineFeature } from '@milkdown/crepe/feature/shared'

// 1. Define the highlight mark schema
const highlightSchema = $markSchema('highlight', () => ({
  attrs: {
    color: { default: 'yellow', validate: 'string' },
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

// 2. Define the toggle command
const toggleHighlightCommand = $command(
  'ToggleHighlight',
  (ctx) => (color = 'yellow') =>
    toggleMark(highlightSchema.type(ctx), { color })
)

// 3. Helper function to check highlight state
function isHighlightActive(ctx: Ctx, selection: Selection, color?: string): boolean {
  const highlightType = highlightSchema.type(ctx)
  const view = ctx.get(editorViewCtx)
  if (!view?.state) return false

  const { from, to } = selection
  let hasHighlight = false

  view.state.doc.nodesBetween(from, to, (node) => {
    if (hasHighlight) return false
    const mark = node.marks.find((m) => m.type === highlightType)
    if (mark && (!color || mark.attrs.color === color)) {
      hasHighlight = true
      return false
    }
  })

  return hasHighlight
}

// 4. Create the highlight feature
const highlightFeature: DefineFeature = (editor) => {
  editor.use(highlightSchema).use(toggleHighlightCommand)
}

// 5. Create toolbar items with proper styling
const createHighlightToolbarItem = (color: string, name: string): ToolbarItem => ({
  key: `highlight-${color.replace('#', '')}`,
  icon: `<span style="background-color: ${color}; padding: 2px 6px; border-radius: 3px; font-weight: bold; font-size: 12px; color: ${
    color === 'yellow' || color === '#ffff00' ? '#333' : '#fff'
  };">A</span>`,
  tooltip: `Highlight with ${name}`,
  onClick: (ctx) => {
    const commands = ctx.get(commandsCtx)
    commands.call(toggleHighlightCommand.key, color)
  },
  isActive: (ctx, selection) => isHighlightActive(ctx, selection, color),
  isDisabled: (ctx, selection) => selection.empty,
})

// 6. Setup the editor
const builder = new CrepeBuilder({ root: '#editor' })

builder
  .addFeature(highlightFeature)
  .addFeature(toolbar, {
    customItems: [
      createHighlightToolbarItem('yellow', 'Yellow'),
      createHighlightToolbarItem('#ffcccc', 'Pink'),
      createHighlightToolbarItem('#ccffcc', 'Green'),
      createHighlightToolbarItem('#ccccff', 'Blue'),
      createHighlightToolbarItem('#ffcc99', 'Orange'),
    ],
  })

const editor = builder.create()
```
import { toolbar, type ToolbarItem } from '@milkdown/crepe'
import { $markSchema, $command } from '@milkdown/utils'
import { toggleMark } from '@milkdown/prose/commands'
import { editorViewCtx, commandsCtx } from '@milkdown/kit/core'
import type { Ctx } from '@milkdown/kit/ctx'
import type { Selection } from '@milkdown/prose/state'
import type { DefineFeature } from '@milkdown/crepe/feature/shared'

// First, define the highlight mark schema
const highlightSchema = $markSchema('highlight', () => ({
  attrs: {
    color: { default: 'yellow', validate: 'string' },
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

// Create the toggle command
const toggleHighlightCommand = $command('ToggleHighlight', (ctx) => (color = 'yellow') => {
  return toggleMark(highlightSchema.type(ctx), { color })
})

// Helper function to check if text is highlighted
function isHighlightActive(ctx: Ctx, selection: Selection, color?: string): boolean {
  const highlightType = highlightSchema.type(ctx)
  const { from, to } = selection
  const view = ctx.get(editorViewCtx)
  if (!view?.state) return false
  const { doc } = view.state
  
  let hasHighlight = false
  doc.nodesBetween(from, to, (node) => {
    if (hasHighlight) return false
    const mark = node.marks.find(m => m.type === highlightType)
    if (mark && (!color || mark.attrs.color === color)) {
      hasHighlight = true
      return false
    }
  })
  
  return hasHighlight
}

// Create a custom feature to register the highlight functionality
const highlightFeature: DefineFeature = (editor) => {
  editor
    .use(highlightSchema)
    .use(toggleHighlightCommand)
}

// Define the complete highlight toolbar item
const highlightToolbarItem: ToolbarItem = {
  key: 'highlight',
  icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="m13.498.795.149-.149a1.207 1.207 0 1 1 1.707 1.708l-.149.148a1.5 1.5 0 0 1-.059 2.059L4.854 14.854a.5.5 0 0 1-.233.131l-4 1a.5.5 0 0 1-.606-.606l1-4a.5.5 0 0 1 .131-.232l9.642-9.642a.5.5 0 0 0-.642.056L6.854 4.854a.5.5 0 1 1-.708-.708L9.44.854A1.5 1.5 0 0 1 11.5.796a1.5 1.5 0 0 1 1.998-.001z"/>
  </svg>`,
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
  }
}

// Multiple highlight colors example
const createHighlightItem = (color: string, name: string): ToolbarItem => ({
  key: `highlight-${color}`,
  icon: `<span style="background-color: ${color}; padding: 2px 4px; border-radius: 2px;">A</span>`,
  tooltip: `Highlight with ${name}`,
  onClick: (ctx) => {
    const commands = ctx.get(commandsCtx)
    commands.call(toggleHighlightCommand.key, color)
  },
  isActive: (ctx, selection) => {
    // Check if selection has this specific color highlight
    const highlightType = highlightSchema.type(ctx)
    const view = ctx.get(editorViewCtx)
    const { from, to } = selection
    let hasColorHighlight = false
    
    view.state.doc.nodesBetween(from, to, (node) => {
      if (hasColorHighlight) return false
      const mark = node.marks.find(m => m.type === highlightType)
      if (mark && mark.attrs.color === color) {
        hasColorHighlight = true
        return false
      }
    })
    
    return hasColorHighlight
  },
  isDisabled: (ctx, selection) => selection.empty
})

// Build the editor with highlight plugins
const builder = new CrepeBuilder({ root: '#editor' })

builder
  // Register the highlight feature first
  .addFeature(highlightFeature)
  // Add toolbar with highlight items
  .addFeature(toolbar, {
    customItems: [
      highlightToolbarItem,
      createHighlightItem('yellow', 'Yellow'),
      createHighlightItem('#ffcccc', 'Pink'),
      createHighlightItem('#ccffcc', 'Green'),
      createHighlightItem('#ccccff', 'Blue'),
    ]
  })

const editor = builder.create()
```

### ToolbarItem Interface

```typescript
interface ToolbarItem {
  /// Unique identifier for the toolbar item
  key: string
  /// Icon to display (SVG string or icon identifier)  
  icon: string
  /// Tooltip text for the item
  tooltip?: string
  /// Function to execute when the item is clicked
  onClick: (ctx: Ctx) => void
  /// Function to determine if the item should be active/highlighted
  isActive?: (ctx: Ctx, selection: Selection) => boolean
  /// Function to determine if the item should be disabled
  isDisabled?: (ctx: Ctx, selection: Selection) => boolean
}
```

### Toolbar Item Presets

The `ToolbarItemPresets` provide common configurations:

```typescript
// Item that's disabled when no text is selected
const item1 = ToolbarItemPresets.requiresSelection({
  key: 'format-text',
  icon: '🎨',
  tooltip: 'Format selected text',
  onClick: (ctx) => { /* ... */ }
})

// Item that's always enabled
const item2 = ToolbarItemPresets.alwaysEnabled({
  key: 'insert-something',
  icon: '➕',
  tooltip: 'Insert something',
  onClick: (ctx) => { /* ... */ }
})
```

## Slash Menu Plugins

You can customize the slash menu by providing a `buildMenu` function in the block edit feature configuration. Here's a comprehensive example implementing an interactive quiz component:

```typescript
import { CrepeBuilder } from '@milkdown/crepe/builder'
import { blockEdit, type GroupBuilder } from '@milkdown/crepe'
import { $nodeSchema, $command, $component } from '@milkdown/utils'
import { editorViewCtx, commandsCtx } from '@milkdown/kit/core'
import type { Ctx } from '@milkdown/kit/ctx'
import type { DefineFeature } from '@milkdown/crepe/feature/shared'

// Define quiz option interface
interface QuizOption {
  id: string
  text: string
  isCorrect: boolean
}

// Define quiz node attributes
interface QuizAttrs {
  question: string
  options: QuizOption[]
  selectedAnswer?: string
  showResult: boolean
}

// Create the quiz node schema
const quizSchema = $nodeSchema('quiz', () => ({
  group: 'block',
  atom: true, // Leaf node - prevents drag-and-drop errors
  selectable: true,
  attrs: {
    question: { default: 'What is the correct answer?' },
    options: { 
      default: [
        { id: '1', text: 'Option A', isCorrect: false },
        { id: '2', text: 'Option B', isCorrect: true },
        { id: '3', text: 'Option C', isCorrect: false },
      ] 
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
          return false
        }
      },
    },
  ],
  // FIXED: No content hole for leaf nodes to prevent drag-and-drop errors
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
  ],
}))

// Command to insert a quiz
const insertQuizCommand = $command('InsertQuiz', (ctx) => (attrs?: Partial<QuizAttrs>) => {
  return (state, dispatch) => {
    const quizType = quizSchema.type(ctx)
    const { tr } = state
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
      ...attrs,
    })
    
    if (dispatch) {
      dispatch(tr.replaceSelectionWith(quizNode))
    }
    return true
  }
})

// Quiz component implementation (follows image block pattern)
class QuizComponent {
  dom: HTMLElement
  node: any
  getPos: () => number
  ctx: Ctx

  constructor(node: any, view: any, getPos: () => number, ctx: Ctx) {
    this.node = node
    this.getPos = getPos
    this.ctx = ctx
    this.dom = this.createDOM()
    this.updateContent()
  }

  createDOM() {
    const container = document.createElement('div')
    container.className = 'milkdown-quiz-container'
    container.innerHTML = `
      <div class="quiz-header">
        <h4 class="quiz-question" contenteditable="true" placeholder="Enter your question here..."></h4>
        <button class="quiz-add-option" type="button">+ Add Option</button>
      </div>
      <div class="quiz-options"></div>
      <div class="quiz-actions">
        <button class="quiz-submit" type="button" disabled>Submit Answer</button>
        <button class="quiz-reset" type="button" style="display: none;">Reset Quiz</button>
      </div>
      <div class="quiz-result" style="display: none;"></div>
    `
    
    this.setupEventListeners(container)
    return container
  }

  setupEventListeners(container: HTMLElement) {
    const questionEl = container.querySelector('.quiz-question') as HTMLElement
    const addOptionBtn = container.querySelector('.quiz-add-option') as HTMLButtonElement
    const submitBtn = container.querySelector('.quiz-submit') as HTMLButtonElement
    const resetBtn = container.querySelector('.quiz-reset') as HTMLButtonElement

    // Handle question editing
    questionEl.addEventListener('blur', () => {
      this.updateNodeAttrs({ question: questionEl.textContent || '' })
    })

    // Handle adding new option
    addOptionBtn.addEventListener('click', () => {
      const newOption = {
        id: Date.now().toString(),
        text: 'New option',
        isCorrect: false,
      }
      const options = [...this.node.attrs.options, newOption]
      this.updateNodeAttrs({ options })
    })

    // Handle quiz submission
    submitBtn.addEventListener('click', () => {
      const selectedOption = this.node.attrs.options.find(
        (opt: QuizOption) => opt.id === this.node.attrs.selectedAnswer
      )
      
      if (selectedOption?.isCorrect) {
        this.showCorrectPopup()
      }
      
      this.updateNodeAttrs({ showResult: true })
    })

    // Handle quiz reset
    resetBtn.addEventListener('click', () => {
      this.updateNodeAttrs({ 
        selectedAnswer: null, 
        showResult: false 
      })
    })
  }

  updateContent() {
    const questionEl = this.dom.querySelector('.quiz-question') as HTMLElement
    const optionsEl = this.dom.querySelector('.quiz-options') as HTMLElement
    const submitBtn = this.dom.querySelector('.quiz-submit') as HTMLButtonElement
    const resetBtn = this.dom.querySelector('.quiz-reset') as HTMLButtonElement

    // Update question
    questionEl.textContent = this.node.attrs.question

    // Update options
    optionsEl.innerHTML = ''
    this.node.attrs.options.forEach((option: QuizOption, index: number) => {
      const optionDiv = document.createElement('div')
      optionDiv.className = 'quiz-option'
      optionDiv.innerHTML = `
        <label>
          <input type="radio" name="quiz-option-${this.getPos()}" value="${option.id}" 
                 ${this.node.attrs.selectedAnswer === option.id ? 'checked' : ''}
                 ${this.node.attrs.showResult ? 'disabled' : ''}>
          <input type="text" value="${option.text}" class="option-text" 
                 ${this.node.attrs.showResult ? 'readonly' : ''}>
          <button type="button" class="option-correct ${option.isCorrect ? 'active' : ''}" 
                  title="Mark as correct answer">✓</button>
          <button type="button" class="option-delete" title="Delete option">×</button>
        </label>
      `

      this.setupOptionListeners(optionDiv, option, index)
      optionsEl.appendChild(optionDiv)
    })

    // Update button states
    submitBtn.disabled = !this.node.attrs.selectedAnswer || this.node.attrs.showResult
    resetBtn.style.display = this.node.attrs.showResult ? 'block' : 'none'

    // Update result display
    if (this.node.attrs.showResult) {
      this.updateResult()
    } else {
      const resultEl = this.dom.querySelector('.quiz-result') as HTMLElement
      resultEl.style.display = 'none'
    }
  }

  setupOptionListeners(optionDiv: HTMLElement, option: QuizOption, index: number) {
    const radioInput = optionDiv.querySelector('input[type="radio"]') as HTMLInputElement
    const textInput = optionDiv.querySelector('.option-text') as HTMLInputElement
    const correctBtn = optionDiv.querySelector('.option-correct') as HTMLButtonElement
    const deleteBtn = optionDiv.querySelector('.option-delete') as HTMLButtonElement

    // Handle option selection
    radioInput.addEventListener('change', () => {
      if (radioInput.checked) {
        this.updateNodeAttrs({ selectedAnswer: option.id })
      }
    })

    // Handle option text editing
    textInput.addEventListener('blur', () => {
      const options = [...this.node.attrs.options]
      options[index] = { ...option, text: textInput.value }
      this.updateNodeAttrs({ options })
    })

    // Handle marking as correct (only one correct answer allowed)
    correctBtn.addEventListener('click', () => {
      const options = this.node.attrs.options.map((opt: QuizOption) => ({
        ...opt,
        isCorrect: opt.id === option.id ? !opt.isCorrect : false,
      }))
      this.updateNodeAttrs({ options })
    })

    // Handle option deletion (minimum 2 options required)
    deleteBtn.addEventListener('click', () => {
      if (this.node.attrs.options.length > 2) {
        const options = this.node.attrs.options.filter((opt: QuizOption) => opt.id !== option.id)
        let selectedAnswer = this.node.attrs.selectedAnswer
        if (selectedAnswer === option.id) {
          selectedAnswer = null
        }
        this.updateNodeAttrs({ options, selectedAnswer })
      }
    })
  }

  updateResult() {
    const resultEl = this.dom.querySelector('.quiz-result') as HTMLElement
    const selectedOption = this.node.attrs.options.find(
      (opt: QuizOption) => opt.id === this.node.attrs.selectedAnswer
    )
    const correctOption = this.node.attrs.options.find((opt: QuizOption) => opt.isCorrect)

    if (selectedOption?.isCorrect) {
      resultEl.innerHTML = `<div class="result-correct">🎉 Correct! Well done!</div>`
      resultEl.className = 'quiz-result correct'
    } else {
      resultEl.innerHTML = `
        <div class="result-incorrect">
          ❌ Incorrect. The correct answer is: "${correctOption?.text}"
        </div>
      `
      resultEl.className = 'quiz-result incorrect'
    }
    resultEl.style.display = 'block'
  }

  showCorrectPopup() {
    // Create popup modal for correct answer
    const popup = document.createElement('div')
    popup.className = 'quiz-correct-popup'
    popup.innerHTML = `
      <div class="popup-content">
        <h3>🎉 Congratulations!</h3>
        <p>You got the correct answer!</p>
        <button type="button" class="popup-close">Continue</button>
      </div>
    `
    
    const closeBtn = popup.querySelector('.popup-close') as HTMLButtonElement
    closeBtn.addEventListener('click', () => {
      document.body.removeChild(popup)
    })

    // Close popup when clicking outside
    popup.addEventListener('click', (e) => {
      if (e.target === popup) {
        document.body.removeChild(popup)
      }
    })

    document.body.appendChild(popup)
    
    // Auto-close after 3 seconds
    setTimeout(() => {
      if (document.body.contains(popup)) {
        document.body.removeChild(popup)
      }
    }, 3000)
  }

  updateNodeAttrs(attrs: Partial<QuizAttrs>) {
    const view = this.ctx.get(editorViewCtx)
    const { tr } = view.state
    const pos = this.getPos()
    
    if (pos >= 0) {
      const newAttrs = { ...this.node.attrs, ...attrs }
      view.dispatch(tr.setNodeAttribute(pos, newAttrs))
    }
  }

  update(node: any) {
    if (node.type !== this.node.type) return false
    this.node = node
    this.updateContent()
    return true
  }

  destroy() {
    // Cleanup event listeners if needed
  }
}

// Create the component plugin
const quizComponent = $component('quiz', (ctx) => {
  return {
    component: QuizComponent,
    as: 'div',
    shouldUpdate: (prev: any, next: any) => {
      return prev.attrs !== next.attrs
    }
  }
})

// Define the slash menu builder with quiz component
const customSlashMenu = (builder: GroupBuilder) => {
  // Add custom group for interactive components
  builder
    .addGroup('interactive', 'Interactive Elements')
    .addItem('quiz', {
      label: 'Quiz/Poll',
      icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
        <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286zm1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94z"/>
      </svg>`,
      onRun: (ctx) => {
        const commands = ctx.get(commandsCtx)
        commands.call(insertQuizCommand.key)
      }
    })
    .addItem('poll', {
      label: 'Simple Poll',
      icon: '📊',
      onRun: (ctx) => {
        const commands = ctx.get(commandsCtx)
        commands.call(insertQuizCommand.key, {
          question: 'What is your preference?',
          options: [
            { id: '1', text: 'Option 1', isCorrect: true },
            { id: '2', text: 'Option 2', isCorrect: true },
          ],
          showResult: false
        })
      }
    })

  // Extend existing text group with more options
  const textGroup = builder.getGroup('text')
  textGroup.addItem('callout', {
    label: 'Callout Box',
    icon: '📢',
    onRun: (ctx) => {
      const view = ctx.get(editorViewCtx)
      const { dispatch, state } = view
      const { tr } = state
      
      // Insert a styled callout box
      const calloutText = `> 💡 **Tip:** This is a callout box for important information.`
      dispatch(tr.insertText(calloutText))
    }
  })
}

// Create a custom feature to register the quiz functionality
const quizFeature: DefineFeature = (editor) => {
  editor
    .use(quizSchema)
    .use(insertQuizCommand)
    .use(quizComponent)
}

// Build the editor with quiz functionality
const builder = new CrepeBuilder({ root: '#editor' })

builder
  .addFeature(quizFeature)
  .addFeature(blockEdit, {
    buildMenu: customSlashMenu
  })
```

### Available Groups

The default slash menu has these groups that you can extend:

- `'text'` - Text formatting options (headings, quotes, etc.)
- `'list'` - List-related items (bullet lists, ordered lists, task lists)
- `'advanced'` - Advanced items (images, code blocks, tables, math)

### MenuItem Interface

```typescript
interface MenuItem {
  key: string
  label: string
  icon: string
  onRun: (ctx: Ctx) => void
}
```

### GroupBuilder Methods

```typescript
class GroupBuilder {
  // Add a new group
  addGroup(key: string, label: string): GroupInstance
  
  // Get an existing group to modify
  getGroup(key: string): GroupInstance
  
  // Clear all groups
  clear(): GroupBuilder
}

interface GroupInstance {
  // Add an item to this group
  addItem(key: string, item: Omit<MenuItem, 'key' | 'index'>): GroupInstance
  
  // Clear all items in this group
  clear(): GroupInstance
}
```

### Slash Menu Item Presets

The `SlashMenuItemPresets` provide common patterns:

```typescript
// Simple text insertion
const textItem = SlashMenuItemPresets.textInsertion({
  key: 'signature',
  label: 'Insert Signature',
  icon: '✍️',
  text: 'Best regards,\nYour Name'
})

// Block type replacement (requires nodeType)
const blockItem = SlashMenuItemPresets.blockReplacement({
  key: 'custom-block',
  label: 'Custom Block',
  icon: '📦',
  nodeType: myCustomNodeType,
  attrs: { customAttr: 'value' }
})
```

## Complete Example

Here's a comprehensive example showcasing both toolbar and slash menu extensions with real functionality:

```typescript
import { CrepeBuilder } from '@milkdown/crepe/builder'
import { toolbar, blockEdit } from '@milkdown/crepe/feature'
import { 
  ToolbarItemPresets, 
  type ToolbarItem, 
  type GroupBuilder 
} from '@milkdown/crepe'
import { $markSchema, $command, $nodeSchema } from '@milkdown/utils'
import { toggleMark } from '@milkdown/kit/prose/commands'
import { editorViewCtx, commandsCtx } from '@milkdown/kit/core'

// === HIGHLIGHT TOOLBAR IMPLEMENTATION ===

// Define highlight mark schema
const highlightSchema = $markSchema('highlight', () => ({
  attrs: {
    color: { default: 'yellow' },
  },
  parseDOM: [
    {
      tag: 'mark',
      getAttrs: (node) => ({
        color: (node as HTMLElement).style.backgroundColor || 'yellow',
      }),
    },
  ],
  toDOM: (mark) => [
    'mark',
    {
      style: `background-color: ${mark.attrs.color}`,
      class: 'milkdown-highlight',
    },
  ],
}))

const toggleHighlightCommand = $command('ToggleHighlight', (ctx) => (color = 'yellow') => {
  return toggleMark(highlightSchema.type(ctx), { color })
})

// Advanced highlight toolbar item with color picker
const highlightToolbarItem: ToolbarItem = {
  key: 'highlight',
  icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="m13.498.795.149-.149a1.207 1.207 0 1 1 1.707 1.708l-.149.148a1.5 1.5 0 0 1-.059 2.059L4.854 14.854a.5.5 0 0 1-.233.131l-4 1a.5.5 0 0 1-.606-.606l1-4a.5.5 0 0 1 .131-.232l9.642-9.642a.5.5 0 0 0-.642.056L6.854 4.854a.5.5 0 1 1-.708-.708L9.44.854A1.5 1.5 0 0 1 11.5.796a1.5 1.5 0 0 1 1.998-.001z"/>
  </svg>`,
  tooltip: 'Highlight text (click and hold for colors)',
  onClick: (ctx) => {
    // Simple click highlights with default color
    const commands = ctx.get(commandsCtx)
    commands.call(toggleHighlightCommand.key)
  },
  isActive: (ctx, selection) => {
    const highlightType = highlightSchema.type(ctx)
    const view = ctx.get(editorViewCtx)
    const { from, to } = selection
    let hasHighlight = false
    
    view.state.doc.nodesBetween(from, to, (node) => {
      if (hasHighlight) return false
      if (node.marks.some(mark => mark.type === highlightType)) {
        hasHighlight = true
        return false
      }
    })
    
    return hasHighlight
  },
  isDisabled: (ctx, selection) => selection.empty
}

// === QUIZ SLASH MENU IMPLEMENTATION ===

// Quiz node schema (simplified for example)
const quizSchema = $nodeSchema('quiz', () => ({
  group: 'block',
  content: '',
  attrs: {
    question: { default: 'What is your answer?' },
    options: { 
      default: [
        { id: '1', text: 'Option A', isCorrect: false },
        { id: '2', text: 'Option B', isCorrect: true },
        { id: '3', text: 'Option C', isCorrect: false },
      ] 
    },
    selectedAnswer: { default: null },
    showResult: { default: false },
  },
  toDOM: () => ['div', { class: 'milkdown-quiz' }, 0],
}))

const insertQuizCommand = $command('InsertQuiz', (ctx) => () => {
  return (state, dispatch) => {
    const quizType = quizSchema.type(ctx)
    const { tr } = state
    const quizNode = quizType.create()
    
    if (dispatch) {
      dispatch(tr.replaceSelectionWith(quizNode))
    }
    return true
  }
})

// Advanced slash menu with multiple component types
const advancedSlashMenu = (builder: GroupBuilder) => {
  // Interactive Components Group
  builder
    .addGroup('interactive', '🎮 Interactive')
    .addItem('quiz', {
      label: 'Quiz Component',
      icon: '❓',
      onRun: (ctx) => {
        const commands = ctx.get(commandsCtx)
        commands.call(insertQuizCommand.key)
      }
    })
    .addItem('poll', {
      label: 'Quick Poll',
      icon: '📊',
      onRun: (ctx) => {
        const view = ctx.get(editorViewCtx)
        const { dispatch, state } = view
        const pollText = `
**Poll:** What's your favorite feature?

- [ ] Toolbar customization
- [ ] Slash menu extensions  
- [ ] Real-time collaboration
- [ ] Plugin ecosystem

*Click the boxes to vote!*
        `
        dispatch(state.tr.insertText(pollText.trim()))
      }
    })
    .addItem('feedback', {
      label: 'Feedback Form',
      icon: '📝',
      onRun: (ctx) => {
        const view = ctx.get(editorViewCtx)
        const { dispatch, state } = view
        const formText = `
**Feedback Form**

**Name:** ___________________

**Email:** __________________

**Message:**
___________________________
___________________________
___________________________

**Rating:** ⭐⭐⭐⭐⭐
        `
        dispatch(state.tr.insertText(formText.trim()))
      }
    })

  // Enhanced Text Group
  const textGroup = builder.getGroup('text')
  textGroup
    .addItem('warning-callout', {
      label: 'Warning Box',
      icon: '⚠️',
      onRun: (ctx) => {
        const view = ctx.get(editorViewCtx)
        const { dispatch, state } = view
        const warningText = `> ⚠️ **Warning:** This is important information that requires attention.`
        dispatch(state.tr.insertText(warningText))
      }
    })
    .addItem('info-callout', {
      label: 'Info Box',
      icon: 'ℹ️',
      onRun: (ctx) => {
        const view = ctx.get(editorViewCtx)
        const { dispatch, state } = view
        const infoText = `> ℹ️ **Info:** Here's some helpful information for context.`
        dispatch(state.tr.insertText(infoText))
      }
    })
    .addItem('success-callout', {
      label: 'Success Box',
      icon: '✅',
      onRun: (ctx) => {
        const view = ctx.get(editorViewCtx)
        const { dispatch, state } = view
        const successText = `> ✅ **Success:** Operation completed successfully!`
        dispatch(state.tr.insertText(successText))
      }
    })

  // Advanced formatting group
  builder
    .addGroup('formatting', '🎨 Advanced Formatting')
    .addItem('kbd', {
      label: 'Keyboard Shortcut',
      icon: '⌨️',
      onRun: (ctx) => {
        const view = ctx.get(editorViewCtx)
        const { dispatch, state } = view
        const { from, to } = state.selection
        
        if (from === to) {
          // No selection, insert template
          dispatch(state.tr.insertText('Press `Ctrl+C` to copy'))
        } else {
          // Wrap selection in kbd tags
          const selectedText = state.doc.textBetween(from, to)
          const kbdText = `\`${selectedText}\``
          dispatch(state.tr.replaceWith(from, to, state.schema.text(kbdText)))
        }
      }
    })
    .addItem('badge', {
      label: 'Status Badge',
      icon: '🏷️',
      onRun: (ctx) => {
        const view = ctx.get(editorViewCtx)
        const { dispatch, state } = view
        const badgeText = `**[NEW]**`
        dispatch(state.tr.insertText(badgeText))
      }
    })
}

// === BUILD THE COMPLETE EDITOR ===

const builder = new CrepeBuilder({
  root: '#editor',
  defaultValue: `# Welcome to Enhanced Crepe!

Try out the new features:
- Select text and use the highlight button in the toolbar
- Type \`/\` to see the enhanced slash menu with interactive components

## Getting Started

Select this text and click the highlight button! Then try typing \`/quiz\` to insert an interactive quiz component.
`
})

// Register all schemas and commands
builder
  .use(highlightSchema)
  .use(toggleHighlightCommand)
  .use(quizSchema)
  .use(insertQuizCommand)

// Configure features
builder
  .addFeature(toolbar, {
    customItems: [
      highlightToolbarItem,
      // Quick highlight colors
      {
        key: 'highlight-yellow',
        icon: '🟨',
        tooltip: 'Yellow highlight',
        onClick: (ctx) => {
          const commands = ctx.get(commandsCtx)
          commands.call(toggleHighlightCommand.key, 'yellow')
        },
        isActive: (ctx, selection) => {
          // Check for yellow highlight specifically
          const highlightType = highlightSchema.type(ctx)
          const view = ctx.get(editorViewCtx)
          const { from, to } = selection
          let hasYellowHighlight = false
          
          view.state.doc.nodesBetween(from, to, (node) => {
            if (hasYellowHighlight) return false
            const mark = node.marks.find(m => m.type === highlightType)
            if (mark && mark.attrs.color === 'yellow') {
              hasYellowHighlight = true
              return false
            }
          })
          
          return hasYellowHighlight
        },
        isDisabled: (ctx, selection) => selection.empty
      },
      {
        key: 'highlight-green',
        icon: '🟩',
        tooltip: 'Green highlight',
        onClick: (ctx) => {
          const commands = ctx.get(commandsCtx)
          commands.call(toggleHighlightCommand.key, '#90EE90')
        },
        isActive: (ctx, selection) => {
          const highlightType = highlightSchema.type(ctx)
          const view = ctx.get(editorViewCtx)
          const { from, to } = selection
          let hasGreenHighlight = false
          
          view.state.doc.nodesBetween(from, to, (node) => {
            if (hasGreenHighlight) return false
            const mark = node.marks.find(m => m.type === highlightType)
            if (mark && mark.attrs.color === '#90EE90') {
              hasGreenHighlight = true
              return false
            }
          })
          
          return hasGreenHighlight
        },
        isDisabled: (ctx, selection) => selection.empty
      }
    ]
  })
  .addFeature(blockEdit, {
    buildMenu: advancedSlashMenu
  })

// Create the editor
const editor = builder.create()

// Add custom styles for the enhanced components
const style = document.createElement('style')
style.textContent = `
  .milkdown-highlight {
    padding: 1px 2px;
    border-radius: 2px;
  }
  
  .milkdown-quiz {
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    padding: 16px;
    margin: 16px 0;
    background: #f9f9f9;
  }
  
  /* Callout styles */
  blockquote:has(strong:first-child:contains("Warning")) {
    border-left: 4px solid #ff6b6b;
    background: #fff5f5;
    color: #c92a2a;
  }
  
  blockquote:has(strong:first-child:contains("Info")) {
    border-left: 4px solid #339af0;
    background: #f0f8ff;
    color: #1864ab;
  }
  
  blockquote:has(strong:first-child:contains("Success")) {
    border-left: 4px solid #51cf66;
    background: #f3fff3;
    color: #2b8a3e;
  }
`
document.head.appendChild(style)
```

## CSS Styling for Enhanced Components

```css
/* Enhanced highlight styles */
.milkdown-highlight {
  padding: 1px 2px;
  border-radius: 2px;
  transition: background-color 0.2s ease;
}

/* Quiz component styles */
.milkdown-quiz {
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
  background: #f9f9f9;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
}

.quiz-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.quiz-question {
  flex: 1;
  margin: 0;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  min-height: 24px;
}

.quiz-option {
  margin: 8px 0;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
}

.quiz-option label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.quiz-result.correct {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
  padding: 12px;
  border-radius: 4px;
  margin-top: 16px;
}

.quiz-result.incorrect {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  padding: 12px;
  border-radius: 4px;
  margin-top: 16px;
}

/* Callout box styles */
blockquote {
  margin: 16px 0;
  padding: 12px 16px;
  border-radius: 4px;
  font-weight: 500;
}

/* Warning callout */
blockquote:has(> :first-child:contains("⚠️")) {
  border-left: 4px solid #ff6b6b;
  background: #fff5f5;
  color: #c92a2a;
}

/* Info callout */
blockquote:has(> :first-child:contains("ℹ️")) {
  border-left: 4px solid #339af0;
  background: #f0f8ff;
  color: #1864ab;
}

/* Success callout */
blockquote:has(> :first-child:contains("✅")) {
  border-left: 4px solid #51cf66;
  background: #f3fff3;
  color: #2b8a3e;
}

/* Keyboard shortcut styling */
code {
  background: #f1f3f4;
  border: 1px solid #dadce0;
  border-radius: 4px;
  padding: 2px 6px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.85em;
}

/* Badge styling */
strong:contains("[") {
  background: #007bff;
  color: white;
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 0.75em;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
```

## Best Practices

1. **Unique Keys**: Always use unique keys for your toolbar items and menu items
2. **Icon Format**: Use SVG strings for consistent styling, or simple emoji for quick prototyping
3. **Context Usage**: Access the Milkdown context (`ctx`) to interact with the editor state and commands
4. **Error Handling**: Add proper error handling in your `onClick` and `onRun` functions
5. **State Management**: Use `isActive` and `isDisabled` functions to provide proper visual feedback
6. **Use Presets**: Leverage `ToolbarItemPresets` and `SlashMenuItemPresets` for common patterns

## Advanced Usage

For more advanced plugin development, you can:

- Access the ProseMirror editor state and view through the context
- Use Milkdown commands and schemas
- Create custom ProseMirror nodes and marks
- Integrate with external services or APIs
- Build interactive components with real-time state management
- Implement complex user interactions with popups and modals

### Component Styling Guidelines

When creating custom components, follow these styling principles:

1. **Consistent Spacing**: Use consistent margins and padding (multiples of 8px)
2. **Color Scheme**: Follow the editor's theme colors for borders and backgrounds
3. **Responsive Design**: Ensure components work well on different screen sizes
4. **Accessibility**: Include proper ARIA labels and keyboard navigation
5. **State Feedback**: Provide clear visual feedback for different component states

### Example Component CSS Framework

```css
/* Base component container */
.milkdown-custom-component {
  border: 2px solid var(--milkdown-border-color, #e0e0e0);
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
  background: var(--milkdown-surface, #f9f9f9);
  font-family: var(--milkdown-font-family, -apple-system, BlinkMacSystemFont, sans-serif);
}

/* Interactive elements */
.milkdown-button {
  background: var(--milkdown-primary, #007bff);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.milkdown-button:hover {
  background: var(--milkdown-primary-dark, #0056b3);
}

.milkdown-button:disabled {
  background: var(--milkdown-muted, #6c757d);
  cursor: not-allowed;
}

/* Input fields */
.milkdown-input {
  border: 1px solid var(--milkdown-border, #ddd);
  border-radius: 4px;
  padding: 8px;
  font-size: 14px;
  width: 100%;
  background: var(--milkdown-input-bg, white);
}

.milkdown-input:focus {
  outline: none;
  border-color: var(--milkdown-primary, #007bff);
  box-shadow: 0 0 0 2px var(--milkdown-primary-light, rgba(0, 123, 255, 0.25));
}

/* Status indicators */
.milkdown-success {
  background: var(--milkdown-success-bg, #d4edda);
  color: var(--milkdown-success-text, #155724);
  border: 1px solid var(--milkdown-success-border, #c3e6cb);
}

.milkdown-error {
  background: var(--milkdown-error-bg, #f8d7da);
  color: var(--milkdown-error-text, #721c24);
  border: 1px solid var(--milkdown-error-border, #f5c6cb);
}

.milkdown-warning {
  background: var(--milkdown-warning-bg, #fff3cd);
  color: var(--milkdown-warning-text, #856404);
  border: 1px solid var(--milkdown-warning-border, #ffeaa7);
}

.milkdown-info {
  background: var(--milkdown-info-bg, #d1ecf1);
  color: var(--milkdown-info-text, #0c5460);
  border: 1px solid var(--milkdown-info-border, #bee5eb);
}
```

### Component Integration Best Practices

1. **State Management**: Always update component state through ProseMirror transactions
2. **Event Handling**: Use proper event delegation and cleanup
3. **Performance**: Avoid unnecessary re-renders and DOM manipulations
4. **Error Handling**: Implement graceful fallbacks for edge cases
5. **Testing**: Create unit tests for component logic and integration tests for editor interactions

Refer to the Milkdown and ProseMirror documentation for detailed information about editor internals.