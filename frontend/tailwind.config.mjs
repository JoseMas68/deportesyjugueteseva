/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: '#FFED00',
        secondary: '#111111',
        accent: '#e63946',
        'background-light': '#F9FAFB',
        'background-dark': '#0f0f0f',
        'surface-light': '#FFFFFF',
        'surface-dark': '#1E1E1E',
      },
      fontFamily: {
        display: ['Montserrat', 'sans-serif'],
        body: ['Open Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
