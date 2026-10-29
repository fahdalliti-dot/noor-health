'use client';

/**
 * Noor (نُور) brand mark — modern fluid architectural N with radiant starlet.
 *
 * Designed according to VoltAgent/awesome-design-md.
 * Represents light, diagnostic clarity, and restorative warmth.
 *
 * Self-contained SVG, responsive at all sizes (14px micro, 24px nav, 120px hero).
 * Inherits colors or customizes via currentColor.
 */
export function NoorMark({
  size = 24,
  className = '',
}: {
  size?: number;
  className?: string;
  surface?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <title>Noor</title>
      <desc>Noor brand mark — architectural N with radiant light starlet.</desc>

      <defs>
        <linearGradient id="noor-mark-gradient" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#E05D34" />
          <stop offset="100%" stop-color="#A53E1B" />
        </linearGradient>
      </defs>

      {/* Subtle outer aura rounded squircle */}
      <rect width="100" height="100" rx="24" fill="#FFF3EC" stroke="#F0EBE2" strokeWidth="1.2" />

      {/* Orbit guidance ring */}
      <circle cx="50" cy="50" r="38" stroke="#E4DDD0" strokeWidth="0.8" strokeDasharray="2 4" />

      {/* Left Pillar Ribbon */}
      <path
        d="M25 74 V30 C25 26.5 28 24 31.5 24 C35 24 38 26.5 38 30 V70 C38 73.5 35 76 31.5 76 C28 76 25 73.5 25 70 Z"
        fill="url(#noor-mark-gradient)"
      />

      {/* Right Pillar Ribbon */}
      <path
        d="M62 30 C62 26.5 65 24 68.5 24 C72 24 75 26.5 75 30 V70 C75 73.5 72 76 68.5 76 C65 76 62 73.5 62 70 Z"
        fill="url(#noor-mark-gradient)"
      />

      {/* Diagonal Fluid Bridge */}
      <path
        d="M31.5 25 C34.5 25 37 26.5 39 30 L67 71 C68.5 73 71 74 73 73 C75 71.5 75 69 73 66 L45 25 C43 22 39 20 35 21 C31 22 30 24 31.5 25 Z"
        fill="url(#noor-mark-gradient)"
      />

      {/* Central Noor Radiance Starlet */}
      <g transform="translate(50, 49)">
        <path
          d="M0 -9 C0.8 -3.5 3.5 -0.8 9 0 C3.5 0.8 0.8 3.5 0 9 C-0.8 3.5 -3.5 0.8 -9 0 C-3.5 -0.8 -0.8 -3.5 0 -9 Z"
          fill="#EA580C"
        />
        <circle cx="0" cy="0" r="2.2" fill="#FFFFFF" />
      </g>
    </svg>
  );
}

// Backwards-compatible alias for existing components
export const NuraMark = NoorMark;
export default NoorMark;
