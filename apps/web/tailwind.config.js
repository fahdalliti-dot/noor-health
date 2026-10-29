/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // --- Brand palette (see BRAND.md) ---
        // Remap the default Tailwind `blue` to the brand terracotta accent.
        // Every existing `bg-blue-600`, `text-blue-700`, `ring-blue-500` etc.
        // now resolves to terracotta without touching a component file.
        blue: {
          50:  '#FFF3EC',
          100: '#FFE6D6',
          200: '#FFC9B0',
          300: '#FFA480',
          400: '#F07346',
          500: '#D9582B',
          600: '#B05A3A', // terracotta — primary accent
          700: '#8C4429',
          800: '#6E3520',
          900: '#4A2416',
        },
        // Remap the default Tailwind `gray` to a warm sand / charcoal scale.
        // Every `bg-gray-50`, `text-gray-600`, `border-gray-200` etc. now
        // resolves to a warm neutral instead of cold slate.
        gray: {
          50:  '#F7F4EF', // sand
          100: '#F0EBE2',
          200: '#E4DDD0',
          300: '#D4C9B8',
          400: '#A89B88',
          500: '#8C8C7A', // sage
          600: '#6B6560',
          700: '#4A4540',
          800: '#2E2B28',
          900: '#1A1A1A', // charcoal
        },
        // Explicit brand names for new code
        terracotta: {
          50:  '#FFF3EC',
          100: '#FFE6D6',
          200: '#FFC9B0',
          300: '#FFA480',
          400: '#F07346',
          500: '#D9582B',
          600: '#B05A3A',
          700: '#8C4429',
          800: '#6E3520',
          900: '#4A2416',
        },
        sand: {
          50:  '#FBF8F3',
          100: '#F7F4EF',
          200: '#F0EBE2',
          300: '#E4DDD0',
        },
        charcoal: '#1A1A1A',
        sage: '#8C8C7A',
      },
      fontFamily: {
        // Brand pairing: editorial serif display + geometric sans UI.
        sans: [
          'var(--font-sans)',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        display: [
          'var(--font-display)',
          'Cormorant Garamond',
          'Georgia',
          'Times New Roman',
          'serif',
        ],
      },
      boxShadow: {
        sm: '0 1px 2px rgba(26,26,26,0.04)',
        md: '0 4px 12px rgba(26,26,26,0.06)',
        lg: '0 12px 32px rgba(26,26,26,0.08)',
      },
      borderRadius: {
        lg: '14px',
      },
    },
  },
  plugins: [],
};
