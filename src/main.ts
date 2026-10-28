import './style.css'
import { ApiError, getCurrentUser, login, logout, type CurrentUser } from './api'
import { initialLanguage, storeLanguage, TEXT, type Language, type TextKey } from './i18n'

// The widget's embed script. Locally it's the widget's dev server (`npm run dev:frame` in
// autodice/widget), whose loader is TypeScript served as an ES module.
const WIDGET_LOADER = import.meta.env.VITE_WIDGET_LOADER || 'http://localhost:4545/src/loader/index.ts'

declare global {
  interface Window {
    Miles?: { open: () => void }
  }
}

type WidgetState = { kind: 'ready'; widgetId: string } | { kind: 'not-dealership' | 'no-widget' | 'disabled' }

const STATE_TEXT: Record<Exclude<WidgetState['kind'], 'ready'>, TextKey> = {
  'not-dealership': 'notDealership',
  'no-widget': 'noWidget',
  disabled: 'disabled',
}

const app = document.querySelector<HTMLElement>('#app')!
let language: Language = initialLanguage()

app.innerHTML = `
  <header class="bar">
    <span class="brand">Miles <span class="muted" data-t="testing"></span></span>
    <span class="bar-actions">
      <span class="language" role="group" aria-label="Language / Langue">
        <button type="button" data-language="en" lang="en">EN</button>
        <button type="button" data-language="fr" lang="fr">FR</button>
      </span>
      <button type="button" class="link" data-logout data-t="logOut" hidden></button>
    </span>
  </header>
  <section class="card" data-card></section>`

const card = app.querySelector<HTMLElement>('[data-card]')!
const logoutButton = app.querySelector<HTMLButtonElement>('[data-logout]')!

// Every piece of page text names its key in data-t (the dealership in data-name), so a language
// switch rewrites the text in place: typed login details and the widget stay as they are.
function applyText() {
  for (const element of app.querySelectorAll<HTMLElement>('[data-t]')) {
    element.textContent = TEXT[language][element.dataset.t as TextKey].replace('{name}', element.dataset.name ?? '')
  }
  document.title = TEXT[language].title
}

/** Our own text by key, or the API's own message (which stays as it is on a switch). */
function setText(element: HTMLElement, key: TextKey | null, message = '') {
  if (key) element.dataset.t = key
  else delete element.dataset.t
  element.textContent = key ? TEXT[language][key] : message
}

function setLanguage(next: Language) {
  language = next
  // The widget reads <html lang>: it starts in that language, and follows a switch until a
  // conversation starts, as on a dealership's own bilingual site.
  document.documentElement.lang = next
  for (const button of app.querySelectorAll<HTMLButtonElement>('[data-language]')) {
    button.setAttribute('aria-pressed', String(button.dataset.language === next))
  }
  applyText()
}

for (const button of app.querySelectorAll<HTMLButtonElement>('[data-language]')) {
  button.addEventListener('click', () => {
    const next = button.dataset.language as Language
    storeLanguage(next)
    setLanguage(next)
  })
}

logoutButton.addEventListener('click', async () => {
  await logout().catch(() => undefined)
  // A reload is the simplest way to take the widget off the page.
  location.reload()
})

// What the logged-in account can try: only an approved dealership's own widget, while it's on.
function widgetStateOf(user: CurrentUser): WidgetState {
  if (user.dealershipStatus !== 'Approved') return { kind: 'not-dealership' }
  const config = user.widgetConfig
  if (!config?.widgetId) return { kind: 'no-widget' }
  if (!config.enabled) return { kind: 'disabled' }
  return { kind: 'ready', widgetId: config.widgetId }
}

function dealershipNameOf(user: CurrentUser) {
  return user.widgetConfig?.branding?.dealershipName?.trim() || user.fullName?.trim() || ''
}

function embedWidget(widgetId: string) {
  const script = document.createElement('script')
  script.src = WIDGET_LOADER
  if (WIDGET_LOADER.endsWith('.ts')) script.type = 'module'
  // The loader finds its own tag by this attribute, also when it's added after the page loaded.
  script.dataset.widgetId = widgetId
  document.body.append(script)
}

function showMessage(key: TextKey) {
  card.innerHTML = `<p class="muted" data-t="${key}"></p>`
  applyText()
}

function showLogin(apiError?: ApiError) {
  logoutButton.hidden = true
  card.innerHTML = `
    <h1 data-t="title"></h1>
    <p class="muted" data-t="loginIntro"></p>
    <form class="form" novalidate>
      <label><span data-t="email"></span> <input name="email" type="email" autocomplete="username" required /></label>
      <label><span data-t="password"></span> <input name="password" type="password" autocomplete="current-password" required /></label>
      <p class="error" role="alert" data-error></p>
      <button type="submit" class="button" data-t="logIn"></button>
    </form>`
  applyText()

  const form = card.querySelector('form')!
  const error = card.querySelector<HTMLElement>('[data-error]')!
  const button = form.querySelector('button')!
  if (apiError) setText(error, null, apiError.message)

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    const data = new FormData(form)
    button.disabled = true
    setText(error, null)
    try {
      await login(String(data.get('email')).trim(), String(data.get('password')))
      await start()
    } catch (loginError) {
      setText(error, loginErrorKey(loginError), loginError instanceof Error ? loginError.message : '')
      button.disabled = false
    }
  })
}

/** Our text for a failed login, or null to show the API's own message. */
function loginErrorKey(error: unknown): TextKey | null {
  if (!(error instanceof ApiError)) return 'unreachableLogin'
  // A wrong password is a 400, an unknown email a 404; both read the same here.
  if ([400, 401, 404].includes(error.status)) return 'wrongLogin'
  return null
}

function showAccount(user: CurrentUser) {
  const state = widgetStateOf(user)
  logoutButton.hidden = false
  card.innerHTML = `
    <h1 data-heading></h1>
    ${
      state.kind === 'ready'
        ? `<p data-t="ready"></p>
           <p class="muted" data-t="languageHint"></p>
           <div class="actions"><button type="button" class="button" data-open data-t="open"></button></div>
           <p class="note" data-t="crmNote"></p>`
        : `<p class="muted" data-t="${STATE_TEXT[state.kind]}"></p>`
    }`

  const heading = card.querySelector<HTMLElement>('[data-heading]')!
  const name = dealershipNameOf(user)
  heading.dataset.t = name ? 'milesFor' : 'milesForYourDealership'
  heading.dataset.name = name
  applyText()

  if (state.kind !== 'ready') return

  card.querySelector('[data-open]')!.addEventListener('click', () => window.Miles?.open())
  embedWidget(state.widgetId)
}

async function start() {
  showMessage('loading')
  try {
    const user = await getCurrentUser()
    if (user) showAccount(user)
    else showLogin()
  } catch (error) {
    // Logged in, but the API won't hand the account over (a blocked or unverified account, say).
    if (error instanceof ApiError) showLogin(error)
    else showMessage('unreachable')
  }
}

setLanguage(language)
start()
