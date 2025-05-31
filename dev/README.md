# Crepe Plugin Examples

This directory contains organized examples of Crepe editor plugins, demonstrating text highlighting and interactive quiz functionality.

## Structure

```
dev/
├── non-react/          # Vanilla JavaScript examples
│   ├── index.html      # Main demo page
│   ├── index.ts        # Editor setup
│   ├── features/       # Feature definitions
│   │   ├── highlight.ts
│   │   └── quiz.ts
│   └── components/     # Component implementations
│       └── quiz-component.ts
├── react/              # React-based examples
│   ├── index.html      # Main demo page
│   ├── index.tsx       # Editor setup
│   ├── features/       # Feature definitions
│   │   ├── highlight.ts
│   │   └── quiz.ts
│   ├── components/     # React components
│   │   ├── QuizComponent.tsx
│   │   ├── QuizReactView.tsx
│   │   └── QuizEditModal.tsx
│   └── types/          # TypeScript types
│       └── quiz.ts
└── legacy/             # Original examples (for reference)
    ├── toolbar-local-test.ts
    └── crepe-react-test.tsx
```

## Features Demonstrated

### 🎨 Text Highlighting
- **Multiple Colors**: Yellow, Pink, Green, Blue, Orange
- **Toolbar Integration**: Custom toolbar buttons with visual feedback
- **State Management**: Active/disabled states based on selection
- **ProseMirror Schema**: Complete mark schema with DOM parsing/serialization

### 📝 Interactive Quiz Blocks
- **Drag & Drop**: Fully draggable quiz blocks
- **Live Editing**: In-place editing with modal interface
- **Answer Validation**: Immediate feedback on correct/incorrect answers
- **State Persistence**: Quiz state maintained across editor operations
- **Slash Menu**: Easy insertion via `/quiz` command

## Running Examples

### Development Server
```bash
# Start development server (opens non-react example)
pnpm dev

# Or access specific examples:
# http://localhost:5173/non-react/index.html
# http://localhost:5173/react/index.html
```

### Build
```bash
pnpm build
```

## Key Implementation Details

### Non-React Example
- Uses vanilla JavaScript DOM manipulation
- Direct ProseMirror node view implementation
- Manual state management and event handling
- No external UI library dependencies

### React Example
- Uses React components for UI rendering
- React Portal integration for modals
- React state management within components
- Clean separation of concerns with TypeScript types

## Code Organization

### Features
Each feature is self-contained with:
- Schema definitions
- Commands
- Component registrations
- Export of reusable items

### Components
Modular component architecture:
- Separate view and edit logic
- Reusable across different contexts
- Clear prop interfaces

### Types
Shared TypeScript definitions:
- Interface definitions
- Type safety across components
- Consistent data structures

This organization makes it easy to understand, maintain, and extend the plugin examples while demonstrating best practices for Crepe plugin development.