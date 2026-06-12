---
name: NoTrace Premium
colors:
  surface: '#0e0e11'
  surface-dim: '#15121c'
  surface-bright: '#3c3743'
  surface-container-lowest: '#100d16'
  surface-container-low: '#1d1a24'
  surface-container: '#221e28'
  surface-container-high: '#2c2833'
  surface-container-highest: '#37333e'
  on-surface: '#e8dfee'
  on-surface-variant: '#ccc3d8'
  inverse-surface: '#e8dfee'
  inverse-on-surface: '#332e3a'
  outline: '#958da1'
  outline-variant: '#4a4455'
  surface-tint: '#d2bbff'
  primary: '#d2bbff'
  on-primary: '#3f008e'
  primary-container: '#8b4aff'
  on-primary-container: '#fffbff'
  inverse-primary: '#742be7'
  secondary: '#88ceff'
  on-secondary: '#00344d'
  secondary-container: '#009fe2'
  on-secondary-container: '#00324a'
  tertiary: '#ffb77e'
  on-tertiary: '#4e2600'
  tertiary-container: '#b25f00'
  on-tertiary-container: '#fffcff'
  error: '#ed2b4d'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#eaddff'
  primary-fixed-dim: '#d2bbff'
  on-primary-fixed: '#25005a'
  on-primary-fixed-variant: '#5a00c6'
  secondary-fixed: '#c8e6ff'
  secondary-fixed-dim: '#88ceff'
  on-secondary-fixed: '#001e2f'
  on-secondary-fixed-variant: '#004c6e'
  tertiary-fixed: '#ffdcc3'
  tertiary-fixed-dim: '#ffb77e'
  on-tertiary-fixed: '#2f1500'
  on-tertiary-fixed-variant: '#6e3900'
  background: '#09090b'
  on-background: '#e8dfee'
  surface-variant: '#37333e'
  foreground: '#f2f2f2'
  muted: '#222226'
  border-subtle: rgba(255, 255, 255, 0.05)
typography:
  headline-xl:
    fontFamily: Outfit
    fontSize: 48px
    fontWeight: '900'
    lineHeight: '1.1'
    letterSpacing: -0.05em
  headline-lg:
    fontFamily: Outfit
    fontSize: 32px
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Outfit
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Outfit
    fontSize: 18px
    fontWeight: '500'
    lineHeight: '1.6'
  body-md:
    fontFamily: Outfit
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Outfit
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Outfit
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-padding: 2rem
  gutter: 1.5rem
  sidebar-width: 280px
  list-width: 320px
---

# Design System: NoTrace Premium

This document serves as the single source of truth for the Google Stitch design generation. It defines the visual identity, color palette, typography, and component styling for the "NoTrace" anonymous chat application.

## 1. Brand Identity & Persona
- **Vibe:** Exclusive, secure, futuristic, high-end, and mysterious.
- **Keywords:** Cyberpunk-lite, Glassmorphism, Midnight, Neon, Anonymous.
- **Goal:** To make the user say "Wow" when they open the app. It should not look like a standard generic SaaS dashboard.

## 2. Color Palette
We use a deeply saturated, premium dark mode palette with vibrant neon accents.

### Base Colors
- **Background:** Obsidian Black `hsl(240 10% 4%)` / `#09090b`
- **Foreground (Text):** Off-White `hsl(0 0% 95%)` / `#f2f2f2`
- **Surface/Card:** Deep Charcoal `hsl(240 10% 6%)` / `#0e0e11`
- **Muted Elements:** Dark Gray `hsl(240 10% 15%)` / `#222226`
- **Subtle Borders:** Semi-transparent White `rgba(255, 255, 255, 0.05)` to `rgba(255, 255, 255, 0.1)`

### Accent Colors
- **Primary:** Electric Violet `hsl(265 85% 65%)` / `#8b4aff`
- **Secondary:** Deep Cyan `hsl(200 90% 45%)` / `#0ba3e6`
- **Destructive/Error:** Neon Red/Pink `hsl(350 80% 55%)` / `#ed2b4d`

## 3. Typography
- **Primary Font Family:** **`Outfit`** (Google Font)
- **Usage:** Use `Outfit` for all headings, body text, and UI elements.
- **Headings:** Should be bold (`font-black` or `font-extrabold`) and tightly tracked (`tracking-tight`).
- **Body Text:** Clean and legible (`font-medium` or `font-normal`).

## 4. UI Components & Styling Rules

### Glassmorphism (The Core Aesthetic)
- **Sidebars & Panels:** Do NOT use solid background colors for sidebars or the admin panel. Instead, use a frosted glass effect:
  - `background: rgba(15, 15, 20, 0.6)`
  - `backdrop-filter: blur(16px)`
  - `border: 1px solid rgba(255, 255, 255, 0.05)`
  - `box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4)`
- **Join Page Login Card:** Use a heavier glass card:
  - `background: linear-gradient(145deg, rgba(30, 30, 40, 0.7) 0%, rgba(15, 15, 20, 0.8) 100%)`
  - `backdrop-filter: blur(24px)`

### Background Mesh Gradients
- Use slow-moving, subtle radial gradients in the background (behind the glass panels) to give the app depth.
- Example: A radial gradient of `Primary/10` in the top left, and `Secondary/10` in the bottom right, overlaid on the Obsidian Black background.

### Buttons & Interactive Elements
- **Primary Buttons:** Solid Electric Violet background with white text.
- **Hover States:** Buttons should have a micro-interaction where they slightly scale up (`hover:scale-[1.02]`) and emit a soft glowing drop-shadow (`shadow-[0_0_15px_-3px] shadow-primary/40`).
- **Inactive/Ghost Buttons:** Should be transparent with muted text, turning slightly lighter on hover (`hover:bg-white/5`).

### Chat Bubbles
- Sent messages should use a subtle linear gradient background (e.g., from `Primary/20` to `Secondary/20`) instead of flat gray.
- Bubbles should have modern, rounded corners (e.g., `rounded-2xl` with a sharp corner pointing to the sender).

## 5. Spacing & Layout
- Use generous padding in layout containers (e.g., `p-6` or `p-8`) to let the glassmorphism breathe.
- Main layout is a 3-column grid: Sidebar (Navigation) -> Channels List -> Chat Area / Admin Panel.