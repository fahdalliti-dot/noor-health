'use client';

/**
 * Nura brand mark — inline SVG.
 *
 * A diamond frame (Moroccan zellige geometry, not a quote) around an
 * interlocking N monogram. The broken diagonal reads as light radiating —
 * نور (nūr), the meaning of the name.
 *
 * Single-color, self-contained, renders at any size including favicon.
 * Color is inherited from `currentColor` so it picks up whatever text color
 * the parent sets.
 */
export function NuraMark({
  size = 24,
  className,
  surface = '#F5F1E8',
}: {
  size?: number;
  className?: string;
  /** Background the mark sits on — the "cut" areas render in this color. */
  surface?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <title>Nura</title>
      <desc>
        Nura brand mark — an interlocking N monogram inside a diamond frame.
      </desc>

      {/* Diamond frame — thin, confident, zellige-inspired */}
      <polygon
        points="100,14 186,100 100,186 14,100"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* N monogram — built from four strokes */}
      <rect x="48" y="30" width="16" height="140" rx="3" fill="currentColor" />
      <rect x="136" y="30" width="16" height="140" rx="3" fill="currentColor" />
      <polygon points="64,30 80,30 136,150 120,150" fill="currentColor" />

      {/* The break — a sliver of background in the diagonal's middle,
          read as light passing through. Rendered in the page background
          color so it "cuts" regardless of the mark color. */}
      <rect x="92" y="72" width="16" height="16" fill={surface} />
      <polygon points="108,104 120,104 114,116" fill={surface} />

      {/* Radiating light — four thin rays in the open counter, subtle */}
      <g
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        opacity="0.55"
      >
        <line x1="100" y1="46" x2="100" y2="24" />
        <line x1="100" y1="154" x2="100" y2="176" />
        <line x1="40" y1="100" x2="22" y2="100" />
        <line x1="160" y1="100" x2="178" y2="100" />
      </g>
    </svg>
  );
}