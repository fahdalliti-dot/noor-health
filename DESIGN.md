# DESIGN.md — Nura (نُور) Brand Kit & Design System Specification

> **Standard:** [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md)  
> **Product:** **Nura — Soin Numérique** (EHR & Practice Management SaaS for Moroccan Doctors)  
> **Version:** `2.0.0-production`  
> **Market / Locale:** Morocco (`Africa/Casablanca`, GMT+1) • Multilingual (`fr-MA` French & `ar-MA` Moroccan Darija)  
> **Regulatory Foundation:** CNDP (Loi N° 09-08) • Moroccan INPE (Identifiant National des Professionnels de Santé)

---

## 1. Brand Philosophy & Archetype

### 1.1 The Meaning of "Nura"
**Nura** stems from the Arabic **نُور** (*nūr*), signifying **light, restorative clarity, and enlightenment**. In clinical practice, it represents shedding light on the patient's diagnostic path and lifting the administrative fog from private practices.

### 1.2 Brand Archetype: *Chirurgical Quiet Luxury*
Nura is **not** a generic blue-and-white hospital utility, nor a playful consumer health app. It is the digital equivalent of a premier private clinic on Boulevard Zerktouni in Casablanca or Avenue Mohammed VI in Rabat:
- **Calm & Grounded:** Earth tones (Warm Sand, Atlas Terracotta, Charcoal) replacing cold clinical neon blues.
- **Authoritative & Prestigious:** High-contrast editorial serif headers paired with ultra-crisp geometric UI sans.
- **Culturally Rooted, Never Folkloric:** Subtle inspiration drawn from Moroccan architectural zellige geometry, symmetry, and warmth—without resort to decorative cliché.
- **Strictly Confidential:** Security, dignity, and patient privacy (Loi 09-08) embedded in every visual choice.

---

## 2. Logo & Iconography System

The Nura logo consists of three coordinated assets: the **Brand Mark (Zellige Diamond)**, the **Wordmark ("Nura" + "نُور")**, and the **Combined Horizontal Lockup**.

### 2.1 The Brand Mark (Geometry & Symbolism)
- **Outer Diamond:** A 45° rotated polygon drawn from Moroccan architectural craft (Zellige octagonal tile cut).
- **Architectural N Monogram:** Two upright vertical columns representing structure and clinic pillars.
- **Radiating Incision:** The diagonal of the "N" is cleanly cut by a central radiance gap, housing a central *Noor* particle that radiates subtle rays outward.

```
       ▲  [Zellige Diamond Apex]
      / \
     / | \
    /  |  \
   | [N|N] |  <-- Interlocking N with Center Radiance Spark (نُور)
    \  |  /
     \ | /
      \ /
       ▼
```

### 2.2 SVG Source: Standalone Mark (`/public/brand/logo-mark.svg`)
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200" fill="none">
  <defs>
    <linearGradient id="nura-terracotta" x1="20" y1="20" x2="180" y2="180" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#D9582B" />
      <stop offset="100%" stop-color="#B05A3A" />
    </linearGradient>
  </defs>
  <!-- Outer Moroccan Diamond Frame -->
  <polygon points="100,12 188,100 100,188 12,100" fill="none" stroke="url(#nura-terracotta)" stroke-width="3" stroke-linejoin="round" />
  <!-- Radiating Cardinal Rays -->
  <line x1="100" y1="26" x2="100" y2="42" stroke="#B05A3A" stroke-width="2" stroke-linecap="round" opacity="0.6" />
  <line x1="100" y1="158" x2="100" y2="174" stroke="#B05A3A" stroke-width="2" stroke-linecap="round" opacity="0.6" />
  <line x1="26" y1="100" x2="42" y2="100" stroke="#B05A3A" stroke-width="2" stroke-linecap="round" opacity="0.6" />
  <line x1="158" y1="100" x2="174" y2="100" stroke="#B05A3A" stroke-width="2" stroke-linecap="round" opacity="0.6" />
  <!-- N Columns -->
  <rect x="52" y="44" width="18" height="112" rx="4" fill="#B05A3A" />
  <rect x="130" y="44" width="18" height="112" rx="4" fill="#B05A3A" />
  <!-- Split Diagonal -->
  <polygon points="70,44 88,44 112,86 94,86" fill="url(#nura-terracotta)" />
  <polygon points="106,114 124,114 148,156 130,156" fill="url(#nura-terracotta)" />
  <!-- Noor Radiance Spark -->
  <polygon points="100,92 108,100 100,108 92,100" fill="#D9582B" />
</svg>
```

### 2.3 Primary Horizontal Lockup (`/public/brand/logo-primary.svg`)
- **Proportions:** 460px width $\times$ 120px height.
- **Left:** Mark scaled to 60px.
- **Separator:** 1.5px vertical dividing rule in Sand-300 (`#E4DDD0`).
- **Wordmark:** "Nura" in *Cormorant Garamond* (size 44px, weight 600, Charcoal `#1A1A1A`).
- **Arabic Ligature:** "نُور" in *Amiri/Traditional Arabic* (size 28px, Terracotta `#B05A3A`).
- **Descriptor:** "SOIN NUMÉRIQUE • MAROC" in *Inter* (size 10.5px, weight 600, tracking 3.5px, Sage `#8C8C7A`).

### 2.4 Minimum Sizes & Clear Space
- **Clear Space:** Maintain a clear margin of at least $0.5 \times$ the mark's width on all 4 sides. No UI controls, text, or border lines may intrude into this boundary.
- **Minimum Digital Sizes:**
  - Mark only (Favicon / App Icon): `16px` $\times$ `16px`.
  - Horizontal Lockup: Minimum `140px` width.
  - Print / Prescription Header: Minimum `35mm` width.

---

## 3. Color Tokens & Semantic Palette

All colors are mathematically calibrated for **WCAG AAA/AA contrast compliance** on both light (`#FBF8F3`) and dark (`#1A1A1A`) surfaces.

### 3.1 Primary Brand Palette

| Token Name | Hex Code | RGB | Role / Usage |
|---|---|---|---|
| **Terracotta-600** (Primary Accent) | `#B05A3A` | `rgb(176, 90, 58)` | Key action CTAs, active tab lines, mark stroke |
| **Terracotta-500** (Vibrant) | `#D9582B` | `rgb(217, 88, 43)` | Hover states, glowing accents, badge highlights |
| **Terracotta-50** (Tint) | `#FFF3EC` | `rgb(255, 243, 236)` | Selected appointment backgrounds, soft badges |
| **Sand-50** (Canvas Background) | `#FBF8F3` | `rgb(251, 248, 243)` | Primary application background, neutral canvas |
| **Sand-100** (Card Surface) | `#F7F4EF` | `rgb(247, 244, 239)` | Inspector drawer, timetable grid background |
| **Sand-200** (Subtle Border) | `#F0EBE2` | `rgb(240, 235, 226)` | Table borders, card outlines |
| **Sand-300** (Muted Rule) | `#E4DDD0` | `rgb(228, 221, 208)` | Dividers, inactive scrollbar tracks |
| **Charcoal-900** (Dominant Dark) | `#1A1A1A` | `rgb(26, 26, 26)` | Headings, primary text, dark mode surfaces |
| **Charcoal-700** (Body Text) | `#4A4540` | `rgb(74, 69, 64)` | Body copy, patient dossiers, clinical notes |
| **Sage-500** (Muted Secondary) | `#8C8C7A` | `rgb(140, 140, 122)` | Secondary metadata, INPE labels, timestamps |
| **Warm White** (Elevated Surface) | `#FFFFFF` | `rgb(255, 255, 255)` | Modals, elevated cards, prescription preview sheets |

### 3.2 Clinical Functional & Regulatory Palette

| Clinical State | Hex Code | Semantic Meaning & UI Application |
|---|---|---|
| **Moroccan Emerald** | `#059669` / `#10B981` | WhatsApp 1-Click Patient Confirmation, Completed consultations, Active medications |
| **Saffron / Amber** | `#D97706` / `#F59E0B` | Waiting Room queue (<15 min), Arrived patients, Pending prescriptions |
| **Tangerine / Alert** | `#EA580C` | Waiting Room alert (>15 min & <30 min), Scheduled reminders |
| **Atlas Crimson** | `#DC2626` | Urgent alert, Allergy warnings (Penicillin), No-show cancellation, Late (>30 min) |
| **Majorelle Blue** | `#2563EB` | CMI Moroccan Card Gateway, AMO / CNSS / CNOPS official claim sheets |
| **Casablanca Playhead** | `#EF4444` / `#D9582B` | 2px live real-time timeline bar for current time in Morocco |

### 3.3 CSS Custom Properties (`:root`)
```css
:root {
  /* Brand Core */
  --nura-terracotta: #B05A3A;
  --nura-terracotta-vibrant: #D9582B;
  --nura-terracotta-soft: #FFF3EC;
  --nura-sand: #F7F4EF;
  --nura-sand-light: #FBF8F3;
  --nura-sand-border: #E4DDD0;
  --nura-charcoal: #1A1A1A;
  --nura-charcoal-muted: #4A4540;
  --nura-sage: #8C8C7A;

  /* Clinical States */
  --nura-emerald: #059669;
  --nura-amber: #D97706;
  --nura-crimson: #DC2626;
  --nura-majorelle: #2563EB;

  /* Elevation */
  --shadow-sm: 0 1px 2px rgba(26, 26, 26, 0.04);
  --shadow-md: 0 4px 12px rgba(26, 26, 26, 0.06);
  --shadow-lg: 0 12px 32px rgba(26, 26, 26, 0.08);

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-full: 9999px;
}
```

---

## 4. Typography System

The typographic language pairs **high-contrast editorial elegance** with **rigorous clinical clarity**.

### 4.1 Typeface Families
1. **Display / Editorial Headings:** `Cormorant Garamond`
   - Role: Hero headings, Doctor title, Practice name, Modal headings, Legal certifications.
   - Weights: `500 Medium`, `600 SemiBold`, `700 Bold`.
2. **UI / Clinical Body Text:** `Inter`
   - Role: Navigation, agenda timetable, data tables, clinical notes, patient dossiers, buttons.
   - Weights: `400 Regular`, `500 Medium`, `600 SemiBold`.
3. **Arabic & Moroccan Darija Text:** `Amiri` / `Noto Sans Arabic`
   - Role: WhatsApp Darija templates, bilingual receipts, Moroccan official documents.
4. **Data & Monospace:** `JetBrains Mono` / `ui-monospace`
   - Role: Timetable hours (`08:30 – 09:00`), Moroccan CIN numbers (`BE849201`), INPE codes (`104829384`), dosage metrics (`1000mg 3x/j`).

### 4.2 Type Scale Hierarchy

| Level | Size / Line-Height | Font Family | Weight | Tracking | Usage |
|---|---|---|---|---|---|
| **Display 1** | `42px / 48px` | Cormorant Garamond | 600 SemiBold | `-0.01em` | Public booking doctor hero |
| **Heading 1** | `28px / 34px` | Cormorant Garamond | 600 SemiBold | `0` | Cockpit view title, Section headers |
| **Heading 2** | `20px / 26px` | Cormorant Garamond | 600 SemiBold | `0.01em` | Modal titles, Inspector patient name |
| **Heading 3** | `15px / 20px` | Inter | 600 SemiBold | `0` | Sub-sections, Drawer card titles |
| **Body Large** | `14px / 20px` | Inter | 400 / 500 | `0` | Diagnostic notes, prescription lines |
| **Body Regular**| `13px / 18px` | Inter | 400 Regular | `0` | Agenda entries, consultation motives |
| **Small / UI** | `11px / 15px` | Inter | 500 Medium | `0.01em` | Badges, waiting room timer, status tags |
| **Caption / Mono** | `10px / 14px` | JetBrains Mono | 600 SemiBold | `0.04em` | INPE code, CIN, timestamps, Meta IDs |

---

## 5. Spatial Grid & Elevation Architecture

### 5.1 Grid & Baselines
- **Base Grid:** `4px` sub-grid, `8px` major rhythm. All paddings and margins are multiples of 4 (`p-1`, `p-2`, `p-3`, `p-4`, `p-6`, `p-8`).
- **Application Max Width:** `1400px` centered with `px-4 sm:px-6`.
- **Cockpit 3-Panel Proportions:**
  - Left Navigation Rail: `72px` (compact) or `240px` (expanded).
  - Center Agenda Timetable: Flexible (`1fr`), minimum `640px`.
  - Right Clinical Inspector Drawer: `336px` (`w-84`) fixed slide-in.

### 5.2 Elevation & Shadows
In keeping with the *Quiet Luxury* ethos, shadows are never pure black and never heavy:
```css
/* Warm Charcoal Diffusion */
.shadow-nura-sm { box-shadow: 0 1px 2px rgba(26, 26, 26, 0.04); }
.shadow-nura-md { box-shadow: 0 4px 12px rgba(26, 26, 26, 0.06); }
.shadow-nura-lg { box-shadow: 0 12px 32px rgba(26, 26, 26, 0.08); }
```

### 5.3 Border Radius Standard
- **Micro (`rounded-md` - 6px):** Status dots, inner chips, language switchers.
- **Medium (`rounded-lg` - 10px):** Form inputs, buttons, appointment cards.
- **Card / Sheet (`rounded-xl` - 14px):** Agenda table frame, modals, Inspector drawers.
- **Pill (`rounded-full` - 9999px):** Status badges, WhatsApp delivery indicators.

---

## 6. Component Visual Standards

### 6.1 Buttons
- **Primary CTA:** Background `terracotta-600` (`#B05A3A`), hover `terracotta-500` (`#D9582B`), text White, radius `10px`, font-weight `600`, subtle press transition (`active:scale-[0.98]`).
- **Secondary / Outline:** Border `Sand-200` (`#E4DDD0`), text `Charcoal-900`, hover background `Sand-100`.
- **WhatsApp Action:** Background Emerald-600 (`#059669`), hover Emerald-700, text White with WhatsApp icon and 1-Click trigger label.

### 6.2 WhatsApp Cloud API Notification Card
- **Frame:** `bg-slate-50/80 border border-slate-200 rounded-lg p-2.5`.
- **Patient Chat Preview:** Simulates realistic WhatsApp message on patient device in Moroccan Darija (`العربية الدارجة`) or French.
- **Status Indicator:**
  - `✓ Confirmé (1-Clic)` : `bg-emerald-100 text-emerald-800 border-emerald-200`.
  - `✓✓ Délivré` : `bg-purple-100 text-purple-800`.
  - `✓ Envoyé` : `bg-blue-100 text-blue-800`.
  - `Non envoyé` : `bg-slate-200 text-slate-600`.

### 6.3 Real-time Agenda Playhead
- A horizontal 2px line stretching across the entire timetable reflecting the current minute in `Africa/Casablanca`.
- Colored in Terracotta-500 with a pulsing beacon dot on the left axis displaying the exact live time.

---

## 7. Strict Do's & Don'ts for Designers and Agents

### Do's:
1. **Always use the Terracotta / Sand / Charcoal / Sage hierarchy.**
2. **Always format doctor INPE codes and patient CINs in Monospace.**
3. **Keep the medical inspector drawer context-preserving** (never cover the whole screen when checking an appointment).
4. **Offer bilingual Arabic (Darija) and French options** for every patient-facing communication (WhatsApp, SMS, invoices).
5. **Ensure full CNDP compliance cues** (display encryption badges, audit trail confirmation).

### Don'ts:
1. **Never use standard hospital blue (#0000FF, #0070F3) or generic medical clip-art.**
2. **Never render medical crosses (+), stethoscopes, or caduceus snakes**—Nura uses abstract geometry and light rays (*نُور*).
3. **Never use harsh black (#000000) or cold blue-slate for backgrounds.**
4. **Never show glassmorphism, aggressive 3D glows, or skeuomorphic shadows.**
5. **Never delete medical doctor notes or RLS security parameters during UI updates.**

---

## 8. Directory of Brand Assets

| Asset Name | Path | Format | Usage |
|---|---|---|---|
| **Primary Logo** | [`/public/brand/logo-primary.svg`](file:///c:/Users/Fahdaoui/Documents/SaaS%20for%20doctors%20in%20Morocco/apps/web/public/brand/logo-primary.svg) | SVG (Vector) | Header nav, login portal, PDF letters |
| **Dark Logo** | [`/public/brand/logo-dark.svg`](file:///c:/Users/Fahdaoui/Documents/SaaS%20for%20doctors%20in%20Morocco/apps/web/public/brand/logo-dark.svg) | SVG (Vector) | Dark surfaces, presentation slides |
| **Brand Mark** | [`/public/brand/logo-mark.svg`](file:///c:/Users/Fahdaoui/Documents/SaaS%20for%20doctors%20in%20Morocco/apps/web/public/brand/logo-mark.svg) | SVG (Vector) | In-app icon, loader, watermark |
| **Favicon** | [`/public/brand/favicon.svg`](file:///c:/Users/Fahdaoui/Documents/SaaS%20for%20doctors%20in%20Morocco/apps/web/public/brand/favicon.svg) | SVG (Vector) | Browser tab icon, mobile PWA shortcut |
| **Inline React Component** | [`NuraMark.tsx`](file:///c:/Users/Fahdaoui/Documents/SaaS%20for%20doctors%20in%20Morocco/apps/web/src/components/nura-mark.tsx) | TSX (React) | Zero-overhead inline SVG with `currentColor` |
