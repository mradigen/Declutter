import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		projects: ['./packages/*', './services/*'],
		// reporters: ['default', 'html'],
		reporters: ['html'],
	},
})
