/* assignment 6: jquery */

function showToast(message, type) {
  let $box = $('#nb-toasts');
  if (!$box.length) {
    $box = $('<div id="nb-toasts" class="nb-toasts" aria-live="polite"></div>').appendTo('body');
  }

  const isError = type === 'error';
  const $toast = $('<div class="nb-toast" role="status"></div>').addClass(isError ? 'nb-toast-error' : 'nb-toast-success');
  $('<span class="nb-toast-icon" aria-hidden="true"></span>').text(isError ? '✕' : '✓').appendTo($toast);
  $('<span></span>').text(message).appendTo($toast);

  $toast.hide().appendTo($box).fadeIn(250).delay(2800).fadeOut(600, function () {
    $(this).remove();
  });
}

function showButtonSpinner(button) {
  const $button = $(button);
  $button.data('label', $button.html());
  $button.prop('disabled', true).attr('aria-busy', 'true')
    .html('<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Please wait…');
}

function hideButtonSpinner(button) {
  const $button = $(button);
  $button.prop('disabled', false).removeAttr('aria-busy').html($button.data('label'));
}

function isInView($element, extra) {
  const margin = extra || 0;
  const top = $element.offset().top;
  const viewTop = $(window).scrollTop();
  const viewBottom = viewTop + $(window).height();
  return top < viewBottom + margin && top + $element.outerHeight() > viewTop - margin;
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtml(text) {
  return $('<div>').text(text).html();
}

function highlightText(text, query) {
  if (!query) return escapeHtml(text);
  const parts = text.split(new RegExp('(' + escapeRegExp(query) + ')', 'gi'));
  return parts.map(function (part, index) {
    return index % 2 ? '<mark class="nb-highlight">' + escapeHtml(part) + '</mark>' : escapeHtml(part);
  }).join('');
}


$(document).ready(function () {
  console.log('jQuery is ready!');

  initScrollProgress();
  initFaqSearch();
  initCounters();
  initCopyButtons();
  initLazyImages();
});


function initScrollProgress() {
  const $bar = $('<div class="nb-progress" aria-hidden="true"><div class="nb-progress-fill"></div></div>');
  $('body').prepend($bar);
  const $fill = $bar.find('.nb-progress-fill');

  function update() {
    const maxScroll = $(document).height() - $(window).height();
    const percent = maxScroll > 0 ? ($(window).scrollTop() / maxScroll) * 100 : 0;
    $fill.css('width', Math.min(percent, 100) + '%');
  }

  $(window).on('scroll resize', update);
  update();
}


function initFaqSearch() {
  const $input = $('#faq-search');
  if (!$input.length) return;

  const $items = $('.custom-accordion-item');
  const $suggestions = $('#faq-suggestions');
  const $count = $('#faq-count');
  const $empty = $('#faq-empty');
  let lastQuery = null;
  let activeIndex = -1;

  $items.find('.custom-accordion-header, .custom-accordion-body p').each(function () {
    $(this).data('original', $(this).text());
  });

  function openItem($item) {
    const $body = $item.find('.custom-accordion-body');
    $item.addClass('active').data('openedBySearch', true);
    $body.css('max-height', $body.prop('scrollHeight') + 'px');
  }

  function closeSearchOpened() {
    $items.each(function () {
      const $item = $(this);
      if ($item.data('openedBySearch')) {
        $item.removeClass('active').data('openedBySearch', false);
        $item.find('.custom-accordion-body').css('max-height', '');
      }
    });
  }

  function runSearch() {
    const query = $input.val().trim();
    if (query === lastQuery) return;
    lastQuery = query;
    const lower = query.toLowerCase();

    $items.find('.custom-accordion-header, .custom-accordion-body p').each(function () {
      $(this).html('<span>' + highlightText($(this).data('original'), query) + '</span>');
    });

    const $matches = $items.filter(function () {
      return $(this).text().toLowerCase().indexOf(lower) !== -1;
    });

    $items.hide();
    $matches.show();
    closeSearchOpened();

    if (query) {
      $matches.each(function () {
        openItem($(this));
      });
      $count.text($matches.length + ' of ' + $items.length + ' questions match “' + query + '”');
    } else {
      $count.text('');
    }

    $empty.toggle($matches.length === 0);
    showSuggestions(query);
  }

  function showSuggestions(query) {
    $suggestions.empty();
    activeIndex = -1;

    if (!query) {
      hideSuggestions();
      return;
    }

    const lower = query.toLowerCase();
    $items.each(function () {
      const question = $(this).find('.custom-accordion-header').data('original');
      if (question.toLowerCase().indexOf(lower) === -1) return;
      $('<li class="nb-suggestion" role="option"></li>')
        .html(highlightText(question, query))
        .attr('data-value', question)
        .appendTo($suggestions);
    });

    if ($suggestions.children().length) {
      $suggestions.show();
      $input.attr('aria-expanded', 'true');
    } else {
      hideSuggestions();
    }
  }

  function hideSuggestions() {
    $suggestions.hide();
    $input.attr('aria-expanded', 'false');
    activeIndex = -1;
  }

  function chooseSuggestion($option) {
    $input.val($option.attr('data-value'));
    runSearch();
    hideSuggestions();
  }

  function moveActive(step) {
    const $options = $suggestions.children();
    if (!$options.length) return;
    activeIndex = (activeIndex + step + $options.length) % $options.length;
    $options.removeClass('active').attr('aria-selected', 'false');
    $options.eq(activeIndex).addClass('active').attr('aria-selected', 'true');
  }

  $input.on('keyup input', function (event) {
    if (['ArrowUp', 'ArrowDown', 'Enter', 'Escape'].indexOf(event.key) !== -1) return;
    runSearch();
  });

  $input.on('keydown', function (event) {
    if (event.key === 'ArrowDown') { event.preventDefault(); moveActive(1); }
    if (event.key === 'ArrowUp') { event.preventDefault(); moveActive(-1); }
    if (event.key === 'Escape') hideSuggestions();
    if (event.key === 'Enter') {
      event.preventDefault();
      const $active = $suggestions.children('.active');
      if ($active.length) chooseSuggestion($active);
      else hideSuggestions();
    }
  });

  $input.on('focus', function () {
    showSuggestions($input.val().trim());
  });

  $input.on('blur', function () {
    setTimeout(hideSuggestions, 150);
  });

  $suggestions.on('mousedown', '.nb-suggestion', function (event) {
    event.preventDefault();
    chooseSuggestion($(this));
  });
}


function initCounters() {
  const $counters = $('.nb-counter');
  if (!$counters.length) return;

  function startVisible() {
    $counters.each(function () {
      const $counter = $(this);
      if ($counter.data('started') || !isInView($counter)) return;
      $counter.data('started', true);

      const target = Number($counter.data('target'));
      const suffix = $counter.data('suffix') || '';

      $({ value: 0 }).animate({ value: target }, {
        duration: 2000,
        easing: 'swing',
        step: function (now) {
          $counter.text(Math.floor(now).toLocaleString('en-US') + suffix);
        },
        complete: function () {
          $counter.text(target.toLocaleString('en-US') + suffix);
        }
      });
    });
  }

  $(window).on('scroll resize', startVisible);
  startVisible();
}


function initCopyButtons() {
  const copyIcon = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5 15V6a2 2 0 0 1 2-2h8" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
  const checkIcon = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  $('.nb-copy-btn').each(function () {
    $(this).html(copyIcon + '<span class="nb-copy-tip" role="status">Copied to clipboard!</span>');
  });

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    const $temp = $('<textarea class="visually-hidden"></textarea>').val(text).appendTo('body');
    $temp.trigger('select');
    const ok = document.execCommand('copy');
    $temp.remove();
    return ok ? Promise.resolve() : Promise.reject(new Error('copy failed'));
  }

  $('.nb-copy-btn').on('click', function () {
    const $button = $(this);
    const text = $($button.data('copy-target')).text().trim();

    copyText(text).then(function () {
      $button.addClass('copied').find('svg').replaceWith(checkIcon);
      $button.find('.nb-copy-tip').stop(true, true).fadeIn(150);
      SoundFX.play('success');

      clearTimeout($button.data('timer'));
      $button.data('timer', setTimeout(function () {
        $button.removeClass('copied').find('svg').replaceWith(copyIcon);
        $button.find('.nb-copy-tip').fadeOut(300);
      }, 2000));
    }).catch(function () {
      showToast('Could not copy. Select the text and press Ctrl+C.', 'error');
    });
  });

  $('.nb-copy-text').on('copy', function () {
    showToast('Copied to clipboard: ' + $(this).text().trim());
  });
}


function initLazyImages() {
  function loadVisible() {
    $('img.lazy[data-src]').each(function () {
      const $image = $(this);
      if (!isInView($image, 200)) return;

      $image.one('load', function () {
        $image.addClass('is-loaded');
      });
      $image.attr('src', $image.attr('data-src')).removeAttr('data-src');
    });
  }

  $(window).on('scroll resize', loadVisible);
  loadVisible();
}
