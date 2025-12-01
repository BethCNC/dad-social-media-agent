/** @type {import('tailwindcss').Config} */
export default {
	darkMode: ["class"],
	content: [
		"./index.html",
		"./src/**/*.{js,ts,jsx,tsx}",
	],
	theme: {
		extend: {
			fontFamily: {
				sans: ['Figtree', 'system-ui', 'sans-serif'],
			},
			fontSize: {
				'6xl': ['60px', { lineHeight: '80px', fontWeight: '700' }],
				'4xl': ['36px', { lineHeight: '48px', fontWeight: '700' }],
				'3xl': ['30px', { lineHeight: '40px', fontWeight: '500' }],
				'2xl': ['24px', { lineHeight: '32px', fontWeight: '600' }],
				'xl': ['20px', { lineHeight: '27px', fontWeight: '500' }],
				'lg': ['18px', { lineHeight: '24px', fontWeight: '400' }],
				'base': ['16px', { lineHeight: '20px', fontWeight: '400' }],
				'sm': ['14px', { lineHeight: '20px', fontWeight: '400' }],
				'xs': ['12px', { lineHeight: '16px', fontWeight: '500' }],
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			spacing: {
				'card-gap': '24px',    // 24px padding between cards
				'block-gap': '48px',   // 48px vertical spacing between blocks
			},
			colors: {
				// Primitives
				'red-500': 'hsl(var(--color-red-500))',
				'orange-500': 'hsl(var(--color-orange-500))',
				'yellow-500': 'hsl(var(--color-yellow-500))',
				'green-500': 'hsl(var(--color-green-500))',
				'blue-500': 'hsl(var(--color-blue-500))',
				'purple-500': 'hsl(var(--color-purple-500))',
				'pink-500': 'hsl(var(--color-pink-500))',
				'white': 'hsl(var(--color-white))',
				'black': 'hsl(var(--color-black))',
				'gray-900': 'hsl(var(--color-gray-900))',
				'gray-950': 'hsl(var(--color-gray-950))',
				'gray-800': 'hsl(var(--color-gray-800))',
				'gray-700': 'hsl(var(--color-gray-700))',
				'gray-500': 'hsl(var(--color-gray-500))',
				'gray-400': 'hsl(var(--color-gray-400))',
				'gray-200': 'hsl(var(--color-gray-200))',
				'gray-100': 'hsl(var(--color-gray-100))',
				'gray-50': 'hsl(var(--color-gray-50))',
				// Semantics
				'fg-headings': 'hsl(var(--fg-headings))',
				'fg-body': 'hsl(var(--fg-body))',
				'fg-subtle': 'hsl(var(--fg-subtle))',
				'fg-inverse': 'hsl(var(--fg-inverse))',
				'fg-on-disabled': 'hsl(var(--fg-on-disabled))',
				'fg-error': 'hsl(var(--fg-error))',
				'fg-warning': 'hsl(var(--fg-warning))',
				'fg-success-hover': 'hsl(var(--fg-success-hover))',
				'fg-warning-hover': 'hsl(var(--fg-warning-hover))',
				'fg-error-hover': 'hsl(var(--fg-error-hover))',
				'bg-page': 'hsl(var(--bg-page))',
				'bg-default': 'hsl(var(--bg-default))',
				'bg-elevated': 'hsl(var(--bg-elevated))',
				'bg-subtle': 'hsl(var(--bg-subtle))',
				'bg-action': 'hsl(var(--bg-action))',
				'bg-secondary': 'hsl(var(--bg-secondary))',
				'bg-disabled': 'hsl(var(--bg-disabled))',
				'bg-success': 'hsl(var(--bg-success))',
				'bg-warning': 'hsl(var(--bg-warning))',
				'bg-error': 'hsl(var(--bg-error))',
				'bg-success-subtle': 'hsl(var(--bg-success-subtle))',
				'bg-warning-subtle': 'hsl(var(--bg-warning-subtle))',
				'bg-error-subtle': 'hsl(var(--bg-error-subtle))',
				'border-primary': 'hsl(var(--border-primary))',
				'border-strong': 'hsl(var(--border-strong))',
				'border-default': 'hsl(var(--border-default))',
				'border-disabled': 'hsl(var(--border-disabled))',
				'border-error': 'hsl(var(--border-error))',
				'border-warning': 'hsl(var(--border-warning))',
				'border-success-hover': 'hsl(var(--border-success-hover))',
				'border-warning-hover': 'hsl(var(--border-warning-hover))',
				'border-error-hover': 'hsl(var(--border-error-hover))'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
}
