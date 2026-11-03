# Crystalina, image direction

This file decides what gets made. Codex generates the images and saves each one
to the exact path given. Every entry carries its path, format, pixel size,
aspect ratio, where it appears, the prompt, and what must not appear.

Read sections 2, 3 and 4 before generating anything. They replace the
direction that produced the current set.

**Most entries will arrive with a reference image.** Section 3 says how those
are used, and it governs: where a reference exists, the prompt stops being a
description to invent from and becomes a cleanup instruction.

---

## 1. What changed on 2026-11-02, and why

The first batch was generated against a palette-forced brief: every prompt
carried the brand hex codes, asked for a cool blue colour grade, and asked for
clean premium studio lighting. The result is a set that reads as AI stock
rather than photography. Three examples, all live on the site today:

- `images/hero-bg.webp` has the navy gradient **painted into the picture** down
  the left side. The hero CSS already lays that gradient over the image, from
  93 percent opacity at the left edge to 8 percent at the right, so the site is
  stacking a real gradient on top of a fake one. Behind it the kitchen is an
  empty white box with no objects in it at all, the counter has no texture, and
  three people hold three glasses in a practised row.
- `images/lifestyle-hydration.webp` contains a bowl of **blue apples**. The
  splashback is blue marble, the Dutch oven is blue, and all four people wear
  navy or blue. The palette has been painted onto the groceries. The room is a
  glass condo with an open skyline, which is the exact stock cliché for this
  product category and is not what most New Yorkers live in.
- `images/cat-reverse-osmosis.webp` is a symmetrical CGI render of an
  under-sink cabinet with no P-trap, no disposal, no cleaning supplies and no
  wear, holding hardware that is not a Crystalina product.

**The new standard: photographic realism first, colour neutral, no brand
colour painted into the world.** The blue belongs to the interface, not to the
fruit.

This does not loosen the house rule in `CLAUDE.md`. That rule bans warm casts
and non-brand colour anywhere a customer can see. Neutral white balance
satisfies it, because neutral is not warm. What is retired is the push toward
cool blue and the practice of pasting hex codes into prompts.

---

## 2. The standard every image must meet

### 2.1 Resolution and delivery

- **Generate at 4K or better**, meaning 3840 px or more on the long edge, then
  downsample to the delivery size listed in the entry with a proper resample.
  Generating straight to the small size is what produces mushy detail.
- **Deliver WebP, sRGB**, at the exact pixel dimensions in the entry.
- **Do not commit the 4K master.** `scripts/build-site.mjs` publishes the whole
  of `images/`, so anything left there ships to visitors. Masters stay outside
  the repository.

### 2.2 Photographic realism

The test is whether a art director would believe a photographer was in the
room. Every one of these is a requirement, not a flourish.

- **Skin.** Visible pores, fine lines at the eyes and mouth, uneven tone,
  a stray hair out of place, faint shine on the forehead or nose. No airbrushed
  poreless faces. People in their forties should read as forty.
- **Expression and anatomy.** Real faces, asymmetric. One person may be
  mid-sentence, looking away, or not smiling at all. Never a group all doing
  the same thing on the same beat. Correct finger count, and a grip that shows
  the weight of what it holds: fingers flattening slightly against a glass,
  not resting on it.
- **The room has been lived in.** A real kitchen holds objects. A dish rack
  with something in it, a kettle, a jar of utensils, a tea towel over the oven
  handle, post on the counter, a magnet on the fridge, a chip in the paint.
  Minor imperfections are the point: a water ring, a few crumbs, fingerprints
  on stainless, scuffed cabinet paint, a cable that is not tidy.
- **One believable light source.** Daylight from a named window, falling off
  the way daylight falls off. No rim light on every subject, no second light
  with no source, no glow with no origin.
- **Depth of field that a lens would produce.** Background detail stays
  legible and specific. Never a uniform haze standing in for a room.
- **Editorial, not advertising.** Think a magazine feature photographed in
  someone's apartment, not a catalogue cover.

### 2.3 New York City, specifically

The product exists because of old buildings. The pictures should show old
buildings.

- **Reach for:** prewar details, cabinets painted over many times, a radiator
  under the window, small hex or subway tile, a narrow galley plan, a pressed
  tin ceiling, a window-mounted air conditioner, a fire escape outside, a brick
  wall or a neighbouring building close behind the glass, landlord-grade
  cabinets from the seventies next to something the tenant bought themselves.
- **Avoid:** the floor-to-ceiling glass condo with an unobstructed skyline. It
  is the cliché for this category, it is what the current lifestyle image does,
  and it describes almost nobody's kitchen.
- **The people are New Yorkers.** Across the set as a whole, a real range of
  ages, body types and ethnicities, and households that are not all one nuclear
  family of four. A single older person in a rent-stabilised one bedroom is as
  on-brand as a family in a brownstone.

### 2.4 Colour

- **Neutral white balance.** No grade pushed in any direction, cool or warm.
  Correct whites, correct skin.
- **Real objects keep their real colours.** A red kettle is fine. A wooden
  chopping board is fine, because that is wood, not a warm cast.
- **Never dress the set in brand colour.** No blue food, no blue props chosen
  to match, no painted blue walls, no everyone in a navy jumper.
- **No grade toward green, purple or amber.** This is the `CLAUDE.md` rule and
  it still holds. It bans the cast, not the object.

### 2.5 Never, in any image

- **No text of any kind baked into the picture.** No words, no numbers, no
  labels, no signage, no UI.
- **No brand marks other than Crystalina's**, and no invented logos on
  appliances, packaging or clothing. Prefer unbranded hardware.
- **No warm or coloured grade.** See 2.4.
- **No watermark, no border, no vignette, no lens flare.**
- **No impossible hardware.** Plumbing that connects, fittings that exist,
  nothing floating, nothing duplicated, no part count that contradicts the
  product it claims to be.

### 2.6 A negative prompt to carry on every entry

```
text, letters, numbers, words, signage, watermark, logo, brand name, UI overlay,
airbrushed skin, poreless face, plastic skin, waxy skin, symmetrical face,
identical expressions, extra fingers, malformed hands, fused fingers,
empty sterile room, staged showroom, stock photo look, advertising gloss,
blue colour grade, cool colour grade, warm colour grade, orange tint, green tint,
purple tint, teal and orange, heavy vignette, lens flare, bokeh haze background,
HDR halo, oversharpened, CGI render, 3D render, video game lighting,
floating objects, duplicated parts, impossible plumbing, low-res, jpeg artifacts
```

---

## 3. Working from a reference image

A reference image is coming for most entries in the queue. When one exists it
is the brief, and the written prompt in section 7 becomes the instruction for
what to fix rather than what to invent.

### 3.1 Where references live

```
image-refs/<target-filename>.<ext>
```

So the reference for `images/hero-bg.webp` is `image-refs/hero-bg.png`, and the
reference for `images/cat-shower.webp` is `image-refs/cat-shower.jpg`. One
reference per target, named after the target, extension whatever it arrives as.

Where more than one reference informs a single image, number them:
`image-refs/hero-bg-1.png`, `image-refs/hero-bg-2.png`. The first is the
composition, the rest are detail or mood.

**`image-refs/` is deliberately outside the publish allow-list.** `DIRS` in
`scripts/build-site.mjs` names the directories that go to `dist/`, and this is
not one of them, so references are version-controlled for both assistants
without ever reaching a visitor. Do not move references into `images/`, and do
not add `image-refs` to that list.

### 3.2 What the reference governs, and what it does not

**Preserve from the reference:**

- The composition. Where the subject sits in the frame, the camera height, the
  angle, the crop, what is in the foreground and background.
- The subject and the story. Who is in it, what they are doing, what hardware
  is shown and how it is installed.
- The room and its character. The cabinets, the window, the tile, the era of
  the building.
- Anything that is deliberate. If the reference has an odd empty corner,
  assume it is for text or a label until told otherwise.

**Fix against section 2:**

- Everything under photographic realism in 2.2. Skin, expression, anatomy,
  hands, lived-in detail, one believable light source, real depth of field.
- Colour, under 2.4. Pull any grade back to neutral. Remove brand colour that
  has been painted onto props, food, walls or wardrobe.
- Anything in the never list, 2.5. Baked text, invented logos, impossible
  hardware, floating parts.
- Resolution, under 2.1. Up to 4K or better, then down to the delivery size.

**The one thing that overrides the reference:** the framing rule in section 4.
If a reference puts the subject where the label gradient will cover it, or is
the wrong aspect ratio for its box, recompose to fit the box and say so in the
handover note. A beautiful image cropped wrong is a broken image.

### 3.3 When the reference and the prompt disagree

The reference wins on composition and subject. Section 2 wins on realism and
colour. Section 4 wins on framing. If a reference cannot be reconciled with
section 2, for example it is a photograph of a product Crystalina does not
sell, stop and flag it in `COORDINATION.md` rather than guessing.

### 3.4 Until the references arrive

The prompts in section 7 stand on their own and can be generated from text
today. **P1, the missing exploded view, should not wait.** It is the only
broken image on the site, its reference already exists in the repository as
the four real product photographs in section 6, and no new reference is needed.

---

## 4. The framing rule

An image is composed for the box it lands in. There are four boxes, and each
one crops and overlays differently. Compose for the box, not for the file.

### A. Product shot, `/images/products/*.webp`

- Square or portrait, subject centred, full product in frame with margin on all
  four sides so a card crop never clips it.
- Plain seamless surface, light neutral grey to white. Not blue.
- One soft key from above and slightly to the side, a real contact shadow on
  the surface beneath, no floating.
- Hardware is the subject. No hands, no room, no props beyond what ships in the
  box.
- Where a transparent cutout is wanted, the edge must be clean enough to sit on
  any background, including the cyan radial glow behind the anatomy figure.

### B. Category tile, `/images/cat-*.webp`

- **4:3 exactly**, because `.cat-tile` sets `aspect-ratio: 4/3` with
  `object-fit: cover`. Anything else gets cropped.
- **The bottom third is covered.** `.ct-label` lays a gradient to
  `rgba(7,29,64,.85)` across the bottom with white text over it. Keep the
  subject in the **upper two thirds**, and keep the bottom third visually quiet:
  floor, counter, a plain surface. Nothing that needs to be read.
- The tile hovers to `scale(1.05)`, so leave a few percent of margin at every
  edge that you would be sorry to lose.
- One clear subject per tile, readable at 380 px wide.

### C. Lifestyle plate, split sections

- **4:3 exactly**, because `.split img` sets `aspect-ratio: 4/3` with
  `object-fit: cover`. The current files are 900x700, which is 9:7, so they are
  already being cropped top and bottom. Deliver 1200x900.
- A person doing something real, in a room with a history, water somewhere in
  the frame but not necessarily the subject.
- No centred symmetry. Let the subject sit off centre the way a reportage frame
  does.

### D. Technical exploded view

- Portrait, transparent background, generous even spacing between parts,
  thin neutral grey leader lines.
- Stack order follows the water path, intake at the top, faucet at the bottom.
- Narrow silhouette, because it sits beside a numbered list and renders at
  460 px wide.
- Neutral studio lighting and true material colour: matte black, brushed steel,
  white, clear. This one was already neutral by intent, and now it simply
  agrees with the global rule.

---

## 5. The weight budget, recorded

Measured on 2026-11-02 against the blueprint's performance budget.

| Fact | Value |
| --- | --- |
| Blueprint target, first screen on `/` | 420 KB |
| Imagery the home page actually loads | **532 KB across 9 files** |
| Of which the hero | 83 KB, which the budget allows as the single heaviest asset |
| The six category tiles | 175 KB |
| `exploded-filter.webp` | 202 KB, alpha, loading before the user scrolls |
| `loading="lazy"` in site HTML | none |
| `srcset` in site HTML | none |
| Hero `rel="preload"` | none |

**No per-image ceiling binds this pass.** The quality standard in section 2
comes first, and a file may be heavier than the one it replaces. Two things
still hold: WebP, and sRGB.

The reason to defer is that compression is the wrong lever while every image on
the page loads eagerly. The six tiles and the 202 KB exploded view are below
the fold and are being fetched before the first screen is painted. Adding
`loading="lazy"`, a hero `preload` and `srcset` belongs to the design session
and recovers more than squeezing quality out of the files would. A compression
and responsive-variant pass follows once that markup exists.

---

## 6. Protected, do not regenerate

**Four real Crystalina product photographs exist.** These are real hardware,
not generated, and they are the ground truth for what the products look like:

```
images/products/h5-600-uv-studio.webp          1086 x 1448
images/products/f5-600-uv-studio.webp          1086 x 1448
images/products/x2a-600-studio.webp            1086 x 1448
images/products/w5-400-alkaline-studio.webp    1086 x 1448
```

Their `-editorial`, `-transparent` and plain variants are derived from them and
are what the catalogue points at today. **Use all of these as reference when a
prompt depicts Crystalina hardware.** Do not invent a different looking product
and do not overwrite any of these files.

---

## 7. The queue

Priority order. P1 is the only thing actually broken on the site.

**Reference slots.** Every entry below expects a reference at the path in the
right column, under the rules in section 3. A slot that is still empty means
the prompt is generated from text alone for now, and regenerated against the
reference when it lands.

| Entry | Target | Reference slot |
| --- | --- | --- |
| P1 | `images/h5-600-exploded.webp` | not needed, the four real photographs in section 6 are the reference |
| P2 | `images/hero-bg.webp` | `image-refs/hero-bg.*` |
| P3 | `images/lifestyle-hydration.webp` | `image-refs/lifestyle-hydration.*` |
| P4 | `images/point-of-use.webp` | `image-refs/point-of-use.*` |
| P5 | `images/nyc-skyline.webp` | `image-refs/nyc-skyline.*` |
| P6 | `images/cat-*.webp`, six files | `image-refs/cat-*.*`, one each |

---

### P1. H5-600 exploded view, missing and referenced

| | |
| --- | --- |
| **Path** | `images/h5-600-exploded.webp` |
| **Format** | WebP, sRGB, **transparent background** |
| **Size** | 1400 x 1600 |
| **Ratio** | 7:8 portrait |
| **Appears** | Home page, "Inside the Flagship", `index.html:339`. Renders at 460 px wide with a cyan radial glow behind it and a drop shadow under it. |

**This file is already referenced in code and does not exist.** The section
falls back to the flat product photograph, so a photo currently sits where an
exploded diagram belongs. It is the only hard break in the image set.

**Reference the real hardware** at `images/products/h5-600-uv-studio.webp` and
`h5-600-uv-transparent.webp`. The H5-600 is a black powder-coated open frame
holding three vertical clear-and-steel prefilter housings side by side, two
round analogue pressure gauges and a small digital panel across the top rail, a
horizontal cylindrical 600 GPD RO membrane housing, and a black LED-UVC module
along the top.

**Prompt.** "Technical exploded view of a black-frame high-flow reverse osmosis
water purification system, components separated vertically with clean thin grey
leader lines and generous even spacing between parts. From top to bottom: a
black cylindrical LED-UVC sterilization module, a horizontal brushed stainless
reverse osmosis membrane housing, three vertical cartridge filters side by side
being a white pleated sediment cartridge, a black activated carbon block and a
white mineral alkaline cartridge, then the black powder-coated steel mounting
frame carrying two round analogue pressure gauges and a small dark digital
display panel, and at the bottom a brushed stainless faucet. Neutral studio
lighting, true material colour, matte black and brushed steel and white, soft
realistic contact shadows, precise industrial product photography of a real
object, isolated on a transparent background, sharp focus throughout, high
detail, narrow vertical composition."

**Must not appear.** No text, no numbers on the gauge faces, no logos, no
colour grade, no blue tint, no background, no duplicated parts, no floating
debris, no leader line that points at nothing, no part the real H5-600 does not
have.

**Note for the design session.** Once this exists, `index.html:128` should
point at it and the alt text at that line should stop naming the RO-10, which
left the catalogue. That retires `images/exploded-filter.webp`, 202 KB.

---

### P2. Hero background

| | |
| --- | --- |
| **Path** | `images/hero-bg.webp` |
| **Format** | WebP, sRGB |
| **Size** | 2600 x 1500 |
| **Ratio** | 26:15 |
| **Appears** | Home page hero, full bleed, `index.html:51`. CSS positions it `center right / cover` at `min-height: min(88vh, 820px)`. |

**Read this before prompting.** The hero CSS lays its own navy gradient over
the image, from `rgba(11,30,54,.93)` at the left edge through `.74` at 40
percent and `.32` at 72 percent to `.08` at the right. **Do not paint a
gradient into the picture.** The current file does, and the site stacks a real
one on top of it. Fill the left 40 percent with actual room that happens to be
quiet: a wall with light falling across it, a doorway, a window reveal. It will
be read through a dark navy veil, so it needs tone and texture, not emptiness.

Because the background is anchored `center right`, the right edge is never
cropped and the left is the first thing lost on a narrow screen. Subject on the
right half.

**Prompt.** "Editorial reportage photograph inside a real prewar New York City
apartment kitchen, late morning. On the right of the frame a woman in her
thirties fills a glass at the sink while a teenager leans against the counter
beside her mid-conversation, neither looking at the camera, a genuine unposed
moment. The kitchen is narrow and lived in: cabinets painted over many times
with a chip near the handle, a cast iron radiator under the window, small white
hex floor tile, a dish rack with two plates in it, a kettle, a tea towel over
the oven handle, a few things stuck to the fridge. The window on the right
looks onto a fire escape and the brick wall of the building opposite, and all
the light in the frame comes from it and falls off across the room. The left of
the frame is the quiet end of the kitchen, a plainly lit painted wall and a
doorway, holding texture but no detail that needs reading. Neutral white
balance, true skin tones with visible pores and fine lines, 35mm lens, natural
depth of field with the background still legible, shot for a magazine feature,
not an advertisement."

**Must not appear.** No painted gradient or colour wash of any kind. No blue
grade. No glass-walled condo and no open skyline. No empty showroom kitchen.
No one smiling at the camera. No blue props chosen to match a palette. No text,
no logos on the appliances. Carry the negative prompt in section 2.6.

---

### P3. Lifestyle plate, "Why Crystalina"

| | |
| --- | --- |
| **Path** | `images/lifestyle-hydration.webp` |
| **Format** | WebP, sRGB |
| **Size** | 1200 x 900 |
| **Ratio** | 4:3 |
| **Appears** | Home page split section, left column, `index.html:215`. `.split img` crops to 4:3, so the current 900x700 file is being cropped top and bottom. |

**This is the blue apples picture.** It is the clearest case of the old brief
failing, and it should be rebuilt from nothing rather than adjusted.

**Prompt.** "Editorial reportage photograph in a real New York City brownstone
kitchen, afternoon. A man in his sixties pours a glass of water at the counter
for a grandchild who is reaching up for it from the other side, caught
mid-movement and slightly blurred. The room is genuinely lived in: open
shelving with mismatched glasses and mugs, a bowl of ordinary fruit, a
chopping board leaning against the splashback, a worn butcher block counter
with knife marks and a faint water ring, a few crumbs, cabinet doors that do
not quite line up. Daylight from a single window at the side of the frame,
falling off across the room. Neutral white balance, true skin tones, visible
skin texture and age, 50mm lens, shallow but believable depth of field, off
centre composition, documentary feeling."

**Must not appear.** No blue food and no props chosen to match the brand. No
navy wardrobe on everybody. No glass tower, no skyline view. No one raising a
glass in unison with anyone else. No colour grade. Carry section 2.6.

---

### P4. Point of use, NYC Water page

| | |
| --- | --- |
| **Path** | `images/point-of-use.webp` |
| **Format** | WebP, sRGB |
| **Size** | 1200 x 900 |
| **Ratio** | 4:3 |
| **Appears** | NYC Water page split section, `nyc-water/index.html:30`. |

The current file is the strongest of the set and still fails on two counts: the
whole frame is washed cool blue, and the background has dissolved into a
featureless haze so the kitchen could be anywhere.

**Prompt.** "Close editorial photograph of a glass being filled from a modern
stainless kitchen faucet in a real New York City apartment kitchen. Sharp focus
on the clear water column entering the glass and the hand holding it, the hand
relaxed and anatomically correct with the fingers flattening slightly against
the glass. Behind, the kitchen stays legible rather than dissolving: the edge
of a stainless sink with a few water spots, a worn counter, a window with a
brick wall close behind it, a sponge and a bottle of washing up liquid at the
back of the sink. Daylight from the window, neutral white balance, true skin
tone with visible texture, 85mm lens, natural shallow depth of field, crisp
water detail, documentary rather than advertising."

**Must not appear.** No blue or cool grade. No background reduced to haze. No
impossible water column and no frozen splash crown. No text, no brand on the
bottle. Carry section 2.6.

---

### P5. New York City, About page

| | |
| --- | --- |
| **Path** | `images/nyc-skyline.webp` |
| **Format** | WebP, sRGB |
| **Size** | 1200 x 900 |
| **Ratio** | 4:3 |
| **Appears** | About page split section, `about/index.html:30`. |

**Reconsider the subject.** A blue hour skyline is the single most generic
image available for a New York business, and the page it sits on is about a
company that works on old buildings. A street level frame says more.

**Prompt.** "Editorial photograph of a New York City residential street in
early evening, shot at street level. A row of prewar brownstones and walk-ups
with stoops, iron railings, fire escapes climbing the facades, a water tower on
a roofline behind. Ordinary parked cars, a bagged rubbish pile at the kerb, a
street tree. Available light at dusk with windows beginning to come on, neutral
white balance, no colour grade, 35mm lens, deep focus, calm and unpeopled or
with one distant figure, documentary architectural photography."

**Must not appear.** No blue hour wash and no teal grade. No glass towers as
the subject. No readable shop signs, street signs or number plates. No
postcard skyline from across the water. Carry section 2.6.

---

### P6. The six category tiles

| | |
| --- | --- |
| **Paths** | `images/cat-*.webp`, six files, listed below |
| **Format** | WebP, sRGB |
| **Size** | 1200 x 900 each |
| **Ratio** | 4:3 |
| **Appears** | Home page "Shop By Category" grid, `index.html:88` onward |

All six are currently CGI renders. Apply framing rule B: **subject in the upper
two thirds, bottom third quiet**, because the label gradient covers it.

Every prompt below is prefixed by: *"Editorial photograph, real hardware in a
real New York City home, neutral white balance, no colour grade, daylight from
a window, lived in and slightly imperfect, visible wear and ordinary clutter at
the edges of the frame, documentary rather than advertising."*

| File | Subject |
| --- | --- |
| `cat-reverse-osmosis.webp` | An open under-sink cabinet with a reverse osmosis system installed, seen slightly from the side rather than dead on. Real plumbing: a P-trap, a shutoff valve, a disposal unit, tubing that is tidy but not perfect. Around it the ordinary contents of the cupboard, cleaning bottles pushed aside, a cloth, a scuffed cabinet floor with a faint old water stain. Reference the Crystalina hardware in `images/products/`. |
| `cat-whole-house.webp` | A whole-house filtration system mounted on the wall of a brownstone basement utility space, beside a boiler and old copper and iron pipework, a painted brick wall, a bare bulb and daylight from a high window. Honest basement conditions, dust, chalk marks on the wall. |
| `cat-countertop.webp` | A countertop filtration unit on the worktop of a small rented apartment kitchen, beside a kettle and a mug. Narrow counter, a tiled splashback with grout that has seen some years, a window above the sink. Renter scale, not a showroom island. |
| `cat-shower.webp` | A shower filter fitted to the arm of a real tiled bathroom shower, white subway or small hex tile with visible grout lines, water running. Everyday details at the edge of frame: a bottle on the ledge, a cloth over the rail. Steam allowed, haze not. |
| `cat-replacement.webp` | Replacement filter cartridges standing on a plain neutral worktop beside the housing they came out of, one of them visibly used and discoloured next to a clean one. This is the honest version of the maintenance story. Reference the cartridge shapes in `images/products/filter-*.webp`. |
| `cat-accessories.webp` | A TDS meter resting on a kitchen counter beside a filled glass, mid-test, a hand just leaving the frame. Not a flat lay, not a product row. |

**Must not appear, on all six.** No CGI or 3D render look. No perfect symmetry
or dead-on centring. No empty cabinet with no plumbing in it. No blue tubing or
blue props chosen to carry the palette, though tubing that is genuinely blue on
the real hardware is correct. No text, no logos, no readable labels on bottles.
No busy detail in the bottom third. Carry section 2.6.

**A catalogue question, not an image one.** `cat-whole-house`, `cat-countertop`
and `cat-shower` link to shop filters that return nothing, because the
catalogue holds only reverse osmosis systems, replacement filters and bundles.
Three tiles advertise ranges that do not exist. Generating better pictures does
not fix that, and whether the tiles stay is a catalogue decision for the lead.

---

## 8. On disk, unreferenced

Twelve product images from the retired catalogue are still in `images/`, and
`scripts/build-site.mjs` publishes the directory wholesale, so roughly 254 KB
ships to every visitor for files nothing points at:

```
ct-luxe  faucet-pure  filters-ro-set  filters-wh-set  mineral-drops
pitcher-glacier  ro-alkaline-10  ro-classic-5  shower-12  tds-meter
uv-guard  wh-3stage
```

`images/exploded-filter.webp` joins them once P1 lands and the markup moves.

Also unreferenced, but worth keeping: the `-transparent` and plain 1000x750
variants of the four real systems. There is no product gallery and no `srcset`
yet. Both would use them.

**Deleting these is not an image-direction decision.** It touches what the
build publishes, so it goes to the lead with the compression pass.
