/*
 * StoreOpsCo email sign-up box (used on the homepage and the calculator).
 *
 * Every element with data-signup-box gets this box. The button opens the Kit
 * sign-up page from EMAIL_SIGNUP_URL in config.js. If that value is empty and
 * no Kit form is pasted below, the box stays empty (never a dead link).
 *
 * TO USE A KIT FORM INSTEAD OF THE BUTTON:
 *   In Kit open your form, press Publish, choose "JavaScript" (or "HTML"),
 *   copy the code and paste it between the two backticks below, like this:
 *
 *     var KIT_EMBED_CODE = `<script async data-uid="..." src="https://storeopsco.kit.com/.../index.js"></script>`;
 *
 *   Save. The form then shows in place of the button on both pages.
 *   To go back to the button, empty it again:  var KIT_EMBED_CODE = ``;
 */

// ===== PASTE THE KIT EMBED CODE BETWEEN THE BACKTICKS =====
var KIT_EMBED_CODE = ``;
// ===== END OF KIT EMBED CODE =====

(function () {
  'use strict';

  var HEADLINE = 'Get one Etsy pricing breakdown a week, free. No spam.';
  var BUTTON = 'Sign up free';

  var CSS =
    '.signup-box{background:#151D27;border:1px solid #26313D;border-left:4px solid #F27A2E;border-radius:14px;padding:18px 18px 16px;text-align:left}' +
    '.signup-box p{margin:0 0 12px;font:600 16px/1.45 Inter,"Segoe UI",system-ui,sans-serif;color:#F3F1EC}' +
    '.signup-box .signup-box-btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 22px;border-radius:999px;background:#F27A2E;color:#0E141B;font:700 15px/1 Inter,"Segoe UI",system-ui,sans-serif;text-decoration:none}' +
    '.signup-box .signup-box-btn:hover{background:#ff8a42}' +
    '.signup-box .signup-box-btn:focus-visible{outline:3px solid #F27A2E;outline-offset:2px}' +
    '.signup-box small{display:block;margin-top:10px;color:#8C97A3;font:500 13px/1.4 Inter,"Segoe UI",system-ui,sans-serif}' +
    '.signup-box small a{color:inherit}' +
    '.signup-box-form{margin-top:4px}';

  var slots = document.querySelectorAll('[data-signup-box]');
  if (!slots.length) return;

  var embed = String(KIT_EMBED_CODE || '').trim();
  var cfg = window.CONFIG || {};
  var url = typeof cfg.EMAIL_SIGNUP_URL === 'string' ? cfg.EMAIL_SIGNUP_URL.trim() : '';
  var hasUrl = /^https:\/\/\S+$/i.test(url);
  if (!embed && !hasUrl) return;

  var style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  // Scripts added with innerHTML never run, so copy each one into a fresh <script>.
  function insertEmbed(target, html) {
    var tpl = document.createElement('template');
    tpl.innerHTML = html;
    Array.prototype.forEach.call(tpl.content.querySelectorAll('script'), function (old) {
      var s = document.createElement('script');
      Array.prototype.forEach.call(old.attributes, function (a) { s.setAttribute(a.name, a.value); });
      s.text = old.text;
      old.parentNode.replaceChild(s, old);
    });
    target.appendChild(tpl.content);
  }

  // Only one Kit form per page: Kit forms clash when the same one appears twice.
  var embedded = false;

  Array.prototype.forEach.call(slots, function (slot) {
    var box = document.createElement('div');
    box.className = 'signup-box';
    var p = document.createElement('p');
    p.textContent = HEADLINE;
    box.appendChild(p);

    if (embed && !embedded) {
      var form = document.createElement('div');
      form.className = 'signup-box-form';
      box.appendChild(form);
      slot.innerHTML = '';
      slot.appendChild(box);
      insertEmbed(form, embed);
      embedded = true;
      return;
    }
    if (!hasUrl) return;

    var a = document.createElement('a');
    a.className = 'signup-box-btn';
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = BUTTON;
    box.appendChild(a);
    var note = document.createElement('small');
    note.innerHTML = 'Opens Kit, our email provider. Unsubscribe from any email. <a href="/privacy/">Privacy</a>';
    box.appendChild(note);
    slot.innerHTML = '';
    slot.appendChild(box);
  });
})();
