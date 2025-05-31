import { $markSchema, $command } from '../../../packages/utils/src'
import { toggleMark } from '../../../packages/kit/src/prose/commands'
import { editorViewCtx, commandsCtx } from '../../../packages/kit/src/core'
import type { Ctx } from '../../../packages/kit/src/ctx'
import type { Selection } from '../../../packages/kit/src/prose/state'
import type { DefineFeature } from '../../../packages/crepe/src/feature/shared'
import type { ToolbarItem } from '../../../packages/crepe/src/feature/toolbar'

// Highlight mark schema
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

// Toggle highlight command
export const toggleHighlightCommand = $command(
  'ToggleHighlight',
  (ctx) =>
    (color = 'yellow') => {
      return toggleMark(highlightSchema.type(ctx), { color })
    }
)

// Helper function to check if text is highlighted
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

// Highlight feature
export const highlightFeature: DefineFeature = (editor) => {
  editor.use(highlightSchema).use(toggleHighlightCommand)
}

// Main highlight toolbar item
export const highlightToolbarItem: ToolbarItem = {
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
  },
}

// Color-specific highlight items
export const createHighlightItem = (color: string, name: string): ToolbarItem => ({
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

// Predefined color toolbar items
export const highlightToolbarItems: ToolbarItem[] = [
  highlightToolbarItem,
  createHighlightItem('yellow', 'Yellow'),
  createHighlightItem('#ffcccc', 'Pink'),
  createHighlightItem('#ccffcc', 'Green'),
  createHighlightItem('#ccccff', 'Blue'),
  createHighlightItem('#ffcc99', 'Orange'),
]