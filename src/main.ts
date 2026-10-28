import './style.css'
import {
  ApiError,
  getCurrentUser,
  getVehiclePage,
  login,
  logout,
  type CurrentUser,
  type DistanceUnit,
  type SaleType,
  type StockQuery,
  type Vehicle,
  type VehiclePage,
} from './api'
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

const CONDITION_TEXT: Record<string, TextKey> = {
  new: 'conditionNew',
  demo: 'conditionDemo',
  used: 'conditionUsed',
  certified: 'conditionCertified',
}

const LOCALES: Record<Language, string> = { en: 'en-CA', fr: 'fr-CA' }

const CAMERA_ICON = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
  stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  <circle cx="12" cy="13" r="3.5" />
</svg>`

const app = document.querySelector<HTMLElement>('#app')!
let language: Language = initialLanguage()

app.innerHTML = `
  <header class="bar">
    <div class="bar-inner">
      <span class="brand">Miles <span class="muted" data-t="testing"></span></span>
      <span class="bar-actions">
        <span class="segmented" role="group" aria-label="Language / Langue">
          <button type="button" data-language="en" lang="en">EN</button>
          <button type="button" data-language="fr" lang="fr">FR</button>
        </span>
        <button type="button" class="link" data-logout data-t="logOut" hidden></button>
      </span>
    </div>
  </header>
  <div class="view" data-view></div>`

const view = app.querySelector<HTMLElement>('[data-view]')!
const logoutButton = app.querySelector<HTMLButtonElement>('[data-logout]')!

// Every piece of page text names its key in data-t, with its {placeholders} in data attributes of
// the same name, and prices and mileages carry their number, so a language switch rewrites the
// text in place: typed login details and the widget stay as they are.
function applyText() {
  for (const element of app.querySelectorAll<HTMLElement>('[data-t]')) {
    element.textContent = TEXT[language][element.dataset.t as TextKey].replace(/\{(\w+)\}/g, (_, key: string) => {
      const value = element.dataset[key] ?? ''
      return /^\d+$/.test(value) ? Number(value).toLocaleString(LOCALES[language]) : value
    })
  }
  // Text with no element of its own: a control's accessible name, an input's placeholder too.
  for (const element of app.querySelectorAll<HTMLElement>('[data-label]')) {
    const label = TEXT[language][element.dataset.label as TextKey]
    element.setAttribute('aria-label', label)
    if (element instanceof HTMLInputElement) element.placeholder = label
  }
  for (const element of app.querySelectorAll<HTMLElement>('[data-price]')) {
    const price = Number(element.dataset.price).toLocaleString(LOCALES[language])
    element.textContent = language === 'fr' ? `${price} $` : `$${price}`
  }
  for (const element of app.querySelectorAll<HTMLElement>('[data-mileage]')) {
    element.textContent = `${Number(element.dataset.mileage).toLocaleString(LOCALES[language])} ${element.dataset.unit}`
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

function element(tag: string, className = '', text = '') {
  const node = document.createElement(tag)
  if (className) node.className = className
  node.textContent = text
  return node
}

/** The login and every message: one narrow card. */
function showCard(html: string) {
  app.dataset.layout = 'card'
  view.innerHTML = `<section class="card">${html}</section>`
  applyText()
}

function showMessage(key: TextKey) {
  showCard(`<p class="muted" data-t="${key}"></p>`)
}

function showLogin(apiError?: ApiError) {
  logoutButton.hidden = true
  showCard(`
    <h1 data-t="title"></h1>
    <p class="muted" data-t="loginIntro"></p>
    <form class="form" novalidate>
      <label><span data-t="email"></span> <input name="email" type="email" autocomplete="username" required /></label>
      <label><span data-t="password"></span> <input name="password" type="password" autocomplete="current-password" required /></label>
      <p class="error" role="alert" data-error></p>
      <button type="submit" class="button" data-t="logIn"></button>
    </form>`)

  const form = view.querySelector('form')!
  const error = view.querySelector<HTMLElement>('[data-error]')!
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

  if (state.kind === 'ready') {
    showSite(user, state.widgetId)
    return
  }

  const name = dealershipNameOf(user)
  showCard(`
    <h1 data-t="${name ? 'milesFor' : 'milesForYourDealership'}"></h1>
    <p class="muted" data-t="${STATE_TEXT[state.kind]}"></p>`)
  const heading = view.querySelector<HTMLElement>('h1')!
  heading.dataset.name = name
  applyText()
}

/** A plain dealership homepage, so the dealership sees Miles the way a shopper on its site would. */
function showSite(user: CurrentUser, widgetId: string) {
  app.dataset.layout = 'site'
  view.innerHTML = `
    <aside class="test-note">
      <div>
        <p data-t="testNote"></p>
        <p class="muted" data-t="languageHint"></p>
        <p class="muted" data-t="crmNote"></p>
      </div>
      <button type="button" class="button" data-open data-t="open"></button>
    </aside>
    <header class="site-header">
      <img class="site-logo" alt="" data-logo hidden />
      <span class="site-name" data-site-name></span>
    </header>
    <section class="hero">
      <h1 data-hero></h1>
      <p data-t="heroText"></p>
    </section>
    <section class="stock" data-stock hidden>
      <div class="stock-heading">
        <h2 data-t="inStock"></h2>
        <span class="muted" data-stock-count></span>
      </div>
      <div class="stock-controls" data-stock-controls>
        <input type="search" class="search" maxlength="100" autocomplete="off" data-search data-label="searchStock" />
        <span class="segmented" role="group" data-label="saleTypeGroup" data-sale-types hidden>
          <button type="button" data-sale-type="" data-t="all" aria-pressed="true"></button>
          <button type="button" data-sale-type="new" data-t="saleNew" aria-pressed="false"></button>
          <button type="button" data-sale-type="used" data-t="saleUsed" aria-pressed="false"></button>
        </span>
      </div>
      <div class="stock-grid" data-stock-grid></div>
      <nav class="pager" data-pager hidden>
        <button type="button" class="button secondary" data-page-step="-1" data-t="previous"></button>
        <span class="muted" data-page-status data-t="pageOf"></span>
        <button type="button" class="button secondary" data-page-step="1" data-t="next"></button>
      </nav>
    </section>`

  const name = dealershipNameOf(user)
  view.querySelector('[data-site-name]')!.textContent = name
  const hero = view.querySelector<HTMLElement>('[data-hero]')!
  hero.dataset.t = name ? 'welcomeTo' : 'welcome'
  hero.dataset.name = name

  const logo = user.widgetConfig?.branding?.logo
  if (logo) {
    const image = view.querySelector<HTMLImageElement>('[data-logo]')!
    image.src = logo
    image.hidden = false
  }

  applyText()
  view.querySelector('[data-open]')!.addEventListener('click', () => window.Miles?.open())

  const section = view.querySelector<HTMLElement>('[data-stock]')!
  for (const button of section.querySelectorAll<HTMLButtonElement>('[data-page-step]')) {
    button.addEventListener('click', async () => {
      await showStock(section, { page: stockQuery.page + Number(button.dataset.pageStep) })
      section.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const saleTypeButtons = section.querySelectorAll<HTMLButtonElement>('[data-sale-type]')
  for (const button of saleTypeButtons) {
    button.addEventListener('click', () => {
      for (const other of saleTypeButtons) other.setAttribute('aria-pressed', String(other === button))
      showStock(section, { page: 1, saleType: (button.dataset.saleType || null) as SaleType | null })
    })
  }

  const search = section.querySelector<HTMLInputElement>('[data-search]')!
  let searchTimer: number | undefined
  search.addEventListener('input', () => {
    window.clearTimeout(searchTimer)
    searchTimer = window.setTimeout(() => showStock(section, { page: 1, search: search.value.trim() }), 300)
  })

  embedWidget(widgetId)
  stockQuery = { page: 1, search: '', saleType: null }
  showStock(section, {})
}

// What the stock grid shows. A change goes in at once, so one made while another page loads
// builds on it rather than on the last page that arrived.
let stockQuery: StockQuery = { page: 1, search: '', saleType: null }
let stockRequest = 0

async function showStock(section: HTMLElement, changes: Partial<StockQuery>) {
  stockQuery = { ...stockQuery, ...changes }
  const query = stockQuery
  const request = ++stockRequest
  setPager(section, null)

  let result: VehiclePage
  try {
    result = await getVehiclePage(query)
  } catch {
    // The cars are scenery: the page and Miles work without them. The grid keeps the last page
    // that loaded, so paging goes on from there.
    if (request !== stockRequest) return
    const pager = readPager(section)
    stockQuery = { ...stockQuery, page: pager.page }
    setPager(section, pager)
    return
  }
  // Something else was asked for since, which wins.
  if (request !== stockRequest) return

  const filtered = !!query.search || !!query.saleType
  const grid = section.querySelector<HTMLElement>('[data-stock-grid]')!
  const count = section.querySelector<HTMLElement>('[data-stock-count]')!
  if (result.totalItems) {
    grid.replaceChildren(...result.items.map((vehicle) => vehicleCard(vehicle, result.distanceUnit)))
    count.dataset.t = result.totalItems === 1 ? 'vehicleCountOne' : 'vehicleCount'
    count.dataset.count = String(result.totalItems)
  } else {
    const empty = element('p', 'muted stock-empty')
    empty.dataset.t = filtered ? 'noMatch' : 'noStock'
    grid.replaceChildren(empty)
    setText(count, null)
  }

  // Nothing to search in an empty stock, and nothing to toggle unless it has both new and used.
  section.querySelector<HTMLElement>('[data-stock-controls]')!.hidden = !result.totalItems && !filtered
  section.querySelector<HTMLElement>('[data-sale-types]')!.hidden = result.saleTypes.length < 2

  setPager(section, { page: result.currentPage, pages: result.totalPages })
  section.hidden = false
  applyText()
}

type Pager = { page: number; pages: number }

function readPager(section: HTMLElement): Pager {
  const status = section.querySelector<HTMLElement>('[data-page-status]')!
  return { page: Number(status.dataset.page) || 1, pages: Number(status.dataset.pages) || 1 }
}

/** Shows where the visitor is in the stock; null while a page loads, which holds both buttons. */
function setPager(section: HTMLElement, pager: Pager | null) {
  const [previous, next] = section.querySelectorAll<HTMLButtonElement>('[data-page-step]')
  previous.disabled = !pager || pager.page <= 1
  next.disabled = !pager || pager.page >= pager.pages
  if (!pager) return

  const status = section.querySelector<HTMLElement>('[data-page-status]')!
  status.dataset.page = String(pager.page)
  status.dataset.pages = String(pager.pages)
  section.querySelector<HTMLElement>('[data-pager]')!.hidden = pager.pages <= 1
}

/** What a vehicle without a photo shows, and one whose photo link is dead. */
function missingPhoto() {
  const placeholder = element('div', 'vehicle-photo-missing')
  placeholder.innerHTML = CAMERA_ICON
  const label = element('span')
  setText(label, 'photosComingSoon')
  placeholder.append(label)
  return placeholder
}

function vehicleCard(vehicle: Vehicle, unit: DistanceUnit) {
  const card = element('article', 'vehicle')

  const photo = element('div', 'vehicle-photo')
  const src = vehicle.photos?.[0]
  if (src) {
    const image = document.createElement('img')
    image.src = src
    image.alt = ''
    image.loading = 'lazy'
    image.addEventListener('error', () => image.replaceWith(missingPhoto()))
    photo.append(image)
  } else {
    photo.append(missingPhoto())
  }

  const body = element('div', 'vehicle-body')
  const conditionKey = vehicle.condition ? CONDITION_TEXT[vehicle.condition] : undefined
  if (conditionKey) {
    const badge = element('span', 'badge')
    badge.dataset.t = conditionKey
    body.append(badge)
  }
  body.append(element('h3', '', [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ')))
  if (vehicle.trim) body.append(element('p', 'muted', vehicle.trim))

  const price = element('p', 'vehicle-price')
  if (typeof vehicle.price === 'number') price.dataset.price = String(vehicle.price)
  else price.dataset.t = 'callForPrice'
  body.append(price)

  if (typeof vehicle.mileage === 'number') {
    const mileage = element('p', 'muted')
    mileage.dataset.mileage = String(vehicle.mileage)
    mileage.dataset.unit = unit
    body.append(mileage)
  }

  card.append(photo, body)
  return card
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
