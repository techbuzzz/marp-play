---
marp: true
author: Your Name
footer: Brand Deck · 2026
size: 16:9
paginate: true
title: Brand Deck — Starter Template
description: A theme-ready starter template with brand colors, cards and grids
style: |
  /* ──────────────────────────────────────────────
     BRAND TOKENS — edit these to match your brand
     ────────────────────────────────────────────── */
  :root {
    --brand: #6366f1;
    --brand-light: #818cf8;
    --brand-dark: #4338ca;
    --accent: #f59e0b;
    --success: #22c55e;
  }

  /*
   * TIP: this file intentionally has no `theme:` directive so that
   * the theme selector (Default / Uncover / Dark / Gaia) in the
   * toolbar takes effect.  Switch themes and see the deck adapt!
   */

  /* ── Section Dividers ─────────────────────────── */
  section.divider {
    background: linear-gradient(135deg, var(--brand) 0%, #7c3aed 100%);
    color: white;
    display: flex; flex-direction: column;
    justify-content: center; align-items: center;
    text-align: center;
  }
  section.divider h1 { font-size: 3em; color: white; margin-bottom: 0.2em; }
  section.divider p  { font-size: 1.4em; opacity: 0.85; }

  /* ── Hero / Lead ──────────────────────────────── */
  section.hero {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
    color: #f1f5f9;
    display: flex; flex-direction: column;
    justify-content: center; align-items: center;
    text-align: center;
  }
  section.hero h1 {
    font-size: 3.2em;
    background: linear-gradient(135deg, var(--brand-light), var(--accent));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 0.3em;
  }
  section.hero p { font-size: 1.2em; color: #94a3b8; }

  /* ── General typography overrides ─────────────── */
  h1 { color: var(--brand); }
  h2 { color: var(--brand-dark); }
  h3 { color: var(--brand); }
  strong { color: var(--brand); }
  a  { color: var(--brand); }
  code {
    background: #eef2ff; color: var(--brand-dark);
    padding: 2px 8px; border-radius: 4px; font-size: 0.9em;
  }
  blockquote {
    border-left: 4px solid var(--brand);
    background: #eef2ff; padding: 16px 24px;
    border-radius: 0 8px 8px 0; font-style: italic;
    color: var(--brand-dark);
  }

  /* ── Tables — theme-adaptive ─────────────────── */
  table { width: 100%; border-collapse: collapse; }
  th {
    background: var(--brand); color: white;
    padding: 12px 16px; text-align: left;
  }
  td { padding: 10px 16px; border-bottom: 1px solid #e2e8f0; }
  tr:nth-child(even) { background: rgba(99, 102, 241, 0.06); }

  /* ── Grid helpers ─────────────────────────────── */
  .g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .g3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }

  /* ── Card ─────────────────────────────────────── */
  .card {
    background: rgba(255,255,255,0.85);
    backdrop-filter: blur(4px);
    border: 1px solid rgba(99, 102, 241, 0.15);
    border-radius: 12px; padding: 24px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  }
  .card h3 { margin-top: 0; font-size: 1.15em; }

  /* ── KPI block ────────────────────────────────── */
  .kpi {
    text-align: center; padding: 20px;
    background: linear-gradient(135deg, #eef2ff, #faf5ff);
    border-radius: 12px; border: 1px solid #e0e7ff;
  }
  .kpi .num  { font-size: 2.6em; font-weight: 800; color: var(--brand); line-height: 1.1; }
  .kpi .lbl  { font-size: 0.9em; color: #64748b; margin-top: 4px; }

  /* ── Pill / badge ─────────────────────────────── */
  .pill {
    display: inline-block;
    background: linear-gradient(135deg, var(--brand), #7c3aed);
    color: white; padding: 4px 14px;
    border-radius: 999px; font-size: 0.8em; font-weight: 600;
  }

  /* ── Highlight / callout ──────────────────────── */
  .hi {
    background: linear-gradient(135deg, #fef3c7, #fde68a);
    border: 1px solid #fbbf24; border-radius: 12px;
    padding: 20px 24px; color: #92400e;
  }

  /* ── Steps ────────────────────────────────────── */
  .step { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 16px; }
  .step-n {
    width: 36px; height: 36px;
    background: var(--brand); color: white;
    border-radius: 50%; display: flex;
    align-items: center; justify-content: center;
    font-weight: 700; font-size: 1.1em; flex-shrink: 0;
  }
---

<!-- _class: hero -->
<!-- _paginate: false -->

# Brand Deck

A starter template with brand colors, cards and grids

<p style="margin-top:1em; font-size:0.85em; color:#64748b">Switch themes with the 🎨 selector in the toolbar ↓</p>

---

<!-- _class: divider -->

# 📋 The Basics

Formatting that works in every theme

---

## Text & Lists

<div class="g2">
<div>

### Inline formatting

- **Bold** for emphasis
- *Italic* for nuance
- ~~Strikethrough~~ for edits
- `inline code` for tech terms
- [Hyperlinks](https://marp.app/) built-in

> "Good design is obvious. Great design is transparent."

</div>
<div>

### Ordered steps

1. Edit the Markdown on the left
2. Watch the preview on the right
3. Pick a **theme** from the dropdown
4. Add **animations** with the ✨ selector
5. Hit **Share** or export to **PDF**

</div>
</div>

---

## Data Table

| Feature | Status | Notes |
|---------|--------|-------|
| Theme selector | ✅ Ready | Default · Uncover · Dark · Gaia |
| PDF export | ✅ Ready | One slide per page, 16 : 9 |
| Slide animations | ✅ Ready | 38 transitions + per-slide |
| MCP integration | ✅ Ready | Native JSON-RPC server |
| Brand CSS | ✅ Ready | Edit `--brand` to change palette |

<p style="margin-top:0.5em; font-size:0.85em; color:#64748b">
💡 Table header and text colors auto-adapt to the active theme.
</p>

---

<!-- _class: divider -->

# 🎨 Cards & Grids

Reusable components for any deck

---

## Three-Column Cards

<div class="g3">
<div class="card">

### 🚀 Performance
Server-side Marp Core renders your slides in milliseconds.

</div>
<div class="card">

### 🎯 Accuracy
Full Marp syntax — directives, frontmatter, custom CSS.

</div>
<div class="card">

### 💡 Simplicity
Paste Markdown → see beautiful slides. Nothing to install.

</div>
</div>

---

## KPI Dashboard

<div class="g3">
<div class="kpi">
<div class="num">4</div>
<div class="lbl">Built-in themes</div>
</div>
<div class="kpi">
<div class="num">38</div>
<div class="lbl">Animations</div>
</div>
<div class="kpi">
<div class="num">∞</div>
<div class="lbl">Possibilities</div>
</div>
</div>

<div style="margin-top: 20px;">

<span class="pill">Default</span> <span class="pill">Uncover</span> <span class="pill">Dark</span> <span class="pill">Gaia</span> <span class="pill">PDF</span> <span class="pill">Animations</span> <span class="pill">MCP</span>

</div>

---

## Two-Column Layout with Callout

<div class="g2">
<div>

### How to customise

<div class="step">
<div class="step-n">1</div>
<div>Change <code>--brand</code> in the CSS to your colour</div>
</div>

<div class="step">
<div class="step-n">2</div>
<div>Replace content — keep the <code>.card</code> / <code>.kpi</code> classes</div>
</div>

<div class="step">
<div class="step-n">3</div>
<div>Pick a theme with the 🎨 dropdown</div>
</div>

</div>
<div>

<div class="hi">

⚡ **Pro tip** — this deck has **no** `theme:` directive in its frontmatter. That's on purpose: it lets the toolbar theme selector (Default / Uncover / Dark / Gaia) take full control. If you want to lock a theme, add `theme: gaia` to the YAML block.

</div>

</div>
</div>

---

<!-- _class: divider -->
<!-- _animateIn: bounceIn -->

# ✨ Animations

Slide transitions in Markdown

---

<!-- _animateIn: fadeInUp -->
<!-- _animateOut: fadeOutDown -->

## Animation Quick-Start

Add comments **above** a slide to set its transition:

```markdown
<!-- _animateIn: fadeInUp -->
<!-- _animateOut: fadeOutDown -->

## My Slide
Content here …
```

<div class="g2">
<div class="card">

### Global presets
Pick from the ✨ dropdown: **None · Fade · Bounce · Slide · Flip · Per-slide**

</div>
<div class="card">

### Per-slide override
`_animateIn` / `_animateOut` comments override the global preset on that slide.

</div>
</div>

---

<!-- _animateIn: bounceInRight -->
<!-- _animateOut: bounceOutLeft -->

## Available Animations (38)

<div class="g3">
<div>

**Fade** 🌫
- fadeIn / fadeOut
- fadeInLeft / fadeOutLeft
- fadeInRight / fadeOutRight
- fadeInUp / fadeOutUp
- fadeInDown / fadeOutDown

</div>
<div>

**Slide & Bounce** ➡️
- slideInLeft / slideOutLeft
- slideInRight / slideOutRight
- bounceIn / bounceOut
- bounceInLeft / bounceOutLeft
- bounceInRight / bounceOutRight

</div>
<div>

**Special** ✨
- flipInX / flipOutX
- flipInY / flipOutY
- rotateIn / rotateOut
- lightSpeedIn / lightSpeedOut
- rollIn / rollOut

</div>
</div>

---

<!-- _class: hero -->
<!-- _paginate: false -->
<!-- _animateIn: rollIn -->

# 🎉 Ready to Go!

Edit this deck · switch themes · share your work

<p style="margin-top:1em; font-size:0.85em; color:#64748b">
Try the <strong>🎨 theme selector</strong> now — every slide adapts instantly.
</p>
