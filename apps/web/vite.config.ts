import path from 'path'
import devtools from 'solid-devtools/vite'
import netlify from 'solid-start-netlify'
import solid from 'solid-start/vite'
import {
  presetAttributify,
  presetIcons,
  presetUno,
  presetWebFonts,
} from 'unocss'
import Unocss from 'unocss/vite'
import { defineConfig } from 'vite'
import pkgJson from './package.json' assert { type: 'json' }

export default defineConfig({
  define: {
    __version__: JSON.stringify(pkgJson.version),
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'src'),
      '@ui': path.resolve(__dirname, '../../packages/ui'),
    },
  },
  plugins: [
    devtools({}),
    solid({ ssr: false, adapter: netlify() }),
    Unocss({
      rules: [
        [
          'tap-highlight-none',
          { '-webkit-tap-highlight-color': 'transparent' },
        ],
      ],
      presets: [
        presetUno(),
        presetAttributify(),
        presetWebFonts({
          provider: 'google',
          fonts: {
            sans: ['Roboto:400,500,600,700,800,900'],
          },
        }),
        presetIcons({
          extraProperties: {
            display: 'inline-block',
            'vertical-align': 'middle',
          },
        }),
      ],
    }),
  ],
  build: {
    sourcemap: false,
  },
})
