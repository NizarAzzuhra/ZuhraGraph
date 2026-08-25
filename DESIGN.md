---
name: Editorial Creative
colors:
  surface: '#fff8f6'
  surface-dim: '#e8d6d2'
  surface-bright: '#fff8f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff1ed'
  surface-container: '#fceae6'
  surface-container-high: '#f6e4e0'
  surface-container-highest: '#f0dfdb'
  on-surface: '#221a17'
  on-surface-variant: '#55423e'
  inverse-surface: '#382e2c'
  inverse-on-surface: '#ffede9'
  outline: '#88726d'
  outline-variant: '#dbc1bb'
  surface-tint: '#994530'
  primary: '#99442f'
  on-primary: '#ffffff'
  primary-container: '#b85c45'
  on-primary-container: '#ffffff'
  inverse-primary: '#ffb4a2'
  secondary: '#605e5b'
  on-secondary: '#ffffff'
  secondary-container: '#e6e2de'
  on-secondary-container: '#666461'
  tertiary: '#006a5f'
  on-tertiary: '#ffffff'
  tertiary-container: '#008578'
  on-tertiary-container: '#ffffff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad2'
  primary-fixed-dim: '#ffb4a2'
  on-primary-fixed: '#3c0700'
  on-primary-fixed-variant: '#7b2e1b'
  secondary-fixed: '#e6e2de'
  secondary-fixed-dim: '#cac6c2'
  on-secondary-fixed: '#1c1b1a'
  on-secondary-fixed-variant: '#484644'
  tertiary-fixed: '#90f4e4'
  tertiary-fixed-dim: '#73d8c8'
  on-tertiary-fixed: '#00201c'
  on-tertiary-fixed-variant: '#005048'
  background: '#fff8f6'
  on-background: '#221a17'
  surface-variant: '#f0dfdb'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 64px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  display-lg-mobile:
    fontFamily: Geist
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.0'
    letterSpacing: 0.05em
  caption:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.4'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
  section-gap: 120px
---

## Brand & Style

The design system is built for a creative studio context, prioritizing visual clarity and an "editorial" feel that allows artwork to take center stage. The aesthetic is rooted in **Modern Minimalism** with a sophisticated, archival warmth. 

The personality is intellectual, curated, and deliberate. It avoids digital-native trends like glassmorphism or vibrant neon, opting instead for a palette and layout reminiscent of high-end print monographs. The user should feel as if they are navigating a digital gallery or a premium art publication. Whitespace is used as a structural element to frame content, creating a sense of calm and focus.

## Colors

This design system utilizes a "Warm Ivory" base to provide a more organic and premium feel than pure white. 

- **Primary Accent (Terracotta):** Used sparingly for calls to action, active states, and critical highlights to draw the eye without overwhelming the artwork.
- **Neutral Palette:** High-contrast Charcoal is used for maximum legibility in typography, while "Surface" provides a subtle lift for cards and secondary containers.
- **Semantic Colors:** Muted and desaturated to maintain the editorial harmony while providing necessary functional feedback.

## Typography

The typography leverages **Geist** to achieve a precise, technical, yet elegant look. The hierarchy is extreme, with large display headings creating a rhythmic structure against wide-margined body text.

- **Headlines:** Should use tight letter-spacing and heavy weights to create a "block" of text that acts as a visual anchor.
- **Body Text:** Uses a generous line height (1.6) to ensure long-form readability and an airy feel.
- **Labels:** Set in uppercase with increased tracking to differentiate them from body content and provide a navigational "signpost" effect.

## Layout & Spacing

The layout follows a **Fixed Grid** philosophy on desktop to maintain the "framed" editorial look.

- **Grid System:** A 12-column grid with wide gutters (24px). Elements should frequently span 6 or 8 columns to leave intentional "dead space" on the sides, mimicking a magazine layout.
- **Rhythm:** Spacing between sections is intentionally aggressive (120px+) to allow the eye to rest between different pieces of content or artwork.
- **Mobile:** Transition to a fluid 4-column grid with 20px margins. Headlines should scale down according to the `display-lg-mobile` token to ensure they don't break awkwardly.

## Elevation & Depth

This design system avoids traditional shadows to maintain a flat, printed aesthetic.

- **Layering:** Use **Tonal Layers** instead of shadows. Elements "sit" on the Warm Ivory background. Containers or modals use the "Surface" color (#FCFAF7) to create a subtle contrast.
- **Outlines:** Use 1px solid borders (#DDD7CE) for structural definition. These "ghost borders" provide clarity without adding weight.
- **Interactive Depth:** On hover, instead of lifting an element with a shadow, use a slight color shift or a change in border-weight/color to signal interactivity.

## Shapes

The shape language is architectural and structured.

- **Base Radius:** 0.25rem (4px) is the standard for most UI elements like buttons and input fields. This provides just enough softness to feel modern without losing the "crisp" editorial edge.
- **Artwork & Large Cards:** May use the same 4px radius or remain completely sharp (0px) if the artwork is particularly geometric.
- **Icons:** Should be stroke-based (linear) rather than filled, matching the weight of the typography for a cohesive visual language.

## Components

### Buttons
- **Primary:** Terracotta background, Charcoal text (or White if contrast required), 4px radius. No shadow.
- **Secondary:** Transparent background, 1px Charcoal border, Charcoal text.
- **States:** Hover should deepen the Terracotta color (#964936); no "lift" effects.

### Cards
- **Style:** Surface color (#FCFAF7) background or a simple 1px border (#DDD7CE) with no background.
- **Spacing:** Generous internal padding (32px) to prevent content from feeling cramped.

### Input Fields
- **Style:** 1px border (#DDD7CE), no fill. Label text should use the uppercase `label-md` token above the field.
- **Focus:** Border color changes to Charcoal (#242321) with a 1px solid thickness.

### Chips & Tags
- **Style:** Small, uppercase text. Light gray or ivory background. Very subtle 4px radius. Used for categorizing artwork or medium types.

### Navigation
- **Header:** Minimalist. Text-only links with generous spacing. Use the primary background color to blend the header into the page, using a border-bottom only when scrolling.