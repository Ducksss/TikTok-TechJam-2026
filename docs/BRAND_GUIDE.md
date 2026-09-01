# SynthFlag brand guide

Version 1.0 · 31 August 2026

This guide translates the visual grammar of the [Arooth reference site](https://arooth.webflow.io/) into an original identity for SynthFlag. It keeps the reference's clarity, scale, cobalt palette, pill-shaped controls, pale surfaces, and editorial pacing while replacing its agency-specific identity with a system built for robust AI-generated image detection.

The reference is inspiration, not an asset library. Do not reuse its logo, icons, photographs, illustrations, or copy without the appropriate license.

## Brand foundation

### One-line description

SynthFlag is a four-expert ensemble that turns image signals into a clear, reviewable probability of synthetic origin.

### Brand idea

**Evidence before certainty.**

SynthFlag should feel technically credible without looking clinical, and progressive without falling into generic “AI futurism.” The identity combines measured structure with one confident visual gesture: a vivid cobalt signal moving through a calm field of white and pale blue.

### Promise

**From pixels to evidence.**

### Personality

| Trait | What it means in practice |
|---|---|
| Rigorous | Claims are specific, qualified, and tied to evidence. |
| Clear | Plain language, visible hierarchy, and one idea per section. |
| Assured | Large type and decisive composition; no hype or bravado. |
| Curious | We investigate signals and edge cases instead of declaring absolutes. |
| Progressive | Modern color, motion, and image treatment without sci-fi clichés. |

### Audience

- Researchers and challenge reviewers who need methodological credibility.
- Product and trust teams evaluating practical detector behavior.
- Partners and non-specialists who need conclusions without losing caveats.

## Message system

### Core messages

1. **Four experts. One ensemble score.** SynthFlag combines two CLIP and two SigLIP experts through the published detector architecture.
2. **Designed for the wild.** The system is designed to be evaluated across real-world datasets, generators, and controlled distortions.
3. **Evidence, not a verdict.** The score supports review; it is not conclusive proof of an image's origin.
4. **Performance you can inspect.** Report thresholds, datasets, sample counts, uncertainty, and failure cases beside headline metrics.

### Headline style

Use short, declarative phrases of three to eight words. Prefer one strong noun or verb. Sentence case is the default.

Good examples:

- See what the pixels reveal.
- Four experts. One signal.
- Designed for the wild.
- Evidence before certainty.
- Confidence, with context.
- Inspect the signal.

Avoid:

- Overpromises such as “Detect every fake instantly.”
- Fear language such as “The deepfake threat is here.”
- Empty superlatives such as “Revolutionary next-generation AI.”
- Claims that confuse a threshold change with an improved model.

### Product language

| Prefer | Avoid |
|---|---|
| “The model assigns a fake-image probability of 0.82.” | “This image is definitely fake.” |
| “At the selected threshold…” | “The detector proves…” |
| “On this evaluated dataset…” | “Works on every image.” |
| “The ranking performance is unchanged.” | “A lower cutoff makes the model smarter.” |
| “Supports human review.” | “Replaces human judgment.” |

## Logo direction

### Primary lockup

Use a bespoke four-part signal mark followed by the `SynthFlag` wordmark. The proposed mark consists of four tapered modules surrounding a narrow central aperture:

- four modules represent the four expert models;
- the aperture represents the image signal being inspected;
- the aligned modules communicate agreement without implying certainty.

The wordmark is set in Instrument Sans Medium with custom spacing. Use title case exactly as `SynthFlag`.

### Alternate lockups

- **Horizontal:** mark + wordmark; default for navigation, reports, and slides.
- **Mark only:** app icon, favicon, avatar, or small data label.
- **Wordmark only:** use when the mark would be visually redundant.

### Clear space and minimum size

- Clear space: at least the width of one mark module on every side.
- Horizontal lockup minimum: 120 px digital or 32 mm print.
- Mark-only minimum: 24 px digital or 7 mm print.
- At small sizes, remove internal hairlines before reducing the outer silhouette.

### Logo rules

- Use Ink on light backgrounds, White on Cobalt, or Cobalt on White.
- Keep the mark flat; do not apply the brand gradients inside the wordmark.
- Do not rotate, stretch, outline, add a drop shadow, or place over busy imagery.
- Do not reproduce or modify the Arooth logo; the SynthFlag mark must be original.

## Color system

The palette is cool, bright, and evidence-led. White and Cloud create breathing room; Cobalt is the signal; Ink provides authority.

| Token | Hex | Role |
|---|---:|---|
| Signal Cobalt | `#0040C1` | Primary brand, actions, key numbers, active states |
| Ink | `#111827` | Headlines, primary text, dark surfaces |
| Slate | `#4B5563` | Supporting copy and secondary information |
| Muted Slate | `#6B7280` | Metadata and tertiary labels |
| White | `#FFFFFF` | Main canvas and inverse text |
| Cloud | `#EFF4FF` | Section surfaces, inactive controls, quiet cards |
| Line Blue | `#D1E0FF` | Rules, card borders, grid lines |
| Sky | `#6199FF` | Illustration highlights and secondary chart series |
| Deep Blue | `#00359E` | Gradient shadow and selected states |
| Bright Blue | `#2970FF` | Gradient highlight and controlled emphasis |

### Gradients

- **Signal field:** `linear-gradient(120deg, #6199FF 50%, #C0D7FF)`
- **Deep signal:** `linear-gradient(180deg, #00359E 0%, #0042C5 50%, #2970FF 100%)`

Gradients belong in hero fields, masks, and abstract signal graphics. Keep them out of body text, data labels, and metric bars.

### Color balance

- 45% White
- 25% Cloud and other pale blue surfaces
- 18% Signal Cobalt
- 10% Ink and Slate
- 2% gradients or Sky highlights

Use Cobalt as a signal, not wallpaper. A page should usually contain one dominant cobalt field or a handful of smaller cobalt actions—not both at full intensity.

### Accessibility

- Use White text on Cobalt and Ink.
- Use Ink text on White, Cloud, and Line Blue.
- Slate is for supporting text at 16 px or larger; prefer Ink for small or essential copy.
- Never encode real/fake, pass/fail, or model A/B using color alone. Pair color with labels, shapes, or line styles.

## Typography

### Families

- **Display:** Instrument Sans, Regular (400) by default; Medium (500) for the wordmark and compact emphasis.
- **Body and UI:** Poppins, Regular (400); Medium (500) for labels and controls; Semibold (600) only for compact data emphasis.
- **Fallback:** `Arial, Helvetica, sans-serif`.

Instrument Sans carries the editorial voice. Poppins handles detail, navigation, annotation, and data. Do not introduce a third family.

### Desktop type scale

| Style | Family | Size / line height | Weight | Tracking |
|---|---|---:|---:|---:|
| Display word | Instrument Sans | `clamp(96px, 16vw, 216px) / 0.88` | 400 | `-0.05em` |
| H1 | Instrument Sans | `64 / 70.4px` | 400 | `-0.03em` |
| H2 | Instrument Sans | `52 / 62.4px` | 400 | `-0.03em` |
| H3 | Instrument Sans | `40 / 48px` | 400 | `-0.03em` |
| H4 | Instrument Sans | `32 / 41.6px` | 400 | `-0.03em` |
| H5 | Instrument Sans | `28 / 36.4px` | 400 | `-0.03em` |
| H6 / pull quote | Instrument Sans | `22 / 28.6px` | 400 | `-0.03em` |
| Lead | Poppins | `18 / 27px` | 400 | `-0.02em` |
| Body / UI | Poppins | `16 / 24px` | 400–500 | `-0.02em` |
| Caption / metadata | Poppins | `14 / 21px` | 400–500 | `-0.02em` |

### Mobile adjustments

- H1: `44 / 48px`
- H2: `36 / 42px`
- H3: `30 / 36px`
- Body remains `16 / 24px`
- Keep the display word large enough to crop at the viewport edge; it is an image-like element, not a paragraph.

### Typographic behavior

- Use tight display tracking and generous section spacing.
- Keep body lines around 55–72 characters.
- Use sentence case for headings and buttons.
- Uppercase is reserved for short filter chips, never prose.
- Use tabular numerals for metrics, score outputs, thresholds, and sample counts.

## Layout and composition

### Grid

- Desktop: 12 columns, 60 px outer gutters, 24 px internal gutters.
- Tablet: 8 columns, 32 px outer gutters, 20 px internal gutters.
- Mobile: 4 columns, 16 px outer gutters, 16 px internal gutters.
- Recommended content maximum: 1,280 px.

Use visible one-pixel grid lines sparingly in hero fields and comparison modules. They imply measurement and structure, but should not run behind dense copy.

### Spacing

Base unit: 8 px.

| Token | Value | Typical use |
|---|---:|---|
| `space-1` | 8 px | Icon gaps, tight metadata |
| `space-2` | 16 px | Chips and internal stacks |
| `space-3` | 24 px | Card content, grid gutters |
| `space-4` | 32 px | Component groups |
| `space-5` | 48 px | Card padding, title-to-body |
| `space-6` | 64 px | Large module separation |
| `space-7` | 96 px | Compact section spacing |
| `space-8` | 128 px | Standard desktop section spacing |
| `space-9` | 160 px | Hero and major story transitions |

### Shape language

- Pill controls: `999px` radius.
- Cards and image frames: `32px` default, `40px` for large feature surfaces.
- Small containers: `20px` radius.
- Circular icon buttons: 36 px or 48 px.
- Rules and borders: 1 px Line Blue.
- Shadows: generally none. If elevation is required, use a soft blue-black shadow below 8% opacity.

## Components

### Floating navigation

- White pill container with a 1 px Line Blue edge.
- Separate logo capsule on the left, navigation capsule in the center, and Cobalt action on the right.
- Active page: Cloud fill with Cobalt text.
- Desktop height: 64–72 px overall; individual controls 36–48 px.

### Primary button

- Height: 48 px.
- Radius: 999 px.
- Label: 16 / 24 px Poppins Regular or Medium.
- Padding: 6 px 6 px 6 px 24 px.
- Arrow puck: 36 × 36 px, circular, contrasting fill.
- Preferred pairs: Cobalt/White and White/Cobalt.
- Hover: roll the label vertically by one line and move the arrow diagonally up-right; duration 180–240 ms.

### Label chip

- 28–32 px high with a 1 px Line Blue border.
- 12–14 px Poppins Medium.
- Use short uppercase taxonomy such as `DATASET`, `GENERATOR`, `CLEAN`, or `AUGMENTED`.

### Evidence card

- Cloud surface, 1 px Line Blue border, 32–40 px radius.
- 32–48 px padding.
- Structure: index → title → short claim → supporting metrics → source or caveat.
- Use a Cobalt number or dot as the single focal signal.
- Keep status labels textual; do not rely on color alone.

### Image specimen

- Large rounded image frame with 32 px radius.
- Add a compact overlay or adjacent strip for score, threshold, dataset, generator, and augmentation state.
- Preserve the image's aspect ratio and never apply a decorative filter that could be confused with evidence.

### Tables and benchmark modules

- White or Cloud background; Ink text; Line Blue separators.
- Right-align numeric values and use tabular numerals.
- Always show sample count, split, threshold, and whether data are clean or augmented.
- Use a dash for unavailable values instead of mixing runs.
- Pair A/B results from the same scored examples. Make threshold-only changes visually distinct from model or ranking changes.

## Data visualization

- Cobalt is the primary series; Sky is secondary; Ink is the benchmark or reference line.
- Use Muted Slate for axes and Line Blue for grid lines.
- Prefer direct labels to legends when space allows.
- Show confidence intervals and sample counts for performance claims.
- Label the operating threshold on confusion-matrix and precision/recall views.
- Keep ROC and PR curves visually separate from threshold-dependent metrics.
- Avoid 3D charts, neon heatmaps, rainbow palettes, and decorative gradients inside plotted data.
- Real/fake comparisons must use text or shape encoding in addition to color.

## Image and illustration direction

### Photography

- High-key, crisp, and minimally staged.
- Cool daylight or controlled blue cast.
- Large areas of negative space.
- Single subjects, objects, or material details rather than busy scenes.
- Crop boldly and use rounded frames.

For SynthFlag, pair aspirational imagery with forensic detail: surface texture, compression patterns, reflections, skin, typography, and object edges. Avoid visual tropes such as glowing brains, humanoid robots, circuit-board faces, or hooded hackers.

### Technical graphics

- Use a faint measurement grid on large blue fields.
- Use four-part structures to echo the ensemble architecture.
- Use apertures, frames, crops, and split planes to suggest inspection.
- Prefer flat vector lines and translucent blue planes over skeuomorphic 3D renders.

### Evidence integrity

- Clearly label example images as real, synthetic, or unknown only when that label is known.
- Keep model outputs visually separate from ground-truth labels.
- Never alter an evaluation image for presentation without disclosing the change.
- Caption source, dataset, generator, and augmentation state wherever relevant.

## Motion

Motion should communicate direction and state, not create spectacle.

- Standard UI transition: 180–240 ms, ease-out.
- Section reveal: 360–500 ms with 16–24 px vertical travel.
- Button label roll and diagonal arrow swap: 180–240 ms.
- Hero display word may reveal by mask or tracking once per visit.
- Respect `prefers-reduced-motion` and disable nonessential parallax.
- Freeze motion in benchmark tables, charts, and score explanations while users are reading.

## Page grammar

A typical SynthFlag page should follow this rhythm:

1. Floating pill navigation.
2. Oversized single-word signal such as **EVIDENCE**, **TRACE**, **SIGNAL**, or **TRUST**.
3. A short plain-language promise and one primary action.
4. A proof block with method, datasets, and headline metrics.
5. Rounded specimen or comparison cards.
6. A high-contrast section for caveats, FAQ, or methodology.
7. A restrained closing action.

Do not use more than one oversized signal word on the same viewport. The empty space around it is part of the identity.

## Practical examples

All values shown in the visual preview's component mockups are illustrative unless they are explicitly tied to a cited evaluation artifact.

### Homepage hero

**EVIDENCE**

> Four experts turn image signals into one reviewable probability—built for robust detection in the wild.

Primary action: **Inspect the method ↗**

Secondary action: **View benchmark**

### Results intro

**Confidence, with context.**

> Read performance by dataset, generator, and distortion. Every result includes its sample count, split, and operating threshold.

### Responsible-use note

> SynthFlag scores indicate model confidence, not proof of origin. Use them alongside provenance, context, and human review.

## Motion and scroll

SynthFlag uses the browser's native document scrolling. Do not add Lenis or
another virtual-scrolling layer by default. GSAP and ScrollTrigger may observe
the native scroll position for section reveals, restrained scrubbed progress,
and desktop-only parallax, but they must not hijack wheel, touch, keyboard, or
browser navigation behavior.

- Respect `prefers-reduced-motion` by presenting all content immediately and
  disabling decorative movement.
- Keep scroll-linked parallax off compact and touch-first layouts unless it has
  been explicitly tested there.
- Treat motion as progressive enhancement: navigation, reading order, upload
  controls, and results must remain complete when JavaScript or animation is
  unavailable.
- Use CSS native scrolling for anchor navigation and preserve normal focus and
  history behavior.

The canonical landing-page sequence is:

1. A desktop sticky scan hero whose detector view develops with scroll.
2. A word-level reveal for “From pixels to evidence.”
3. A scrubbed feature-map and probability visualization.
4. Evidence cards that enter in a restrained stagger with a light blur.
5. A final desktop-pinned verdict sequence that resolves into the primary CTA.

On mobile, keep the same content hierarchy but remove sticky pinning and
scroll-scrubbed movement. Under `prefers-reduced-motion: reduce`, present the
final readable state immediately and disable decorative animation.

## Design tokens

```css
:root {
  --fd-color-signal: #0040c1;
  --fd-color-ink: #111827;
  --fd-color-slate: #4b5563;
  --fd-color-muted: #6b7280;
  --fd-color-white: #ffffff;
  --fd-color-cloud: #eff4ff;
  --fd-color-line: #d1e0ff;
  --fd-color-sky: #6199ff;
  --fd-color-deep: #00359e;
  --fd-color-bright: #2970ff;

  --fd-gradient-signal: linear-gradient(120deg, #6199ff 50%, #c0d7ff);
  --fd-gradient-deep: linear-gradient(180deg, #00359e 0%, #0042c5 50%, #2970ff 100%);

  --fd-font-display: "Instrument Sans", Arial, Helvetica, sans-serif;
  --fd-font-body: "Poppins", Arial, Helvetica, sans-serif;

  --fd-radius-sm: 20px;
  --fd-radius-card: 32px;
  --fd-radius-feature: 40px;
  --fd-radius-pill: 999px;

  --fd-space-1: 8px;
  --fd-space-2: 16px;
  --fd-space-3: 24px;
  --fd-space-4: 32px;
  --fd-space-5: 48px;
  --fd-space-6: 64px;
  --fd-space-7: 96px;
  --fd-space-8: 128px;
  --fd-space-9: 160px;
}
```

## Final quality check

Before shipping a SynthFlag artifact, ask:

- Is the page mostly calm, pale, and spacious, with Cobalt used as the signal?
- Is there one clear message and one dominant action?
- Are claims tied to a dataset, sample count, metric, or method?
- Are threshold-dependent claims distinguished from ranking or model changes?
- Are uncertainty, provenance, and limitations visible rather than buried?
- Are the logo, icons, and imagery original or properly licensed?
- Does the result still work without motion and without color alone?
