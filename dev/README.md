# Plugin Examples - Simplified & Complex

This directory contains plugin examples for Milkdown, organized to provide both simple learning examples and complex reference implementations.

## 🚀 Quick Start - Use the Simplified Examples

### Vanilla JavaScript
- **Location**: `./vanilla/`
- **Quiz Example**: 168 lines total (components + features)
- **Focus**: Clean, minimal code for learning plugin development

### React
- **Location**: `./react/`  
- **Quiz Example**: 189 lines total (components + features)
- **Focus**: Proper React patterns with useState and clean components

## 📚 Structure

```
dev/
├── vanilla/              # 📖 SIMPLIFIED vanilla JS examples
│   ├── README.md         # Getting started guide
│   ├── features/         # Simplified feature definitions
│   ├── components/       # Simple component implementations  
│   └── complex/          # 🔧 Original complex examples
├── react/                # 📖 SIMPLIFIED React examples
│   ├── README.md         # Getting started guide
│   ├── features/         # Simplified feature definitions
│   ├── components/       # Clean React components
│   └── complex/          # 🔧 Original complex examples
└── src/                  # Build tooling
```

## ✨ What's New - Dramatically Simplified Examples

### Before vs After

**Vanilla JavaScript Quiz:**
- **Before**: 391 lines of complex DOM manipulation
- **After**: 168 lines with simple innerHTML templates
- **Reduction**: 57% fewer lines

**React Quiz:**
- **Before**: 526 lines across multiple complex files  
- **After**: 189 lines in clean, focused components
- **Reduction**: 64% fewer lines

### Key Improvements

✅ **Simple DOM Updates**: Uses innerHTML instead of complex createElement chains  
✅ **Minimal Styling**: Basic inline styles instead of extensive CSS-in-JS  
✅ **Proper React Patterns**: useState instead of DOM manipulation  
✅ **Reduced Boilerplate**: Streamlined schemas and commands  
✅ **Easy to Understand**: Focus on functionality over visual complexity  

## 🎯 When to Use Which Examples

### Use Simplified Examples When:
- Learning plugin development
- Building basic functionality
- Need clean, maintainable code
- Want to understand core concepts

### Use Complex Examples When:
- Need advanced editing features
- Want complex modal systems
- Building production-ready UIs
- Need advanced interactions

## 🏃 Running Examples

```bash
cd dev
npx vite --config vite.config.mts
# Visit: http://localhost:5173/vanilla/ or http://localhost:5173/react/
```

## 📖 Features Demonstrated

### Text Highlighting
- Multiple colors with toolbar integration
- State management and visual feedback
- Complete ProseMirror mark implementation

### Interactive Quiz Blocks  
- Question and answer functionality
- Selection feedback and result display
- Clean component-based architecture
- Easy insertion and interaction

**Start with the simplified examples for the best learning experience!**
