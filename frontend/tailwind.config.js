/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './app/**/*.{js,ts,jsx,tsx}',
        './pages/**/*.{js,ts,jsx,tsx}',
        './components/**/*.{js,ts,jsx,tsx}',
        './src/**/*.{js,ts,jsx,tsx}',
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                bg: '#0b0f1a',
                panel: '#0f1724',
                muted: '#94a3b8',
                accent: '#7c3aed',
                neon: '#00ffa3',
            },
            fontFamily: {
                sans: ['Inter', 'ui-sans-serif', 'system-ui'],
            },
            boxShadow: {
                'neon-md': '0 8px 30px rgba(124,58,237,0.12), inset 0 1px 0 rgba(255,255,255,0.02)',
            },
        },
    },
    plugins: [],
}
