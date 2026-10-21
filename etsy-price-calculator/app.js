/*
 * StoreOpsCo Etsy price calculator: the page.
 *
 * Reads the form, runs Calc.calculate on every keystroke and updates the
 * result. Inputs are saved in this browser (localStorage) when allowed;
 * the page works the same when storage is blocked.
 */
(function () {
  'use strict';

  var Calc = window.Calc;
  var CONFIG = window.CONFIG || {};
  var STORAGE_KEY = 'storeopsco-price-calculator-v1';
  var MINUS = '−';

  var PRODUCT_FIELDS = ['laborMinutes', 'hourlyRate', 'packaging', 'shippingCost', 'overhead', 'currentPrice'];
  var SETTING_FIELDS = Object.keys(Calc.DEFAULT_SETTINGS);

  var EXAMPLE = {
    productName: 'Lavender wax melts',
    lines: [
      { name: 'Soy wax (g)', packPrice: '35', packQty: '4500', used: '70' },
      { name: 'Lavender oil (ml)', packPrice: '28', packQty: '450', used: '5' },
      { name: 'Clamshell', packPrice: '30', packQty: '50', used: '1' }
    ],
    fields: { laborMinutes: '10', hourlyRate: '20', packaging: '0.80', shippingCost: '4.50', overhead: '0.30', currentPrice: '' }
  };

  var EMPTY_LINE = { name: '', packPrice: '', packQty: '', used: '' };

  // ---------- small helpers ----------

  function $(id) { return document.getElementById(id); }

  function copy(value) { return JSON.parse(JSON.stringify(value)); }

  function defaultSettings() {
    var out = {};
    SETTING_FIELDS.forEach(function (key) { out[key] = String(Calc.DEFAULT_SETTINGS[key]); });
    return out;
  }

  function exampleState() {
    var fields = copy(EXAMPLE.fields);
    var settings = defaultSettings();
    Object.keys(settings).forEach(function (key) { fields[key] = settings[key]; });
    return {
      v: 1,
      currency: '$',
      isExample: true,
      settingsOpen: true,
      productName: EXAMPLE.productName,
      lines: copy(EXAMPLE.lines),
      fields: fields
    };
  }

  /*
   * Turns what the seller typed into a number.
   * Accepts "." or "," as the decimal mark, and ignores spaces and a typed
   * currency or % sign. Returns { value, error }; value is 0 when empty or bad.
   */
  function parseNumber(raw) {
    var s = String(raw == null ? '' : raw).trim();
    if (s === '') return { value: 0, error: null, empty: true };
    s = s.replace(/[\s$£€%]/g, '').replace(/−/g, '-');
    if (s.indexOf('.') !== -1 && s.indexOf(',') !== -1) {
      s = s.replace(/,/g, ''); // "1,234.50": the comma is a thousands separator
    } else if ((s.match(/,/g) || []).length > 1) {
      s = s.replace(/,/g, ''); // "1,234,567"
    } else {
      s = s.replace(',', '.'); // "2,50" means 2.50
    }
    if (s === '' || s === '-' || !/^-?(\d+\.?\d*|\.\d+)$/.test(s)) {
      return { value: 0, error: 'Enter a number, like 12.50' };
    }
    var n = parseFloat(s);
    if (n < 0) return { value: 0, error: 'Enter 0 or more' };
    return { value: n, error: null };
  }

  function money(value, opts) {
    opts = opts || {};
    var rounded = Calc.roundTo(value, 2);
    if (Object.is(rounded, -0)) rounded = 0;
    var text = state.currency + Math.abs(rounded).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    if (rounded < 0) return MINUS + text;
    if (opts.sign && rounded > 0) return '+' + text;
    return text;
  }

  function percent(value) {
    var rounded = Calc.roundTo(value, 1);
    if (Object.is(rounded, -0)) rounded = 0;
    var text = Math.abs(rounded).toFixed(1) + '%';
    return rounded < 0 ? MINUS + text : text;
  }

  // "30" not "30.0" for the margin target as the seller typed it.
  function plainPercent(value) {
    return String(Calc.roundTo(value, 1)) + '%';
  }

  // ---------- storage (never required) ----------

  function load() {
    try {
      var saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
      if (saved && saved.v === 1 && Array.isArray(saved.lines) && saved.fields) {
        var base = exampleState();
        base.currency = ['$', '£', '€'].indexOf(saved.currency) !== -1 ? saved.currency : '$';
        base.isExample = !!saved.isExample;
        base.settingsOpen = saved.settingsOpen !== false;
        base.productName = String(saved.productName || '');
        base.lines = saved.lines.map(function (line) {
          return {
            name: String(line.name || ''),
            packPrice: String(line.packPrice || ''),
            packQty: String(line.packQty || ''),
            used: String(line.used || '')
          };
        });
        PRODUCT_FIELDS.concat(SETTING_FIELDS).forEach(function (key) {
          if (typeof saved.fields[key] === 'string') base.fields[key] = saved.fields[key];
        });
        return base;
      }
    } catch (e) { /* storage blocked or bad data: start from the example */ }
    return exampleState();
  }

  function save() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) { /* storage blocked: the page still works, it just won't remember */ }
  }

  var state = load();

  // ---------- field messages ----------

  function setFieldMessage(input, message, kind) {
    var id = input.id + '-msg';
    var msg = $(id);
    var wrap = input.closest('.input-wrap');
    var describedBy = (input.getAttribute('aria-describedby') || '').split(' ').filter(function (x) {
      return x && x !== id;
    });

    if (message) {
      if (!msg) {
        msg = document.createElement('p');
        msg.id = id;
        msg.className = 'field-msg';
        wrap.parentNode.insertBefore(msg, wrap.nextSibling);
      }
      msg.textContent = message;
      msg.classList.toggle('field-msg-warn', kind === 'warn');
      describedBy.push(id);
    } else if (msg) {
      msg.parentNode.removeChild(msg);
    }

    if (message && kind !== 'warn') input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
    wrap.classList.toggle('has-error', !!message && kind !== 'warn');
    wrap.classList.toggle('has-warn', !!message && kind === 'warn');
    if (describedBy.length) input.setAttribute('aria-describedby', describedBy.join(' '));
    else input.removeAttribute('aria-describedby');
  }

  // Parses one input, shows any message beside it and returns the number.
  function readNumber(input) {
    var parsed = parseNumber(input.value);
    setFieldMessage(input, parsed.error);
    return parsed.value;
  }

  // ---------- material lines ----------

  var linesEl = $('material-lines');
  var lineCounter = 0;

  function lineField(uid, key, label, value, opts) {
    var id = 'm' + uid + '-' + key;
    var html = '<div class="field field-' + key + '">' +
      '<label for="' + id + '">' + label + '</label>' +
      '<div class="input-wrap">' +
      (opts.currency ? '<span class="affix prefix" data-cur aria-hidden="true">' + escapeHtml(state.currency) + '</span>' : '') +
      '<input id="' + id + '" data-key="' + key + '" type="text"' +
      (opts.text ? ' maxlength="60"' : ' inputmode="decimal"') +
      (opts.placeholder ? ' placeholder="' + opts.placeholder + '"' : '') +
      ' value="' + escapeHtml(value) + '">' +
      '</div></div>';
    return html;
  }

  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function renderLines() {
    linesEl.innerHTML = '';
    state.lines.forEach(function (line, index) {
      var uid = ++lineCounter;
      var el = document.createElement('div');
      el.className = 'mline';
      el.setAttribute('role', 'group');
      el.setAttribute('aria-labelledby', 'm' + uid + '-title');
      el.dataset.index = String(index);
      el.innerHTML =
        '<div class="mline-head">' +
          '<span class="mline-title" id="m' + uid + '-title">Material ' + (index + 1) + '</span>' +
          '<span class="mline-cost" id="m' + uid + '-cost"></span>' +
          '<button type="button" class="icon-btn" data-remove aria-label="Remove material ' + (index + 1) + '">' +
            '<span aria-hidden="true">×</span></button>' +
        '</div>' +
        lineField(uid, 'name', 'Name', line.name, { text: true, placeholder: 'e.g. Soy wax' }) +
        '<div class="mline-numbers">' +
          lineField(uid, 'packPrice', 'Pack price', line.packPrice, { currency: true }) +
          lineField(uid, 'packQty', 'Pack quantity', line.packQty, {}) +
          lineField(uid, 'used', 'Amount used', line.used, {}) +
        '</div>';
      linesEl.appendChild(el);
    });
  }

  linesEl.addEventListener('input', function (event) {
    var input = event.target;
    var row = input.closest('.mline');
    if (!row || !input.dataset.key) return;
    state.lines[Number(row.dataset.index)][input.dataset.key] = input.value;
    update();
  });

  linesEl.addEventListener('click', function (event) {
    var button = event.target.closest('[data-remove]');
    if (!button) return;
    var index = Number(button.closest('.mline').dataset.index);
    state.lines.splice(index, 1);
    if (state.lines.length === 0) state.lines.push(copy(EMPTY_LINE));
    renderLines();
    update();
    // Keep keyboard focus somewhere sensible after the row disappears.
    var rows = linesEl.querySelectorAll('.mline');
    var next = rows[Math.min(index, rows.length - 1)];
    (next ? next.querySelector('input') : $('add-line')).focus();
  });

  $('add-line').addEventListener('click', function () {
    state.lines.push(copy(EMPTY_LINE));
    renderLines();
    update();
    var rows = linesEl.querySelectorAll('.mline');
    rows[rows.length - 1].querySelector('input').focus();
  });

  // ---------- plain fields ----------

  function fillForm() {
    $('productName').value = state.productName;
    $('currency').value = state.currency;
    PRODUCT_FIELDS.concat(SETTING_FIELDS).forEach(function (key) {
      $(key).value = state.fields[key] || '';
    });
    $('settings').open = state.settingsOpen;
    renderLines();
  }

  $('calc-form').addEventListener('input', function (event) {
    var input = event.target;
    if (input.id === 'productName') state.productName = input.value;
    else if (input.id === 'currency') state.currency = input.value;
    else if (state.fields.hasOwnProperty(input.id)) state.fields[input.id] = input.value;
    else return;
    update();
  });
  // Some older browsers only fire "change" for select boxes.
  $('currency').addEventListener('change', function (event) {
    state.currency = event.target.value;
    update();
  });

  $('calc-form').addEventListener('submit', function (event) { event.preventDefault(); });

  $('settings').addEventListener('toggle', function () {
    state.settingsOpen = $('settings').open;
    save();
  });

  $('reset-settings').addEventListener('click', function () {
    var settings = defaultSettings();
    SETTING_FIELDS.forEach(function (key) {
      state.fields[key] = settings[key];
      $(key).value = settings[key];
    });
    update();
  });

  function productHasData() {
    if (state.productName.trim()) return true;
    if (PRODUCT_FIELDS.some(function (key) { return String(state.fields[key] || '').trim(); })) return true;
    return state.lines.some(function (line) {
      return ['name', 'packPrice', 'packQty', 'used'].some(function (key) { return String(line[key]).trim(); });
    });
  }

  $('example-toggle').addEventListener('click', function () {
    if (state.isExample) {
      state.isExample = false;
      state.productName = '';
      state.lines = [copy(EMPTY_LINE)];
      PRODUCT_FIELDS.forEach(function (key) { state.fields[key] = ''; });
    } else {
      if (productHasData() && !window.confirm('Replace your product with the wax melt example? Your settings stay as they are.')) return;
      state.isExample = true;
      state.productName = EXAMPLE.productName;
      state.lines = copy(EXAMPLE.lines);
      PRODUCT_FIELDS.forEach(function (key) { state.fields[key] = EXAMPLE.fields[key]; });
    }
    fillForm();
    update();
    var first = linesEl.querySelector('input');
    if (first && !state.isExample) first.focus();
  });

  // ---------- the result ----------

  function collectInputs() {
    var inputs = { materialLines: [] };

    Array.prototype.forEach.call(linesEl.querySelectorAll('.mline'), function (row) {
      var get = function (key) { return row.querySelector('[data-key="' + key + '"]'); };
      var line = {
        name: get('name').value,
        packPrice: readNumber(get('packPrice')),
        packQty: readNumber(get('packQty')),
        used: readNumber(get('used'))
      };
      // A line with something typed in it but no pack quantity costs 0: say why.
      var qtyInput = get('packQty');
      var hasData = line.name.trim() || line.packPrice > 0 || line.used > 0;
      if (!qtyInput.getAttribute('aria-invalid') && line.packQty === 0 && hasData) {
        setFieldMessage(qtyInput, 'Add a pack quantity', 'warn');
      }
      inputs.materialLines.push(line);
    });

    PRODUCT_FIELDS.concat(SETTING_FIELDS).forEach(function (key) {
      inputs[key] = readNumber($(key));
    });
    return inputs;
  }

  function setText(id, text) { $(id).textContent = text; }

  function renderReceipt(r) {
    var receiptEl = $('receipt');
    receiptEl.innerHTML = '';

    if (!r.receipt || r.recommendedPrice <= 0) {
      setText('receipt-intro', r.error
        ? 'Fix the settings above to see where the money goes.'
        : 'There is nothing to split yet.');
      return;
    }

    var shown = Calc.roundReceipt(r.receipt);
    var hasExtras = r.receipt.discount > 0 || r.receipt.shippingCharged > 0;
    setText('receipt-intro', 'One order at the recommended price of ' + money(r.recommendedPrice) + '.' +
      (hasExtras ? ' After your typical discount and the shipping the buyer pays, you receive ' + money(shown.received) + '.' : ''));

    function row(label, value, cls) {
      var div = document.createElement('div');
      div.className = 'receipt-row' + (cls ? ' ' + cls : '');
      var dt = document.createElement('dt');
      dt.textContent = label;
      var dd = document.createElement('dd');
      dd.textContent = value;
      div.appendChild(dt);
      div.appendChild(dd);
      receiptEl.appendChild(div);
    }

    if (hasExtras) {
      row('Price', money(r.recommendedPrice), 'receipt-sub');
      if (r.receipt.discount > 0) row('Typical discount', money(-r.receipt.discount), 'receipt-sub');
      if (r.receipt.shippingCharged > 0) row('Shipping the buyer pays', money(r.receipt.shippingCharged, { sign: true }), 'receipt-sub');
      row('You receive', money(shown.received), 'receipt-received');
    }

    shown.lines.forEach(function (line) {
      row(line.label, money(line.amount), line.amount === 0 ? 'is-zero' : '');
    });
    row('Profit', money(shown.profit), shown.profit < 0 ? 'receipt-profit is-loss' : 'receipt-profit');
  }

  function render(r) {
    // Material line costs
    Array.prototype.forEach.call(linesEl.querySelectorAll('.mline'), function (row, i) {
      row.querySelector('.mline-cost').textContent = '= ' + money(r.materialLineCosts[i] || 0) + ' per product';
    });

    // Recommended price
    var priceEl = $('rec-price');
    var errorEl = $('rec-error');
    var noteEl = $('rec-note');
    noteEl.hidden = true;

    if (r.error === 'IMPOSSIBLE') {
      priceEl.hidden = true;
      $('rec-basis').hidden = true;
      errorEl.hidden = false;
      errorEl.textContent = 'Your fees, refunds and margin target add up to 100% or more, so no price can work. Lower the margin target or the fees.';
      setText('sticky-price', 'Check settings');
    } else {
      priceEl.hidden = false;
      $('rec-basis').hidden = false;
      errorEl.hidden = true;
      var shownPrice = Math.max(0, r.recommendedPrice);
      priceEl.textContent = money(shownPrice);
      setText('rec-basis', 'Based on a ' + plainPercent(r.targetMarginPct) + ' margin');
      setText('sticky-price', money(shownPrice));
      if (r.recommendedPrice <= 0) {
        noteEl.hidden = false;
        noteEl.textContent = 'The shipping you charge already covers your costs on its own. Check the shipping charged to buyer.';
      }
    }

    // At the current price
    var current = $('current-block');
    current.hidden = !r.hasCurrentPrice;
    $('no-current').hidden = r.hasCurrentPrice;
    if (r.hasCurrentPrice) {
      setText('current-label', 'At your price of ' + money(r.currentPrice));
      var pill = $('health-pill');
      pill.textContent = r.health;
      pill.className = 'pill pill-' + r.healthKey;

      var profitEl = $('real-profit');
      profitEl.textContent = money(r.profit, { sign: true });
      profitEl.className = 'tile-value ' + (Calc.roundTo(r.profit, 2) < 0 ? 'is-loss' : 'is-profit');

      var marginEl = $('real-margin');
      marginEl.textContent = percent(r.marginPct);
      marginEl.className = 'tile-value ' + (Calc.roundTo(r.marginPct, 1) < 0 ? 'is-loss' : '');

      // A price gap only means something when there is a recommended price.
      var showGap = !r.error && r.recommendedPrice > 0;
      $('gap-tile').hidden = !showGap;
      var gapNote = $('gap-note');
      gapNote.hidden = !showGap;
      if (showGap) {
        var gap = Calc.roundTo(r.priceGap, 2);
        setText('price-gap', money(gap, { sign: true }));
        if (gap > 0) gapNote.textContent = 'Your price is ' + money(gap) + ' below the recommended price.';
        else if (gap < 0) gapNote.textContent = 'Your price is ' + money(-gap) + ' above the recommended price.';
        else gapNote.textContent = 'Your price matches the recommended price.';
      }
    }

    // Extra line for shops that are losing money or below target
    var more = $('more-products');
    more.hidden = !(r.hasCurrentPrice && (r.healthKey === 'losing' || r.healthKey === 'below'));

    // Costs
    setText('total-cost', money(r.totalCost));
    setText('material-cost', money(r.materialCost));
    setText('labor-cost', money(r.laborCost));

    renderReceipt(r);
  }

  function update() {
    var r = Calc.calculate(collectInputs());
    render(r);

    Array.prototype.forEach.call(document.querySelectorAll('[data-cur]'), function (el) {
      el.textContent = state.currency;
    });
    $('example-toggle').textContent = state.isExample ? 'Clear example' : 'Load example';
    save();
  }

  // ---------- links from config.js ----------

  function setupLink(id, url) {
    var link = $(id);
    var ok = typeof url === 'string' && /^https?:\/\//i.test(url.trim());
    if (ok) link.href = url.trim();
    else link.parentNode.removeChild(link); // never ship a dead link
  }
  setupLink('shop-link', CONFIG.SHOP_URL);
  setupLink('video-link', CONFIG.VIDEO_URL);
  Array.prototype.forEach.call(document.querySelectorAll('#next-actions a'), function (a) { a.hidden = false; });
  if (!$('next-actions').children.length) $('next-actions').hidden = true;

  function validUrl(url) { return typeof url === 'string' && /^https?:\/\//i.test(url.trim()); }

  if (validUrl(CONFIG.SHOP_URL)) {
    var moreText = $('more-products-text');
    var moreLink = document.createElement('a');
    moreLink.href = CONFIG.SHOP_URL.trim();
    moreLink.target = '_blank';
    moreLink.rel = 'noopener';
    moreLink.textContent = moreText.textContent;
    moreText.parentNode.replaceChild(moreLink, moreText);
  }

  if (validUrl(CONFIG.EMAIL_SIGNUP_URL)) {
    $('signup-link').href = CONFIG.EMAIL_SIGNUP_URL.trim();
    $('signup-card').hidden = false;
  }

  // Optional privacy-friendly visit counter: nothing loads unless a source is set.
  if (validUrl(CONFIG.ANALYTICS_SCRIPT_SRC)) {
    var script = document.createElement('script');
    script.defer = true;
    script.src = CONFIG.ANALYTICS_SCRIPT_SRC.trim();
    var attrs = CONFIG.ANALYTICS_ATTRS || {};
    Object.keys(attrs).forEach(function (k) { script.setAttribute(k, String(attrs[k])); });
    document.body.appendChild(script);
    if (typeof CONFIG.ANALYTICS_NOTE === 'string' && CONFIG.ANALYTICS_NOTE.trim()) {
      var note = $('privacy-note');
      note.textContent = note.textContent + ' ' + CONFIG.ANALYTICS_NOTE.trim();
    }
  }

  // ---------- sticky bar on phones ----------
  // Hidden while the result card itself is on screen.

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      document.body.classList.toggle('result-in-view', entries[0].isIntersecting);
    }, { threshold: 0.25 });
    observer.observe($('result'));
  }

  // ---------- start ----------

  fillForm();
  update();
})();
