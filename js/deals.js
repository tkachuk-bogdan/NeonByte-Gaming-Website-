const DEALS_API = 'https://www.cheapshark.com/api/1.0/deals';
const DEAL_LINK = 'https://www.cheapshark.com/redirect?dealID=';

document.addEventListener('DOMContentLoaded', () => {
  const list = document.getElementById('deals-list');
  if (!list) return;

  const form = document.getElementById('deals-form');
  const input = document.getElementById('deals-query');
  const sortSelect = document.getElementById('deals-sort');
  const topButton = document.getElementById('deals-reset');
  const statusEl = document.getElementById('deals-status');
  const searchButton = form.querySelector('button[type="submit"]');

  let deals = [];
  let loading = false;
  let currentQuery = loadSetting('nb-deals-query', '');
  sortSelect.value = loadSetting('nb-deals-sort', 'rating');

  // aborts after 10 s, throws on network or http errors
  async function fetchDeals(query) {
    const params = new URLSearchParams({ storeID: '1', pageSize: '12' });
    if (query) {
      params.set('title', query);
    } else {
      params.set('onSale', '1');
      params.set('sortBy', 'Deal Rating');
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(DEALS_API + '?' + params.toString(), { signal: controller.signal });
      if (!response.ok) throw new Error('Server answered with status ' + response.status);
      return await response.json();
    } finally {
      clearTimeout(timer);
    }
  }

  function readCache() {
    try {
      return JSON.parse(loadSetting('nb-deals-cache', 'null'));
    } catch (error) {
      return null;
    }
  }

  function showLoading(query) {
    list.setAttribute('aria-busy', 'true');
    list.innerHTML = '';
    for (let i = 0; i < 6; i++) {
      const col = createElement('div', 'col-12 col-sm-6 col-xl-4');
      col.appendChild(createElement('div', 'nb-deal-skeleton rounded-3'));
      list.appendChild(col);
    }
    statusEl.innerHTML = '<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>';
    statusEl.append(query ? 'Searching deals for “' + query + '”…' : 'Loading the best Steam deals…');
  }

  function sortedDeals() {
    const copy = deals.slice();
    switch (sortSelect.value) {
      case 'price':
        return copy.sort((a, b) => Number(a.salePrice) - Number(b.salePrice));
      case 'savings':
        return copy.sort((a, b) => Number(b.savings) - Number(a.savings));
      case 'reviews':
        return copy.sort((a, b) => Number(b.steamRatingPercent) - Number(a.steamRatingPercent));
      default:
        return copy;
    }
  }

  function createDealCard(deal) {
    const col = createElement('div', 'col-12 col-sm-6 col-xl-4');
    const card = createElement('article', 'card nb-card nb-deal h-100');

    // steam header image first, then the api thumbnail, then the placeholder
    const image = createElement('img', 'nb-deal-img');
    const sources = [deal.thumb, 'images/placeholder.svg'];
    if (deal.steamAppID) sources.unshift('https://cdn.cloudflare.steamstatic.com/steam/apps/' + deal.steamAppID + '/header.jpg');
    image.src = sources.shift();
    image.alt = deal.title + ' cover';
    image.addEventListener('error', () => {
      if (sources.length) image.src = sources.shift();
    });

    const body = createElement('div', 'card-body d-flex flex-column p-3');
    const title = createElement('h3', 'h6 card-title mb-2', deal.title);

    const savings = Math.round(Number(deal.savings));
    const prices = createElement('p', 'd-flex flex-wrap align-items-center gap-2 mb-2');
    if (savings > 0) {
      prices.appendChild(createElement('span', 'badge nb-deal-badge', '-' + savings + '%'));
      prices.appendChild(createElement('span', 'nb-deal-old', '$' + deal.normalPrice));
    }
    prices.appendChild(createElement('strong', 'nb-deal-price', Number(deal.salePrice) === 0 ? 'Free' : '$' + deal.salePrice));

    const rating = deal.steamRatingText
      ? 'Steam: ' + deal.steamRatingText + ' (' + deal.steamRatingPercent + '%)'
      : 'No Steam reviews yet';
    const reviews = createElement('p', 'small text-body-secondary mb-3', rating);

    const link = createElement('a', 'btn btn-outline-primary btn-sm mt-auto align-self-start', 'View deal');
    link.href = DEAL_LINK + encodeURIComponent(deal.dealID);
    link.target = '_blank';
    link.rel = 'noopener';
    link.setAttribute('aria-label', 'View deal for ' + deal.title + ' (opens in a new tab)');

    [title, prices, reviews, link].forEach((part) => body.appendChild(part));
    card.append(image, body);
    col.appendChild(card);
    return col;
  }

  function render() {
    list.innerHTML = '';
    list.setAttribute('aria-busy', 'false');
    sortedDeals().forEach((deal) => list.appendChild(createDealCard(deal)));
  }

  function showError(text) {
    list.setAttribute('aria-busy', 'false');
    const box = createElement('div', 'col-12');
    const alert = createElement('div', 'alert alert-danger d-flex flex-wrap align-items-center gap-3 mb-0');
    alert.setAttribute('role', 'alert');
    alert.appendChild(createElement('span', '', text));
    const retry = createElement('button', 'btn btn-sm btn-outline-danger', 'Try again');
    retry.type = 'button';
    retry.addEventListener('click', () => loadDeals(currentQuery));
    alert.appendChild(retry);
    box.appendChild(alert);
    list.prepend(box);
  }

  async function loadDeals(query) {
    if (loading) return;
    loading = true;
    currentQuery = query;
    showLoading(query);
    showButtonSpinner(searchButton);
    topButton.disabled = true;

    try {
      deals = await fetchDeals(query);
      saveSetting('nb-deals-query', query);
      saveSetting('nb-deals-cache', JSON.stringify({ query: query, savedAt: Date.now(), deals: deals }));
      render();
      if (!deals.length) {
        statusEl.textContent = 'No deals found for “' + query + '”. Try another title.';
      } else {
        statusEl.textContent = query
          ? deals.length + ' deals found for “' + query + '”.'
          : 'Top ' + deals.length + ' Steam deals right now.';
      }
    } catch (error) {
      // offline: show the last saved results for the same search
      const cache = readCache();
      if (cache && cache.query === query && cache.deals.length) {
        deals = cache.deals;
        render();
        const time = new Date(cache.savedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        statusEl.textContent = 'Showing saved results from ' + time + '.';
        showError('Could not reach the deals server.');
      } else {
        list.innerHTML = '';
        statusEl.textContent = '';
        showError('Could not load deals right now. Check your connection and try again.');
      }
      SoundFX.play('error');
    } finally {
      loading = false;
      hideButtonSpinner(searchButton);
      topButton.disabled = false;
    }
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const query = input.value.trim();
    const message = !query ? 'Type a game title to search.' : query.length < 2 ? 'Use at least 2 characters.' : '';
    if (!Validate.check(input, message)) {
      SoundFX.play('error');
      return;
    }
    input.classList.remove('is-valid');
    SoundFX.play('click');
    loadDeals(query);
  });

  topButton.addEventListener('click', () => {
    input.value = '';
    Validate.clear(form);
    SoundFX.play('click');
    loadDeals('');
  });

  sortSelect.addEventListener('change', () => {
    saveSetting('nb-deals-sort', sortSelect.value);
    if (deals.length) render();
  });

  input.value = currentQuery;
  loadDeals(currentQuery);
});
