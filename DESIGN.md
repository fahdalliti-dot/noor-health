# DESIGN.md — Noor (نُور) Brand Kit & Design System Specification

> **Standard:** [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md)  
> **Product:** **Noor — Soin Numérique** (EHR & Practice Management SaaS for Moroccan Doctors)  
> **Brand Name:** **Noor** (Latin) • **نُور** (Arabic)  
> **Version:** `2.1.0-production`  
> **Market / Locale:** Morocco (`Africa/Casablanca`, GMT+1) • Multilingual (`fr-MA` French & `ar-MA` Moroccan Darija)  
> **Regulatory Foundation:** CNDP (Loi N° 09-08) • Moroccan INPE (Identifiant National des Professionnels de Santé)

---

## 1. Brand Philosophy & Archetype

### 1.1 The Meaning of "Noor"
**Noor** is the direct, authentic Latin transcription of the Arabic **نُور** (*nūr*), signifying **light, radiant clarity, and restorative warmth**. In clinical practice, it represents shedding diagnostic light on the patient's care journey and lifting the operational darkness from Moroccan private practices.

### 1.2 Brand Archetype: *Chirurgical Quiet Luxury*
Noor is **not** a generic blue-and-white hospital utility, nor a playful consumer health app. It is the digital equivalent of a premier private clinic on Boulevard Zerktouni in Casablanca or Avenue Mohammed VI in Rabat:
- **Calm & Grounded:** Earth tones (Warm Sand, Atlas Terracotta, Deep Charcoal) replacing cold clinical neon blues.
- **Authoritative & Prestigious:** High-contrast editorial serif headers (*Cormorant Garamond*) paired with ultra-crisp geometric UI sans (*Inter*).
- **Culturally Rooted, Never Folkloric:** Pure geometric ribbon harmony inspired by Moroccan architectural zellige and light apertures—without decorative clichés.
- **Strictly Confidential:** Security, dignity, and patient privacy (Loi 09-08) embedded in every visual choice.

---

## 2. The New Logo & Iconography System

The Noor logo embodies modern high-end healthcare SaaS: fluid, memorable, and unmistakably premium.

### 2.1 The Brand Mark (Geometry & Symbolism)
- **Fluid Architectural "N":** Two upright pillars connected by a seamless sweeping dynamic diagonal bridge, symbolizing clinical strength and seamless coordination between doctor and patient.
- **Central Noor Radiance Starlet:** An 8-pointed star of light at the heart of the monogram, capturing the emergence of clarity (*Noor*).
- **Rounded Squircle Halo:** A softly-radiused protective tile (`rx="24"`) with an orbital guide ring, evoking precision and safety.

```
       ┌────────────────────────┐
       │   /\     [NOOR]     /\ │
       │  |  \      ★       /  |│   <-- Continuous N Ribbon with
       │  |   \    / \     /   |│       Central 8-Point Star of Light
       │  |    \  /   \   /    |│       (نُور - Radiance & Healing)
       │  \_____V_______V______/│
       └────────────────────────┘
```

### 2.2 SVG Source: Standalone Mark (`/public/brand/logo-mark.svg`)
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200" fill="none">
  <defs>
    <linearGradient id="noor-grad-primary" x1="30" y1="20" x2="170" y2="180" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#E05D34" />
      <stop offset="45%" stop-color="#C24E28" />
      <stop offset="100%" stop-color="#8E3214" />
    </linearGradient>
    <linearGradient id="noor-core-glow" x1="100" y1="65" x2="100" y2="135" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FDBA74" />
      <stop offset="100%" stop-color="#EA580C" />
    </linearGradient>
  </defs>
  <rect x="22" y="22" width="156" height="156" rx="36" fill="#FFF3EC" stroke="#F0EBE2" stroke-width="1.5" />
  <circle cx="100" cy="100" r="68" stroke="#E4DDD0" stroke-width="1" stroke-dasharray="2 6" opacity="0.8" />
  <path d="M56 142 V62 C56 55.37 61.37 50 68 50 C74.63 50 80 55.37 80 62 V134 C80 140.63 74.63 146 68 146 C61.37 146 56 140.63 56 134 Z" fill="url(#noor-grad-primary)" />
  <path d="M120 66 C120 59.37 125.37 54 132 54 C138.63 54 144 59.37 144 66 V138 C144 144.63 138.63 150 132 150 C125.37 150 120 144.63 120 138 Z" fill="url(#noor-grad-primary)" />
  <path d="M68 52 C73 52 77 54 81 59 L131 137 C133 140 137 142 141 140 C144 138 144 134 141 129 L91 51 C87 45 80 42 73 44 C67 46 65 50 68 52 Z" fill="url(#noor-grad-primary)" />
  <g transform="translate(100, 98)">
    <path d="M0 -14 C1 -5 5 -1 14 0 C5 1 1 5 0 14 C-1 5 -5 1 -14 0 C-5 -1 -1 -5 0 -14 Z" fill="url(#noor-core-glow)" />
    <circle cx="0" cy="0" r="3.5" fill="#FFFFFF" />
  </g>
</svg>
```

### 2.3 Primary Horizontal Lockup (`/public/brand/logo-primary.svg`)
- **Proportions:** 520px width $\times$ 130px height.
- **Left:** Mark (100px $\times$ 100px squircle).
- **Separator:** 1.5px vertical dividing rule in Sand-300 (`#E4DDD0`).
- **Wordmark:** "Noor" in *Cormorant Garamond* (size 52px, weight 600, Charcoal `#1A1A1A`).
- **Arabic Ligature:** "نُور" in *Amiri* calligraphy (size 34px, weight 700, Terracotta `#C24E28`).
- **Descriptor:** "SOIN NUMÉRIQUE • MAROC" in *Inter* (size 11px, weight 600, letter-spacing 4px, Sage `#8C8C7A`).

---

## 3. Color Tokens & Semantic Palette

All colors are mathematically calibrated for **WCAG AAA/AA contrast compliance** on both light (`#FBF8F3`) and dark (`#1A1A1A`) surfaces.

| Token Name | Hex Code | RGB | Role / Usage |
|---|---|---|---|
| **Terracotta-600** (Primary Accent) | `#B05A3A` | `rgb(176, 90, 58)` | Key action CTAs, active tab lines, mark stroke |
| **Terracotta-500** (Vibrant Sunset) | `#D9582B` / `#E05D34` | `rgb(224, 93, 52)` | Hover states, glowing accents, badge highlights |
| **Terracotta-50** (Warm Tint) | `#FFF3EC` | `rgb(255, 243, 236)` | Selected appointment backgrounds, soft badges |
| **Sand-50** (Canvas Background) | `#FBF8F3` | `rgb(251, 248, 243)` | Primary application background, neutral canvas |
| **Sand-100** (Card Surface) | `#F7F4EF` | `rgb(247, 244, 239)` | Inspector drawer, timetable grid background |
| **Sand-200** (Subtle Border) | `#F0EBE2` | `rgb(240, 235, 226)` | Table borders, card outlines |
| **Sand-300** (Muted Rule) | `#E4DDD0` | `rgb(228, 221, 208)` | Dividers, inactive scrollbar tracks |
| **Charcoal-900** (Dominant Dark) | `#1A1A1A` | `rgb(26, 26, 26)` | Headings, primary text, dark mode surfaces |
| **Charcoal-700** (Body Text) | `#4A4540` | `rgb(74, 69, 64)` | Body copy, patient dossiers, clinical notes |
| **Sage-500** (Muted Secondary) | `#8C8C7A` | `rgb(140, 140, 122)` | Secondary metadata, INPE labels, timestamps |
| **Moroccan Emerald** | `#059669` / `#10B981` | `rgb(5, 150, 105)` | WhatsApp 1-Click Patient Confirmation, active status |
| **Saffron / Amber** | `#D97706` / `#F59E0B` | `rgb(217, 119, 6)` | Waiting Room queue (<15 min), Arrived patients |
| **Atlas Crimson** | `#DC2626` | `rgb(220, 38, 38)` | Urgent alert, Allergy warnings (Penicillin), No-show |
| **Majorelle Blue** | `#2563EB` | `rgb(37, 99, 235)` | CMI Moroccan Card Gateway, AMO / CNSS / CNOPS sheets |
| **Casablanca Playhead** | `#EF4444` / `#D9582B` | `rgb(239, 68, 68)` | 2px live real-time timeline bar in Morocco |

---

## 4. Typography System

The typographic language pairs **high-contrast editorial elegance** with **rigorous clinical clarity**.

1. **Display / Editorial Headings:** `Cormorant Garamond` (weights 500, 600, 700).
2. **UI / Clinical Body Text:** `Inter` (weights 400, 500, 600).
3. **Arabic & Moroccan Darija Text:** `Amiri` / `Noto Sans Arabic` (weights 600, 700).
4. **Data & Monospace:** `JetBrains Mono` / `ui-monospace` (INPE codes, CIN numbers, dosage ratios).

---

## 5. Strict Do's & Don'ts

### Do's:
1. **Always spell the name "Noor" in Latin and "نُور" in Arabic.**
2. **Use the new fluid ribbon mark with the central starlet.**
3. **Keep the Terracotta / Sand / Charcoal / Sage hierarchy.**
4. **Maintain full CNDP (Loi 09-08) compliance badges and INPE formatting in monospace.**

### Don'ts:
1. **Never spell the brand as "nura" or "Nura"**—it is strictly **Noor** / **نُور**.
2. **Never use hospital green crosses (+), stethoscopes, or caduceus snakes.**
3. **Never use sterile cold blue (#0000FF) as a background.**
4. **Never show glassmorphism, heavy drop shadows, or cheap 3D plastic gloss.**

---

## 6. Motion Design System Specification (`motiondivision/motion`)

Nura/Noor relies on [**Motion** (`motion/react`)](https://github.com/motiondivision/motion) for high-precision, natural spring physics. Motion in clinical software must never feel sluggish, playful, or decorative—it must feel **tactile, instantaneous, and purposeful**.

### 6.1 Standard Spring Physics Presets

```typescript
export const motionPresets = {
  // Micro-interactions (Buttons, quick toggles, icon clicks)
  snappy: { type: 'spring', stiffness: 500, damping: 30 },
  
  // Modal dialogs and alert banners (WhatsApp modal, Cash desk)
  modal: { type: 'spring', stiffness: 320, damping: 26 },

  // Sliding drawers (Clinical Inspector right-edge drawer)
  drawer: { type: 'spring', stiffness: 300, damping: 28, mass: 0.8 },

  // Shared layout transitions (Day/Week view switcher, reordering)
  tabGlide: { type: 'spring', stiffness: 450, damping: 30 },
};
```

### 6.2 Key Interaction Choreographies

1. **Tactile Micro-Press on CTAs (`Button`) :**
   - Scale down to `0.98` on click (`whileTap`), elevating `y: -0.5px` on hover. Gives doctor physical tactile feedback on high-stakes clinical confirmations.
2. **Context-Preserving Clinical Drawer (`ClinicalInspector`) :**
   - Glides in smoothly from `x: 340px` with spring `damping: 28, stiffness: 300` when an appointment is selected, and gracefully glides out without jarring page reflows via `<AnimatePresence>`.
3. **Sliding View Switcher (`layoutId="activeAgendaViewTab"`) :**
   - Active white pill glides under the text label between "Jour" and "Semaine" using shared layout animation.
4. **Dynamic Waiting Room Queue Reordering :**
   - Automatic smooth position adjustment (`layout`) when a patient transitions from *Programmé* to *Arrivé* or enters the consultation room.
5. **Accessibility & Reduced Motion :**
   - All spring animations gracefully degrade to instant opacity fades whenever `prefers-reduced-motion` is detected in the operating system.

