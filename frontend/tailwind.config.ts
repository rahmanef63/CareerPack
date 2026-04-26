import type { Config } from "tailwindcss"
import tailwindcssAnimate from "tailwindcss-animate"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			// Every token carries the `/ <alpha-value>` placeholder so
  			// Tailwind slash utilities (bg-primary/90, hover:bg-accent/50,
  			// text-muted-foreground/70, border-border/40, ring-ring/30, …)
  			// resolve to real HSL with the requested alpha instead of
  			// silently dropping the alpha modifier and rendering full
  			// opacity. Applies uniformly so there are no "some colors
  			// blend, others don't" surprises across the codebase.
  			border: 'oklch(var(--border) / <alpha-value>)',
  			input: 'oklch(var(--input) / <alpha-value>)',
  			ring: 'oklch(var(--ring) / <alpha-value>)',
  			background: 'oklch(var(--background) / <alpha-value>)',
  			foreground: 'oklch(var(--foreground) / <alpha-value>)',
  			primary: {
  				DEFAULT: 'oklch(var(--primary) / <alpha-value>)',
  				foreground: 'oklch(var(--primary-foreground) / <alpha-value>)'
  			},
  			secondary: {
  				DEFAULT: 'oklch(var(--secondary) / <alpha-value>)',
  				foreground: 'oklch(var(--secondary-foreground) / <alpha-value>)'
  			},
  			destructive: {
  				DEFAULT: 'oklch(var(--destructive) / <alpha-value>)',
  				foreground: 'oklch(var(--destructive-foreground) / <alpha-value>)'
  			},
  			success: {
  				DEFAULT: 'oklch(var(--success) / <alpha-value>)',
  				foreground: 'oklch(var(--success-foreground) / <alpha-value>)'
  			},
  			warning: {
  				DEFAULT: 'oklch(var(--warning) / <alpha-value>)',
  				foreground: 'oklch(var(--warning-foreground) / <alpha-value>)'
  			},
  			info: {
  				DEFAULT: 'oklch(var(--info) / <alpha-value>)',
  				foreground: 'oklch(var(--info-foreground) / <alpha-value>)'
  			},
  			brand: {
  				DEFAULT: 'oklch(var(--brand) / <alpha-value>)',
  				foreground: 'oklch(var(--brand-foreground) / <alpha-value>)',
  				from: 'oklch(var(--brand-from) / <alpha-value>)',
  				to: 'oklch(var(--brand-to) / <alpha-value>)',
  				muted: 'oklch(var(--brand-muted) / <alpha-value>)',
  				'muted-foreground': 'oklch(var(--brand-muted-foreground) / <alpha-value>)'
  			},
  			muted: {
  				DEFAULT: 'oklch(var(--muted) / <alpha-value>)',
  				foreground: 'oklch(var(--muted-foreground) / <alpha-value>)'
  			},
  			accent: {
  				DEFAULT: 'oklch(var(--accent) / <alpha-value>)',
  				foreground: 'oklch(var(--accent-foreground) / <alpha-value>)'
  			},
  			popover: {
  				DEFAULT: 'oklch(var(--popover) / <alpha-value>)',
  				foreground: 'oklch(var(--popover-foreground) / <alpha-value>)'
  			},
  			card: {
  				DEFAULT: 'oklch(var(--card) / <alpha-value>)',
  				foreground: 'oklch(var(--card-foreground) / <alpha-value>)'
  			},
  			sidebar: {
  				DEFAULT: 'oklch(var(--sidebar-background) / <alpha-value>)',
  				foreground: 'oklch(var(--sidebar-foreground) / <alpha-value>)',
  				primary: 'oklch(var(--sidebar-primary) / <alpha-value>)',
  				'primary-foreground': 'oklch(var(--sidebar-primary-foreground) / <alpha-value>)',
  				accent: 'oklch(var(--sidebar-accent) / <alpha-value>)',
  				'accent-foreground': 'oklch(var(--sidebar-accent-foreground) / <alpha-value>)',
  				border: 'oklch(var(--sidebar-border) / <alpha-value>)',
  				ring: 'oklch(var(--sidebar-ring) / <alpha-value>)'
  			},
  			career: {
  				'50': '#f0f9ff',
  				'100': '#e0f2fe',
  				'200': '#bae6fd',
  				'300': '#7dd3fc',
  				'400': '#38bdf8',
  				'500': '#0ea5e9',
  				'600': '#0284c7',
  				'700': '#0369a1',
  				'800': '#075985',
  				'900': '#0c4a6e'
  			},
  			chart: {
  				'1': 'oklch(var(--chart-1) / <alpha-value>)',
  				'2': 'oklch(var(--chart-2) / <alpha-value>)',
  				'3': 'oklch(var(--chart-3) / <alpha-value>)',
  				'4': 'oklch(var(--chart-4) / <alpha-value>)',
  				'5': 'oklch(var(--chart-5) / <alpha-value>)'
  			}
  		},
  		borderRadius: {
  			xl: 'var(--radius-xl)',
  			lg: 'var(--radius-lg)',
  			md: 'var(--radius-md)',
  			sm: 'var(--radius-sm)',
  			xs: 'calc(var(--radius) - 6px)'
  		},
  		boxShadow: {
  			'2xs': 'var(--shadow-2xs)',
  			xs: 'var(--shadow-xs)',
  			sm: 'var(--shadow-sm)',
  			DEFAULT: 'var(--shadow)',
  			md: 'var(--shadow-md)',
  			lg: 'var(--shadow-lg)',
  			xl: 'var(--shadow-xl)',
  			'2xl': 'var(--shadow-2xl)',
  			cta: 'var(--shadow-cta)'
  		},
  		letterSpacing: {
  			tighter: 'var(--tracking-tighter)',
  			tight: 'var(--tracking-tight)',
  			normal: 'var(--tracking-normal)',
  			wide: 'var(--tracking-wide)',
  			wider: 'var(--tracking-wider)',
  			widest: 'var(--tracking-widest)',
  			brutal: 'var(--tracking-brutal, 0.2em)',
  			'brutal-sm': 'var(--tracking-brutal-sm, 0.15em)'
  		},
  		fontFamily: {
  			sans: ['var(--font-sans)'],
  			mono: ['var(--font-mono)'],
  			serif: ['var(--font-serif)'],
  			// Display = distinctive editorial serif (Fraunces by default).
  			// Applied via `font-display` utility on hero titles, page
  			// greetings, auth headings. Sits independent of presets so
  			// switching tweakcn presets doesn't override it.
  			display: ['var(--font-display)', 'var(--font-serif)', 'serif']
  		},
  		backgroundImage: {
  			'brand-gradient': 'var(--brand-gradient)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: { height: '0' },
  				to: { height: 'var(--radix-accordion-content-height)' }
  			},
  			'accordion-up': {
  				from: { height: 'var(--radix-accordion-content-height)' },
  				to: { height: '0' }
  			},
  			// Orchestrated first-visit reveal — blur + slide-up.
  			// Used via <Reveal delay={N}> to stagger dashboard sections.
  			'reveal-up': {
  				'0%': {
  					opacity: '0',
  					transform: 'translate3d(0, 12px, 0)',
  					filter: 'blur(6px)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'none',
  					filter: 'none'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'reveal-up': 'reveal-up 420ms cubic-bezier(0.2, 0.9, 0.25, 1) both'
  		}
  	}
  },
  plugins: [tailwindcssAnimate],
}

export default config
