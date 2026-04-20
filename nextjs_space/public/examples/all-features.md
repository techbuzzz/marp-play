---
marp: true
theme: default
author: Marp Player Team
footer: Marp Player · All Features Demo · 2026
size: 16:9
paginate: true
title: Marp Player — All Features Demo
description: A comprehensive example showcasing every Marp Player feature
style: |
  :root {
    --brand: #6366f1;
    --brand-light: #818cf8;
    --accent: #f59e0b;
    --bg-dark: #0f172a;
    --text-light: #f1f5f9;
  }

  /* Title slide */
  section.lead {
    background: linear-gradient(135deg, var(--bg-dark) 0%, #1e293b 50%, #0f172a 100%);
    color: var(--text-light);
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
  section.lead h1 {
    font-size: 3.2em;
    background: linear-gradient(135deg, var(--brand-light), var(--accent));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 0.3em;
  }
  section.lead p {
    font-size: 1.3em;
    color: #94a3b8;
  }

  /* Section dividers */
  section.section {
    background: linear-gradient(135deg, var(--brand) 0%, #7c3aed 100%);
    color: white;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
  }
  section.section h1 {
    font-size: 3em;
    margin-bottom: 0.3em;
  }
  section.section p {
    font-size: 1.4em;
    opacity: 0.85;
  }

  /* Dark slide */
  section.dark {
    background: var(--bg-dark);
    color: var(--text-light);
  }
  section.dark h1, section.dark h2 {
    color: var(--brand-light);
  }

  /* Standard enhancements */
  h1 { color: var(--brand); font-size: 2.2em; }
  h2 { color: #4f46e5; font-size: 1.6em; }
  h3 { color: #6366f1; }
  strong { color: var(--brand); }
  code { background: #eef2ff; color: #4338ca; padding: 2px 8px; border-radius: 4px; font-size: 0.9em; }
  blockquote { border-left: 4px solid var(--brand); background: #eef2ff; padding: 16px 24px; border-radius: 0 8px 8px 0; font-style: italic; color: #4f46e5; }
  a { color: var(--brand); }
  table { width: 100%; border-collapse: collapse; }
  th { background: var(--brand); color: white; padding: 12px 16px; text-align: left; }
  td { padding: 10px 16px; border-bottom: 1px solid #e2e8f0; }
  tr:nth-child(even) { background: #f8fafc; }
  img { border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.1); }

  /* Grid layouts */
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }

  /* Card component */
  .card {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }
  .card h3 { margin-top: 0; font-size: 1.2em; }

  /* Badge / pill */
  .pill {
    display: inline-block;
    background: linear-gradient(135deg, var(--brand), #7c3aed);
    color: white;
    padding: 4px 14px;
    border-radius: 999px;
    font-size: 0.8em;
    font-weight: 600;
  }

  /* KPI block */
  .kpi {
    text-align: center;
    padding: 20px;
    background: linear-gradient(135deg, #eef2ff, #faf5ff);
    border-radius: 12px;
    border: 1px solid #e0e7ff;
  }
  .kpi .number { font-size: 2.5em; font-weight: 800; color: var(--brand); line-height: 1.2; }
  .kpi .label { font-size: 0.9em; color: #64748b; margin-top: 4px; }

  /* Highlight box */
  .highlight {
    background: linear-gradient(135deg, #fef3c7, #fde68a);
    border: 1px solid #fbbf24;
    border-radius: 12px;
    padding: 20px 24px;
    color: #92400e;
  }

  /* Steps */
  .step {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 16px;
  }
  .step-num {
    width: 36px; height: 36px;
    background: var(--brand);
    color: white;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 1.1em;
    flex-shrink: 0;
  }
---

<!-- _class: lead -->
<!-- _paginate: false -->

# Marp Player

All Features Demo Presentation

<p style="margin-top: 1em; font-size: 0.9em; color: #64748b;">Use ← → arrows, click slides, or press Space to navigate</p>

---

<!-- _class: section -->

# 📝 Basic Formatting

Markdown essentials in Marp

---

## Text Formatting

Marp supports all standard **Markdown** formatting:

- **Bold text** for emphasis
- *Italic text* for subtle highlights
- ~~Strikethrough~~ for corrections
- `inline code` for technical terms
- [Hyperlinks](https://marp.app/) work naturally

> "Simplicity is the ultimate sophistication."
> — Leonardo da Vinci

You can combine them: ***bold italic***, **`bold code`**, ~~*deleted italic*~~

---

## Lists & Structure

<div class="grid-2">
<div>

### Unordered List
- First item
  - Nested item A
  - Nested item B
- Second item
- Third item
  - Deep nesting
    - Even deeper

</div>
<div>

### Ordered List
1. Step one
2. Step two
3. Step three
   1. Sub-step 3a
   2. Sub-step 3b
4. Step four

</div>
</div>

---

<!-- _class: section -->

# 🎨 Custom CSS Styles

Cards, grids, pills and more

---

## Cards Layout

<div class="grid-3">
<div class="card">

### 🚀 Performance
Optimized server-side rendering with Marp Core for instant results.

</div>
<div class="card">

### 🎯 Accuracy
Full Marp syntax support including frontmatter, directives, and themes.

</div>
<div class="card">

### 💡 Simplicity
Just paste Markdown and get a beautiful presentation instantly.

</div>
</div>

---

## KPI Dashboard

<div class="grid-3">
<div class="kpi">
<div class="number">25</div>
<div class="label">Slides in this demo</div>
</div>
<div class="kpi">
<div class="number">100%</div>
<div class="label">Marp Compatible</div>
</div>
<div class="kpi">
<div class="number">∞</div>
<div class="label">Possibilities</div>
</div>
</div>

<div style="margin-top: 24px;">

<span class="pill">Server-side Rendering</span> <span class="pill">SVG Output</span> <span class="pill">Custom CSS</span> <span class="pill">PDF Export</span> <span class="pill">Animations</span>

</div>

---

<!-- _class: section -->

# 📊 Data & Tables

Structured content in Marp

---

## Features Table

| Feature | Status | Description |
|---------|--------|-------------|
| Marp Core Rendering | ✅ Ready | Server-side SVG rendering |
| PDF Export | ✅ Ready | Full-page landscape PDF |
| Click to Advance | ✅ Ready | Toggle in toolbar |
| Auto-play | ✅ Ready | 1s–10s intervals |
| Mobile Layout | ✅ Ready | Stacked responsive design |
| Speaker Notes | ✅ Ready | Collapsible panel |
| **Slide Animations** | ✅ **New!** | Fade, Bounce, Slide, Flip + custom per-slide |
| Fullscreen Mode | ✅ Ready | Press F or button |

---

<!-- _class: section -->
<!-- _animateIn: bounceIn -->

# ✨ Slide Animations

New feature: transition effects between slides!

---

## Animation Presets

Select an animation preset from the **✨ sparkle dropdown** in the toolbar:

<div class="grid-2">
<div class="card">

### Built-in Presets
| Preset | Enter | Exit |
|--------|-------|------|
| ⏹ None | — | — |
| 🌫 Fade | fadeIn | fadeOut |
| 🏀 Bounce | bounceInLeft | bounceOutRight |
| ➡️ Slide | slideInRight | slideOutLeft |
| 🔄 Flip | flipInY | flipOutY |
| ✨ Per-slide | Custom per slide | Custom per slide |

</div>
<div class="card">

### How it works
1. Choose a **preset** from dropdown
2. All slides use that transition
3. Or choose **✨ Per-slide** mode
4. Set custom animations per slide
5. Animations play on every navigation

</div>
</div>

---

## Per-Slide Animations in Markdown

The killer feature: **specify animations directly in your Markdown!**

Use HTML comments to set custom In/Out animations per slide:

```markdown
<!-- _animateIn: bounceInLeft -->
<!-- _animateOut: fadeOut -->

## My Slide
Content here...
```

<div class="highlight">

⚡ **How it works:** Animation directives in comments override the global preset. Choose ✨ Per-slide mode for full control, or let per-slide directives override any active preset!

</div>

---

<!-- _animateIn: fadeInUp -->
<!-- _animateOut: fadeOutDown -->

## This Slide Uses Custom Animations!

This slide has `fadeInUp` enter and `fadeOutDown` exit — defined right in the Markdown:

```markdown
<!-- _animateIn: fadeInUp -->
<!-- _animateOut: fadeOutDown -->

## This Slide Uses Custom Animations!
```

👉 **Try it:** Select ✨ **Per-slide** mode in the toolbar, then navigate away and back.

---

<!-- _animateIn: bounceInRight -->
<!-- _animateOut: bounceOutLeft -->

## Bounce Animations

This slide bounces in from the right! 🏀

```markdown
<!-- _animateIn: bounceInRight -->
<!-- _animateOut: bounceOutLeft -->
```

### Available Bounce Animations

<div class="grid-2">
<div>

**Enter:**
- `bounceIn`
- `bounceInLeft`
- `bounceInRight`
- `bounceInUp`
- `bounceInDown`

</div>
<div>

**Exit:**
- `bounceOut`
- `bounceOutLeft`
- `bounceOutRight`
- `bounceOutUp`
- `bounceOutDown`

</div>
</div>

---

<!-- _animateIn: flipInY -->
<!-- _animateOut: flipOutY -->

## Flip Animations

This slide flips in! 🔄

```markdown
<!-- _animateIn: flipInY -->
<!-- _animateOut: flipOutY -->
```

### All Available Animation Types

<div class="grid-3">
<div>

**Fade** 🌫
- fadeIn / fadeOut
- fadeInLeft / fadeOutLeft
- fadeInRight / fadeOutRight
- fadeInUp / fadeOutUp
- fadeInDown / fadeOutDown

</div>
<div>

**Slide** ➡️
- slideInLeft / slideOutLeft
- slideInRight / slideOutRight
- slideInUp / slideOutUp
- slideInDown / slideOutDown

</div>
<div>

**Special** ✨
- rotateIn / rotateOut
- flipInX / flipOutX
- flipInY / flipOutY
- lightSpeedIn / lightSpeedOut
- rollIn / rollOut

</div>
</div>

---

<!-- _class: section -->

# 💻 Code & Technical

Syntax highlighting and more

---

## Code Blocks

```typescript
// Server-side Marp rendering
import { Marp } from '@marp-team/marp-core'

const marp = new Marp({ html: true, script: false })
const { html, css } = marp.render(markdown)

// Each slide is an SVG element
const slides = html.match(/<svg[^>]*data-marpit-svg[^>]*>[\s\S]*?<\/svg>/gi)
```

```css
/* Custom Marp styles */
section.lead {
  background: linear-gradient(135deg, #0f172a, #1e293b);
  color: #f1f5f9;
  text-align: center;
}
```

---

<!-- _class: dark -->

## Dark Theme Slide

This slide uses `<!-- _class: dark -->` directive.

You can create **multiple visual styles** within one presentation.

<div class="grid-2">
<div class="card" style="background: #1e293b; border-color: #334155;">

### 🌙 Dark Cards
Custom CSS adapts to any theme context.

</div>
<div class="card" style="background: #1e293b; border-color: #334155;">

### ⭐ Flexible Styles
Mix and match across slides.

</div>
</div>

---

<!-- _class: section -->

# ⌨️ Navigation & Controls

All the ways to interact

---

## Keyboard Shortcuts

<div class="grid-2">
<div>

| Key | Action |
|-----|--------|
| `→` / `Space` | Next slide |
| `←` | Previous slide |
| `Home` | First slide |
| `End` | Last slide |
| `F` | Toggle fullscreen |
| `Esc` | Exit fullscreen / Toggle editor |

</div>
<div>

### Modes

🖱️ **Click to Advance** — Toggle with the mouse switch. Click anywhere on the slide.

▶️ **Auto-play** — Play/Pause button with configurable interval.

📺 **Fullscreen** — Immersive presentation mode.

✨ **Animations** — Select preset or use per-slide directives.

</div>
</div>

---

## Speaker Notes

This slide has hidden speaker notes! Check the panel below.

Speaker notes are defined using HTML comments:

```markdown
<!-- These are speaker notes for the presenter -->
```

Or with `<aside class="notes">` tags.

<!-- These are speaker notes for the presenter. They are hidden from the audience but visible in the Speaker Notes panel. You can use them to remember key talking points, statistics, or transition cues. -->

---

<!-- _class: section -->

# 💾 Export & Import

Save and share your work

---

## Save & Load Options

<div class="grid-2">
<div class="card">

### 📥 Import
- **Load .md files** — Direct Marp markdown
- **Load .json** — Marp Player format
- **Load .txt** — Plain text markdown
- **Paste** — Direct paste into editor

</div>
<div class="card">

### 📤 Export
- **PDF** — Full presentation as PDF
  - Landscape 16:9 format
  - All styles preserved
  - One slide per page
- **JSON** — Save for later editing

</div>
</div>

---

<!-- _animateIn: lightSpeedIn -->
<!-- _animateOut: lightSpeedOut -->

## 🚀 Animation Quick Reference

This slide enters with `lightSpeedIn`!

Add animations to your slides in 3 ways:

<div class="step">
<div class="step-num">1</div>
<div><strong>Global Preset</strong> — Select from ✨ dropdown: None, Fade, Bounce, Slide, Flip</div>
</div>

<div class="step">
<div class="step-num">2</div>
<div><strong>Per-slide Override</strong> — Add <code>&lt;!-- _animateIn: X --&gt;</code> and <code>&lt;!-- _animateOut: X --&gt;</code> in your Markdown</div>
</div>

<div class="step">
<div class="step-num">3</div>
<div><strong>Per-slide Mode</strong> — Select ✨ Per-slide preset, then each slide uses its own directives</div>
</div>

---

<!-- _class: lead -->
<!-- _paginate: false -->
<!-- _animateIn: rollIn -->

# 🎉 That's All!

You've seen every feature of **Marp Player**

<p style="margin-top: 1em; font-size: 0.9em; color: #64748b;">Built with Next.js · Marp Core · Tailwind CSS · Animate.css</p>
<p style="font-size: 0.8em; color: #475569;">This slide entered with <code>rollIn</code> animation!</p>
