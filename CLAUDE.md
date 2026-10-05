# StoreOpsCo website

## What this is
StoreOpsCo is a faceless YouTube channel plus Notion templates for Etsy sellers. The owner is **Riad**, a solo founder in Beirut. He is **not a developer** and works on a **Windows laptop**.

This repo is the **public StoreOpsCo website**: a single scroll-driven page with a real-time **3D hero** that tells the brand story (shop chaos snaps into one connected system), then the products, the free calculator, the YouTube channel and an email sign-up link. Its job is to give every video, Short and social profile one memorable place to send people, and to make people stop and say "wow" without ever making the page hard to use.

## Rules that never change
1. **No build step, no framework, no bundler.** Plain `index.html`, `styles.css`, `scene.js`, `app.js`, `config.js`. It must work by double-clicking `index.html` and when published on GitHub Pages with zero setup.
2. **Classic scripts only, not ES modules** (modules do not load from a double-clicked file).
3. **three.js is vendored, not hot-linked.** Commit a pinned copy (the r128 browser build, and only the extra scripts you really use) into `vendor/`. Never load code from a CDN at runtime. If you cannot download it in your environment, say so in the pull request and write the site so adding the file later is the only step left.
4. **Content never depends on 3D.** Every word, link and button is real HTML that works with no WebGL, no JavaScript animation and no mouse. The canvas is decoration (`aria-hidden="true"`).
5. **Wow within a budget.** The effect must never cost usability or speed: see the performance and accessibility sections in `TASK-1.md`. If a flashy idea and these budgets conflict, the budgets win.
6. **No tracking, no cookies, no analytics, no third-party scripts** by default. Allowed network requests: Google Fonts, and one optional privacy-friendly analytics script that is only loaded when `config.js` sets it.
7. **This repo will be public.** No secrets, no personal data, no private business plans.
8. **Honest copy only.** No testimonials, no sales numbers, no "as seen on", no invented statistics, no guarantees. Product facts come from `ref-products.md` only. Prices and counts that are marked unverified there must not appear on the page.
9. **Never ship a dead link.** Every outside link comes from `config.js`. If a value is empty, hide that button (or show a plain "Coming soon" label where `TASK-1.md` says so).
10. **Be honest about testing.** If you could not check something (for example, a real phone), say so in the pull request. Do not claim it was tested.

## Brand
Dark Midnight `#0E141B`, cards `#151D27`, text `#F3F1EC`, muted `#8C97A3`, Signal Orange `#F27A2E` for the one key thing in view, Ledger Green `#2FBF71`, loss red `#FF6B70`. Fonts: Plus Jakarta Sans 800 for headings and big numbers, Inter for everything else. The wordmark is set in type ("StoreOps" in text colour, "Co" in orange). Details: `ref-brand.md`, `ref-tokens.json`, `ref-design-system-readme.md`.

## Where things are
Reference files sit at the top level and start with `ref-`. **Leave them where they are; do not move or edit them.**
- `ref-showcase3d.html`: the existing three.js brand film (chaos, snap, four platforms, beam, pull-back). Reuse its scene logic and camera keyframes.
- `ref-motion-3d.md`: the motion recipe (timeline, scene kit, easing table)
- `ref-brand.md`, `ref-tokens.json`, `ref-design-system-readme.md`: look and voice
- `ref-products.md`: the only source of product facts and copy rules
- `og-image.png`: the share image; use it as it is
- `TASK-1.md`: the current task
