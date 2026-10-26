/* =========================================================
   Assignment #5: Advanced JavaScript and DOM Manipulation
   Team NeonByte: Bekzat Kuatbekov & Bogdan Tkachuk | Group: SE-2511

   Contents
   1. Helpers: safe localStorage + small DOM helper
   2. Sound effects            - object with methods, no overlapping audio
   3. Async form sending       - fetch POST + success / error callbacks
   4. Day / Night theme switch - all pages
   5. Keyboard navigation      - arrow keys in the navbar (keydown + switch)
   6. Newsletter popup         - async submit, Escape closes it
   7. Greeting by time of day  - switch statement (index.html)
   8. "Read more" toggle       - style.display (about.html)
   9. Tournament explorer      - objects, arrays, loops, higher-order
                                 functions, filter with switch, fetch
                                 "Load more" (games.html)
   10. Rating stars            - querySelectorAll (games.html)

   Every feature first checks that its elements exist, so the same
   file can be loaded on every page without errors.
   ========================================================= */

/* ---------------------------------------------------------
   1. Helpers
   --------------------------------------------------------- */

// localStorage can throw in private mode, so every access is wrapped
function loadSetting(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value;
  } catch (error) {
    return fallback;
  }
}

function saveSetting(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    // not saved - the feature still works for this visit
  }
}

// Creates an element with a class list and (safe) text content
function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

// Plays a CSS animation class once (class is removed when it ends)
function playAnimation(element, className) {
  element.classList.remove(className);
  void element.offsetWidth; // restart the animation if it is already running
  element.classList.add(className);
  element.addEventListener('animationend', () => element.classList.remove(className), { once: true });
}


/* ---------------------------------------------------------
   2. Sound effects
   One Audio object per sound is cached. Before a sound starts,
   every other sound is stopped, so sounds never overlap.
   --------------------------------------------------------- */
const SoundFX = {
  enabled: loadSetting('nb-sound', 'on') === 'on',
  files: {
    click: 'sounds/click.wav',
    star: 'sounds/star.wav',
    success: 'sounds/success.wav',
    error: 'sounds/error.wav'
  },
  cache: {},

  play(name) {
    if (!this.enabled || !this.files[name]) return;

    if (!this.cache[name]) {
      this.cache[name] = new Audio(this.files[name]);
      this.cache[name].volume = 0.45;
    }

    // stop whatever is playing right now
    Object.values(this.cache).forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });

    // play() returns a Promise; browsers may block it before the first click
    this.cache[name].play().catch(() => {});
  },

  toggle() {
    this.enabled = !this.enabled;
    saveSetting('nb-sound', this.enabled ? 'on' : 'off');
    return this.enabled;
  }
};


/* ---------------------------------------------------------
   3. Async form sending with callbacks
   JSONPlaceholder is a free test REST API: it accepts a POST
   and answers with the same data plus a new "id".
   onSuccess(result) / onError(error) are callback functions
   given by the caller, so every form decides how to react.
   --------------------------------------------------------- */
const API_URL = 'https://jsonplaceholder.typicode.com/posts';

function sendFormData(url, data, onSuccess, onError) {
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify(data)
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Server answered with status ' + response.status);
      }
      return response.json();
    })
    .then((result) => onSuccess(result))
    .catch((error) => onError(error));
}


document.addEventListener('DOMContentLoaded', () => {

  /* ---------------------------------------------------------
     4. Day / Night theme switch
     Changes the data-bs-theme attribute on <html>; all colours in
     style.css are CSS variables, so the whole page follows.
     The button icon spins with style.transform.
     --------------------------------------------------------- */
  const themeButton = document.getElementById('theme-toggle');
  let themeRotation = 0;

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-bs-theme', theme);
    document.body.style.backgroundColor = ''; // reset the colour from the A4 "BG" button
    if (!themeButton) return;
    const isDay = theme === 'light';
    themeButton.textContent = isDay ? '☀️' : '🌙';
    themeButton.setAttribute('aria-pressed', String(isDay));
    themeButton.setAttribute('aria-label', isDay ? 'Switch to night theme' : 'Switch to day theme');
  }

  if (themeButton) {
    applyTheme(loadSetting('nb-theme', 'dark'));

    themeButton.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-bs-theme');
      const next = current === 'light' ? 'dark' : 'light';
      applyTheme(next);
      saveSetting('nb-theme', next);

      themeRotation += 360;
      themeButton.style.transform = `rotate(${themeRotation}deg)`;
      SoundFX.play('click');
    });
  }

  // Sound on / off button
  const soundButton = document.getElementById('sound-toggle');

  function showSoundState() {
    soundButton.textContent = SoundFX.enabled ? '🔊' : '🔇';
    soundButton.setAttribute('aria-pressed', String(SoundFX.enabled));
    soundButton.setAttribute('aria-label', SoundFX.enabled ? 'Turn sound off' : 'Turn sound on');
  }

  if (soundButton) {
    showSoundState();
    soundButton.addEventListener('click', () => {
      SoundFX.toggle();
      showSoundState();
      SoundFX.play('click'); // only audible when sound was just turned on
    });
  }


  /* ---------------------------------------------------------
     5. Keyboard navigation in the navbar
     Arrow keys move the focus between menu items, Home / End
     jump to the first / last item. A switch picks the action.
     --------------------------------------------------------- */
  const menuItems = Array.from(document.querySelectorAll('.navbar-nav .nav-link, .navbar-nav .btn'));

  menuItems.forEach((item, index) => {
    item.addEventListener('keydown', (event) => {
      let nextIndex;

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          nextIndex = (index + 1) % menuItems.length;
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          nextIndex = (index - 1 + menuItems.length) % menuItems.length;
          break;
        case 'Home':
          nextIndex = 0;
          break;
        case 'End':
          nextIndex = menuItems.length - 1;
          break;
        default:
          return; // every other key keeps its normal behaviour
      }

      event.preventDefault(); // stop the page from scrolling
      menuItems[nextIndex].focus();
    });
  });


  /* ---------------------------------------------------------
     6. Newsletter popup: async submit + Escape key
     (opening / closing on click is in main.js, Assignment 4)
     --------------------------------------------------------- */
  const popup = document.getElementById('popup-modal');
  const newsletterForm = document.getElementById('newsletter-form');
  const newsletterEmail = document.getElementById('newsletter-email');
  const newsletterMessage = document.getElementById('newsletter-message');

  if (popup && newsletterForm) {
    newsletterForm.addEventListener('submit', (event) => {
      event.preventDefault(); // no page reload

      const email = newsletterEmail.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        newsletterMessage.textContent = 'Please enter a valid email address.';
        newsletterMessage.className = 'small mt-3 mb-0 text-danger';
        playAnimation(newsletterEmail, 'nb-shake');
        SoundFX.play('error');
        return;
      }

      const submitButton = newsletterForm.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.textContent = 'Subscribing...';

      function enableButton() {
        submitButton.disabled = false;
        submitButton.textContent = 'Subscribe Now';
      }

      sendFormData(API_URL, { email: email, list: 'weekly-brackets' },
        // success callback
        () => {
          enableButton();
          newsletterMessage.textContent = `Subscribed! Weekly brackets will be sent to ${email}.`;
          newsletterMessage.className = 'small mt-3 mb-0 text-success';
          newsletterForm.reset();
          SoundFX.play('success');
          setTimeout(() => {
            document.getElementById('close-popup-btn').click();
            newsletterMessage.textContent = '';
          }, 1800);
        },
        // error callback
        () => {
          enableButton();
          newsletterMessage.textContent = 'Could not subscribe right now. Please check your connection and try again.';
          newsletterMessage.className = 'small mt-3 mb-0 text-danger';
          SoundFX.play('error');
        }
      );
    });

    // Escape closes the popup
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && popup.classList.contains('active')) {
        document.getElementById('close-popup-btn').click();
      }
    });
  }


  /* ---------------------------------------------------------
     7. Greeting by time of day (index.html)
     The day is split into four 6-hour parts: 0-5, 6-11, 12-17, 18-23.
     --------------------------------------------------------- */
  const greetingEl = document.getElementById('time-greeting');

  function getGreeting(hour) {
    switch (Math.floor(hour / 6)) {
      case 0:
        return '🌙 Late-night grind? Respect, gamer.';
      case 1:
        return '☀️ Good morning, gamer! Warm-up scrims start at 10:00.';
      case 2:
        return '🎮 Good afternoon! Perfect time for a ranked match.';
      case 3:
        return '🌆 Good evening! Tonight\'s LAN lobby is open.';
      default:
        return '🎮 Welcome to Gaming Club!';
    }
  }

  if (greetingEl) {
    greetingEl.textContent = getGreeting(new Date().getHours());
    playAnimation(greetingEl, 'nb-enter');
  }


  /* ---------------------------------------------------------
     8. "Read more" toggle (about.html)
     The extra text is hidden with style.display = 'none' when the
     page loads (without JavaScript it simply stays visible).
     --------------------------------------------------------- */
  const readMoreButton = document.getElementById('read-more-btn');
  const moreText = document.getElementById('club-story-more');

  if (readMoreButton && moreText) {
    moreText.style.display = 'none';

    readMoreButton.addEventListener('click', () => {
      const isHidden = moreText.style.display === 'none';
      moreText.style.display = isHidden ? 'block' : 'none';
      readMoreButton.textContent = isHidden ? 'Read less' : 'Read more';
      readMoreButton.setAttribute('aria-expanded', String(isHidden));
      if (isHidden) playAnimation(moreText, 'nb-enter');
      SoundFX.play('click');
    });
  }


  /* ---------------------------------------------------------
     9. Tournament explorer (games.html)
     --------------------------------------------------------- */
  const tournamentList = document.getElementById('tournament-list');

  if (tournamentList) {
    const summaryEl = document.getElementById('tournament-summary');
    const filterButtons = document.querySelectorAll('#tournament-filters [data-filter]');
    const loadMoreButton = document.getElementById('load-more-btn');
    const loadStatus = document.getElementById('load-more-status');

    const CATEGORY_LABELS = {
      shooter: 'Tactical Shooter',
      moba: 'MOBA',
      racing: 'Racing Sim',
      rpg: 'RPG & Co-op'
    };

    // Starting data: an array of plain objects
    const startingTournaments = [
      { id: 1, title: 'NeonByte Clash', category: 'shooter', format: '5v5 Single Elimination', prize: 50000, date: '2026-11-07', slots: 16, registered: 12 },
      { id: 2, title: 'Grid Rivals Cup', category: 'racing', format: 'Time Trial + Final Race', prize: 30000, date: '2026-11-14', slots: 24, registered: 9 },
      { id: 3, title: 'Guild Wars Night', category: 'rpg', format: 'Cooperative Boss Run', prize: 20000, date: '2026-11-21', slots: 10, registered: 10 },
      { id: 4, title: 'Mid Lane Masters', category: 'moba', format: '5v5 Double Elimination', prize: 60000, date: '2026-11-28', slots: 8, registered: 5 }
    ];

    // Turns plain data into a tournament object with its own methods
    function createTournament(data) {
      return {
        ...data,
        getCategoryLabel() {
          return CATEGORY_LABELS[this.category] || 'Other';
        },
        formatPrize() {
          return this.prize.toLocaleString('en-US') + ' KZT';
        },
        formatDate() {
          return new Date(this.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        },
        getFreeSlots() {
          return this.slots - this.registered;
        },
        isFull() {
          return this.registered >= this.slots;
        },
        join() {
          if (this.isFull() || this.joined) return false; // a squad can join only once
          this.registered += 1;
          this.joined = true;
          return true;
        }
      };
    }

    let tournaments = startingTournaments.map(createTournament); // map = higher-order function
    let currentFilter = 'all';

    // Decides if a tournament is shown for the chosen filter button
    function matchesFilter(tournament, filter) {
      switch (filter) {
        case 'all':
          return true;
        case 'open':
          return !tournament.isFull();
        case 'big-prize':
          return tournament.prize >= 50000;
        case 'shooter':
        case 'moba':
        case 'racing':
        case 'rpg':
          return tournament.category === filter;
        default:
          return true;
      }
    }

    // Builds one Bootstrap card from a tournament object
    function createTournamentCard(tournament, position) {
      const column = createElement('div', 'col-12 col-sm-6 col-xl-4');
      const card = createElement('article', 'card nb-card nb-tour-card h-100 nb-enter');
      card.style.animationDelay = `${position * 80}ms`; // cards appear one after another
      if (tournament.isFull()) card.classList.add('is-full');

      const body = createElement('div', 'card-body d-flex flex-column p-3');
      const badge = createElement('span', 'badge text-bg-primary align-self-start mb-2', tournament.getCategoryLabel());
      const title = createElement('h3', 'card-title h5 mb-1', tournament.title);
      const format = createElement('p', 'card-text small text-body-secondary mb-2', `${tournament.format} · ${tournament.formatDate()}`);
      const prize = createElement('p', 'nb-prize mb-2', `Prize pool: ${tournament.formatPrize()}`);

      const progress = createElement('div', 'progress mb-1');
      progress.setAttribute('role', 'progressbar');
      progress.setAttribute('aria-label', `${tournament.title} squads registered`);
      progress.setAttribute('aria-valuemin', '0');
      progress.setAttribute('aria-valuemax', String(tournament.slots));
      progress.setAttribute('aria-valuenow', String(tournament.registered));
      const bar = createElement('div', 'progress-bar');
      bar.style.width = `${Math.round((tournament.registered / tournament.slots) * 100)}%`;
      progress.appendChild(bar);

      const slotsText = tournament.isFull()
        ? `${tournament.registered}/${tournament.slots} squads · bracket is full`
        : `${tournament.registered}/${tournament.slots} squads · ${tournament.getFreeSlots()} slots left`;
      const slots = createElement('p', 'small text-body-secondary mb-3', slotsText);

      // Button text depends on the object's state
      let buttonText = 'Join tournament';
      if (tournament.joined) buttonText = 'Joined ✓';
      else if (tournament.isFull()) buttonText = 'Full';

      const joinButton = createElement('button', 'btn btn-sm mt-auto align-self-start', buttonText);
      joinButton.type = 'button';
      joinButton.classList.add(tournament.joined ? 'btn-success' : tournament.isFull() ? 'btn-outline-light' : 'btn-primary');
      joinButton.disabled = tournament.isFull() || tournament.joined;
      joinButton.dataset.join = tournament.id;

      [badge, title, format, prize, progress, slots, joinButton].forEach((part) => body.appendChild(part));
      card.appendChild(body);
      column.appendChild(card);
      return column;
    }

    // Draws the list for the current filter
    function renderTournaments() {
      const visible = tournaments.filter((t) => matchesFilter(t, currentFilter)); // filter = higher-order function

      tournamentList.innerHTML = '';
      for (let i = 0; i < visible.length; i++) {
        tournamentList.appendChild(createTournamentCard(visible[i], i));
      }

      if (visible.length === 0) {
        tournamentList.appendChild(createElement('p', 'text-body-secondary mb-0', 'No tournaments match this filter yet.'));
      }

      const totalPrize = visible.reduce((sum, t) => sum + t.prize, 0); // reduce = higher-order function
      summaryEl.textContent = `Showing ${visible.length} of ${tournaments.length} tournaments · Total prize pool: ${totalPrize.toLocaleString('en-US')} KZT`;
    }

    // Filter buttons
    filterButtons.forEach((button) => {
      button.addEventListener('click', () => {
        currentFilter = button.dataset.filter;
        filterButtons.forEach((other) => {
          const isActive = other === button;
          other.classList.toggle('active', isActive);
          other.setAttribute('aria-pressed', String(isActive));
        });
        renderTournaments();
        SoundFX.play('click');
      });
    });

    // "Join tournament" buttons - one listener on the list (event delegation)
    tournamentList.addEventListener('click', (event) => {
      const button = event.target.closest('[data-join]');
      if (!button) return;

      const tournament = tournaments.find((t) => t.id === Number(button.dataset.join));
      if (tournament && tournament.join()) {
        renderTournaments();
        loadStatus.textContent = `Your squad joined ${tournament.title}! ${tournament.getFreeSlots()} slots left.`;
        SoundFX.play('success');
      }
    });

    // "Load more" button: fetch more tournaments from a JSON file without reloading
    loadMoreButton.addEventListener('click', () => {
      loadMoreButton.disabled = true;
      loadMoreButton.textContent = 'Loading...';

      fetch('data/tournaments.json')
        .then((response) => {
          if (!response.ok) throw new Error('HTTP ' + response.status);
          return response.json();
        })
        .then((items) => {
          const newTournaments = items
            .filter((item) => !tournaments.some((t) => t.id === item.id)) // skip ones we already have
            .map(createTournament);
          tournaments = tournaments.concat(newTournaments);
          renderTournaments();
          loadStatus.textContent = `${newTournaments.length} more tournaments loaded.`;
          loadMoreButton.textContent = 'All tournaments loaded';
          SoundFX.play('success');
        })
        .catch(() => {
          loadStatus.textContent = 'Could not load more tournaments. Open the site from GitHub Pages or a local server.';
          loadMoreButton.disabled = false;
          loadMoreButton.textContent = 'Try again';
          SoundFX.play('error');
        });
    });

    renderTournaments();
  }


  /* ---------------------------------------------------------
     10. Rating stars (games.html)
     querySelectorAll selects all five stars; hovering previews a
     rating, clicking saves it and updates the message.
     --------------------------------------------------------- */
  const stars = document.querySelectorAll('.nb-star');
  const starsBox = document.querySelector('.nb-stars');
  const ratingMessage = document.getElementById('rating-message');

  if (stars.length > 0 && ratingMessage) {
    const RATING_TEXT = [
      '',
      'Ouch! Tell us what to fix.',
      'Not great, we will improve.',
      'Decent. Thanks for the feedback!',
      'Great! See you at the next cup.',
      'Legendary! GG WP 🏆'
    ];
    let currentRating = Number(loadSetting('nb-rating', '0'));

    // Colours the first "value" stars
    function paintStars(value) {
      for (let i = 0; i < stars.length; i++) {
        stars[i].classList.toggle('is-on', i < value);
      }
    }

    function setRating(value, clickedStar) {
      currentRating = value;
      paintStars(value);
      stars.forEach((star) => {
        star.setAttribute('aria-checked', String(Number(star.dataset.value) === value));
      });
      ratingMessage.innerHTML = `You rated us <strong>${value}/5</strong>. ${RATING_TEXT[value]}`;
      saveSetting('nb-rating', String(value));
      if (clickedStar) {
        playAnimation(clickedStar, 'nb-pop');
        SoundFX.play('star');
      }
    }

    stars.forEach((star) => {
      const value = Number(star.dataset.value);
      star.addEventListener('click', () => setRating(value, star));
      star.addEventListener('mouseenter', () => paintStars(value));
    });
    starsBox.addEventListener('mouseleave', () => paintStars(currentRating));

    if (currentRating > 0) setRating(currentRating); // show the saved rating
  }

});
