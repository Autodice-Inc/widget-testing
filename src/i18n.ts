export type Language = 'en' | 'fr'

const en = {
  title: 'Try Miles',
  testing: 'testing',
  loading: 'Loading…',
  unreachable: "Can't reach AutoDice right now. Reload the page in a moment.",
  loginIntro: "Log in with your dealership's AutoDice account to chat with your own Miles.",
  email: 'Email',
  password: 'Password',
  logIn: 'Log in',
  logOut: 'Log out',
  wrongLogin: 'Wrong email or password.',
  unreachableLogin: "Can't reach AutoDice right now. Try again in a moment.",
  milesFor: 'Miles for {name}',
  milesForYourDealership: 'Miles for your dealership',
  testNote:
    'This page stands in for your website. Miles is in the corner, with your inventory and settings: chat with it the way a shopper would.',
  languageHint:
    'Miles follows the page\'s language until a conversation starts. To try the other language after that, switch it above, then pick "New conversation" in Miles\'s header.',
  open: 'Open Miles',
  crmNote: "Bookings and contact details sent from here reach your dealership's CRM, just like real ones.",
  notDealership:
    "This account isn't an approved dealership, so there's no Miles to try. Log in with your dealership's account.",
  noWidget: "Miles isn't set up for this dealership yet.",
  disabled: 'Miles is turned off for this dealership. Turn it on in your Miles settings on AutoDice to try it here.',
  welcomeTo: 'Welcome to {name}',
  welcome: 'Welcome',
  heroText: 'Find your next vehicle in our inventory. Questions? Ask our virtual assistant in the corner of the page.',
  inStock: 'In stock',
  noStock: 'Miles has no vehicles yet. Add your inventory in your Miles settings on AutoDice.',
  callForPrice: 'Call for price',
  photosComingSoon: 'Photos coming soon',
  vehicleCount: '{count} vehicles',
  vehicleCountOne: '1 vehicle',
  previous: 'Previous',
  next: 'Next',
  pageOf: 'Page {page} of {pages}',
  searchStock: 'Search by make, model, trim or stock number',
  saleTypeGroup: 'New or used',
  all: 'All',
  saleNew: 'New',
  saleUsed: 'Used',
  noMatch: 'No vehicles match your search.',
  conditionNew: 'New',
  conditionDemo: 'Demo',
  conditionUsed: 'Used',
  conditionCertified: 'Certified',
}

export type TextKey = keyof typeof en

const fr: Record<TextKey, string> = {
  title: 'Essayer Miles',
  testing: 'essai',
  loading: 'Chargement…',
  unreachable: 'Impossible de joindre AutoDice pour le moment. Rechargez la page dans un instant.',
  loginIntro: 'Connectez-vous avec le compte AutoDice de votre concession pour discuter avec votre propre Miles.',
  email: 'Courriel',
  password: 'Mot de passe',
  logIn: 'Se connecter',
  logOut: 'Se déconnecter',
  wrongLogin: 'Courriel ou mot de passe incorrect.',
  unreachableLogin: 'Impossible de joindre AutoDice pour le moment. Réessayez dans un instant.',
  milesFor: 'Miles pour {name}',
  milesForYourDealership: 'Miles pour votre concession',
  testNote:
    'Cette page tient lieu de votre site Web. Miles est dans le coin, avec votre inventaire et vos paramètres : discutez avec lui comme le ferait un client.',
  languageHint:
    "Miles suit la langue de la page jusqu'au début d'une conversation. Pour essayer l'autre langue ensuite, changez-la ci-dessus, puis choisissez « Nouvelle conversation » dans l'en-tête de Miles.",
  open: 'Ouvrir Miles',
  crmNote:
    "Les rendez-vous et les coordonnées envoyés d'ici parviennent au CRM de votre concession, comme les vrais.",
  notDealership:
    "Ce compte n'est pas une concession approuvée, il n'y a donc pas de Miles à essayer. Connectez-vous avec le compte de votre concession.",
  noWidget: "Miles n'est pas encore configuré pour cette concession.",
  disabled:
    "Miles est désactivé pour cette concession. Activez-le dans vos paramètres Miles sur AutoDice pour l'essayer ici.",
  welcomeTo: 'Bienvenue chez {name}',
  welcome: 'Bienvenue',
  heroText:
    'Trouvez votre prochain véhicule dans notre inventaire. Des questions? Posez-les à notre assistant virtuel, dans le coin de la page.',
  inStock: 'En inventaire',
  noStock: "Miles n'a encore aucun véhicule. Ajoutez votre inventaire dans vos paramètres Miles sur AutoDice.",
  callForPrice: 'Prix sur demande',
  photosComingSoon: 'Photos à venir',
  vehicleCount: '{count} véhicules',
  vehicleCountOne: '1 véhicule',
  previous: 'Précédent',
  next: 'Suivant',
  pageOf: 'Page {page} sur {pages}',
  searchStock: 'Rechercher par marque, modèle, version ou numéro de stock',
  saleTypeGroup: "Neufs ou d'occasion",
  all: 'Tous',
  saleNew: 'Neufs',
  saleUsed: "D'occasion",
  noMatch: 'Aucun véhicule ne correspond à votre recherche.',
  conditionNew: 'Neuf',
  conditionDemo: 'Démo',
  conditionUsed: "D'occasion",
  conditionCertified: 'Certifié',
}

export const TEXT: Record<Language, Record<TextKey, string>> = { en, fr }

const STORAGE_KEY = 'try-miles.language'

/** The visitor's last pick on this page, else the browser's language. */
export function initialLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'en' || stored === 'fr') return stored
  } catch {
    // Storage blocked: the browser's language still works.
  }
  return navigator.language.toLowerCase().startsWith('fr') ? 'fr' : 'en'
}

export function storeLanguage(language: Language) {
  try {
    localStorage.setItem(STORAGE_KEY, language)
  } catch {
    // Only a convenience: the page works without it.
  }
}
