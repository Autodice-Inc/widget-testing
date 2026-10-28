import './style.css'
import { ApiError, getCurrentUser, login, logout, type CurrentUser } from './api'

// The widget's embed script. Locally it's the widget's dev server (`npm run dev:frame` in
// autodice/widget), whose loader is TypeScript served as an ES module.
const WIDGET_LOADER = import.meta.env.VITE_WIDGET_LOADER || 'http://localhost:4545/src/loader/index.ts'

declare global {
  interface Window {
    Miles?: { open: () => void; reset: () => void }
  }
}

type WidgetState = { kind: 'ready'; widgetId: string } | { kind: 'not-dealership' | 'no-widget' | 'disabled' }

const app = document.querySelector<HTMLElement>('#app')!

// What the logged-in account can try: only an approved dealership's own widget, while it's on.
function widgetStateOf(user: CurrentUser): WidgetState {
  if (user.dealershipStatus !== 'Approved') return { kind: 'not-dealership' }
  const config = user.widgetConfig
  if (!config?.widgetId) return { kind: 'no-widget' }
  if (!config.enabled) return { kind: 'disabled' }
  return { kind: 'ready', widgetId: config.widgetId }
}

function dealershipNameOf(user: CurrentUser) {
  return user.widgetConfig?.branding?.dealershipName?.trim() || user.fullName?.trim() || 'your dealership'
}

function embedWidget(widgetId: string) {
  const script = document.createElement('script')
  script.src = WIDGET_LOADER
  if (WIDGET_LOADER.endsWith('.ts')) script.type = 'module'
  // The loader finds its own tag by this attribute, also when it's added after the page loaded.
  script.dataset.widgetId = widgetId
  document.body.append(script)
}

function showMessage(text: string) {
  app.innerHTML = `<section class="card"><p class="muted" data-text></p></section>`
  app.querySelector('[data-text]')!.textContent = text
}

function showLogin(errorText = '') {
  app.innerHTML = `
    <section class="card">
      <h1>Try Miles</h1>
      <p class="muted">Log in with your dealership's AutoDice account to chat with your own Miles.</p>
      <form class="form" novalidate>
        <label>Email <input name="email" type="email" autocomplete="username" required /></label>
        <label>Password <input name="password" type="password" autocomplete="current-password" required /></label>
        <p class="error" role="alert" data-error></p>
        <button type="submit" class="button">Log in</button>
      </form>
    </section>`

  const form = app.querySelector('form')!
  const error = app.querySelector<HTMLElement>('[data-error]')!
  const button = form.querySelector('button')!
  error.textContent = errorText

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    const data = new FormData(form)
    button.disabled = true
    error.textContent = ''
    try {
      await login(String(data.get('email')).trim(), String(data.get('password')))
      await start()
    } catch (loginError) {
      error.textContent = loginErrorText(loginError)
      button.disabled = false
    }
  })
}

function loginErrorText(error: unknown) {
  if (!(error instanceof ApiError)) return "Can't reach AutoDice right now. Try again in a moment."
  // A wrong password is a 400, an unknown email a 404; both read the same here.
  if ([400, 401, 404].includes(error.status)) return 'Wrong email or password.'
  return error.message
}

const STATE_TEXT: Record<Exclude<WidgetState['kind'], 'ready'>, string> = {
  'not-dealership': "This account isn't an approved dealership, so there's no Miles to try. Log in with your dealership's account.",
  'no-widget': "Miles isn't set up for this dealership yet.",
  disabled: 'Miles is turned off for this dealership. Turn it on in your Miles settings on AutoDice to try it here.',
}

function showAccount(user: CurrentUser) {
  const state = widgetStateOf(user)

  app.innerHTML = `
    <header class="bar">
      <span class="brand">Miles <span class="muted">testing</span></span>
      <button type="button" class="link" data-logout>Log out</button>
    </header>
    <section class="card">
      <h1>Miles for <span data-name></span></h1>
      ${
        state.kind === 'ready'
          ? `<p>Miles is in the bottom-right corner, with your inventory and settings. Chat with it the way a shopper would.</p>
             <div class="actions">
               <button type="button" class="button" data-open>Open Miles</button>
               <button type="button" class="button secondary" data-reset>Start a new conversation</button>
             </div>
             <p class="note">Bookings and contact details sent from here reach your dealership's CRM, just like real ones.</p>`
          : `<p class="muted" data-state></p>`
      }
    </section>`

  app.querySelector('[data-name]')!.textContent = dealershipNameOf(user)
  app.querySelector('[data-logout]')!.addEventListener('click', async () => {
    await logout().catch(() => undefined)
    // A reload is the simplest way to take the widget off the page.
    location.reload()
  })

  if (state.kind !== 'ready') {
    app.querySelector('[data-state]')!.textContent = STATE_TEXT[state.kind]
    return
  }

  app.querySelector('[data-open]')!.addEventListener('click', () => window.Miles?.open())
  app.querySelector('[data-reset]')!.addEventListener('click', () => window.Miles?.reset())
  embedWidget(state.widgetId)
}

async function start() {
  showMessage('Loading…')
  try {
    const user = await getCurrentUser()
    if (user) showAccount(user)
    else showLogin()
  } catch (error) {
    // Logged in, but the API won't hand the account over (a blocked or unverified account, say).
    if (error instanceof ApiError) showLogin(error.message)
    else showMessage("Can't reach AutoDice right now. Reload the page in a moment.")
  }
}

start()
