/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0056D2', // Un bleu plus vif et "confiance" (Google/Facebook style)
        secondary: '#FFFFFF', // Fond principal blanc pour l'élégance
        dark: '#0D1E30', // Pour le texte sombre
        accent: '#E8F0FE', // Un bleu très pâle pour les fonds secondaires
        uzp: '#F59E0B',
      }
    },
  },
  plugins: [],
}
