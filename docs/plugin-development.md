# Crepe Plugin Development Guide

This guide shows how to create custom plugins for the Crepe editor to extend both the toolbar and slash menu functionality.

## Quick Start

```typescript
import { CrepeBuilder } from '@milkdown/crepe/builder'
import { toolbar, blockEdit } from '@milkdown/crepe/feature'
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

You can add custom toolbar items by providing a `customItems` array in the toolbar feature configuration:

```typescript
import { CrepeBuilder } from '@milkdown/crepe/builder'
import { toolbar, type ToolbarItem, ToolbarItemPresets } from '@milkdown/crepe/feature/toolbar'

// Define a custom toolbar item
const customHighlightItem: ToolbarItem = {
  key: 'highlight',
  icon: '<svg width="16" height="16" viewBox="0 0 16 16"><path d="M2 3h12v2H2V3zm0 4h12v2H2V7zm0 4h12v2H2v-2z"/></svg>',
  tooltip: 'Highlight text',
  onClick: (ctx) => {
    // Your custom logic here
    console.log('Highlight text clicked!')
    
    // Example: Get the current editor view and selection
    const view = ctx.get(editorViewCtx)
    const { selection } = view.state
    
    // Add your custom formatting/command logic
  },
  isActive: (ctx, selection) => {
    // Return true if the button should appear active/pressed
    return false
  },
  isDisabled: (ctx, selection) => {
    // Return true if the button should be disabled
    return selection.empty
  }
}

// Or use presets for common patterns
const presetItem = ToolbarItemPresets.requiresSelection({
  key: 'my-action',
  icon: '🎯',
  tooltip: 'My Action',
  onClick: (ctx) => {
    // This item is automatically disabled when selection is empty
  }
})

// Add the toolbar with custom items
builder.addFeature(toolbar, {
  customItems: [customHighlightItem, presetItem]
})
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

You can customize the slash menu by providing a `buildMenu` function in the block edit feature configuration:

```typescript
import { CrepeBuilder } from '@milkdown/crepe/builder'
import { blockEdit, type GroupBuilder, SlashMenuItemPresets } from '@milkdown/crepe/feature/block-edit'

// Define custom slash menu items
const customMenuBuilder = (builder: GroupBuilder) => {
  // Add a completely new group
  builder
    .addGroup('custom', 'Custom Elements')
    .addItem('highlight-block', {
      label: 'Highlight Block',
      icon: '<svg width="16" height="16" viewBox="0 0 16 16"><rect fill="yellow" x="2" y="2" width="12" height="12"/></svg>',
      onRun: (ctx) => {
        console.log('Highlight block inserted!')
        
        // Example: Insert a custom block
        const view = ctx.get(editorViewCtx)
        const { dispatch, state } = view
        
        // Add your custom block insertion logic here
      }
    })
    .addItem('text-snippet', SlashMenuItemPresets.textInsertion({
      key: 'hello',
      label: 'Insert Hello',
      icon: '👋',
      text: 'Hello, World!'
    }))

  // You can also modify existing groups
  const textGroup = builder.getGroup('text')
  textGroup.addItem('custom-text', {
    label: 'Custom Text Style',
    icon: '<svg width="16" height="16" viewBox="0 0 16 16"><text x="8" y="12" text-anchor="middle" font-size="12">T</text></svg>',
    onRun: (ctx) => {
      // Your custom text formatting logic
    }
  })
}

// Add block edit with custom menu
builder.addFeature(blockEdit, {
  buildMenu: customMenuBuilder
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

```typescript
import { CrepeBuilder } from '@milkdown/crepe/builder'
import { toolbar, blockEdit } from '@milkdown/crepe/feature'
import { 
  ToolbarItemPresets, 
  SlashMenuItemPresets,
  type ToolbarItem, 
  type GroupBuilder 
} from '@milkdown/crepe'

// Custom toolbar item
const customToolbarItem: ToolbarItem = {
  key: 'my-custom-action',
  icon: '🎨',
  tooltip: 'Apply custom styling',
  onClick: (ctx) => {
    // Your custom toolbar action
  },
  isActive: (ctx, selection) => false,
  isDisabled: (ctx, selection) => selection.empty
}

// Custom slash menu builder
const customSlashMenu = (builder: GroupBuilder) => {
  builder
    .addGroup('my-plugins', 'My Custom Plugins')
    .addItem('custom-element', {
      label: 'Custom Element',
      icon: '⭐',
      onRun: (ctx) => {
        // Your custom element insertion
      }
    })
    .addItem('quick-text', SlashMenuItemPresets.textInsertion({
      key: 'signature',
      label: 'My Signature',
      icon: '✍️',
      text: '---\nBest regards,\nJohn Doe'
    }))
}

// Create editor with plugins
const builder = new CrepeBuilder({
  root: '#editor',
  defaultValue: '# Welcome to Custom Crepe!'
})

builder
  .addFeature(toolbar, {
    customItems: [
      customToolbarItem,
      ToolbarItemPresets.requiresSelection({
        key: 'highlight',
        icon: '🌟',
        tooltip: 'Highlight text',
        onClick: (ctx) => { /* highlight logic */ }
      })
    ]
  })
  .addFeature(blockEdit, {
    buildMenu: customSlashMenu
  })

const editor = builder.create()
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

Refer to the Milkdown and ProseMirror documentation for detailed information about editor internals.