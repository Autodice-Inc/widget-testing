import { existsSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'

// Runs the page against the widget's own dev servers instead of the deployed widget:
//   WIDGET_LOADER=http://localhost:4545/src/loader/index.ts yarn dev
// (`npm run dev:frame` in autodice/widget serves that loader). It's an ES module, so the tag
// becomes type="module"; the loader then finds it by data-widget-id. WIDGET_ID swaps in another
// widget, for one whose domain whitelist has localhost.
function localWidget(): Plugin {
  const loader = process.env.WIDGET_LOADER
  const widgetId = process.env.WIDGET_ID
  return {
    name: 'local-widget',
    transformIndexHtml(html) {
      let result = html
      if (loader) {
        result = result.replace(
          /<script\s+src="https:\/\/dev\.cdn\.autodice\.com\/widget\.js"/g,
          `<script type="module" src="${loader}"`,
        )
      }
      if (widgetId) {
        result = result.replace(/data-widget-id="[^"]*"/g, `data-widget-id="${widgetId}"`)
      }
      return result
    },
  }
}

// The dealer pages copied by scripts/mirror-page.mjs, at the dealer's own paths. / only sends
// visitors on to /en. The Spinelli Toyota Lachine look-alike sits under /toyota.
const PAGES = [
  'index.html',
  'en/index.html',
  'fr/index.html',
  'toyota/en/index.html',
  'toyota/fr/index.html',
].filter((page) => existsSync(page))

// https://vite.dev/config/
export default defineConfig({
  appType: 'mpa',
  plugins: [localWidget()],
  build: { rollupOptions: { input: PAGES } },
})
