// The demo page's own behaviour: the hero slider, the featured-vehicle cards, the hours tabs and
// the phone menu. Links that would leave the demo are "#" and do nothing, and no form submits, so
// nothing reaches the dealership; Miles is the only live thing on the page.
(function () {
  var locale = document.documentElement.lang === 'fr' ? 'fr' : 'en';

  var STRINGS = {
    en: {
      vin: 'VIN #',
      stock: '# stock',
      priceLabel: 'Purchase Price',
      cash: 'on cash purchase',
      fine: '(GST/QST), licensing, insurance & registration not included.',
      offer: 'Offer details',
      details: 'See details',
      rebate: 'Dealer Rebate',
      km: 'KM',
      transmission: { Automatic: 'Automatic', Manual: 'Manual' },
      numberLocale: 'en-CA',
    },
    // Their French site's own wording.
    fr: {
      vin: '# de série',
      stock: 'Inventaire #',
      priceLabel: "Prix d'achat",
      cash: 'en achat comptant',
      fine: '(TPS/TVQ), immatriculation, assurances & enregistrement non inclus.',
      offer: "Détails de l'offre",
      details: 'Voir les détails',
      rebate: 'Remise concessionnaire',
      km: 'KM',
      transmission: { Automatic: 'Automatique', Manual: 'Manuelle' },
      numberLocale: 'fr-CA',
    },
  };
  var t = STRINGS[locale];

  // Used Toyotas from the 1,000-car test inventory Spinelli's Miles has on dev, so a car on the
  // page is one Miles can talk about. Photos come from Autodice's own media CDN; these twelve have
  // distinct photos, no other dealer's banner on them, and model years that exist.
  var CARS = [
    { stock: 'T10688', vin: 'NPWVKA7427UMWH4L4', year: 2018, model: 'Corolla', trim: 'SE', price: 9595, regularPrice: 11195, km: 118485, transmission: 'Automatic', photo: 'https://dev.media.autodice.com/car-listings/69bce9e5a5a215111b78a72b/48d9e10b-9364-4572-851c-308c5920efbd-L.avif' },
    { stock: 'T10843', vin: 'UXA0BTDMFX95HMUXC', year: 2019, model: 'RAV4', trim: 'Limited', price: 18995, regularPrice: 19995, km: 96732, transmission: 'Automatic', photo: 'https://dev.media.autodice.com/car-listings/69bce898a5a215111b789ad3/0bdf0cdb-7b6d-49dd-a2ff-dfa62cbe2dc6-L.avif' },
    { stock: 'T10002', vin: 'U5VPCR277X9DH9M3E', year: 2023, model: 'Camry', trim: 'LE', price: 24495, regularPrice: 27095, km: 62461, transmission: 'Automatic', photo: 'https://dev.media.autodice.com/car-listings/68a209c75efa63222223bff8/b7d3808f-924c-48e3-9747-38bdd2b5e8bc-L.avif' },
    { stock: 'T10037', vin: 'CUXHFGF354JK5158D', year: 2022, model: 'Corolla Cross', trim: 'L', price: 16595, regularPrice: null, km: 60177, transmission: 'Automatic', photo: 'https://dev.media.autodice.com/car-listings/69bce92aa5a215111b78a020/5e34c62b-da70-4a3b-84a9-746cef74fb3b-L.avif' },
    { stock: 'T10837', vin: 'TTPR25EVD2CRT7BXM', year: 2019, model: 'Highlander', trim: 'Limited', price: 24795, regularPrice: null, km: 99880, transmission: 'Automatic', photo: 'https://dev.media.autodice.com/car-listings/69bce9fea5a215111b78a84d/0012708a-6fae-4186-9cb2-b38a0077f9b2-L.avif' },
    { stock: 'T10883', vin: 'VLNKTHMMFY995D7GS', year: 2020, model: 'Tundra', trim: 'Limited', price: 29995, regularPrice: 32395, km: 113964, transmission: 'Automatic', photo: 'https://dev.media.autodice.com/car-listings/6aa8f13263f26ba55e0689de/cfe27ae7-7e17-45bc-81cc-309de906a405-L.avif' },
    { stock: 'T10580', vin: '2VH4YBTXXVC1CFX12', year: 2021, model: 'RAV4', trim: 'Trail', price: 21895, regularPrice: null, km: 65138, transmission: 'Automatic', photo: 'https://dev.media.autodice.com/car-listings/69bce994a5a215111b78a412/9867052d-b3f0-4f89-9140-3d269f8a3bee-L.avif' },
    { stock: 'T10629', vin: 'W076Z3K0NKTG9X6UJ', year: 2017, model: 'Sienna', trim: 'Limited', price: 19695, regularPrice: 20695, km: 157421, transmission: 'Automatic', photo: 'https://dev.media.autodice.com/car-listings/69bce9a8a5a215111b78a4c9/8fbfd397-8296-4419-aaf3-c6d67c1b9225-L.avif' },
    { stock: 'T10913', vin: 'HH9493T0D0NVVGASP', year: 2023, model: 'bZ4X', trim: 'XLE', price: 35495, regularPrice: null, km: 53947, transmission: 'Automatic', photo: 'https://dev.media.autodice.com/car-listings/69bce9d0a5a215111b78a64d/2afd4cfb-249c-44a2-8057-726e88f532e9-L.avif' },
    { stock: 'T10405', vin: 'TWV2XC8XMG0KXKXMT', year: 2020, model: 'Corolla', trim: 'XSE', price: 13295, regularPrice: null, km: 102169, transmission: 'Automatic', photo: 'https://dev.media.autodice.com/car-listings/69bce931a5a215111b78a068/d9732d02-438a-49a1-9703-c8e290850db1-L.avif' },
    { stock: 'T10434', vin: '2TYAGMC9Y5HZRTWL0', year: 2024, model: 'RAV4 Prime', trim: 'XSE', price: 42595, regularPrice: null, km: 31291, transmission: 'Automatic', photo: 'https://dev.media.autodice.com/car-listings/69bcea1aa5a215111b78a98f/b20ab880-e54b-4c39-96d0-45e878e952b6-L.avif' },
    { stock: 'T10336', vin: '3AD2U4FNSLR9639LT', year: 2022, model: 'Camry', trim: 'LE', price: 20395, regularPrice: null, km: 75937, transmission: 'Automatic', photo: 'https://dev.media.autodice.com/car-listings/69bce9dba5a215111b78a6cb/e5409c1d-8c4d-439d-b498-fdb2e46275be-L.avif' },
  ];

  var ICONS = {
    tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg>',
    gears: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 4v16M12 4v16M19 4v8H5"/></svg>',
    gauge: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 18a8 8 0 1 1 16 0"/><path d="m12 14 4-5"/></svg>',
  };

  function money(value, cents) {
    return value.toLocaleString(t.numberLocale, {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: cents ? 2 : 0,
      maximumFractionDigits: cents ? 2 : 0,
    });
  }

  function escape(value) {
    return String(value).replace(/[&<>"]/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char];
    });
  }

  function carCard(car) {
    var rebate = car.regularPrice && car.regularPrice > car.price ? car.regularPrice - car.price : 0;
    var name = car.year + ' ' + car.model;
    return (
      '<article class="car">' +
      '<div class="car__media">' +
      '<img src="' + escape(car.photo) + '" alt="Toyota ' + escape(name) + '" loading="lazy" />' +
      (rebate ? '<div class="car__rebate">' + ICONS.tag + '<span>' + t.rebate + ' ' + money(rebate, true) + '</span></div>' : '') +
      '</div>' +
      '<div class="car__body">' +
      '<div class="car__ids">' + t.vin + ' ' + escape(car.vin) + '<br />' + t.stock + ' ' + escape(car.stock) + '</div>' +
      '<p class="car__make">Toyota</p>' +
      '<p class="car__name">' + escape(name) + '</p>' +
      '<p class="car__trim">' + escape(car.trim) + '</p>' +
      '<div class="car__specs">' +
      '<span>' + ICONS.gears + (t.transmission[car.transmission] || car.transmission) + '</span>' +
      '<span>' + ICONS.gauge + car.km.toLocaleString(t.numberLocale) + ' ' + t.km + '</span>' +
      '</div>' +
      '<div class="car__price">' +
      '<div class="car__price-label">' + t.priceLabel + '</div>' +
      '<div class="car__amounts">' +
      (rebate ? '<div class="car__was">' + money(car.regularPrice) + '</div>' : '') +
      '<div class="car__amount">' + money(car.price) + '</div>' +
      '</div>' +
      '<p class="car__fine">' + t.cash + '<br />' + t.fine + '</p>' +
      '<a class="car__offer" href="#">' + t.offer + '</a>' +
      '</div>' +
      '<a class="btn btn--black" href="#">' + t.details + '</a>' +
      '</div>' +
      '</article>'
    );
  }

  // Links that lead off the demo go nowhere, and no form submits anywhere.
  document.addEventListener(
    'click',
    function (event) {
      var link = event.target.closest && event.target.closest('a[href="#"]');
      if (link) event.preventDefault();
    },
    true,
  );
  document.addEventListener(
    'submit',
    function (event) {
      event.preventDefault();
    },
    true,
  );

  function dots(container, count, onPick) {
    container.innerHTML = '';
    var buttons = [];
    for (var i = 0; i < count; i++) {
      var button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', String(i + 1));
      button.addEventListener('click', onPick.bind(null, i));
      container.appendChild(button);
      buttons.push(button);
    }
    return function (active) {
      buttons.forEach(function (button, index) {
        button.setAttribute('aria-current', String(index === active));
      });
    };
  }

  // Hero: one slide at a time, every 6 seconds, paused while the pointer is over it.
  var hero = document.querySelector('[data-hero]');
  if (hero) {
    var track = hero.querySelector('.hero__track');
    var slideCount = track.children.length;
    var current = 0;
    var timer = null;
    var markHero = dots(hero.querySelector('.dots'), slideCount, go);

    function go(index) {
      current = (index + slideCount) % slideCount;
      track.style.transform = 'translateX(' + -current * 100 + '%)';
      markHero(current);
    }
    function play() {
      clearInterval(timer);
      timer = setInterval(function () {
        go(current + 1);
      }, 6000);
    }

    hero.querySelector('.hero__arrow--prev').addEventListener('click', function () {
      go(current - 1);
      play();
    });
    hero.querySelector('.hero__arrow--next').addEventListener('click', function () {
      go(current + 1);
      play();
    });
    hero.addEventListener('mouseenter', function () {
      clearInterval(timer);
    });
    hero.addEventListener('mouseleave', play);
    go(0);
    play();
  }

  // Featured vehicles: a row that scrolls a page of cards at a time.
  var carousel = document.querySelector('[data-cars]');
  if (carousel) {
    var row = carousel.querySelector('.carousel__track');
    row.innerHTML = CARS.map(carCard).join('');

    function perPage() {
      var card = row.firstElementChild;
      return card ? Math.max(1, Math.round(row.clientWidth / card.getBoundingClientRect().width)) : 1;
    }
    function pages() {
      return Math.ceil(CARS.length / perPage());
    }
    function page() {
      var card = row.firstElementChild;
      var step = card ? card.getBoundingClientRect().width + 20 : row.clientWidth;
      return Math.round(row.scrollLeft / (step * perPage()));
    }
    function scrollToPage(index) {
      var target = row.children[Math.min(CARS.length - 1, index * perPage())];
      if (target) row.scrollTo({ left: target.offsetLeft - row.offsetLeft, behavior: 'smooth' });
    }

    var markCars = function () {};
    function buildDots() {
      markCars = dots(carousel.querySelector('.dots'), pages(), scrollToPage);
      markCars(page());
    }

    carousel.querySelector('.carousel__arrow--prev').addEventListener('click', function () {
      scrollToPage(Math.max(0, page() - 1));
    });
    carousel.querySelector('.carousel__arrow--next').addEventListener('click', function () {
      scrollToPage(page() + 1 >= pages() ? 0 : page() + 1);
    });
    row.addEventListener('scroll', function () {
      markCars(page());
    });
    window.addEventListener('resize', buildDots);
    buildDots();
  }

  // Footer hours: Sales, Service and Parts tabs.
  document.querySelectorAll('[data-hours-tab]').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('[data-hours-tab]').forEach(function (other) {
        other.setAttribute('aria-selected', String(other === tab));
      });
      document.querySelectorAll('[data-hours-panel]').forEach(function (panel) {
        panel.hidden = panel.dataset.hoursPanel !== tab.dataset.hoursTab;
      });
    });
  });

  // Back to the top, from the footer.
  var top = document.querySelector('[data-scroll-top]');
  if (top) {
    top.addEventListener('click', function (event) {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Phone menu.
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.querySelector('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }
})();
