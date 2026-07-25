# PsyFi Design System

## Purpose

This design system converts the PsyFi visual language into platform-neutral tokens and behavioral contracts. Web is the first implementation. Future iPhone interfaces must consume the same semantic system rather than recreating the brand independently.

## Experience Principles

1. **Field before chrome** — the simulation and its state remain visually primary.
2. **Calm control, expressive output** — controls are restrained; visualization carries intensity.
3. **Explain every transformation** — users can distinguish inputs, modeled processes, metrics, and interpretations.
4. **Progressive disclosure** — novice workflows remain legible while advanced parameters stay available.
5. **Motion communicates state** — animation must indicate causality, transition, or feedback; decoration alone is insufficient.
6. **Accessible by construction** — color, motion, sound, and spatial effects always have non-exclusive alternatives.

## Information Hierarchy

Primary surfaces:
- simulation workspace;
- preset and parameter controls;
- visualization viewport;
- run state and progress;
- results and provenance inspector;
- session history and export.

Secondary surfaces:
- engine catalog;
- methodology and limitations;
- capability diagnostics;
- preferences;
- help and glossary.

## Semantic Tokens

Store tokens in a platform-neutral source such as JSON and generate CSS variables first, then Swift constants later.

```json
{
  "color": {
    "surface.canvas": "#07070B",
    "surface.panel": "#101018",
    "surface.elevated": "#171724",
    "text.primary": "#F4F4F8",
    "text.secondary": "#B8B8C7",
    "text.muted": "#858597",
    "signal.primary": "#63F3E8",
    "signal.secondary": "#D56CFF",
    "signal.tertiary": "#8D7CFF",
    "status.success": "#74D99F",
    "status.warning": "#F1C76A",
    "status.danger": "#FF7A8A"
  },
  "space": {"1":4,"2":8,"3":12,"4":16,"5":24,"6":32,"7":48,"8":64},
  "radius": {"sm":6,"md":10,"lg":16,"pill":999},
  "duration": {"instant":0,"fast":120,"standard":220,"slow":420},
  "opacity": {"disabled":0.42,"muted":0.68,"scrim":0.72}
}
```

Values are initial defaults, not permission to hardcode duplicates throughout the UI.

## Typography

- Use a highly legible sans-serif for interface and explanatory copy.
- Use monospaced typography only for identifiers, parameters, metrics, code, and provenance.
- Minimum body size: 16 CSS pixels on mobile.
- Keep line length near 45–75 characters for explanatory content.
- Do not encode hierarchy using color alone.

## Component Contracts

Every interactive component documents:
- default, hover, focus, active, selected, loading, disabled, success, warning, and error states where applicable;
- keyboard behavior;
- screen-reader name and description;
- touch target size;
- reduced-motion behavior;
- data and analytics implications.

Minimum component set:
- app shell and navigation;
- parameter field, slider, stepper, toggle, and select;
- preset card;
- primary/secondary/destructive buttons;
- run progress and cancellation controls;
- metric card with definition and range;
- provenance record;
- visualization toolbar;
- modal/dialog, toast, inline alert, empty state, and error boundary;
- session list and import/export controls.

## Layout

- Mobile baseline begins at 320 CSS pixels.
- Use content-driven breakpoints rather than device labels.
- Preserve safe-area insets for installed PWAs.
- The primary action remains reachable without obscuring the visualization.
- Desktop may use split panes; mobile uses staged sections or sheets.
- Avoid permanently fixed panels that reduce the field viewport below a useful size.

## Motion

- Respect `prefers-reduced-motion` without removing critical state feedback.
- Default interface transitions: 120–220 ms.
- Complex visualization transitions may be longer but must be interruptible.
- Never animate unboundedly when the viewport is hidden or the user has paused simulation.
- Distinguish simulated temporal evolution from decorative UI animation.

## Visualization Accessibility

Every canonical visualization requires:
- textual summary;
- numerical values or downloadable data;
- palette that remains interpretable under common color-vision deficiencies;
- high-contrast mode or alternate palette;
- non-animated or reduced-motion representation;
- explicit legend and units;
- keyboard-accessible view controls.

## Content Standards

Use disciplined language:
- `simulation`, `model`, `preset`, `parameter`, `metric`, `estimate`, and `rendering` are preferred.
- Avoid presenting modeled states as diagnoses, biological measurements, or verified subjective experiences.
- Surface assumptions and limitations near interpretation, not only in legal or methodology pages.

## Asset Standards

- Prefer SVG for interface icons and diagrams.
- Use glTF/GLB only when 3D materially improves comprehension.
- Compress raster textures and provide responsive sizes.
- Record source, license, version, dimensions, color space, and intended use in an asset manifest.
- Do not embed critical meaning solely inside an image.

## Design QA Gate

A feature is not design-complete until it passes:
- responsive layout review;
- keyboard-only operation;
- screen-reader smoke test;
- contrast validation;
- reduced-motion review;
- loading/error/empty-state review;
- real-device mobile test;
- provenance and terminology review.
