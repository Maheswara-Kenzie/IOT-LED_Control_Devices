/* tailwind-config.js - konfigurasi Tailwind CDN (dimuat setelah script CDN) */
tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      },
      colors: {
        brand: { cyan: '#38bdf8', primary: '#0284c7' },
        surface: { base: '#0a0e16', dim: '#0f131c', card: '#131824', highlight: '#1c2232', border: '#242b3d' }
      }
    }
  }
};
