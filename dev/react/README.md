# Simplified React Plugin Examples

This directory contains simplified, easy-to-understand React plugin examples for Milkdown. These examples use proper React patterns and modern conventions.

## Examples Included

### Quiz Plugin (React)
- **Location**: `features/quiz.ts` + `components/quiz-component.tsx`
- **Lines**: 189 total (reduced from 526)
- **Features**: Simple quiz with option selection and result display
- **Approach**: Clean React component with proper state management

### Highlight Plugin
- **Location**: `features/highlight.ts`
- **Features**: Text highlighting functionality

## Key Improvements

1. **Proper React Patterns**: Uses React state management instead of DOM manipulation
2. **Clean Component Structure**: Inline styles instead of complex CSS systems
3. **Reduced Complexity**: Removed unnecessary modal systems and popups
4. **Modern React**: Uses functional components and clean patterns
5. **Easy to Extend**: Clear component structure for adding features

## For Complex Examples

If you need more advanced features like editing modals, complex state management, or advanced interactions, see the `./complex/` directory which contains the full-featured versions.

## Usage

```typescript
import { quizFeature } from './features/quiz'

// Add to your editor
editor.use(quizFeature)
```

The simplified examples demonstrate how to build clean, maintainable React components for Milkdown plugins while preserving all essential functionality.