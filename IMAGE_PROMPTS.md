# Crystalina — editorial image direction

Revised 2026-11-02 from the user's direct review. This file governs site imagery.
Read sections 2–4 before generating. The previous emphasis on dirt and wear is retired.

## 1. Direction

Clean, attractive, well-kept middle-income New York apartments, photographed at
editorial quality, with the filter as the visual focal point. Homes are comfortable
and attainable, neither neglected nor luxury penthouses. Realism comes from
natural materials, believable light and people, not grime. Minor imperfections
are aesthetic and effectively unnoticeable at normal viewing size.

The user supplied two official logos and authorized applying them to actual
products. This supersedes the prior blanket text/logo ban. Brand blue belongs on
the supplied marks and genuine hardware, not on food, walls, wardrobe or lighting.

## 2. The standard

### 2.1 Resolution and delivery

Request native 4K or better (at least 3840 pixels on the long edge).
The user explicitly approved installing the best built-in generator results below
4K if their actual native resolution is documented. Never call an enlarged export
native 4K. Deliver WebP, embedded sRGB, exact dimensions below, Lanczos resampling.
P1 requires true transparency. Masters stay outside the repository; images/ publishes
whole. Only final delivery files go there. References/logs stay in image-refs/.

### 2.2 Clean editorial realism

- Clean, intact, aligned cabinetry; clean grout; wiped counters; clean sinks;
  maintained hardware. No peeling paint, grime, stains, scale, rust or crumbs.
- Restrained everyday objects: a glass, neatly folded linen towel or small fruit
  bowl. Two or three useful objects, arranged without looking sterile or staged.
- Texture means subtle wood grain, ceramic glaze, cloth weave and brushed steel.
  Do not emphasize scratches, chipped edges or distressed surfaces.
- People have natural skin, fine lines, pores, relaxed asymmetric expressions,
  anatomically correct hands and real grip pressure. No harshly exaggerated age.
- Generous soft daylight from a clear window source, natural bounce and falloff,
  bright editorial exposure and readable shadows. No gloom or theatrical rimlight.
- The filter is the sharpest, clearest and most salient subject. People and room
  support it. Never hide it behind a body, door or foreground object.
- Polished magazine photography, realistic lens perspective and materials,
  restrained styling. No plastic CGI sheen, HDR grit or featureless background haze.

### 2.3 Setting and product priority

Use nicely maintained middle-income NYC apartments: modest renovated galley
kitchens, white shaker cabinets, clean quartz or laminate counters, subway tile,
oak accents, cared-for windows and a glimpse of neighbouring brick or fire escape.
Old-building character does not mean decay. Show realistic scale and diverse households.

Lifestyle images show the actual filtration system, not just a generic glass or
faucet. Under-sink models stay installed under the sink or in a proper utility
cabinet; do not turn them into countertop dispensers. The About plate now shows
a clean NYC apartment installation, with its existing filename retained.

### 2.4 Colour

Neutral white balance, accurate whites, true skin/material colours. No cool,
warm, green, purple or amber grade. Actual wood, fruit and fitting colours are fine.
No brand-blue set dressing. Official blue/silver artwork is allowed on the product.

### 2.5 Official product branding

Use these supplied references, copied unchanged:
- image-refs/brand/Crystalina-Logo.png — official wordmark and tagline.
- image-refs/brand/Realistic-Logo.png — blue/silver C-and-water-drop emblem.

Apply the wordmark and/or emblem as a proportionate engraving, printed mark,
fitted label, badge, embossing or texture ON THE PRODUCT. Follow its perspective,
curvature, lighting and reflections. Preserve the reference's shape/proportions.
Do not paste a white reference-image rectangle over hardware.

Use wordmark on a large panel/rail; use emblem alone on small chrome/curved parts.
Monochrome engraving of the emblem is allowed. Omit the tagline when too small.
If rendered, permitted wording is exactly CRYSTALINA and PURE WATER. PURE LIFE.
No invented lettering, claims, specifications, numbers, UI or other brands.
No floating logo/watermark; no branding on walls, clothes, people, food or unrelated
appliances. Original product photographs remain protected; only generated assets
receive this treatment. Category concepts are not verified catalogue products.

### 2.6 Negative prompt — include on every generation

```text
dirt, grime, mould, mildew, stained grout, peeling paint, chipped cabinets,
water stains, limescale, rust, crumbs, rubbish, distressed surfaces, clutter,
neglected apartment, gritty reportage, gloomy room, luxury penthouse,
unauthorized text, numbers, signage, watermark, invented logo, misspelled branding,
third-party brand, UI overlay, floating logo, oversized product label,
airbrushed skin, poreless face, plastic skin, waxy skin, exaggerated wrinkles,
identical expressions, extra fingers, malformed hands, fused fingers,
blue colour grade, cool colour grade, warm colour grade, orange tint, green tint,
purple tint, teal and orange, heavy vignette, lens flare, bokeh haze background,
HDR halo, oversharpened, CGI render, 3D render, video game lighting,
floating objects, duplicated parts, impossible plumbing, low-res, jpeg artifacts
```

Supplied Crystalina marks on products are allowed. P1's intentional exploded
separation is the only exception to floating parts.

## 3. References

Scene references: image-refs/<target-filename>.<ext>, numbered for multiples.
Brand references: image-refs/brand/. Real product photographs govern hardware;
supplied logos govern branding. Scene references guide composition, but this user's
clean-home correction overrides dirt, wear and clutter. Section 4 governs crop.
If accurate hardware cannot fit the scene, flag it in COORDINATION.md rather than
inventing components. User authorized all P1–P6 from written prompts when scene
references are absent. image-refs/ stays outside the publish allow-list.

## 4. Compose for the box

### A. Product shots
Full hardware with margins, neutral surface or required alpha, plausible lighting.
Do not overwrite protected images/products/ photographs or their variants.

### B. Category tiles
Exactly 4:3. Entire focal hardware and logo in upper two thirds, ideally ending at
60–62% image height. Bottom third quiet CLEAN counter, floor or tile for the CSS
label gradient. Leave margins for scale(1.05) hover. Hardware readable at 380px.
Do not make the product tiny in a vast room. Never bake in a gradient.

### C. Lifestyle and About plates
1200 x 900, 4:3. Filter sharp, prominent and unobstructed. People, if present,
support the product story with natural activity at its dedicated faucet.
No forced symmetry. No generic faucet-only composition.

### D. Technical exploded view
1400 x 1600, 7:8, true alpha; generous spacing, thin neutral grey leader lines.
Top to bottom: UVC, membrane housing, three filter assemblies, empty frame with
gauges/display, faucet. Preserve actual black/amber housing and cartridge geometry.
Conceptual exploded illustration, not a certified flow schematic. Brand frame
rail or casing. Do not duplicate the full system inside its empty frame.

### E. Hero
2600 x 1500, 26:15. Hardware and human activity on right half. Left 40% is clean
real room, no painted gradient; CSS adds the overlay. Product branding is visible
on right. Bodies and open doors must not obscure the filter.

## 5. Weight and checks

Quality first; no per-image byte ceiling. Efficient WebP, record sizes.
The earlier 11 files totalled 2,500,482 bytes (historical, not a target).
Responsive variants, lazy loading and hero preload belong to design owner.
Run npm run check before pushing; tests/build must pass. Report unrelated drift.

## 6. Protected hardware

Never regenerate/overwrite these real photographs or their derived variants:
```text
images/products/h5-600-uv-studio.webp
images/products/f5-600-uv-studio.webp
images/products/x2a-600-studio.webp
images/products/w5-400-alkaline-studio.webp
```
Use the matching model as reference. H5-600: black open frame, three clear bowls
with black caps, two gauges, dark panel with three orange buttons, horizontal
black membrane housing with amber collar, black UVC above. No invented features.
Use filter-ppf-02.webp and filter-acm-10.webp for replacement cartridge geometry.

## 7. Revised prompts

Every entry includes sections 2.2, 2.4, 2.5 and full negative prompt 2.6.
All targets below are under images/, WebP/sRGB. Product is the focus.

### P1 — h5-600-exploded.webp
1400 x 1600, 7:8, transparent. References: real H5-600 and both supplied logos.
Precise photographic exploded view in section 4D order, neutral studio key,
accurate material texture, grey leaders and generous margins. Official wordmark
printed silver on right of frame rail, small supplied emblem beside it.
Gauges unnumbered, display dark. Preserve hardware geometry and transparency.

### P2 — hero-bg.webp
2600 x 1500, 26:15. References: real H5-600 and official logos.
Bright editorial photograph of a clean, attractive middle-income NYC apartment
kitchen: modest white shaker cabinetry, pale counter, oak floor and cared-for
window overlooking nearby brick. Right-side open under-sink cabinet reveals the
real branded H5-600, primary focal point, with tidy connected plumbing. A woman
fills a glass at its dedicated faucet, standing beside rather than in front of
the unit. Teenager adds quiet context. Natural expressions and skin. Daylight
from right window; folded linen and small ceramic bowl. Left 40% clean real wall
and cabinetry. Wordmark/emblem on filter rail only. No painted gradient.

### P3 — lifestyle-hydration.webp
1200 x 900, 4:3. References: real H5-600 and official logos.
Polished editorial home photograph in a comfortable clean NYC apartment kitchen,
intact white cabinetry and oak accents. Branded H5-600 clearly visible, sharp and
unobstructed in an open under-sink cabinet in foreground. Beside it an older man
fills a glass at the dedicated filtered-water faucet for his grandchild. People
farther back, supporting the product. Restrained fruit bowl, folded towel, pale
clean counter, daylight. Natural fine skin texture and gentle candid expressions.
Official supplied marks physically printed on filter rail.

### P4 — point-of-use.webp
1200 x 900, 4:3. References: real H5-600 and official logos.
Editorial detail of the branded H5-600 installed in a beautifully clean open sink
cabinet, dedicated brushed-steel drinking-water faucet visible above. Product
foreground sharp and prominent; a hand filling a glass provides use context
without hiding filter. Clean white interior, pale counter, tidy connected tubing,
P-trap, neutral daylight and realistic clear water. Wordmark on filter rail,
optional tiny supplied emblem engraved on faucet base. No soap clutter or grime.

### P5 — nyc-skyline.webp (filename retained; new About subject)
1200 x 900, 4:3. References: real H5-600 and official logos.
Product-led editorial photograph of a real branded H5-600 installation in a clean
utility cabinet beside a kitchen sink in a comfortable middle-income NYC apartment.
Nearby well-maintained sash window offers a restrained glimpse of brownstone
brick/fire escape. Filter fills foreground, sharp and central to the story. Tidy
neutral room, daylight, white cabinetry, clean fittings, subtle oak grain.
Official wordmark/emblem on rail. No people required, no rubbish or distressed
architecture. Design owner updates skyline-specific alt text separately.

### P6 — six category tiles
All 1200 x 900, 4:3, rule 4B. Base: clean attractive middle-income NYC home,
polished editorial photograph, soft natural daylight, neutral white balance,
real texture, focal product, restrained everyday context. Hardware and branding
above bottom third; no overlay. Apply only supplied marks to product.

| Target | Prompt |
| --- | --- |
| cat-reverse-osmosis.webp | Real H5-600 in immaculate open under-sink cabinet, clean connected P-trap/shutoff/disposal with clearance, tidy tubing and intact cabinetry. Product dominates upper two thirds, clean floor foreground. Official wordmark/emblem on top rail. H5-600 reference mandatory. |
| cat-whole-house.webp | Three neat white filter housings on steel wall bracket in clean cared-for utility room, orderly copper piping, shutoff/bypass valves, boiler incidental at edge. Fresh neutral wall, clean floor. Supplied emblem/wordmark as small fitted housing labels. Category concept, not verified SKU. |
| cat-countertop.webp | Modest off-white countertop filter/dispenser with clear reservoir on clean pale counter, one ceramic mug, neat backsplash and small window. Product dominates, no luxury island. Supplied wordmark on casing and small integrated emblem. Category concept, not verified SKU. |
| cat-shower.webp | Chrome inline filter correctly joined between shower arm and showerhead in attractive clean bathroom, white tile, clean grout, natural spray. Filter focal, quiet tile below. Supplied emblem engraved into chrome body, no giant sticker. Category concept, not verified SKU. |
| cat-replacement.webp | Fresh clean cartridges matching filter-ppf-02.webp and filter-acm-10.webp, clean empty housing beside them, spotless neutral worktop. No stained used cartridge. Small official mark on end cap or housing; never cover active filter media with a solid label. Sharp product texture. |
| cat-accessories.webp | Clean TDS pen with blank display beside clear glass on clean pale kitchen counter, hand setting it down. Supplied wordmark printed on casing, small emblem near cap. Instrument/glass upper two thirds, no clutter. |

## 8. Scope and handoff

User authorized rewriting this brief and regenerating site imagery with supplied
branding. Edit IMAGE_PROMPTS.md, image-refs/, specified images/ assets and
COORDINATION.md. Never change original product photos, markup, CSS, docs/, scripts/,
functions/, api/, supabase/ or catalogue in this pass.

Whole-house/countertop/shower currently lack catalogue products. Their imagery is
a category concept, not verification of stock or actual manufactured branding.
Catalogue/design owner decides continued use. No invented certifications or claims.
Record actual prompts, references, sizes, brand treatment and checks. Earlier
generation logs are historical and do not override this revision. Retired image
deletion and old RO-10/skyline alt text remain design-owner work.

