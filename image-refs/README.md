# Reference images

Current direction: clean, attractive middle-income apartments and focal filtration
products, per the user's review and revised IMAGE_PROMPTS.md. Earlier dirty/worn
scene references do not override this correction. The official branding sources
are brand/Crystalina-Logo.png and brand/Realistic-Logo.png, copied unchanged from
the user's attachments. Apply their marks physically to generated products only;
do not alter the original product photographs. Previous generation logs remain
historical records, not current instructions.

Drop a reference here and Codex works from it instead of inventing the frame.
`IMAGE_PROMPTS.md` section 3 is the rule. The short version:

- **Name the file after its target.** The reference for `images/hero-bg.webp`
  is `image-refs/hero-bg.png`. Any extension is fine.
- **Several references for one image** get numbered: `hero-bg-1.png`,
  `hero-bg-2.png`. The first is the composition, the rest are detail or mood.
- **The reference governs composition, subject and room.** Realism, colour and
  framing still come from `IMAGE_PROMPTS.md`.

**Nothing in this folder is published.** `DIRS` in `scripts/build-site.mjs`
lists the directories copied into `dist/`, and this is not one of them. Do not
add it, and do not move references into `images/`, which is published whole.
