import { Cormorant_Garamond, Inter } from 'next/font/google';

/**
 * Noor typefaces.
 *
 * Display face (headings): Cormorant Garamond — high-contrast editorial serif.
 * UI face (body): Inter — geometric sans.
 *
 * Both preloaded via next/font so they are FOIT/LAYOUT-shift free and
 * self-hosted (no third-party request at runtime, per the CNDP rule).
 */
export const displayFont = Cormorant_Garamond({
  subsets: ['latin', 'latin-ext'],
  weight: ['500', '600', '700'],
  display: 'swap',
  variable: '--font-display',
});

export const sansFont = Inter({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-sans',
});