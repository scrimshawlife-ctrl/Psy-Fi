# PsyFi Figma Style Guide
**Applied Alchemy Labs | Brand Identity v1.0**

This document provides specifications for importing PsyFi design tokens into Figma.

---

## Color Styles

### Neutrals

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| `PsyFi/BG/0 - Void` | #05070B | rgb(5, 7, 11) | Main background |
| `PsyFi/BG/1 - Panel` | #0B1018 | rgb(11, 16, 24) | Panel background |
| `PsyFi/BG/2 - Elevated` | #141B26 | rgb(20, 27, 38) | Elevated cards |
| `PsyFi/Border/Subtle` | #232939 | rgb(35, 41, 57) | Subtle borders |
| `PsyFi/Border/Strong` | #3A435C | rgb(58, 67, 92) | Strong borders |

### Text

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| `PsyFi/Text/Main` | #F5F7FF | rgb(245, 247, 255) | Primary text |
| `PsyFi/Text/Muted` | #9BA4C7 | rgb(155, 164, 199) | Muted text |
| `PsyFi/Text/Soft` | #6F7897 | rgb(111, 120, 151) | Soft text |
| `PsyFi/Text/Accent` | #EAE9FF | rgb(234, 233, 255) | Accent text |

### Accents

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| `PsyFi/Cyan` | #3EE7F2 | rgb(62, 231, 242) | Field/energy color |
| `PsyFi/Cyan/Soft` | #22B1C0 | rgb(34, 177, 192) | Subdued cyan |
| `PsyFi/Magenta` | #FF42C1 | rgb(255, 66, 193) | Psychedelic highlight |
| `PsyFi/Magenta/Soft` | #C02C94 | rgb(192, 44, 148) | Subdued magenta |
| `PsyFi/Violet` | #8F7BFF | rgb(143, 123, 255) | Valence/resonance |
| `PsyFi/Violet/Soft` | #6451DA | rgb(100, 81, 218) | Subdued violet |

### Status

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| `PsyFi/Success` | #38D996 | rgb(56, 217, 150) | Success states |
| `PsyFi/Warning` | #FFB547 | rgb(255, 181, 71) | Warning states |
| `PsyFi/Danger` | #FF4F6C | rgb(255, 79, 108) | Error states |
| `PsyFi/Info` | #34C3FF | rgb(52, 195, 255) | Info states |

---

## Typography Styles

### Font Families

- **UI Font**: Inter (weights: 300, 400, 500, 600, 700)
- **Mono Font**: JetBrains Mono (weights: 400, 500, 600)

### Text Styles

| Style Name | Font | Size | Weight | Line Height | Letter Spacing |
|------------|------|------|--------|-------------|----------------|
| `PsyFi/Heading/1` | Inter | 64px | Bold (700) | 120% | -2% |
| `PsyFi/Heading/2` | Inter | 48px | Semibold (600) | 120% | 0% |
| `PsyFi/Heading/3` | Inter | 32px | Semibold (600) | 120% | 5% |
| `PsyFi/Heading/4` | Inter | 24px | Medium (500) | 150% | 5% |
| `PsyFi/Body` | Inter | 16px | Regular (400) | 160% | 0% |
| `PsyFi/Body/Small` | Inter | 13px | Regular (400) | 150% | 0% |
| `PsyFi/Label` | Inter | 13px | Medium (500) | 150% | 10% |
| `PsyFi/Code` | JetBrains Mono | 13px | Regular (400) | 160% | 0% |
| `PsyFi/Metric` | JetBrains Mono | 32px | Medium (500) | 120% | 0% |
| `PsyFi/Caption` | Inter | 11px | Regular (400) | 150% | 5% |

---

## Effect Styles

### Shadows

| Name | Values |
|------|--------|
| `PsyFi/Shadow/Subtle` | 0px 4px 20px rgba(5, 7, 11, 0.6) |
| `PsyFi/Shadow/Glow/Cyan` | 0px 0px 20px rgba(62, 231, 242, 0.35) |
| `PsyFi/Shadow/Glow/Magenta` | 0px 0px 20px rgba(255, 66, 193, 0.30) |
| `PsyFi/Shadow/Glow/Violet` | 0px 0px 20px rgba(143, 123, 255, 0.28) |
| `PsyFi/Shadow/Glow/Full` | 0px 0px 24px rgba(62, 231, 242, 0.35), 0px 0px 48px rgba(143, 123, 255, 0.28) |

### Corner Radius

| Name | Value |
|------|-------|
| `PsyFi/Radius/SM` | 4px |
| `PsyFi/Radius/MD` | 8px |
| `PsyFi/Radius/LG` | 12px |
| `PsyFi/Radius/XL` | 16px |

---

## Component Patterns

### Console Card

- **Frame**: Auto-layout vertical, 30px padding
- **Fill**: PsyFi/BG/1 - Panel
- **Border**: 1px solid PsyFi/Border/Strong
- **Corner Radius**: PsyFi/Radius/LG (12px)
- **Effects**: PsyFi/Shadow/Subtle + PsyFi/Shadow/Glow/Full

### Button Primary

- **Frame**: Auto-layout horizontal, 16px vertical padding, 40px horizontal padding
- **Fill**: Linear gradient 135° from PsyFi/Cyan to PsyFi/Magenta
- **Corner Radius**: PsyFi/Radius/SM (4px)
- **Text**: PsyFi/Body, uppercase, letter-spacing: 10%
- **Effects**: PsyFi/Shadow/Subtle + PsyFi/Shadow/Glow/Cyan

### Metric Row

- **Frame**: Auto-layout vertical, 20px padding, 10px gap
- **Fill**: PsyFi/BG/1 - Panel
- **Border**: 1px solid PsyFi/Border/Subtle
- **Corner Radius**: PsyFi/Radius/MD (8px)
- **Hover**: Border → PsyFi/Violet, Fill → PsyFi/BG/2

---

## Grid & Layout

### Spacing Scale

- **XS**: 4px
- **SM**: 8px
- **MD**: 12px
- **LG**: 20px
- **XL**: 30px
- **2XL**: 40px
- **3XL**: 60px

### Grid System

- **Max Width**: 900px
- **Columns**: 12
- **Gutter**: 20px
- **Margin**: 20px (mobile), 40px (desktop)

### Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

---

## Icon Specifications

All PsyFi icons follow these specifications:

- **Canvas**: 24×24px (small), 48×48px (large)
- **Stroke Width**: 2px
- **Stroke Cap**: Round
- **Primary Stroke**: PsyFi/Text/Accent (#EAE9FF)
- **Accent Strokes**: PsyFi/Cyan (#3EE7F2), PsyFi/Magenta (#FF42C1)
- **Alignment**: Pixel-aligned geometry
- **Export**: SVG, optimized

---

## Auto-Layout Guidance

### Console Card

```
Frame: Auto-layout Vertical
├─ Header (Auto-layout Horizontal, space-between)
│  ├─ Title (Text)
│  └─ Metadata (Text)
├─ Body (Auto-layout Vertical, 25px gap)
   └─ Content
```

### Button

```
Frame: Auto-layout Horizontal, center-aligned
├─ Icon (optional)
└─ Label (Text)
Gap: 12px
Padding: 16px 40px
```

### Metric Row

```
Frame: Auto-layout Vertical, 10px gap
├─ Label (Text)
├─ Value (Text, mono)
└─ Bar (Frame with fill)
```

---

## Import Instructions

1. **Create Color Styles**:
   - In Figma, go to the color picker
   - Click the four-dot icon to create a style
   - Name using the format: `PsyFi/Category/Name`

2. **Create Text Styles**:
   - Select text
   - Click the four-dot icon in the type panel
   - Name using the format: `PsyFi/Type/Name`

3. **Create Effect Styles**:
   - Apply shadow to a frame
   - Click the four-dot icon in the Effects panel
   - Name using the format: `PsyFi/Shadow/Name`

4. **Import Icons**:
   - Copy SVG code from `docs/icons/`
   - Paste into Figma
   - Convert to component
   - Add to PsyFi icon library

---

## Resources

- **Color Tokens**: `docs/style/psyfi-colors.css`
- **Typography**: `docs/style/psyfi-typography.css`
- **Effects**: `docs/style/psyfi-effects.css`
- **Components**: `docs/style/psyfi-components.css`
- **Icons**: `docs/icons/` (SVG files)
- **Graphics**: `docs/images/` (headers/footers)

---

**Applied Alchemy Labs | PsyFi v1.0**
