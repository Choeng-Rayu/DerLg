import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './providers/**/*.{ts,tsx}',
    './stores/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {},
  },
}

export default config
