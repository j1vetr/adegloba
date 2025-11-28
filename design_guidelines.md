# Maritime Starlink Admin Login - Design Guidelines

## Design Approach
**Reference-Based:** Drawing inspiration from Stripe's professional minimalism, Linear's futuristic aesthetics, and Apple's refined dark mode implementation. The design leverages glassmorphism with animated gradients to create a premium, tech-forward atmosphere befitting maritime satellite connectivity.

## Typography System
**Primary Font:** Inter or SF Pro Display (Google Fonts CDN)
**Secondary Font:** JetBrains Mono for technical details/codes

**Hierarchy:**
- H1: 3.5rem (56px), font-weight 700, tracking tight
- H2: 2rem (32px), font-weight 600
- Body: 1rem (16px), font-weight 400, leading relaxed
- Small/Caption: 0.875rem (14px), font-weight 500
- Input labels: 0.875rem, font-weight 500, uppercase tracking-wide

## Layout System
**Spacing Primitives:** Tailwind units of 4, 6, 8, 12, 16 (e.g., p-4, gap-6, mb-8)

**Structure:** Full-viewport split-screen layout (100vh)
- Left panel (55% width): Immersive maritime hero image with overlay
- Right panel (45% width): Login form with glassmorphic container

**Responsive:** Stack vertically on mobile - hero section reduces to 40vh, form below

## Core Components

### Glassmorphic Login Card
- Centered on right panel with max-width 28rem
- Background: backdrop-blur-xl with rgba overlay (dark blue/20% opacity)
- Border: 1px solid rgba(cyan/15%)
- Border-radius: 1.5rem
- Padding: p-12
- Box-shadow: Large, multi-layered with cyan glow

### Company Logo
- Positioned top-center of login card
- Size: h-12 to h-16
- Accompanied by wordmark/tagline beneath: "Maritime Connectivity Solutions" in small caps

### Input Fields
- Background: Subtle dark fill with glassmorphic border
- Height: h-14
- Border-radius: 0.75rem
- Focus state: Cyan glow ring, brightened border
- Placeholder text: Muted cyan/gray
- Icons: Leading icons (user, lock) in cyan

### Primary CTA Button
- Full-width within form
- Height: h-14
- Background: Animated gradient (deep blue → cyan)
- Border-radius: 0.75rem
- Text: Bold, white, uppercase tracking
- Hover: Gradient shift with subtle scale (1.02)
- Background blurred when over images: backdrop-blur-md

### Animated Gradient Background
Applied to login card container and button:
- Keyframe animation: Slow diagonal gradient shift (15s duration)
- Colors: Deep blue (#0A1628) → Navy (#1A2F4F) → Dark cyan (#0D4F5C)
- Subtle aurora effect with amber accent highlights

### Supporting Elements
- "Forgot Password" link: Amber accent color, small text, positioned below button
- Security badge/trust indicator: Small icon + "256-bit SSL Encryption" text at bottom
- Version number footer: Muted text, bottom-right of card

## Images Section

**Hero Background Image:**
- **Description:** Dramatic maritime scene showing a luxury yacht or cargo vessel at sea during twilight/dusk with starlink satellite visible in night sky. Atmosphere should be cinematic with deep blue ocean, amber sunset glow on horizon.
- **Placement:** Full-height left panel (55% width), with dark gradient overlay (top-to-bottom: transparent → deep blue/60%)
- **Treatment:** Subtle parallax scroll effect, slightly desaturated to enhance glassmorphism contrast
- **Alternative:** Abstract visualization of satellite connectivity mesh over ocean surface with glowing connection nodes

**Logo Image:**
- **Description:** Maritime-tech fusion logo incorporating satellite, wave, or anchor motif with modern geometric styling
- **Placement:** Top-center of login card, mb-8

## Accessibility
- High contrast ratios on dark theme (WCAG AAA for text)
- Focus indicators: Cyan glow rings, 3px offset
- Keyboard navigation fully supported
- Screen reader labels for all inputs and icons

## Animation Strategy
**Minimal, purposeful animations:**
- Gradient backgrounds: Slow, continuous 15s loop
- Input focus: Smooth 200ms glow transition
- Button hover: 150ms scale + gradient shift
- Page load: Fade-in stagger for card elements (300ms delay between)