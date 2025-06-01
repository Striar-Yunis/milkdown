# Simplified Plugin Examples

This directory contains simplified, easy-to-understand plugin examples for Milkdown. These examples focus on clarity and functionality over visual complexity.

## Examples Included

### Quiz Plugin (Vanilla JavaScript)
- **Location**: `features/quiz.ts` + `components/quiz-component.ts`
- **Lines**: 168 total (reduced from 391)
- **Features**: Simple quiz with option selection and result display
- **Approach**: Minimal DOM manipulation using innerHTML templates

### Highlight Plugin
- **Location**: `features/highlight.ts`
- **Features**: Text highlighting functionality

## Key Improvements

1. **Simplified DOM Manipulation**: Uses innerHTML instead of complex DOM creation
2. **Minimal Styling**: Basic inline styles instead of extensive CSS-in-JS
3. **Reduced Boilerplate**: Streamlined schema and command definitions
4. **Clear Code Structure**: Easy to read and modify

## For Complex Examples

If you need more advanced features like editing modals, complex styling, or advanced interactions, see the `./complex/` directory which contains the full-featured versions.

## Usage

```typescript
import { quizFeature } from './features/quiz'

// Add to your editor
editor.use(quizFeature)
```

The simplified examples maintain all core functionality while being much easier to understand and extend.