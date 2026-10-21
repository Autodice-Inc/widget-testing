// The demo page's own behaviour: the hero slider, the featured-vehicle cards, the hours tabs and
// the phone menu. Links that would leave the demo are "#" and do nothing, and no form submits, so
// nothing reaches the dealership; Miles is the only live thing on the page.
(function () {
  var locale = document.documentElement.lang === 'fr' ? 'fr' : 'en';

  var STRINGS = {
    en: {
      label: 'Pre-Owned',
      vin: 'VIN #',
      stock: '# stock',
      priceLabel: 'Purchase Price',
      cash: 'on cash purchase',
      fine: '(GST/QST), licensing, insurance & registration not included.',
      details: 'See details',
      rebate: 'Dealer Rebate',
      km: 'KM',
      transmission: { Automatic: 'Automatic', Manual: 'Manual' },
      numberLocale: 'en-CA',
    },
    // Their French site's own wording.
    fr: {
      label: 'Occasion',
      vin: '# de série',
      stock: 'Inventaire #',
      priceLabel: "Prix d'achat",
      cash: 'en achat comptant',
      fine: '(TPS/TVQ), immatriculation, assurances & enregistrement non inclus.',
      details: 'Voir les détails',
      rebate: 'Remise concessionnaire',
      km: 'KM',
      transmission: { Automatic: 'Automatique', Manual: 'Manuelle' },
      numberLocale: 'fr-CA',
    },
  };
  var t = STRINGS[locale];

  // Nissans from the 1,000-car test inventory Spinelli's Miles has on dev, so a car on the page is
  // one Miles can talk about. Photos come from Autodice's own media CDN.
  var CARS = [
    { stock: 'T10162', vin: 'B7PB52XNN8X6AS5WZ', year: 2023, model: 'Rogue', trim: 'S', price: 22795, regularPrice: null, km: 50500, transmission: 'Automatic', photo: 'https://dev.media.autodice.com/car-listings/6aabec16dd5f1f8faac935ca/62f72fbd-22f4-4e78-baa7-2fc4e8594653-L.avif' },
    { stock: 'T10064', vin: 'DZ8MW6DF1TGLPMR53', year: 2021, model: 'Kicks', trim: 'SR', price: 16095, regularPrice: 16795, km: 77021, transmission: 'Automatic', photo: 'https://dev.media.autodice.com/car-listings/6aabec68dd5f1f8faac93654/b2951260-78e7-4714-8f12-3ec09aa8b3d7-L.avif' },
    { stock: 'T10042', vin: '2YTDEYDJLUTYL38SS', year: 2025, model: 'Kicks', trim: 'S', price: 23395, regularPrice: null, km: 25608, transmission: 'Automatic', photo: 'https://dev.media.autodice.com/car-listings/6aabec79dd5f1f8faac93681/71e2fa50-d12c-4aa1-9825-2b0aee37475f-L.avif' },
    { stock: 'T10093', vin: 'EG1CTUPZK4LHWM9NH', year: 2022, model: 'Sentra', trim: 'SR', price: 15995, regularPrice: null, km: 88939, transmission: 'Automatic', photo: 'https://dev.media.autodice.com/car-listings/6abb678806bee0a2a2ed4224/3b93e825-0f89-48ae-acc5-cc55380914be-L.avif' },
    { stock: 'T10104', vin: 'GVCYU832CX5GVVBDV', year: 2019, model: 'Pathfinder', trim: 'SL', price: 21595, regularPrice: null, km: 151044, transmission: 'Automatic', photo: 'https://dev.media.autodice.com/car-listings/6aab8885f507acc62e4801d2/0b087456-cce1-47fe-9626-1ca8b60f70c4-L.avif' },
    { stock: 'T10375', vin: 'RFA2A3358AEWL1C38', year: 2018, model: 'LEAF', trim: 'S', price: 15795, regularPrice: null, km: 127078, transmission: 'Automatic', photo: 'https://dev.media.autodice.com/car-listings/6abb61a606bee0a2a2ed3955/f4b833c8-fef4-4118-8d41-09dfc40775cd-L.avif' },
    { stock: 'T10024', vin: 'BJK1XSTTYTJR526YL', year: 2020, model: 'Altima', trim: 'SR', price: 16495, regularPrice: null, km: 98775, transmission: 'Automatic', photo: 'https://dev.media.autodice.com/car-listings/6aafa6eae25bacff934c6079/fd00afcc-fc97-495a-a3b5-7d0661120097-L.avif' },
    { stock: 'T10198', vin: 'A39LSHPWLP0HSU297', year: 2020, model: 'Rogue', trim: 'SV', price: 17495, regularPrice: null, km: 108286, transmission: 'Automatic', photo: 'https://dev.media.autodice.com/car-listings/6aabee694277da7f961ed4a5/4574c5ca-d04f-40de-8750-441fc68ed9ad-L.avif' },
  ];

  var ICONS = {
    tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg>',
    gears: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 4v16M12 4v16M19 4v8H5"/></svg>',
    gauge: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 18a8 8 0 1 1 16 0"/><path d="m12 14 4-5"/></svg>',
  };

  function money(value) {
    return value.toLocaleString(t.numberLocale, { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 });
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
      '<img src="' + escape(car.photo) + '" alt="Nissan ' + escape(name) + '" loading="lazy" />' +
      (rebate ? '<div class="car__rebate">' + ICONS.tag + t.rebate + ' ' + money(rebate) + '</div>' : '') +
      '</div>' +
      '<div class="car__body">' +
      '<span class="car__label">' + t.label + '</span>' +
      '<div class="car__ids">' + t.vin + ' ' + escape(car.vin) + '<br />' + t.stock + ' ' + escape(car.stock) + '</div>' +
      '<p class="car__make">Nissan</p>' +
      '<p class="car__name">' + escape(name) + '</p>' +
      '<p class="car__trim">' + escape(car.trim) + '</p>' +
      '<div class="car__specs">' +
      '<span>' + ICONS.gears + (t.transmission[car.transmission] || car.transmission) + '</span>' +
      '<span>' + ICONS.gauge + car.km.toLocaleString(t.numberLocale) + ' ' + t.km + '</span>' +
      '</div>' +
      '<div class="car__price">' +
      '<div class="car__price-label">' + t.priceLabel + '</div>' +
      (rebate ? '<div class="car__was">' + money(car.regularPrice) + '</div>' : '') +
      '<div class="car__amount">' + money(car.price) + '</div>' +
      '<p class="car__fine">' + t.cash + '<br />' + t.fine + '</p>' +
      '</div>' +
      '<a class="btn btn--red" href="#">' + t.details + '</a>' +
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
      markCars = dots(carousel.querySelector('.carousel__dots'), pages(), scrollToPage);
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

  // Phone menu.
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.querySelector('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }

  // About: the rest of the text on demand.
  var more = document.querySelector('.about__more');
  if (more) {
    more.addEventListener('click', function () {
      var text = more.closest('.about__text');
      var open = text.classList.toggle('is-open');
      more.textContent = open ? more.dataset.less : more.dataset.more;
    });
  }
})();
