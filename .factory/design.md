# Health Data Bridge — visual thesis

## Direction

Topographic cartography turns an invisible data boundary into a map the user can inspect. Activity and weight records travel along contour-like paths into a ruled local ledger. The interface avoids fitness-dashboard tropes: no rings, streaks, leaderboards, or motivational gradients.

## Palette

- `paper` `#F2EBDD`: warm map stock and primary background.
- `paper-deep` `#E5DAC5`: raised terrain and quiet sections.
- `ink` `#18251F`: primary text, 13.2:1 on paper.
- `ink-muted` `#526258`: secondary text, 5.3:1 on paper.
- `river` `#0D6258`: primary actions, 6.2:1 with white.
- `river-dark` `#08463F`: hover and dark treatment.
- `clay` `#913921`: warnings and route markers.
- `lichen` `#D7D19A`: selected rows and map highlights.
- `success` `#246646`, `danger` `#972F2F`.
- Dark treatment: `#101814` ground, `#17231D` surface, `#F2EBDD` text, `#93CDB8` accent.

Color never carries status alone. Labels, icons, and patterns repeat every meaning.

## Type

Display uses Georgia, a self-host-free system serif with the authority of an atlas title. Body uses the native Android/system sans stack for quick scanning and low payload. Record identifiers and quantities use `ui-monospace` with tabular figures. The scale is 14 / 16 / 20 / 28 / 44 / 64 px.

## Spacing and shapes

An 8 px base grid drives 8, 16, 24, 32, 48, 64, and 96 px gaps. Content measures at most 70 characters. Panels use clipped map-corner shapes rather than generic round cards. Buttons are rectangular with a 2 px ink edge and 48 px minimum height. Dashed route lines indicate movement; fine solid rules indicate stored records.

## Interaction grammar

The import flow is a route with four stations: Source, Range, Map, Receipt. The current station receives a filled trail marker. Record rows expand in place. Destructive choices are confirmed or reversible. Focus uses a 3 px clay outline plus a paper offset.

## Motion

The signature motion is a route being drawn between stations over 240 ms when the user advances. Rows enter with a short 160 ms vertical settle. With `prefers-reduced-motion`, all transforms are removed and state changes are immediate. Nothing loops.

## Asset plan and prompt sheet

The hero uses one original generated landscape: an oblique paper relief map where separate rust and teal contour paths converge into a small ruled field ledger. It explains the product boundary without depicting a dashboard. Small UI symbols are hand-authored SVG.

Prompt: “Editorial topographic paper-cut illustration for a privacy-first Android health data utility. Oblique terrain map made from layered warm ivory paper, precise dark green contour lines, one muted teal route and one rust route converging into a small blank ruled field ledger, subtle punched registration marks, tactile fibers, soft directional studio light, quiet archival cartography, generous negative space, no people, no phones, no medical crosses, no charts, no text, no letters, no logos, no watermark.”

Generated with the factory image model (`factory-image`) on 2026-08-28. The final asset is original to this product. Source PNG and prompt sidecar live in `assets/src/`; optimized WebP/AVIF derivatives ship in `public/assets/`.

## Why it fits

The user is not seeking coaching. They need bearings, boundaries, and proof. Cartographic marks make scope visible; the ledger imagery makes local custody tangible. The visual system presents import as a traceable route rather than a magical sync.
