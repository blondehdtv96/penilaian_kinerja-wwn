---
name: Merit-Misconduct System
description: Real-time operator performance tracking for PT Bridgestone Tire Indonesia, backed by blockchain integrity.
colors:
  red-accent: "#ef4444"
  red-deep: "#b91c1c"
  merit-green: "#10b981"
  merit-deep: "#059669"
  rail: "#111827"
  rail-elevated: "#1f2937"
  content-bg: "#f5f7fa"
  card: "#ffffff"
  card-alt: "#f9fafb"
  ink: "#1f2937"
  ink-muted: "#6b7280"
  ink-subtle: "#9ca3af"
  divider: "#e5e7eb"
typography:
  display:
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "normal"
  headline:
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.2
  title:
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    letterSpacing: "0.05em"
rounded:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  full: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.red-accent}"
    textColor: "{colors.card}"
    rounded: "{rounded.sm}"
    padding: "10px 24px"
  button-primary-hover:
    backgroundColor: "{colors.red-deep}"
    textColor: "{colors.card}"
  button-ghost:
    backgroundColor: "rgba(239,68,68,0.1)"
    textColor: "{colors.red-accent}"
    rounded: "{rounded.sm}"
    padding: "10px 24px"
  button-ghost-hover:
    backgroundColor: "{colors.red-accent}"
    textColor: "{colors.card}"
  card-default:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.md}"
    padding: "{spacing.lg}"
  kpi-card:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.md}"
    padding: "{spacing.lg}"
  input-default:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "10px 12px"
---

# Design System: Merit-Misconduct System

## 1. Overview

**Creative North Star: "The Control Room"**

This system is built like precision instrumentation. It exists in a high-stakes industrial environment where every performance event is recorded permanently on a blockchain — no edits, no erasure. The interface reflects that permanence: deliberate, unambiguous, and load-bearing. Every pixel earns its place. Density is a feature, not a failure.

The visual language pairs a dark charcoal navigation rail with a clean, bright content area. The sidebar is the anchor — always present, always grounding the operator or manager in where they are and what role they hold. The content area is neutral and bright, designed to make data the protagonist. Bridgestone red appears as a precise signal: active navigation state, primary action, critical status. It is never decorative.

The system explicitly rejects: the default blue-and-white admin aesthetic that communicates nothing about its purpose; consumer-app decoration (gradient blobs, rounded bubble UI, playful animations); the hacker dark-mode terminal aesthetic that would undermine the institutional legitimacy blockchain is meant to provide; and joyless corporate grey that communicates indifference to the people this system evaluates.

**Key Characteristics:**
- Dark navigation rail (`#111827`) paired with bright content area (`#f5f7fa`) — structured contrast, not uniform tone
- Bridgestone red used at ≤10% of any screen surface — its scarcity makes it signal
- Inter as the sole typeface across all weights — consistency communicates control
- Flat-by-default cards, lifted on hover — stillness is authority; elevation is earned
- Color carries meaning, never decoration — red is warning/action, green is merit, white is truth

## 2. Colors: The Control Room Palette

A dual-tone system: a dark rail for identity and navigation, a bright neutral field for data. One semantic color pair — merit green and misconduct red — carries the product's core logic.

### Primary
- **Bridgestone Red** (`#ef4444`): The brand's voice in the system. Active navigation state, primary action buttons, critical status indicators, and the misconduct signal. Never a background color. Used on ≤10% of any screen.
- **Deep Red** (`#b91c1c`): Hover and pressed state for red elements. Gradient depth in avatar fills and CTA hover states.

### Secondary
- **Merit Green** (`#10b981`): The positive performance signal. Merit event backgrounds, approval indicators, success states, and the blockchain "connected" status dot.
- **Merit Deep** (`#059669`): Gradient depth for merit-colored elements and icon fills.

### Neutral
- **Night Rail** (`#111827`): The navigation sidebar surface. Dark, grounding, constant. This is where the system's identity lives.
- **Rail Elevated** (`#1f2937`): Sidebar header and elevated structural elements within the dark rail. Also the strongest ink value for body text.
- **Workshop Light** (`#f5f7fa`): The content area background. Cool-neutral, not warm. Deliberately anti-cream.
- **Clean Sheet** (`#ffffff`): Card surface. The working document.
- **Performer Row** (`#f9fafb`): Alternating row backgrounds in dense lists. One tone above white.
- **Ink** (`#1f2937`): Primary text color. Strong enough to read on all light surfaces.
- **Steel Muted** (`#6b7280`): Secondary text — labels, metadata, timestamps in normal context.
- **Steel Light** (`#9ca3af`): Tertiary text — placeholders, inactive navigation items, micro-timestamps.
- **Divider** (`#e5e7eb`): Borders, separators, input stroke. Never decorative.

### Named Rules
**The One Signal Rule.** Red appears as a signal, not a brand wash. The moment red occupies more than 10% of a screen surface, it ceases to signal anything. Reserve it for: active nav item, primary button, misconduct badges, and critical warnings. Nowhere else.

**The Anti-Cream Rule.** The content background is `#f5f7fa` — a cool grey-blue, not a warm off-white. "Workshop Light", not parchment. This is a factory floor system, not an editorial magazine.

## 3. Typography

**Body / Interface Font:** Inter (with system-ui, -apple-system, sans-serif fallback)

**Character:** A single geometric sans-serif at a controlled weight range (400–800). Authoritative at heavy weights, legible at small sizes. No display/body pairing — uniformity communicates control. The voice is the weight, not the family.

### Hierarchy
- **Display** (700, 2rem, line-height 1): KPI metric numbers — the single most important number on any dashboard card. Used sparingly; maximum one or two per card.
- **Headline** (700, 1.875rem, line-height 1.2): Page-level welcome text and major section titles. Maximum one per screen.
- **Title** (600, 1.25rem, line-height 1.3): Card headers, section group titles, sidebar app name. Multiple per screen; should not compete with each other.
- **Body** (400–500, 0.875rem, line-height 1.6): Event descriptions, list item content, form fields, all prose. Cap at 65–75ch for inline text.
- **Label** (500–700, 0.75rem, letter-spacing 0.05em): Timestamps, nav section titles, role badges, column headers in tables. Often uppercase for structural labels.

### Named Rules
**The Weight-as-Voice Rule.** This system uses one font family across all contexts. Hierarchy is carried entirely by weight and size, not by font switching. A new font family is never the answer — a weight adjustment is.

**The Extrabold Ceiling.** Font weight 800 is reserved for KPI numbers in operator info cards and display-level rank indicators. Do not apply `font-weight: 800` to body text, buttons, or labels.

## 4. Elevation

The system is flat by default. Cards rest at surface level without asserting elevation. Elevation is a state-change behavior, not an always-on hierarchy signal.

### Shadow Vocabulary
- **Ambient Rest** (`0 1px 3px rgba(0, 0, 0, 0.10)`): The at-rest shadow for all standard cards and content panels. Barely perceptible — enough to separate card from background without asserting hierarchy.
- **Lifted Hover** (`0 4px 6px rgba(0, 0, 0, 0.10)`): Applied on card hover and interactive list item focus. A subtle rise that acknowledges interaction without drama.
- **Featured Element** (`0 8px 24px rgba(30, 58, 95, 0.25)`): Reserved for the operator identity card. The blue-tinted shadow matches the card's navy gradient, making the shadow feel structural rather than generic.
- **Brand Action** (`0 4px 12px rgba(239, 68, 68, 0.25)`): Applied on red CTA hover states (primary button, logout). The shadow shares the button's hue — a focused glow, not a generic drop.

### Named Rules
**The Flat-By-Default Rule.** Cards do not assert elevation at rest. The ambient shadow reads as separation, not depth. Elevation is earned through interaction, not decoration.

**The Colored Shadow Principle.** When a shadow appears on a colored element (red button, navy operator card), it uses a tinted version of that element's color — never a generic `rgba(0,0,0,x)`. The shadow belongs to the element.

## 5. Components

### Buttons
Decisive and load-bearing. Primary buttons are solid fill; they communicate that clicking them matters.
- **Shape:** Gently curved (`8px` radius). Not pill, not square — controlled and precise.
- **Primary:** Bridgestone Red fill (`#ef4444`), white label, padding `10px 24px`, font weight 600.
- **Primary Hover:** Deepens to `#b91c1c`, gains brand-tinted shadow (`0 4px 12px rgba(239,68,68,0.25)`).
- **Ghost / Outline:** Red-tinted background (`rgba(239,68,68,0.1)`), `#fca5a5` text, red border (`rgba(239,68,68,0.2)`). Used for logout and secondary destructive actions.
- **Ghost Hover:** Fills solid red, white text — matches primary on hover.
- **Disabled:** 50% opacity, `cursor: not-allowed`. No visual redesign.

### Cards / Containers
The primary content surface. White, barely elevated above the cool-neutral background.
- **Corner Style:** Moderately rounded (`12px` radius).
- **Background:** Clean Sheet (`#ffffff`).
- **Shadow:** Ambient Rest at rest; Lifted Hover on hover.
- **Border:** None — the shadow handles separation.
- **Internal Padding:** `24px` (`1.5rem`) standard. Dense-data cards may use `16px`.

### Inputs / Fields
- **Style:** White background, `1px` Divider stroke (`#e5e7eb`), `8px` radius.
- **Focus:** Border shifts to Bridgestone Red (`#ef4444`). No glow ring — the color shift is the signal.
- **Placeholder:** Must use `#6b7280` (Steel Muted) at minimum. `#9ca3af` (Steel Light) fails WCAG 2.1 AA 4.5:1 contrast against white at body sizes.
- **Error:** Border turns red, error label in red below the field. Always pair color with text — never color alone.
- **Label:** Body weight 600, `#374151` (slightly lighter than full ink).

### Navigation (Sidebar Rail)
The most intentional component in the system. The dark rail is the app's constant identity layer.
- **Surface:** Night Rail (`#111827`) full height, `1px` Rail Elevated right border.
- **Brand Header:** Rail Elevated (`#1f2937`) background. Red "B" logomark (36×36px, `8px` radius, `#ef4444` fill, red-tinted shadow). App name in white 700. Subtitle in Steel Light. Red underline strip (3px) anchors the header.
- **Nav Items (rest):** Steel Light text (`#9ca3af`), `0.9rem` 500 weight, padding `0.85rem 1.5rem`.
- **Nav Items (hover):** White text, `rgba(31,41,55,0.5)` background, micro-slide to `padding-left: 1.75rem`.
- **Nav Items (active):** White text, `rgba(239,68,68,0.08)` background, icon turns red (`#ef4444`), 4px red left-edge indicator strip.
- **Section label:** Steel Dark (`#4b5563`), `0.7rem` 700 uppercase, `0.1em` tracking. One label: "MAIN NAVIGATION".
- **Footer:** Ghost-style logout button; blockchain status dot (6px, `#10b981`, green glow `0 0 8px #10b981`).

### KPI Cards
The signature information unit of the management dashboard.
- **Layout:** Flex row, colored icon block left (60×60px, `12px` radius), metric content right.
- **Icon fill:** Flat semantic color per role — `#10b981` (merits), `#ef4444` (misconducts), `#3b82f6` (operators/structural), `#8b5cf6` (blockchain). White icon inside. No multi-step gradients.
- **Metric number:** Display scale (`2rem`, weight 700, `#1f2937`).
- **Label:** Body scale (`0.875rem`, Steel Muted).
- **Hover:** Rises 2px (`transform: translateY(-2px)`) with Lifted Hover shadow.

### Role Badges
Inline chips in the sidebar user profile section.
- **Shape:** `4px` radius, tight padding (`2px 6px`).
- **Color system:** Each role has a unique semantic tint — amber (Super Admin), emerald (HRD/Staff), violet (Manager), orange (Foreman), blue (Operator). Applied as `rgba` background + text + 1px border.
- **Typography:** `0.65rem`, weight 700, uppercase.

### Activity Items
The feed-style display of recent merit/misconduct events.
- **Merit:** `#ecfdf5` tinted background, `#10b981` avatar fill, green positive points label.
- **Misconduct:** `#fef2f2` tinted background, `#ef4444` avatar fill, red negative points label.
- **Layout:** Flex row, 40px circular avatar, info column, points right-aligned.

### Operator Identity Card
The featured surface showing an operator's personal summary.
- **Background:** Deep navy gradient (`#1e3a5f` → `#1a56a0`, 135°).
- **Shadow:** Featured Element (`0 8px 24px rgba(30,58,95,0.25)`).
- **Corner Style:** `16px` radius.
- **Rank badge:** Semi-transparent white inset block (`rgba(255,255,255,0.15)`), `12px` radius. Rank number at display scale, weight 800.

## 6. Do's and Don'ts

### Do:
- **Do** use Bridgestone Red (`#ef4444`) on ≤10% of any screen surface. Its scarcity makes it signal.
- **Do** keep the sidebar dark (`#111827`) and the content area bright (`#f5f7fa`). This contrast is the system's structural identity.
- **Do** use `#6b7280` or darker for placeholder text to meet WCAG 2.1 AA 4.5:1 contrast against white.
- **Do** always pair the merit/misconduct green/red color signal with a text label or icon — color alone is never sufficient for status communication.
- **Do** use colored tinted shadows on brand-colored elements (`rgba(239,68,68,0.25)` for red, `rgba(30,58,95,0.25)` for navy). Generic black shadows read as generic.
- **Do** use `8px` radius on interactive elements (buttons, inputs), `12px` on cards, `16px` on featured hero elements.
- **Do** keep KPI metric numbers at `2rem` 700 weight. They are the protagonists; let them read without competition.
- **Do** use Inter at weights 400–700 for all body and UI. Weight 800 only for display KPI numbers and rank indicators.
- **Do** cap body and description text at `65–75ch` maximum line length.
- **Do** include `@media (prefers-reduced-motion: reduce)` for every transition and hover animation.
- **Do** use flat semantic fills for KPI icon blocks — one color per semantic role, no multi-stop gradients.

### Don't:
- **Don't** use a generic blue as the primary action color. The Tailwind config defines `primary` as blue (`#3b82f6`) but the real product primary is Bridgestone Red. Correct this in the config.
- **Don't** use the warm cream/sand/off-white band for backgrounds. The content area is Workshop Light (`#f5f7fa`) — a cool grey-blue. "Warm editorial" aesthetics are explicitly rejected.
- **Don't** use gradient text (`background-clip: text`). Prohibited. Not for KPI numbers, not for headings.
- **Don't** use a colored `border-left` stripe (> 1px) as the sole distinguishing treatment for cards, list items, or callouts. Use full borders, background tints, or icons instead.
- **Don't** use emoji as primary UI indicators (✅ ⚠️ 🏆). Replace with Ionicons and semantic color + text labels.
- **Don't** apply multi-stop gradient fills to KPI icon blocks. The current blue-violet / green / red / purple gradient icons read as "generic admin". Replace with flat semantic fills.
- **Don't** make the app feel like a generic blue admin panel (Bootstrap / generic SaaS). The dark rail and red accent are the primary differentiators — protect them.
- **Don't** use consumer-app patterns: bright bubble gradients, oversized rounded pill cards, playful mascots or illustrations.
- **Don't** extend the dark aesthetic to the content area. The sidebar is dark; the content area must stay light (`#f5f7fa` / `#ffffff`). Full-dark mode is not in scope and would undermine the institutional trust the blockchain component is meant to establish.
- **Don't** produce cold, grey, and lifeless screens. The semantic color pair, the red accent, and the colored shadow language exist to ensure this system feels purposefully built — not generated.
