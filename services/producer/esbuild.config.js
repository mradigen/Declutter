import { build } from 'esbuild'

await build({
	entryPoints: ['src/index.ts'],
	bundle: true,
	platform: 'node',
	target: 'node22',
	format: 'esm',
	outfile: 'dist/index.js',
	banner: {
		js: "import { createRequire } from 'module';const require = createRequire(import.meta.url);",
	},
	minify: true,
	external: ['pulsar-client', '@valkey/valkey-glide', 'fastbloom'],
})
