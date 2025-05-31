# Crepe Plugin Development Guide

This guide shows how to create custom plugins for the Crepe editor to extend both the toolbar and slash menu functionality. The examples below are based on the working implementations in `./dev` directory.

## Quick Start

### Vanilla JavaScript / TypeScript

```typescript
import { CrepeBuilder } from '@milkdown/crepe/builder'
import { toolbar, blockEdit } from '@milkdown/crepe'

const builder = new CrepeBuilder({ root: '#editor' })

// Add custom toolbar items
builder.addFeature(toolbar, {
  customItems: [
    {
      key: 'highlight',
      icon: '🎨',
      tooltip: 'Highlight text',
      onClick: (ctx) => {
        // Your custom logic
      },
      isActive: (ctx, selection) => false,
      isDisabled: (ctx, selection) => selection.empty
    }
  ]
})

// Add custom slash menu items
builder.addFeature(blockEdit, {
  buildMenu: (builder) => {
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

### React Integration

```tsx
import React from 'react'
import { Crepe, toolbar, blockEdit } from '@milkdown/crepe'
import { Milkdown, MilkdownProvider, useEditor } from '@milkdown/integrations/react'

const CrepeEditor = () => {
  useEditor((root) => {
    const crepe = new Crepe({ root })
    crepe
      .addFeature(toolbar, {
        customItems: [/* your toolbar items */]
      })
      .addFeature(blockEdit, {
        buildMenu: (builder) => {
          // your menu customization
        }
      })
    return crepe
  })
  return <Milkdown />
}

export const App = () => (
  <MilkdownProvider>
    <CrepeEditor />
  </MilkdownProvider>
)
```

## Toolbar Plugins

You can add custom toolbar items by providing a `customItems` array in the toolbar feature configuration. Here's a complete example implementing text highlighting based on the working implementation in `./dev/non-react/features/highlight.ts`:

```typescript
// highlight.ts - Define the highlight feature
import { $markSchema, $command } from '@milkdown/utils'
import { toggleMark } from '@milkdown/kit/prose/commands'
import { editorViewCtx, commandsCtx } from '@milkdown/kit/core'
import type { Ctx } from '@milkdown/kit/ctx'
import type { Selection } from '@milkdown/kit/prose/state'
import type { DefineFeature } from '@milkdown/crepe/feature/shared'
import type { ToolbarItem } from '@milkdown/crepe/feature/toolbar'
import { ToolbarItemPresets } from '@milkdown/crepe'

// 1. Define the highlight mark schema
export const highlightSchema = $markSchema('highlight', () => ({
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

// 2. Define the toggle command
export const toggleHighlightCommand = $command(
  'ToggleHighlight',
  (ctx) =>
    (color = 'yellow') => {
      return toggleMark(highlightSchema.type(ctx), { color })
    }
)

// 3. Helper function to check if text is highlighted
function isHighlightActive(ctx: Ctx, selection: Selection): boolean {
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

// 4. Create the highlight feature
export const highlightFeature: DefineFeature = (editor) => {
  editor.use(highlightSchema).use(toggleHighlightCommand)
}

// 5. Main highlight toolbar item using ToolbarItemPresets
export const highlightToolbarItem: ToolbarItem = ToolbarItemPresets.requiresSelection({
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
})

// 6. Color-specific highlight items using ToolbarItemPresets
export const createHighlightItem = (color: string, name: string): ToolbarItem => ToolbarItemPresets.requiresSelection({
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
})

// 7. Predefined color toolbar items
export const highlightToolbarItems: ToolbarItem[] = [
  highlightToolbarItem,
  createHighlightItem('yellow', 'Yellow'),
  createHighlightItem('#ffcccc', 'Pink'),
  createHighlightItem('#ccffcc', 'Green'),
  createHighlightItem('#ccccff', 'Blue'),
  createHighlightItem('#ffcc99', 'Orange'),
]
```

```typescript
// index.ts - Setup the editor
import { CrepeBuilder } from '@milkdown/crepe/builder'
import { toolbar } from '@milkdown/crepe/feature/toolbar'
import { highlightFeature, highlightToolbarItems } from './highlight'

const builder = new CrepeBuilder({ root: '#editor' })

builder
  // Register the highlight feature
  .addFeature(highlightFeature)
  // Add toolbar with highlight items
  .addFeature(toolbar, {
    customItems: highlightToolbarItems,
  })

const editor = builder.create()
```

## Plugin Utilities

Crepe provides helpful utility functions to simplify common plugin patterns. These utilities reduce boilerplate code and ensure consistent behavior across plugins.

### ToolbarItemPresets

The `ToolbarItemPresets` utility provides common toolbar item configurations:

```typescript
import { ToolbarItemPresets } from '@milkdown/crepe'

// Item that requires text selection (automatically disabled when selection is empty)
const selectionItem = ToolbarItemPresets.requiresSelection({
  key: 'my-item',
  icon: '🎨',
  tooltip: 'My Action',
  onClick: (ctx) => { /* your logic */ },
  isActive: (ctx, selection) => false, // optional
})

// Item that is always enabled
const alwaysEnabledItem = ToolbarItemPresets.alwaysEnabled({
  key: 'my-item',
  icon: '🔧',
  tooltip: 'Always Available',
  onClick: (ctx) => { /* your logic */ },
  isActive: (ctx, selection) => false, // optional
})
```

### SlashMenuItemPresets

The `SlashMenuItemPresets` utility provides common slash menu item patterns:

```typescript
import { SlashMenuItemPresets } from '@milkdown/crepe'

// Simple text insertion
const textItem = SlashMenuItemPresets.textInsertion({
  key: 'signature',
  label: 'Insert Signature',
  icon: '✍️',
  text: 'Best regards,\nJohn Doe'
})

// Block replacement (requires NodeType)
const blockItem = SlashMenuItemPresets.blockReplacement({
  key: 'callout',
  label: 'Callout Block',
  icon: '📢',
  nodeType: myNodeType, // Your ProseMirror NodeType
  attrs: { type: 'info' } // optional attributes
})
```

These utilities handle common patterns like:
- Automatic disabling when selection is empty (`requiresSelection`)
- Text insertion at cursor position (`textInsertion`)
- Block type replacement (`blockReplacement`)
- Consistent state management

### ToolbarItem Interface

```typescript
interface ToolbarItem {
  /// Unique identifier for the toolbar item
  key: string
  /// Icon to display (SVG string or HTML)  
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

### Available Groups

The default slash menu has these groups that you can extend:

- `'text'` - Text formatting options (headings, quotes, etc.)
- `'list'` - List-related items (bullet lists, ordered lists, task lists)
- `'advanced'` - Advanced items (images, code blocks, tables, math)

### MenuItem Interface

```typescript
interface MenuItem {
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
}

interface GroupInstance {
  // Add an item to this group
  addItem(key: string, item: MenuItem): GroupInstance
}
```

## Slash Menu Plugins

You can customize the slash menu by providing a `buildMenu` function in the block edit feature configuration. Here's a comprehensive example implementing an interactive quiz component based on the working implementation in `./dev/non-react/features/quiz.ts`:

```typescript
// quiz-component.ts - Define the quiz component
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
  ctx: any
  modalEl: HTMLDivElement | null = null
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
    const { question, options, selectedAnswer, showResult } = this.node.attrs || {}
    
    this.dom.innerHTML = ''
    this.dom.className = 'quiz-component'
    this.dom.style.cssText = `
      border: 2px solid ${this.selected ? '#007bff' : '#e1e5e9'};
      border-radius: 8px;
      padding: 16px;
      margin: 8px 0;
      background-color: ${this.selected ? '#f8f9fa' : '#fff'};
      transition: all 0.2s ease;
    `

    // Question element
    const questionEl = document.createElement('div')
    questionEl.className = 'quiz-question'
    questionEl.style.cssText = `
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 12px;
      color: #333;
    `
    questionEl.textContent = question
    this.dom.appendChild(questionEl)

    // Options container
    const optionsEl = document.createElement('div')
    optionsEl.className = 'quiz-options'
    this.dom.appendChild(optionsEl)

    options.forEach((option: QuizOption) => {
      const optionEl = document.createElement('div')
      optionEl.className = 'quiz-option'
      const isSelected = selectedAnswer === option.id
      optionEl.style.cssText = `
        padding: 10px;
        margin: 4px 0;
        border: 1px solid ${isSelected ? '#2196f3' : '#ddd'};
        border-radius: 4px;
        cursor: pointer;
        background-color: ${isSelected ? '#e3f2fd' : '#fff'};
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
      `

      const radioIcon = document.createElement('span')
      radioIcon.style.cssText = `
        margin-right: 8px;
        color: ${isSelected ? '#2196f3' : '#666'};
      `
      radioIcon.textContent = isSelected ? '●' : '○'
      optionEl.appendChild(radioIcon)

      const textSpan = document.createElement('span')
      textSpan.textContent = option.text
      optionEl.appendChild(textSpan)

      if (showResult && option.isCorrect) {
        const checkIcon = document.createElement('span')
        checkIcon.style.cssText = `
          margin-left: auto;
          color: #4caf50;
          font-weight: bold;
        `
        checkIcon.textContent = '✓'
        optionEl.appendChild(checkIcon)
      }

      optionEl.addEventListener('click', () => this.selectAnswer(option.id))
      optionsEl.appendChild(optionEl)
    })

    // Show result
    if (showResult) {
      const resultEl = document.createElement('div')
      resultEl.className = 'quiz-result'
      resultEl.style.cssText = `
        margin-top: 12px;
        padding: 8px 12px;
        background-color: #e8f5e8;
        border-radius: 4px;
        color: #2e7d32;
        font-weight: bold;
      `
      const correctOptions = options.filter((o: QuizOption) => o.isCorrect)
      resultEl.textContent = `Correct answer: ${correctOptions.map(o => o.text).join(', ')}`
      this.dom.appendChild(resultEl)
    }

    // Edit button (when selected)
    if (this.selected) {
      const editBtn = document.createElement('button')
      editBtn.className = 'quiz-edit-btn'
      editBtn.textContent = 'Edit Quiz'
      editBtn.style.cssText = `
        margin-top: 12px;
        padding: 8px 16px;
        background-color: #007bff;
        color: #fff;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        font-weight: bold;
      `
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        this.openEditModal()
      })
      this.dom.appendChild(editBtn)
    }
  }

  selectAnswer = (answerId: string) => {
    const options = Array.isArray(this.node.attrs?.options) ? this.node.attrs.options : []
    const selected = options.find((o: QuizOption) => o.id === answerId)
    
    if (selected && selected.isCorrect) {
      this.showPopup('🎉 Correct! Well done!')
    } else {
      this.showPopup('❌ Not quite right, try again!')
    }
    
    this.updateAttributes({ selectedAnswer: answerId, showResult: true })
  }

  updateAttributes(attrs: Partial<QuizAttrs>) {
    const pos = this.getPos()
    if (typeof pos !== 'number') return
    
    const baseAttrs = typeof this.node.attrs === 'object' && this.node.attrs !== null ? this.node.attrs : {}
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
    
    if (selection.from <= pos && selection.to >= pos + (this.node.nodeSize || 1)) {
      this.selected = true
    }
    
    this.render()
  }

  openEditModal = () => {
    // Modal implementation - see working example for full code
    // Allows editing question and options with add/delete functionality
  }

  showPopup(message: string) {
    // Popup implementation for feedback messages
    // Shows success/error messages when answers are selected
  }

  destroy() {
    document.removeEventListener('selectionchange', this.updateSelection)
  }
}
```

```typescript
// quiz.ts - Define the quiz feature
import { $nodeSchema, $command, $component } from '@milkdown/utils'
import { commandsCtx } from '@milkdown/kit/core'
import type { DefineFeature } from '@milkdown/crepe/feature/shared'
import { QuizComponent, type QuizOption, type QuizAttrs } from './quiz-component'

// 1. Create the quiz node schema (IMPORTANT: atom: true prevents drag errors)
export const quizSchema = $nodeSchema('quiz', () => ({
  group: 'block',
  content: '',
  atom: true,  // Leaf node - prevents "Content hole not allowed" drag errors
  selectable: true,
  attrs: {
    question: { default: 'Enter your question here' },
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
        return {
          question: element.dataset.question || 'Enter your question here',
          options: JSON.parse(element.dataset.options || '[]'),
          selectedAnswer: element.dataset.selectedAnswer || null,
          showResult: element.dataset.showResult === 'true',
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

// 2. Command to insert a quiz
export const insertQuizCommand = $command('InsertQuiz', (ctx) => (attrs?: Partial<QuizAttrs>) => {
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

// 3. Quiz component registration
export const quizComponent = $component('quiz', (ctx) => {
  return {
    component: QuizComponent,
    as: 'div',
    shouldUpdate: (prev, next) => prev.attrs !== next.attrs,
  }
})

// 4. Quiz feature that registers everything
export const quizFeature: DefineFeature = (editor) => {
  editor.use(quizSchema).use(insertQuizCommand).use(quizComponent)
}

// 5. Custom slash menu builder function
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
```

```typescript
// index.ts - Setup the editor with quiz functionality
import { CrepeBuilder } from '@milkdown/crepe/builder'
import { blockEdit } from '@milkdown/crepe/feature/block-edit'
import { quizFeature, customSlashMenu } from './quiz'

const builder = new CrepeBuilder({ root: '#editor' })

builder
  // Register the quiz feature
  .addFeature(quizFeature)
  // Add block edit with custom slash menu
  .addFeature(blockEdit, {
    buildMenu: customSlashMenu,
  })

const editor = builder.create()
```

### Key Implementation Notes

1. **`atom: true`**: Essential for leaf nodes to prevent drag-and-drop errors
2. **Component Lifecycle**: Proper event listener cleanup in `destroy()` method
3. **State Management**: Use ProseMirror transactions for all attribute updates
4. **Selection Handling**: Listen to selection changes for visual feedback
5. **Modal Integration**: Edit functionality follows the image block pattern

## Complete Example

Here's a comprehensive example showcasing both toolbar and slash menu extensions with real functionality, based on the working implementation in `./dev`:

```typescript
// main.ts - Complete working example
import { CrepeBuilder } from '@milkdown/crepe/builder'
import { toolbar } from '@milkdown/crepe/feature/toolbar'
import { blockEdit } from '@milkdown/crepe/feature/block-edit'

// Import highlight feature and toolbar items
import { highlightFeature, highlightToolbarItems } from './features/highlight'

// Import quiz feature and slash menu
import { quizFeature, customSlashMenu } from './features/quiz'

// Import styles
import '@milkdown/crepe/theme/common/style.css'
import '@milkdown/crepe/theme/frame/style.css'

// Build the editor with both highlight and quiz features
const builder = new CrepeBuilder({ root: '#editor' })

builder
  // Register features
  .addFeature(highlightFeature)
  .addFeature(quizFeature)

  // Add toolbar with highlight items
  .addFeature(toolbar, {
    customItems: highlightToolbarItems,
  })

  // Add block edit with custom slash menu
  .addFeature(blockEdit, {
    buildMenu: customSlashMenu,
  })

// Create the editor
const editor = builder.create()
```

### React Integration Example

```tsx
// React version based on ./dev/react/index.tsx
import React from 'react'
import { toolbar } from '@milkdown/crepe/feature/toolbar'
import { Crepe, blockEdit } from '@milkdown/crepe'
import {
  Milkdown,
  MilkdownProvider,
  useEditor,
} from '@milkdown/integrations/react'

// Import features
import { highlightFeature, highlightToolbarItems } from './features/highlight'
import { quizFeature, customSlashMenu } from './features/quiz'

// Import styles
import '@milkdown/crepe/theme/common/style.css'
import '@milkdown/crepe/theme/frame/style.css'

// Crepe Editor component
const CrepeEditor = () => {
  useEditor((root) => {
    const crepe = new Crepe({ root })
    crepe
      .addFeature(quizFeature)
      .addFeature(highlightFeature)
      .addFeature(toolbar, {
        customItems: highlightToolbarItems,
      })
      .addFeature(blockEdit, {
        buildMenu: customSlashMenu,
      })
    return crepe
  })
  return <Milkdown />
}

// Main wrapper component
export const MilkdownEditorWrapper = () => (
  <MilkdownProvider>
    <CrepeEditor />
  </MilkdownProvider>
)
```

## Best Practices

1. **Unique Keys**: Always use unique keys for your toolbar items and menu items
2. **Icon Format**: Use SVG strings for consistent styling, or simple HTML for quick prototyping
3. **Context Usage**: Access the Milkdown context (`ctx`) to interact with the editor state and commands
4. **Error Handling**: Add proper error handling in your `onClick` and `onRun` functions
5. **State Management**: Use `isActive` and `isDisabled` functions to provide proper visual feedback
6. **Leaf Nodes**: Use `atom: true` for custom block components to prevent drag-and-drop errors
7. **Component Lifecycle**: Always clean up event listeners in component `destroy()` methods

## Common Pitfalls

1. **Drag-and-Drop Errors**: Ensure leaf nodes have `atom: true` and no content holes in `toDOM`
2. **Import Paths**: Use correct relative paths for development or proper package imports for distribution
3. **Builder Methods**: Use `builder.addFeature()` not `builder.use()` for Crepe
4. **Selection Handling**: Check for valid selection states before accessing editor view
5. **Event Cleanup**: Remove event listeners to prevent memory leaks

## File Structure

For best organization, structure your plugins like the working examples:

```
features/
├── highlight.ts          # Highlight mark and toolbar items
├── quiz.ts              # Quiz schema and commands
└── components/
    └── quiz-component.ts # Quiz component implementation

index.ts                 # Main entry point
```

This structure separates concerns and makes your plugins maintainable and reusable across different projects.