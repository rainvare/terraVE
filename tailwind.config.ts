import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        terra: {
          earth:  '#2C1810',
          gold:   '#D4A017',
          sand:   '#F5E6C8',
          smoke:  '#8B9EA7',
          night:  '#0D1B2A',
          danger: '#C0392B',
        },
        damage: {
          none:    '#27AE60',
          minor:   '#F1C40F',
          major:   '#E67E22',
          destroyed: '#E74C3C',
        }
      },
      fontFamily: {
        display: ['Georgia', 'serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
