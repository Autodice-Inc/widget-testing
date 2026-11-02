import type { CurrentUser } from './api'

// The widget's embed script. Locally it's the widget's dev server (`npm run dev:frame` in
// autodice/widget), whose loader is TypeScript served as an ES module.
const WIDGET_LOADER = import.meta.env.VITE_WIDGET_LOADER || 'http://localhost:4545/src/loader/index.ts'

export type WidgetState = { kind: 'ready'; widgetId: string } | { kind: 'not-dealership' | 'no-widget' | 'disabled' }

// What the logged-in account can try: only an approved dealership's own widget, while it's on.
export function widgetStateOf(user: CurrentUser): WidgetState {
  if (user.dealershipStatus !== 'Approved') return { kind: 'not-dealership' }
  const config = user.widgetConfig
  if (!config?.widgetId) return { kind: 'no-widget' }
  if (!config.enabled) return { kind: 'disabled' }
  return { kind: 'ready', widgetId: config.widgetId }
}

export function embedWidget(widgetId: string) {
  const script = document.createElement('script')
  script.src = WIDGET_LOADER
  if (WIDGET_LOADER.endsWith('.ts')) script.type = 'module'
  // The loader finds its own tag by this attribute, also when it's added after the page loaded.
  script.dataset.widgetId = widgetId
  document.body.append(script)
}
