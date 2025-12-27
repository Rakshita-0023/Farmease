/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#2E7D32', // Green 800
                secondary: '#81C784', // Green 300
                accent: '#FFD54F', // Amber 300
                dark: '#1B1B1B',
                light: '#F5F5F5',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
