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
