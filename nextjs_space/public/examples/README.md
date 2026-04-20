# Marp Player Example Presentations

This directory contains ready-to-use example Marp Markdown presentations for demonstrating Marp Player capabilities.

## 📚 Available Examples

### `beautiful-example.md` ✨ **RECOMMENDED**
A modern, professional presentation demonstrating all features:
- ✅ Custom CSS with gradients and color variables
- ✅ Multiple slide layouts (hero, content, features, table)
- ✅ Lists, tables, and formatted text
- ✅ Complete YAML frontmatter with metadata
- ✅ Best practices for Marp syntax

**Slides:** 5 | **Size:** ~2.5 KB | **Status:** ✅ Works perfectly

### `simple-example.md` 📖
Perfect for beginners - a minimal working example:
- Basic slide structure
- Simple Markdown formatting
- No custom CSS (uses default theme)
- Clean and easy to understand

**Slides:** 4 | **Size:** ~315 B | **Status:** ✅ Works perfectly

### `speech_1_2.md` 🎤
Professional Russian presentation (technical content):
- Advanced custom CSS with complex styling
- Multiple custom layout classes
- Dark gradient background
- Real-world presentation structure

**Slides:** 23 | **Size:** ~28 KB | **Status:** ✅ Works perfectly

## 🚀 How to Use Examples

### Method 1: Load in the App
1. Open Marp Player
2. Use the **Load** button to import a JSON file, OR
3. Copy-paste the raw Markdown into the editor

### Method 2: Load via API
The files are automatically available at:
```
/api/markdown?file=beautiful-example.md
/api/markdown?file=simple-example.md
/api/markdown?file=speech_1_2.md
```

### Method 3: Use as Template
1. Copy one of these files as a starting point
2. Modify the YAML frontmatter
3. Replace the slide content with your own

## 📝 Marp File Format

All Marp presentations follow this structure:

```markdown
---
marp: true
theme: default
author: Your Name
footer: Your Footer
size: 16:9
paginate: true
title: Presentation Title
description: Optional description
style: |
  :root {
    --primary: #7D63FF;
  }
  section {
    background: white;
    color: #333;
    padding: 60px;
  }
---

# Slide 1: Title

Your content here...

---

# Slide 2: Another Slide

More content...
```

## 💡 Important Tips

- **Line Endings:** Use CRLF (`\r\n`) for proper parsing (like `speech_1_2.md`)
- **Slide Separator:** Use `---` on its own line to separate slides
- **Frontmatter:** YAML frontmatter goes between first and second `---`
- **CSS Styles:** Define custom styles in the `style: |` block
- **Speaker Notes:** Use HTML comments: `<!-- Your notes here -->`
- **HTML Support:** You can include HTML divs and custom elements
- **Emojis:** Supported in titles and content

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `←` / `→` | Previous / Next slide |
| `Space` | Next slide |
| `Home` / `End` | First / Last slide |
| `F` | Toggle fullscreen |
| `Play Button` | Auto-advance slides |

## 🎨 Customization

Each example demonstrates different styling approaches:
- **beautiful-example.md** - Modern gradient design with custom colors
- **simple-example.md** - Minimal styling with default theme
- **speech_1_2.md** - Complex CSS with custom classes and layouts

## 📖 Learn More

1. Start with `simple-example.md` if new to Marp
2. Graduate to `beautiful-example.md` for custom styling
3. Check `speech_1_2.md` for advanced techniques
4. Customize colors, fonts, and layouts in the `style:` block
