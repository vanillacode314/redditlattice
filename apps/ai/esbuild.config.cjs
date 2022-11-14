const esbuild = require('esbuild')

esbuild.build({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/index.js',
  format: 'esm',
  bundle: true,
  color: true,
  logLevel: 'info',
  platform: 'browser',
})
