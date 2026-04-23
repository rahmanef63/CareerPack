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
  			border: 'hsl(var(--border) / <alpha-value>)',
  			input: 'hsl(var(--input) / <alpha-value>)',
  			ring: 'hsl(var(--ring) / <alpha-value>)',
  			background: 'hsl(var(--background) / <alpha-value>)',
  			foreground: 'hsl(var(--foreground) / <alpha-value>)',
  			primary: {
  				DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
  				foreground: 'hsl(var(--primary-foreground) / <alpha-value>)'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
  				foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
  				foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)'
  			},
  			success: {
  				DEFAULT: 'hsl(var(--success) / <alpha-value>)',
  				foreground: 'hsl(var(--success-foreground) / <alpha-value>)'
  			},
  			warning: {
  				DEFAULT: 'hsl(var(--warning) / <alpha-value>)',
  				foreground: 'hsl(var(--warning-foreground) / <alpha-value>)'
  			},
  			info: {
  				DEFAULT: 'hsl(var(--info) / <alpha-value>)',
  				foreground: 'hsl(var(--info-foreground) / <alpha-value>)'
  			},
  			brand: {
  				DEFAULT: 'hsl(var(--brand) / <alpha-value>)',
  				foreground: 'hsl(var(--brand-foreground) / <alpha-value>)',
  				from: 'hsl(var(--brand-from) / <alpha-value>)',
  				to: 'hsl(var(--brand-to) / <alpha-value>)',
  				muted: 'hsl(var(--brand-muted) / <alpha-value>)',
  				'muted-foreground': 'hsl(var(--brand-muted-foreground) / <alpha-value>)'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
  				foreground: 'hsl(var(--muted-foreground) / <alpha-value>)'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
  				foreground: 'hsl(var(--accent-foreground) / <alpha-value>)'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover) / <alpha-value>)',
  				foreground: 'hsl(var(--popover-foreground) / <alpha-value>)'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card) / <alpha-value>)',
  				foreground: 'hsl(var(--card-foreground) / <alpha-value>)'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background) / <alpha-value>)',
  				foreground: 'hsl(var(--sidebar-foreground) / <alpha-value>)',
  				primary: 'hsl(var(--sidebar-primary) / <alpha-value>)',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground) / <alpha-value>)',
  				accent: 'hsl(var(--sidebar-accent) / <alpha-value>)',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground) / <alpha-value>)',
  				border: 'hsl(var(--sidebar-border) / <alpha-value>)',
  				ring: 'hsl(var(--sidebar-ring) / <alpha-value>)'
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
  				'1': 'hsl(var(--chart-1) / <alpha-value>)',
  				'2': 'hsl(var(--chart-2) / <alpha-value>)',
  				'3': 'hsl(var(--chart-3) / <alpha-value>)',
  				'4': 'hsl(var(--chart-4) / <alpha-value>)',
  				'5': 'hsl(var(--chart-5) / <alpha-value>)'
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
  			widest: 'var(--tracking-widest)'
  		},
  		fontFamily: {
  			sans: ['var(--font-sans)'],
  			mono: ['var(--font-mono)'],
  			serif: ['var(--font-serif)']
  		},
  		backgroundImage: {
  			'brand-gradient': 'var(--brand-gradient)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [tailwindcssAnimate],
}

export default config
