# Crystalina — Image Generation Prompts (for Codex)

Generate each image below and save it to the exact path shown, then it appears on the site.
Two images (hero background, exploded RO-10) are **already referenced in code** and will show
the moment their files exist. The rest currently use temporary stock photos; once generated,
swap the `<img src>` to the local path noted per image.

## Global art direction (apply to every prompt)
- **Palette (strict):** deep navy `#15375D` / `#1F4C80`, vivid blue `#2A7BC4`, light blue `#53A4DA`,
  cyan `#3DC7F4`, silver `#CFD2D3`, white. No teal-green, no purple, no warm/orange casts.
- **Mood:** modern, clean, premium, trustworthy, clinical-but-warm. Think Apple-store-meets-water-science.
- **Lighting:** soft studio light, gentle gradients, subtle depth of field.
- **Format:** export **WebP**, quality ~82, sRGB. Optimize file size (< 400 KB where possible).
- **Universal negative prompt:** `text, watermark, logo, letters, brand names, people's faces distorted,
  extra fingers, low-res, jpeg artifacts, cluttered, busy background, garish colors, green tint, purple tint`.

---

## 1. Hero background — ACTIVE, FULL-BLEED (`/images/hero-bg.webp`)
This image fills the **entire** hero (no image box). Text sits over the left third on a dark
navy gradient; the right side stays visible, so the subject must live on the **right half**.
- **Size:** 2600 × 1500 (landscape, 16:9-ish). Keep the composition's focal point on the right;
  the left ~40% should be calmer/simpler (a wall, window light, or soft gradient) with room for text.
- **Prompt:** "Editorial lifestyle photograph, a happy young family (two parents and a child)
  together in a bright, airy modern New York City kitchen, smiling and sharing glasses of
  crystal-clear water, grouped on the right side of the frame, warm genuine candid moment, soft
  natural window light, shallow depth of field, calm and premium, cool blue color grade, the left
  side of the frame is a softly lit neutral wall with gentle negative space for text, sophisticated
  and aspirational, high-end brand photography, blue palette #15375D #2A7BC4 #3DC7F4."
- **Alternate (product-forward) prompt:** "Premium under-sink reverse osmosis system with brushed
  stainless canisters and blue tubing, dramatically lit on the right side of a dark studio scene,
  water droplets and soft caustic reflections, deep navy to cyan gradient filling the left as
  negative space, cinematic, high-end product photography, monochrome blue palette."
- **Note:** deliver a version that reads well when the left ~40% is covered by a dark navy overlay.

## 2. Exploded RO-10 system — ACTIVE (`/images/exploded-filter.webp`)
- **Size:** 1200 × 1400 (portrait), **transparent background**.
- **Prompt:** "Exploded technical product view of an under-sink reverse osmosis water filtration
  system, components separated and floating in a vertical stack with thin connecting lines:
  three cylindrical filter canisters (sediment, two carbon blocks), a horizontal membrane housing,
  a round pressurized storage tank, and a slim brushed-metal faucet, clean studio render, brushed
  stainless steel and translucent blue housings, soft reflections, isolated on transparent background,
  premium industrial design, navy and cyan accents #1F4C80 #3DC7F4."
- **Note:** vertical stack from top (intake) to bottom (faucet); crisp edges for the transparent cutout.

## 3–8. Category tiles (`/images/cat-*.webp`, 800 × 600 each)
Replace the six stock photos in the homepage "Shop By Category" grid.
| File | Prompt focus |
|---|---|
| `/images/cat-reverse-osmosis.webp` | "Sleek under-sink reverse osmosis unit installed under a modern kitchen sink, tidy blue tubing, stainless canisters, clean cabinet interior, premium." |
| `/images/cat-whole-house.webp` | "Large whole-house water filtration system mounted in a clean utility area of a NYC brownstone basement, big blue canisters, professional install." |
| `/images/cat-countertop.webp` | "Modern countertop water dispenser on a bright minimalist kitchen counter, glass of clear water beside it, renter-friendly, navy and cyan accents." |
| `/images/cat-shower.webp` | "Premium chrome shower head with soft water spray in a bright modern bathroom, clean tile, spa-like, blue tones, water droplets." |
| `/images/cat-replacement.webp` | "Set of cylindrical replacement water filter cartridges standing in a row on a clean white surface, studio product shot, blue and silver." |
| `/images/cat-accessories.webp` | "Flat lay of water testing accessories: a digital TDS meter, small UV lamp module, and mineral drops bottle on a clean light-blue surface, top-down." |

## 10. Lifestyle / hydration (`/images/lifestyle-hydration.webp`)
- **Size:** 900 × 700. Homepage "Why Crystalina" split section.
- **Prompt:** "A happy, healthy family in a bright modern NYC apartment kitchen drinking clear water
  from glasses, natural window light, candid and warm, lifestyle photography, cool clean color grade."

## 11. NYC skyline (`/images/nyc-skyline.webp`)
- **Size:** 900 × 700. About page.
- **Prompt:** "New York City skyline at soft blue hour, clean and crisp, subtle cool blue tone,
  water reflections in the foreground (Hudson River), premium editorial photography."

## 12. Point-of-use tap (`/images/point-of-use.webp`)
- **Size:** 900 × 700. NYC Water page.
- **Prompt:** "Clean filtered water flowing from a modern kitchen faucet into a glass, sharp focus on
  the clear stream, bright kitchen bokeh background, cool blue palette, premium."

## 13. Product photos (`/images/products/<id>.webp`, 1000 × 750 each)
Studio product shots on a seamless very-light-blue (#F3FAFE) background, soft shadow, centered,
navy/cyan/silver hardware. Load each into the Admin dashboard product image field (or set as the
`image` in `js/store.js`).
| Product id | Prompt focus |
|---|---|
| `ro-alkaline-10` | 10-stage under-sink RO system, multiple stainless canisters + tank + designer faucet, flagship. |
| `ro-classic-5` | Compact 5-stage under-sink RO system with chrome faucet. |
| `wh-3stage` | Three large blue whole-house filter canisters on a mounting bracket. |
| `ct-luxe` | Modern countertop water dispenser, glossy white and navy, digital panel. |
| `shower-12` | Chrome multi-stage shower filter attached to a shower arm, water spray. |
| `faucet-pure` | Small twist-on faucet-mount filter on a kitchen tap, switch lever. |
| `pitcher-glacier` | Clear 10-cup water filter pitcher with blue lid, full of clear water. |
| `filters-ro-set` | Three replacement RO pre-filter cartridges in a row. |
| `filters-wh-set` | Three heavy-duty whole-house replacement cartridges. |
| `uv-guard` | Slim stainless UV sterilization chamber module with blue indicator. |
| `tds-meter` | Handheld digital TDS water quality meter, screen showing a reading. |
| `mineral-drops` | Small dropper bottle of trace mineral drops, navy label, on light surface. |

---

### After Codex generates the files
- Images **1 and 2** appear automatically (already wired).
- For **3–12**, replace the `https://images.unsplash.com/...` `src` on the relevant page with the
  local `/images/...` path (keep the existing `onerror` fallback).
- For **13**, upload via the Admin dashboard, or set the `image` field in `js/store.js`.

---

## 14. H5-600 exploded flagship view (`/images/h5-600-exploded.webp`)

Replaces the generic RO-10 artwork in the homepage "Inside the Flagship" section.
This one intentionally sits **outside** the blue brand palette: it is a technical
cutaway, so a neutral studio look reads as more credible than brand colour.

- **Size:** 1400 x 1600 (portrait), **transparent background**.
- **Reference images already in the repo** (match the real hardware, do not invent a
  different product): `/images/products/h5-600-uv-transparent.webp`,
  `h5-600-uv-studio.webp`, `h5-600-uv-editorial.webp`, `h5-600-uv.webp`.
- **The real H5-600 hardware:** a black powder-coated open frame holding three
  vertical clear-and-steel prefilter housings side by side, two round analogue
  pressure gauges and a small digital monitoring panel across the top rail, a
  horizontal cylindrical 600 GPD RO membrane housing, and a black LED-UVC module
  mounted along the top.

- **Prompt:** "Technical exploded view of a black-frame high-flow reverse osmosis
  water purification system, components separated vertically with clean thin grey
  leader lines and generous spacing between parts: at the top a black cylindrical
  LED-UVC sterilization module, below it a horizontal stainless reverse osmosis
  membrane housing, then three vertical cartridge filters side by side (a white
  pleated sediment cartridge, a black activated carbon block, and a mineral
  alkaline cartridge), then the black powder-coated steel mounting frame with two
  round pressure gauges and a small digital display panel, and at the bottom a
  brushed stainless faucet. Neutral studio lighting, soft realistic shadows,
  matte black and brushed steel and white materials, subtle grey and amber
  accents, industrial product design render, isolated on a transparent
  background, sharp focus, high detail."

- **Negative prompt:** `text, watermark, logo, letters, brand names, blue tint,
  heavy colour grading, cluttered background, duplicated parts, floating debris,
  low-res, jpeg artifacts`

- **Note:** keep the vertical stack order top-to-bottom so it reads as the water
  path, and keep the silhouette narrow so it sits beside the numbered stage list.
