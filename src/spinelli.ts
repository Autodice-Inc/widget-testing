// The Spinelli Nissan look-alike (spinelli/en, spinelli/fr): the logged-in dealership's own Miles,
// and its own cars in the featured row, on a page that looks like Spinelli's site. Logging in
// happens on the testing page, which sends the visitor back here.
import { ApiError, getCurrentUser, getVehiclePage, type CurrentUser, type SaleType, type Vehicle } from './api'
import { TEXT, type Language, type TextKey } from './i18n'
import { embedWidget, widgetStateOf, type WidgetState } from './widget'

/** A car as /nissan/site.js draws it in the featured row. */
type FeaturedCar = {
  stock: string
  year?: number | null
  make: string
  model: string
  trim?: string | null
  price?: number | null
  km?: number | null
  photo?: string
  condition?: string | null
}

declare global {
  interface Window {
    showFeaturedCars?: (cars: FeaturedCar[], usedOnly: boolean) => void
  }
}

const language: Language = document.documentElement.lang === 'fr' ? 'fr' : 'en'

const LOG_IN_TEXT: Record<Language, string> = {
  en: 'Log in with your AutoDice dealer account to try Miles on this page.',
  fr: 'Connectez-vous avec votre compte concessionnaire AutoDice pour essayer Miles sur cette page.',
}

const STATE_TEXT: Record<Exclude<WidgetState['kind'], 'ready'>, TextKey> = {
  'not-dealership': 'notDealership',
  'no-widget': 'noWidget',
  disabled: 'disabled',
}

/** A strip above the page for why Miles isn't on it, with a way to log in when that's the reason. */
function showNote(text: string, logIn = false) {
  const note = document.createElement('aside')
  note.className = 'miles-note'
  note.append(text)
  if (logIn) {
    const link = document.createElement('a')
    link.href = `/?next=${encodeURIComponent(location.pathname)}`
    link.textContent = TEXT[language].logIn
    note.append(' ', link)
  }
  document.body.prepend(note)
}

function featuredCarOf(vehicle: Vehicle): FeaturedCar {
  return {
    stock: vehicle.stockNumber,
    year: vehicle.year,
    make: vehicle.make,
    model: vehicle.model,
    trim: vehicle.trim,
    price: vehicle.price,
    km: vehicle.mileage,
    photo: vehicle.photos?.[0],
    condition: vehicle.condition,
  }
}

/** The dealership's used cars for the featured row, as on Spinelli's site, or any of its cars when it has no used ones. */
async function showFeaturedCars() {
  const page = (saleType: SaleType | null) => getVehiclePage({ page: 1, search: '', saleType })
  const used = await page('used')
  const cars = used.totalItems ? used : await page(null)
  if (cars.totalItems) window.showFeaturedCars?.(cars.items.map(featuredCarOf), !!used.totalItems)
}

function showMiles(user: CurrentUser) {
  const state = widgetStateOf(user)
  if (state.kind !== 'ready') {
    showNote(TEXT[language][STATE_TEXT[state.kind]])
    return
  }

  embedWidget(state.widgetId)
  // The cars are scenery: the page and Miles work without them.
  showFeaturedCars().catch(() => undefined)
}

async function start() {
  try {
    const user = await getCurrentUser()
    if (user) showMiles(user)
    else showNote(LOG_IN_TEXT[language], true)
  } catch (error) {
    // Logged in, but the API won't hand the account over (a blocked or unverified account, say).
    if (error instanceof ApiError) showNote(error.message, true)
    else showNote(TEXT[language].unreachable)
  }
}

start()
