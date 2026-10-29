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
| `NURA-LOGO.svg` | Logo concept: mark + wordmark + Arabic variant | **Starting point** — needs iteration |
| `NURA-PREVIEW.html` | Browser preview of the current logo | Reference only |

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

The current wordmark uses the Cormorant Garamond web font. That is not
shipable — web fonts don't render in app icons, PDFs, letterhead, or print.

**Deliverable:** a custom-drawn "Nura" wordmark. Serif, with presence. Should
feel editorial, not corporate. Must work at favicon size (16px) and at large
format.

**Constraints:**
- No medical symbols, no cartoonish or rounded forms
- Must read as premium, not generic
- Should pair with a geometric sans for UI

### 2. Arabic calligraphic treatment

The current Arabic نور uses the Amiri font. It needs a considered
calligraphic composition of its own — not a font fallback, not a literal
transliteration of the Latin letters.

**Deliverable:** an Arabic wordmark that feels as resolved as the Latin one.
Should be balanced, not cramped. Consider weight, spacing, and how it
sits alongside the Latin wordmark in a bilingual lockup.

### 3. Brand mark refinement

The current mark is an interlocking "N" monogram inside a diamond, with
radiating light lines in the negative space. The diamond references zellige
geometry without quoting it literally.

**Deliverable:** a resolved, ownable mark. Iterate on:
- Whether the diamond frame stays or goes
- The light/radiating lines — subtle, never decorative
- Weight and presence at small sizes
- Whether it works as a standalone favicon and app icon

**Direction to push toward:** abstract, geometric, ownable. The mark should
be recognizable at 32px. If it needs the wordmark to be legible, it's not
there yet.

### 4. Light and dark variants

**Deliverables:**
- Mark + wordmark on sand background
- Mark + wordmark on charcoal background
- Mark-only variant (for favicons, app icons, social avatars)
- Bilingual lockup (Latin + Arabic, stacked or side by side)

### 5. Brand application (one example, not exhaustive)

**Deliverable:** a single app-header lockup showing the mark + wordmark +
tagline, on the actual product background (sand `#F5F1E8`).

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