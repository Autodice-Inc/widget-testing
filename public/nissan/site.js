// The demo page's own behaviour: the hero slider, the featured-vehicle cards, the hours tabs and
// the phone menu. Links that would leave the demo are "#" and do nothing, and no form submits, so
// nothing reaches the dealership; Miles is the only live thing on the page.
(function () {
  var locale = document.documentElement.lang === 'fr' ? 'fr' : 'en';

  var STRINGS = {
    en: {
      label: 'Pre-Owned',
      labelNew: 'New',
      title: 'Featured Vehicles',
      callForPrice: 'Call for price',
      stock: '# stock',
      priceLabel: 'Purchase Price',
      cash: 'on cash purchase',
      fine: '(GST/QST), licensing, insurance & registration not included.',
      details: 'See details',
      km: 'KM',
      numberLocale: 'en-CA',
    },
    // Their French site's own wording.
    fr: {
      label: 'Occasion',
      labelNew: 'Neuf',
      title: 'Véhicules en vedette',
      callForPrice: 'Appelez-nous',
      stock: 'Inventaire #',
      priceLabel: "Prix d'achat",
      cash: 'en achat comptant',
      fine: '(TPS/TVQ), immatriculation, assurances & enregistrement non inclus.',
      details: 'Voir les détails',
      km: 'KM',
      numberLocale: 'fr-CA',
    },
  };
  var t = STRINGS[locale];

  // The logged-in dealership's own cars, which /src/spinelli.ts hands over once they've loaded
  // (window.showFeaturedCars), so a car on the page is one Miles can talk about.
  var CARS = [];

  var ICONS = {
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
    var name = [car.year, car.model].filter(Boolean).join(' ');
    var isNew = car.condition === 'new' || car.condition === 'demo';
    var hasPrice = typeof car.price === 'number';
    return (
      '<article class="car">' +
      '<div class="car__media">' +
      (car.photo ? '<img src="' + escape(car.photo) + '" alt="' + escape(car.make + ' ' + name) + '" loading="lazy" />' : '') +
      '</div>' +
      '<div class="car__body">' +
      '<span class="car__label">' + (isNew ? t.labelNew : t.label) + '</span>' +
      '<div class="car__ids">' + t.stock + ' ' + escape(car.stock) + '</div>' +
      '<p class="car__make">' + escape(car.make) + '</p>' +
      '<p class="car__name">' + escape(name) + '</p>' +
      '<p class="car__trim">' + escape(car.trim || '') + '</p>' +
      '<div class="car__specs">' +
      (typeof car.km === 'number' ? '<span>' + ICONS.gauge + car.km.toLocaleString(t.numberLocale) + ' ' + t.km + '</span>' : '') +
      '</div>' +
      '<div class="car__price">' +
      '<div class="car__price-label">' + t.priceLabel + '</div>' +
      '<div class="car__amount">' + (hasPrice ? money(car.price) : t.callForPrice) + '</div>' +
      (hasPrice ? '<p class="car__fine">' + t.cash + '<br />' + t.fine + '</p>' : '') +
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

  // Featured vehicles: a row that scrolls a page of cards at a time. It stays hidden until the
  // dealership's cars arrive, and keeps the page's "pre-owned" title only when they're all used.
  var carousel = document.querySelector('[data-cars]');
  if (carousel) {
    var row = carousel.querySelector('.carousel__track');
    var section = carousel.closest('.section');
    section.hidden = true;

    window.showFeaturedCars = function (cars, usedOnly) {
      CARS = cars;
      row.innerHTML = CARS.map(carCard).join('');
      if (!usedOnly) section.querySelector('.section__title').textContent = t.title;
      section.hidden = false;
      buildDots();
    };

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
