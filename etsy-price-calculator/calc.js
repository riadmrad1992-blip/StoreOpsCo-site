/*
 * StoreOpsCo Etsy price calculator: the maths.
 *
 * Pure functions only, no page code. The formulas follow ref-formulas.md
 * exactly so the numbers match Profit Pilot. Nothing is rounded until the
 * end: only the recommended price is rounded (to cents) inside the maths.
 *
 * In the browser this file sets window.Calc. In Node it is loaded with
 * require('./calc.js') so the tests can use it.
 */
(function (root) {
  'use strict';

  // Etsy and selling settings with their US 2026 defaults (see ref-etsy-fees-2026.md).
  var DEFAULT_SETTINGS = {
    feePct: 9.5,
    fixedFee: 0.45,
    adsBufferPct: 3,
    refundPct: 2,
    targetMarginPct: 30,
    discountPct: 0,
    shippingCharged: 0,
    etsyAdsPerSale: 0,
    marketingPerSale: 0
  };

  var HEALTH = {
    none: 'No price yet',
    losing: 'Losing money',
    below: 'Below target',
    healthy: 'Healthy'
  };

  // Empty, missing, negative or non-numeric values count as 0.
  function num(value) {
    var n = typeof value === 'number' ? value : parseFloat(value);
    return isFinite(n) && n > 0 ? n : 0;
  }

  // Settings that are not given fall back to the defaults.
  function setting(inputs, key) {
    var value = inputs[key];
    return value === undefined || value === null ? DEFAULT_SETTINGS[key] : num(value);
  }

  function roundTo(value, decimals) {
    var factor = Math.pow(10, decimals);
    // Number.EPSILON nudges values such as 1.005 so they round the way people expect.
    return Math.round((value + (value >= 0 ? Number.EPSILON : -Number.EPSILON)) * factor) / factor;
  }

  function materialLineCost(line) {
    var packQty = num(line && line.packQty);
    if (packQty === 0) return 0;
    return num(line.packPrice) / packQty * num(line.used);
  }

  // Everything that happens to one order sold at `price`.
  function atPrice(price, c) {
    var salePrice = price * (1 - c.discount);
    var orderTotal = salePrice + c.shippingCharged;
    var etsyFees = orderTotal * c.feeRate;
    var fees = etsyFees + c.fixedFee;
    var refunds = salePrice * c.refund;
    var realProfit = orderTotal - fees - refunds - c.totalCost - c.etsyAdsPerSale - c.marketingPerSale;
    return {
      salePrice: salePrice,
      orderTotal: orderTotal,
      etsyFees: etsyFees,
      fees: fees,
      refunds: refunds,
      realProfit: realProfit,
      marginPct: salePrice === 0 ? 0 : realProfit / salePrice * 100
    };
  }

  function healthFor(currentPrice, realProfit, recommendedPrice) {
    if (!(currentPrice > 0)) return 'none';
    if (realProfit < 0) return 'losing';
    if (currentPrice < recommendedPrice) return 'below';
    return 'healthy';
  }

  /*
   * calculate(inputs) -> everything the page needs.
   *
   * error is null, or 'IMPOSSIBLE' when fees, refunds and margin add up to
   * 100% or more (then recommendedPrice is 0 and there is no receipt).
   * Money values are not rounded, except recommendedPrice (to cents).
   */
  function calculate(inputs) {
    inputs = inputs || {};
    var lines = Array.isArray(inputs.materialLines) ? inputs.materialLines : [];

    var lineCosts = lines.map(materialLineCost);
    var materialCost = lineCosts.reduce(function (sum, cost) { return sum + cost; }, 0);
    var laborCost = num(inputs.laborMinutes) / 60 * num(inputs.hourlyRate);
    var packaging = num(inputs.packaging);
    var shippingCost = num(inputs.shippingCost);
    var overhead = num(inputs.overhead);
    var totalCost = materialCost + packaging + laborCost + overhead + shippingCost;

    var c = {
      totalCost: totalCost,
      discount: setting(inputs, 'discountPct') / 100,
      feeRate: (setting(inputs, 'feePct') + setting(inputs, 'adsBufferPct')) / 100,
      refund: setting(inputs, 'refundPct') / 100,
      margin: setting(inputs, 'targetMarginPct') / 100,
      fixedFee: setting(inputs, 'fixedFee'),
      shippingCharged: setting(inputs, 'shippingCharged'),
      etsyAdsPerSale: setting(inputs, 'etsyAdsPerSale'),
      marketingPerSale: setting(inputs, 'marketingPerSale')
    };

    var top = totalCost + c.etsyAdsPerSale + c.marketingPerSale + c.fixedFee - c.shippingCharged * (1 - c.feeRate);
    var bottom = (1 - c.discount) * (1 - c.feeRate - c.refund - c.margin);
    var impossible = bottom <= 0;
    var recommendedPrice = impossible ? 0 : roundTo(top / bottom, 2);

    var result = {
      error: impossible ? 'IMPOSSIBLE' : null,
      materialLineCosts: lineCosts,
      materialCost: materialCost,
      laborCost: laborCost,
      packaging: packaging,
      shippingCost: shippingCost,
      overhead: overhead,
      totalCost: totalCost,
      targetMarginPct: setting(inputs, 'targetMarginPct'),
      recommendedPrice: recommendedPrice,
      hasCurrentPrice: false,
      currentPrice: 0,
      salePrice: null,
      orderTotal: null,
      fees: null,
      refunds: null,
      profit: null,
      marginPct: null,
      priceGap: null,
      healthKey: 'none',
      health: HEALTH.none,
      receipt: null
    };

    var currentPrice = num(inputs.currentPrice);
    if (currentPrice > 0) {
      var now = atPrice(currentPrice, c);
      result.hasCurrentPrice = true;
      result.currentPrice = currentPrice;
      result.salePrice = now.salePrice;
      result.orderTotal = now.orderTotal;
      result.fees = now.fees;
      result.refunds = now.refunds;
      result.profit = now.realProfit;
      result.marginPct = now.marginPct;
      result.priceGap = recommendedPrice - currentPrice;
      result.healthKey = healthFor(currentPrice, now.realProfit, recommendedPrice);
      result.health = HEALTH[result.healthKey];
    }

    if (!impossible) {
      // Where the money goes, at the recommended price.
      var rec = atPrice(recommendedPrice, c);
      result.receipt = {
        price: recommendedPrice,
        discount: recommendedPrice - rec.salePrice,
        shippingCharged: c.shippingCharged,
        received: rec.orderTotal,
        lines: [
          { key: 'materials', label: 'Materials', amount: materialCost },
          { key: 'time', label: 'Your time', amount: laborCost },
          { key: 'packaging', label: 'Packaging', amount: packaging },
          { key: 'shipping', label: 'Shipping', amount: shippingCost },
          { key: 'overhead', label: 'Overhead', amount: overhead },
          { key: 'etsyFees', label: 'Etsy fees', amount: rec.etsyFees },
          { key: 'fixedFee', label: 'Fixed fee', amount: c.fixedFee },
          { key: 'etsyAds', label: 'Etsy Ads', amount: c.etsyAdsPerSale },
          { key: 'marketing', label: 'Marketing', amount: c.marketingPerSale },
          { key: 'refunds', label: 'Refunds', amount: rec.refunds }
        ],
        profit: rec.realProfit
      };
    }

    return result;
  }

  /*
   * Rounds the receipt to cents for display so the rows add up exactly to
   * what the seller receives. Profit is rounded normally (so it matches the
   * profit shown elsewhere). Rounding each cost line on its own can leave the
   * total a few cents out, so those cents go to the lines whose exact value
   * was closest to rounding the other way. Every shown value stays within
   * 1 cent of its exact value. This changes display only, never the maths.
   */
  function roundReceipt(receipt) {
    var toCents = function (v) { return Math.round(roundTo(v, 2) * 100); };
    var profitCents = toCents(receipt.profit);
    var targetCents = toCents(receipt.received) - profitCents;
    var shown = receipt.lines.map(function (line) { return toCents(line.amount); });
    var diff = targetCents - shown.reduce(function (sum, v) { return sum + v; }, 0);

    while (diff !== 0) {
      var step = diff > 0 ? 1 : -1;
      var best = -1;
      var bestError = -Infinity;
      for (var i = 0; i < shown.length; i++) {
        if (receipt.lines[i].amount === 0) continue;
        // How far the shown value is below (step +1) or above (step -1) the exact value.
        var error = (receipt.lines[i].amount * 100 - shown[i]) * step;
        if (error > bestError) { bestError = error; best = i; }
      }
      if (best === -1) break; // nothing to adjust (all lines are 0)
      shown[best] += step;
      diff -= step;
    }

    return {
      lines: receipt.lines.map(function (line, i) {
        return { key: line.key, label: line.label, amount: shown[i] / 100 };
      }),
      profit: profitCents / 100,
      received: toCents(receipt.received) / 100
    };
  }

  var Calc = {
    DEFAULT_SETTINGS: DEFAULT_SETTINGS,
    HEALTH: HEALTH,
    calculate: calculate,
    materialLineCost: materialLineCost,
    roundReceipt: roundReceipt,
    roundTo: roundTo
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Calc;
  } else {
    root.Calc = Calc;
  }
})(typeof window !== 'undefined' ? window : this);
