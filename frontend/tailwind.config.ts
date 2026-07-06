const config = {
    darkMode: 'class',
    content: [
        './app/**/*.{ts,tsx}',
        './components/**/*.{ts,tsx}',
        './pages/**/*.{ts,tsx}',
        './src/**/*.{ts,tsx}'
    ],
    theme: {
        extend: {
            colors: {
                background: 'var(--background)',
                foreground: 'var(--foreground)',
                secondary: 'var(--secondary)',
                card: 'var(--card)',
                sidebar: 'var(--sidebar)',
                border: 'var(--border)',
                input: 'var(--input)',
                muted: {
                    DEFAULT: 'var(--muted)',
                    foreground: 'var(--muted-foreground)',
                },
                primary: {
                    DEFAULT: 'var(--primary)',
                    foreground: 'var(--primary-foreground)',
                },
                accent: {
                    DEFAULT: 'var(--accent)',
                    foreground: 'var(--accent-foreground)',
                },
                slate: {
                    950: '#02030a',
                    900: '#060914',
                    850: '#0b1220'
                },
                graphite: '#09101c',
                panel: '#101725',
                surface: '#111928',
                electric: '#22d3ee',
                cyan: '#22d3ee',
                violet: '#8b5cf6',
                blue: '#60a5fa'
            },
            fontFamily: {
                sans: ['Inter', 'ui-sans-serif', 'system-ui']
            },
            boxShadow: {
                soft: '0 18px 70px rgba(0,0,0,0.35)',
                glow: '0 0 40px rgba(34,211,238,0.12)',
                panel: '0 24px 80px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.04)'
            },
            borderRadius: {
                '4xl': '2rem'
            },
            animation: {
                float: 'float 6s ease-in-out infinite',
                shimmer: 'shimmer 1.8s linear infinite',
                pulseSlow: 'pulse 2.5s ease-in-out infinite'
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-4px)' }
                },
                shimmer: {
                    '100%': { transform: 'translateX(100%)' }
                }
            }
        }
    },
    plugins: [],
}
export default config
