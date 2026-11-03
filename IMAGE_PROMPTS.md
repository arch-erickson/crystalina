# Crystalina — reference-led editorial imagery
Revised 2026-11-03 following the user's latest visual review. This complete revision
supersedes the logo-heavy, oversized-product and invented-kitchen prompts.

## 1. Direction
Original editorial photographs in clean, attractive, attainable middle-income
apartments. Start with an actual photographed apartment kitchen, inspect its
architecture, then generate an original scene grounded in that layout.
The user's examples guide detail, photographic quality, background and natural
family interaction. They do not authorize copying competitor products, text,
icons, certification marks or pasted product collages.

## 2. The standard
### 2.1 Delivery
Request native 4K or better. If the built-in generator returns less, the user
authorized installing the best result with its true native size documented.
Never describe an enlarged export as native 4K. Deliver exact dimensions below,
WebP with embedded sRGB; Lanczos resizing. P1 has true alpha. Masters stay outside
the repository; only delivery WebPs go in images/.

### 2.2 Photographic realism
Clean cabinets, counters, sinks and grout. Minor aesthetic irregularities:
cloth folds, subtle wood grain, normal hair flyaways, gentle material variation.
No grime, chips, rust, scale, crumbs or distressed surfaces. A home can contain
useful objects: kettle, chopping board, fruit bowl, dish towel, glassware.
Choose objects appropriate to the observed real kitchen, not a sterile showroom.
Natural pores, fine lines, asymmetry, individual expressions and normal teeth.
Hands grip with real pressure; bodies have believable weight and support.
People do ordinary actions, not simultaneous advertising smiles or a lineup.
Keep faces large enough to resolve. Avoid tiny figures in a huge artificial room.
One dominant window source, realistic bounce, soft shadows and accurate exposure.
Use believable 35–50mm perspective, restrained depth of field and fine detail.
No synthetic shine, excessive sharpening, skin smoothing or simulated HDR.

### 2.3 Architecture before styling
Before each kitchen scene, inspect a real apartment reference and record its
source, layout and relevant observations in image-refs/. Establish walls,
cabinet fronts, sink position, working side, appliance locations and a continuous
walkway before placing people. A person never stands between a wall-backed sink
and its backsplash. Peninsula seating and working sides must be distinguishable.
Keep cabinet doors, drawers, chairs and walking routes usable.
Retain practical stove/hood/fridge context where the view would show it.
Use a new original room inspired by the reference, not an exact copy of its
artwork or decor. Do not claim a generated room is a real installation.
Do not enlarge hardware to make it prominent. Preserve product proportions and
leave fitting/service clearance. A filter may occupy a separate adjacent utility
cabinet when an actual sink bowl/drain would prevent an under-sink fit.
The filtration story is clear through the installed unit or dedicated drinking
tap and water use; do not force an open oversized unit into every family scene.
Product detail plates carry the close-up hardware story.

### 2.4 Colour
Neutral white balance and natural colours; no warm, cool, green or purple cast.
Real wood, fruit, clothing and fittings retain their colours. No blue apples or
brand-coloured set dressing. Warmth comes from people and materials, not grading.

### 2.5 No added text or icons
Latest user instruction: no text or icons. Do not add logos, wordmarks, taglines,
badges, certification symbols, diagrams, captions, numbers or UI to this new set.
Do not force Crystalina branding into every photograph. Generate clean unmarked
surfaces; keep necessary controls physically present but displays dark and gauge
faces unnumbered. Original product photographs remain untouched.
Supplied brand files remain historical references, not inputs for this revision.

### 2.6 Negative prompt — append in full to every generation
```text
text, letters, numbers, logos, wordmarks, icons, certification badges, signage,
watermark, captions, labels, UI overlay, floating product cutout, pasted collage,
giant filter, distorted hardware, impossible plumbing, blocked walkway,
people behind wall-backed countertop, impossible kitchen geometry,
matching advertising smiles, identical faces, plastic skin, airbrushed skin,
waxy skin, exaggerated wrinkles, extra fingers, malformed hands, fused fingers,
duplicated people, unsupported baby, dirt, grime, mould, mildew, stained grout,
peeling paint, chipped cabinets, water stains, limescale, rust, crumbs, rubbish,
distressed surfaces, neglected apartment, luxury penthouse, blue colour grade,
cool colour grade, warm colour grade, orange tint, green tint, purple tint,
teal and orange, heavy vignette, lens flare, artificial background haze,
HDR halo, oversharpened, CGI render, 3D render, video game lighting,
floating objects, duplicated parts, low-res, jpeg artifacts
```
P1 intentional exploded separation is the sole floating-parts exception.

## 3. References
Architecture: image-refs/architecture/brooklyn-kitchen-reference.jpg.
Source: https://www.apartmenttherapy.com/oyin-antwi-brooklyn-small-apartment-tour-photos-36821702
Photo credit: Angelene Coronel Photography and Erwin Pajarillo, via Apartment Therapy.
Use only as unpublished architectural inspiration. It depicts an actual Brooklyn
apartment: wall cooking/appliance run, compact sink peninsula with separate
working/seating sides, dining table next to window, ordinary storage and utensils.
Do not copy wall art, clock, fixtures or the complete furnished composition.
It is spatial evidence, not proof that the room fits the H5 or a five-person household.
Adapt modestly for a family-sized apartment and retain plausible circulation.
User inspiration: image-refs/inspiration/family-cooking.png and family-water.png.
Use their convincing interaction, fine detail and layered backgrounds, not
identities, exact poses, grading, logos or product configurations.
Hardware photographs govern shape whenever a Crystalina unit is visible.
No scene reference overrides anatomy, neutral colour, physical layout or crop.

## 4. Compose for the box
P1: full exploded hardware, margins, true alpha, 7:8. No text or icons.
Category tiles: 4:3; entire focal subject in upper two thirds, ideally base at
60–62% height. Bottom third quiet real counter/floor/tile for CSS labels.
Leave hover-crop margins; do not bake in gradient.
Hero: 26:15; left40% quiet real room for CSS copy overlay. Family/action at right,
all five faces readable and fully framed. No painted gradient. Avoid enormous
empty wall by including naturally quiet room detail.
Other editorial plates: 4:3; coherent scene and useful background context.

## 5. Validation
Inspect architecture, hands, faces, baby support, family count, product proportions,
plumbing, typography absence and crop at final size. Reject impossible layouts.
Record source/native dimensions/delivery dimensions and generation prompts.
Run npm run check before pushing; tests and site build must pass.
Report unrelated existing drift without changing other owners' files.

## 6. Protected product references
Never overwrite these photographs or any originals/variants in images/products/:
- images/products/h5-600-uv-studio.webp
- images/products/f5-600-uv-studio.webp
- images/products/x2a-600-studio.webp
- images/products/w5-400-alkaline-studio.webp
H5: black frame, three clear bowls/black caps, twin gauges, dark display/three
orange buttons, black membrane with amber collar, upper black UVC housing.
Match geometry but omit printed labels in generated scenes.
Replacement geometry: filter-ppf-02.webp and filter-acm-10.webp.

## 7. Per-image prompts
Every prompt inherits sections2–4 and full negative prompt2.6.

### P1 — h5-600-exploded.webp
1400x1600 transparent. Precise photographic exploded H5 using real hardware.
Top-to-bottom UVC, membrane, three filter assemblies, empty frame/gauges/panel,
faucet. Neutral studio light, accurate black/clear/amber materials. No duplicate
assembled system in frame. Fine grey leaders only, no arrows/icons/text/branding.

### P2 — hero-bg.webp
2600x1500. First inspect actual apartment architecture reference. Original clean
family apartment with wall appliance run, usable sink peninsula and nearby
window-lit dining area, adapted from observed spatial relationships.
Camera from dining/living side, eye-level35mm, coherent perspective.
Exactly five people: father about40, mother about37, older son14, younger
daughter7, baby boy9months. Father safely supports baby with forearm under
bottom and hand at torso; baby looks at family. Mother uses drinking-water tap
from its working side; son and daughter naturally interact at dining counter or
table. Separate readable faces, natural expressions, ordinary clothes and poses.
Do not arrange five smiling heads in a row. Make interaction intimate enough to
see expressions, with clear water/glass and dedicated tap as foreground subject.
A full H5 need not be exposed in this family image; keep installation concealed
if revealing it would distort architecture or force a product collage.
Left40% real quiet room, action right. Clean middle-income home, daylight, neutral
white balance, real texture, no added text, icons or logos.

### P3 — lifestyle-hydration.webp
1200x900. Real-kitchen-reference-led original photograph. Older grandfather and
young granddaughter share an ordinary water moment at a modest dining counter,
dedicated tap and clear glass visible. Anatomically convincing grips, relaxed
individual expressions, natural fine lines, clean practical kitchen background.
Use an intimate eye-level50mm view. Do not expose an enormous unit at their knees.
No text, icons or logos.

### P4 — point-of-use.webp
1200x900. Real-reference-based detail of H5 installed inside a clean adjacent
utility cabinet or under a sink only with credible bowl/drain clearance.
Three-quarter view shows cabinet depth, tidy actual connections, full unit at
normal scale, small drinking tap above/nearby. No person required. Ordinary
materials, soft daylight, accurate hardware. No text/icons/logos.

### P5 — nyc-skyline.webp
1200x900; filename retained. Original NYC apartment kitchen detail grounded in
real architecture, clean sink/drinking tap and modest window with brick outside.
H5 visible in practical adjacent utility cabinet, actual scale and clearance.
No staged luxury, no giant appliance, no text/icons/logos.
Design owner handles old skyline-specific alt text.

### P6 — six category tiles
All1200x900. Upper-two-thirds product placement; clean quiet lower third.
- cat-reverse-osmosis.webp: actual-reference H5, clean utility/sink cabinet,
  credible drain and service clearance, tidy connections, no oversized hardware.
- cat-whole-house.webp: three plain white housings, steel bracket and connected
  copper bypass plumbing in a maintained modest utility room. No branding.
- cat-countertop.webp: plain modest off-white dispenser, clear reservoir,
  clean real-reference apartment counter, one ordinary mug, no text or UI.
- cat-shower.webp: chrome inline filter correctly connected between arm/head,
  clean ordinary bathroom tile, natural spray/daylight, no engraving or icons.
- cat-replacement.webp: fresh cartridges matching protected PPF/ACM references,
  clean empty housing beside them, sharp real media texture, unmarked end caps.
- cat-accessories.webp: plain TDS pen, dark blank display, clear glass, natural
  hand setting pen down on real apartment counter; correct fingers, no markings.
Whole-house, countertop and shower are category concepts, not verified SKUs.

## 8. Scope
Only IMAGE_PROMPTS.md, image-refs/, the11 delivery images and COORDINATION.md.
No code/CSS/markup/docs/scripts changes. Keep original product images untouched.
Earlier logs and generated candidates are historical; latest user direction wins.

