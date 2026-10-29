# Design Handoff — Nura

**To:** Claude Design (claude.ai/design)
**From:** Engineering
**Project:** Brand identity + logo for Nura, a private-practice EHR for Moroccan clinics.

---

## Context

Nura is a multi-tenant electronic health record for doctors' offices and
clinics in Morocco. French-first, Arabic (RTL) supported. Used by doctors,
secretaries, and clinic admins.

**Brand direction:** luxurious and understated. Think Aesop / Byredo /
Diptyque, not DocuSign or a hospital system. Moroccan identity is present but
never themed — inspired by craft, never quoting it.

**Name:** Nura (Arabic نور, *nūr* = light). Also reads as "nourish."
Bilingual by nature: same word in French, Arabic, and Latin script.

---

## Files already delivered (in this repo)

| File | What it is | Status |
|---|---|---|
| `BRAND.md` | Full brand guide: positioning, palette, typography, logo spec, tone of voice | **Done** — decisions are final |
| `NURA-LOGO.svg` | Original logo concept: mark + wordmark + Arabic variant | **Superseded** — replaced by the drawn assets below |
| `NURA-PREVIEW.html` | Browser preview of the original concept | Reference only |
| `Nura-mark.svg` | Refined brand mark — diamond + interlocking N, radiating light | **Starting point** — needs iteration |
| `Nura-wordmark.svg` | Custom-drawn Latin wordmark (not a web font) | **Starting point** — needs iteration |
| `Nura-arabic.svg` | Drawn Arabic calligraphic نور (not a font fallback) | **Starting point** — needs iteration |
| `Nura-lockup-light.svg` | Mark + wordmark on sand background | **Starting point** |
| `Nura-lockup-dark.svg` | Mark + wordmark on charcoal background | **Starting point** |
| `Nura-lockup-bilingual.svg` | Latin stacked above Arabic, mark left | **Starting point** |
| `Nura-favicon.svg` | Mark-only, tight crop, single color | **Starting point** |
| `Nura-preview.html` | Browser preview of all assets | Reference only |

---

## What is already decided (do not re-litigate)

- **Name:** Nura
- **Palette:** charcoal `#1A1A1A`, sand `#F5F1E8`, terracotta `#B05A3A`, sage `#8C8C7A`, warm white `#FFFFFF`
- **Display type:** serif (Cormorant Garamond direction)
- **Body/UI type:** geometric sans (Satoshi / Inter direction)
- **Tone:** warm, professional, French-first. No medical clichés, no blue/white healthcare palette, no gradients, no 3D gloss.

---

## What needs iteration

### 1. Custom wordmark (highest priority)

A drawn wordmark is now in place (`Nura-wordmark.svg`) — but it is a first
pass, not a finished letterform. The lockup files use the Cormorant Garamond
web font so you can see it rendered; the drawn version is the one that ships.

**Deliverable:** refine the drawn "Nura" wordmark. Serif, with presence.
Should feel editorial, not corporate. Must work at favicon size and at large
format.

**What to iterate on:**
- The 'a' bowl is the weakest letter — currently reads slightly heavy
- Letter spacing is generous; tighten if it feels loose at small sizes
- The 'r' arm is a path curve — may want a cleaner junction
- Consider whether the serifs should stay slab (current) or become more
  refined bracketed

**Constraints:**
- No medical symbols, no cartoonish or rounded forms
- Must read as premium, not generic
- Should pair with a geometric sans for UI

### 2. Arabic calligraphic treatment

A drawn Arabic نور is now in place (`Nura-arabic.svg`) — Naskh-inspired,
with the نun as a large lower bowl, the وwaw as a head above, and the رa
sweeping right as a tail. Thick downstroke / thin upstroke contrast, built
as paths, not a font fallback.

**Deliverable:** refine the Arabic wordmark so it feels as resolved as the
Latin one. Should be balanced, not cramped. Consider weight, spacing, and
how it sits alongside the Latin wordmark in a bilingual lockup.

**What to iterate on:**
- The نun bowl is the anchor — its curve and weight carry the whole word
- The رa tail currently tapers; consider whether it should stay level or
  lift slightly at the end
- The وwaw head reads small against the bowl — may want more presence
- Check the Latin/Arabic vertical alignment in the bilingual lockup

### 3. Brand mark refinement

The mark is now `Nura-mark.svg`: an interlocking N monogram inside a
diamond, with radiating light lines in the negative space. The diamond
references zellige geometry without quoting it literally.

**Deliverable:** a resolved, ownable mark. Iterate on:
- Whether the diamond frame stays or goes
- The light/radiating lines — subtle, never decorative
- Weight and presence at small sizes
- Whether it works as a standalone favicon and app icon

**Direction to push toward:** abstract, geometric, ownable. The mark should
be recognizable at 32px. If it needs the wordmark to be legible, it's not
there yet.

### 4. Light and dark variants

**Deliverables (all in place as first passes):**
- `Nura-lockup-light.svg` — mark + wordmark on sand background
- `Nura-lockup-dark.svg` — mark + wordmark on charcoal background
- `Nura-lockup-bilingual.svg` — Latin stacked above Arabic, mark left
- `Nura-favicon.svg` — mark-only, tight crop, single color

**What to iterate on:**
- Proportions between mark and wordmark in each lockup
- Whether the bilingual lockup should be side by side instead of stacked
- Favicon crop tightness — test at 16px and 32px

### 5. Brand application (one example, not exhaustive)

**Deliverable:** a single app-header lockup showing the mark + wordmark +
tagline, on the actual product background (sand `#F5F1E8`).

**Tagline options** (pick one, or propose better):
- "soin numérique" — digital care
- "nourrir la pratique" — nourish the practice
- "le logiciel de votre clinique" — your clinic's software

**Tagline options** (pick one, or propose better):
- "soin numérique" — digital care
- "nourrir la pratique" — nourish the practice
- "le logiciel de votre clinique" — your clinic's software

---

## Files to produce

- `Nura-mark.svg` — refined mark, single color
- `Nura-wordmark.svg` — custom Latin wordmark
- `Nura-arabic.svg` — Arabic calligraphic wordmark
- `Nura-lockup-dark.svg` / `Nura-lockup-light.svg` — full lockups
- `Nura-favicon.svg` — mark-only, tight crop
- `Nura-type-spec.pdf` or `.png` — wordmark with spacing/clear-space rules
- Final `BRAND.md` updated with the approved assets and their usage rules

---

## One open question for the designer

The current palette leans warm (terracotta + sand). Do you see a stronger
direction — cooler and more clinical-premium, or warmer and more
craft-oriented? The brief says "luxurious and understated" but doesn't pin
the temperature. If you have a strong read, propose it. Otherwise the warm
direction stands.

---

## Out of scope

- Product UI design (that's a separate phase)
- Illustration style, iconography, or motion
- Naming (Nura is final)
- Website or landing page