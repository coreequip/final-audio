const plugin = require('tailwindcss/plugin')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './*.html',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-vertical': 'linear-gradient(to bottom, #001724, #000000)',
      },
      fontFamily: {
        display: "'Case', ui-sans-serif",
        serif: "'ibm-serif', ui-serif",
      },
      boxShadow: {
        'btn': '0 0 80px 20px rgba(255,255,255,.08)',
      },
      textColor: {
        blue: '#4AA8DD',
        'light-blue': '#87CFF7'
      },
      borderImage: {
        'gradient-vertical': 'linear-gradient(to bottom, #87CFF7, #1D85BF) 1'
      },
      backgroundColor: {
        'button-blue': '#006FAD',
      }
    },
  },
  plugins: [
  ],
}

