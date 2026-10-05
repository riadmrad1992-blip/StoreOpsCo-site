# Task 1: build the StoreOpsCo website

Read `CLAUDE.md` first, then `ref-brand.md`, `ref-products.md` and `ref-motion-3d.md`, and skim `ref-showcase3d.html` (reuse its scene logic). Make decisions yourself and note them in the pull request. Ask a question only if you are truly blocked.

## Goal
A one-page, scroll-driven website with a real-time **3D hero** that stops people in their tracks: shop chaos snaps into four connected platforms (the four engines), joined by an orange beam, then the camera pulls back to the wordmark. Below it: the products, the free calculator, the YouTube channel, an email sign-up link and a short About. It must be fast, readable without 3D, and honest.

## Build in three stages (commit after each; open ONE pull request at the end)
If you run out of time or credit, **stop after Stage B and say so** in the pull request. Stages A and B are required; C is polish.

### Stage A: structure, content, fallback
1. Files (all top-level except `vendor/`): `index.html`, `styles.css`, `scene.js`, `app.js`, `config.js`, `vendor/`, `README.md`, `favicon.svg` (simple orange hexagon mark you draw), `robots.txt`, `sitemap.xml`, `.gitignore`, and keep `og-image.png` as provided.
2. `config.js` defines `window.CONFIG = { SITE_URL: "", ETSY_SHOP_URL: "", YOUTUBE_URL: "", TIKTOK_URL: "", INSTAGRAM_URL: "", LINKEDIN_URL: "", CALCULATOR_URL: "https://riadmrad1992-blip.github.io/StoreOpsCo-calculator/", EMAIL_SIGNUP_URL: "", CONTACT_EMAIL: "", ANALYTICS_SCRIPT_SRC: "", ANALYTICS_ATTRS: {} }` with a plain-language comment for each telling Riad what to paste. **Empty means hidden** (or a "Coming soon" label for the shop buttons).
3. Page sections, in this order, all real HTML with proper headings and landmarks and a "Skip to content" link:
   - **Hero** (the 3D story, Stage B). Static content in the hero: the wordmark, the line "The back office for small online shops.", one primary button (to the products section) and one secondary (to the YouTube channel, hidden if empty).
   - **The problem:** one short paragraph about messages, refunds, fees and guesswork, in the brand voice.
   - **The system:** the four engines as four cards (colour edge per engine): Communicate, Resolve, Know your profit, Automate, each with its product name and one line from `ref-products.md`.
   - **Products:** Profit Pilot ($17), Customer Response Bank ($12), Back Office + AI ($39), and a card for Refund & Dispute Manager that says it comes inside the bundles. Customer Service Kit: mention in text with **no price**. Buttons use `ETSY_SHOP_URL`; while empty show "Coming soon on Etsy".
   - **Free tool:** the Etsy price calculator card with a button to `CALCULATOR_URL`.
   - **Watch:** "A new back-office video every week" with a button to `YOUTUBE_URL` (hidden if empty). No video embeds.
   - **Join the list:** "New free tools and Etsy back-office tips" plus a button to `EMAIL_SIGNUP_URL`. **Hide the whole section when empty.** A plain link: no embedded form, no provider script.
   - **About:** the approved bio from `ref-brand.md`.
   - **Footer:** "© StoreOpsCo", the social links that are set, and `CONTACT_EMAIL` if set.
4. **Fallback hero** (used when WebGL is missing, JavaScript is off, or reduced motion is requested): a static CSS/SVG version of the assembled four-platform tower with the beam, same colours. The page must look finished without any 3D.
5. SEO and sharing: title "StoreOpsCo: the back office for small online shops", a natural meta description, Open Graph and Twitter tags using `og-image.png` (absolute URL when `SITE_URL` is set), canonical link when `SITE_URL` is set, `robots.txt`, a one-page `sitemap.xml`, and an Organization JSON-LD block whose `sameAs` lists only the profile links that are set.
6. Optional analytics: if `ANALYTICS_SCRIPT_SRC` is set, add one deferred script tag with `ANALYTICS_ATTRS`; if empty, no script and no request. No cookie banner.

### Stage B: the 3D scroll story (the wow)
Use `ref-showcase3d.html` and `ref-motion-3d.md` as the recipe. Implementation rules:
1. **Pinned canvas, native scroll.** The hero is a tall section (about 500vh on desktop, 350vh on phones) with a `position: sticky` full-viewport canvas. Scroll progress `p` (0 to 1) drives the scene. **Do not hijack the wheel, add momentum scrolling or use a smooth-scroll library**: the page must scroll normally, with keyboard and touch.
2. **Story by progress** (adjust to taste, keep the order):
   - 0.00–0.15 **Chaos:** paper message cards, kraft parcels, gold coins and glowing orange crystals tumble around the camera. Headline over the canvas: "Running an online shop?" then the four words appear one by one: Messages. Refunds. Fees. Guesswork.
   - 0.15–0.25 **Snap:** objects pull toward the centre, the core light swells, a quick paper-colour flash.
   - 0.25–0.70 **Order:** four hexagonal platforms pop in one at a time (back-out easing); each set of objects lands in a neat arrangement on its platform while a label names the engine and its product. Camera rises floor by floor.
   - 0.70–0.80 **Connect:** the orange beam grows through all four platforms: "All connected. One system."
   - 0.80–1.00 **Reveal:** camera pulls back and up, a ring of orange particles fades in, the wordmark lands with the tagline. Then the page continues normally.
   - Text overlays are HTML, never 3D text. Each overlay line has a matching visually-hidden text equivalent so the story reads without the canvas.
3. **Idle life:** a slow constant orbit and gentle object drift; on desktop a subtle mouse parallax on the camera (at most 0.3 units).
4. **Look:** the brand colours only, one soft bloom-like glow on the core and beam (a cheap additive-sprite glow is fine; do not use heavy post-processing unless it stays inside the budget), fog matching the page background, no stock textures or external assets.
5. **Performance budget (a hard rule):**
   - Use instanced meshes for the objects: at most about 120 objects on desktop and about 50 on phones; at most about 60 draw calls.
   - Pixel ratio capped at 2 on desktop and 1.5 on phones. Antialias off on phones.
   - Load three.js and start the scene **after first paint** (the headline and buttons are visible before any 3D). Initialise lazily with `requestIdleCallback`/`setTimeout` fallback.
   - **Pause rendering** when the hero is off-screen (IntersectionObserver) or the tab is hidden (`visibilitychange`). No work when nothing changes.
   - **Adaptive quality:** if the average frame time is above about 28 ms for 2 seconds, step down (pixel ratio first, then object count) and never step back up.
   - Total transferred size of the first page load under about 1.5 MB gzipped, three.js included. Report the real number.
6. **Fallbacks and accessibility:**
   - No WebGL (or context loss): show the Stage A static hero and keep everything else working.
   - `prefers-reduced-motion: reduce`: no scroll-scrubbing, no orbit, no parallax: render the final assembled frame once (or use the static hero), with no motion anywhere.
   - Canvas is `aria-hidden="true"`; all information also exists as normal text; keyboard focus order is natural; visible focus rings; contrast at least 4.5:1.

### Stage C: interaction and polish
- Product and engine cards: a subtle CSS 3D tilt on hover or touch (at most 8 degrees), disabled under reduced motion.
- The Profit Pilot card includes a small animated "price flip" that runs once when it scrolls into view: "$10.00 → −$2.29" in red, then "$19.53 → +$5.86" in green, with the single orange glow on $19.53. The numbers must match `ref-products.md` and come with the note "Example: US Etsy rates, 2026." Under reduced motion show the final state only.
- Section reveals: simple fade-and-rise on scroll (CSS or a tiny IntersectionObserver), no heavy animation libraries.
- A thin scroll progress line at the top in signal orange.
- Keep every effect cheap; if the frame-time rule from Stage B triggers, the page-level effects stay but the scene degrades.

## README.md (plain language, Windows)
1. What this is, in two lines.
2. See it on your laptop: double-click `index.html`.
3. Change your links: open `config.js` in Notepad, paste each link between the quotes, save.
4. **Publish for free with GitHub Pages:** the repository must be **public** on a free account; Settings → Pages → Build and deployment → Source "Deploy from a branch" → branch `main`, folder `/ (root)` → Save → wait 1–2 minutes → the page shows the link (it looks like `https://USERNAME.github.io/REPOSITORY/`). Later changes to `main` republish by themselves.
5. **Using your own domain later (optional):** a short, honest explanation of buying a domain from any registrar, adding it under Settings → Pages → Custom domain, the DNS records GitHub asks for, and that HTTPS turns on by itself. Say plainly that the exact DNS screens differ by registrar. Tell Riad to set `SITE_URL` in `config.js` once the domain works.
6. What to check before sharing: every button, phone and laptop, the page with sound off, the page with JavaScript off.

## Acceptance (check each one and list the result in the pull request)
- [ ] The page opens by double-click and works when served over `http://localhost` (say which static server you used, if any). No console errors.
- [ ] With every `config.js` value empty: no dead links, no empty sections, shop buttons show "Coming soon on Etsy", the join section is hidden, no analytics request.
- [ ] Screenshots at 360px, 768px and 1280px wide for scroll positions 0, 0.2, 0.5, 0.8 and 1 of the hero (use headless Chromium with software rendering for WebGL; say how you ran it). No overlapping text, nothing cut off, no horizontal scroll.
- [ ] WebGL disabled: the static hero shows and every section still works.
- [ ] `prefers-reduced-motion` emulated: no motion at all, final assembled state visible.
- [ ] JavaScript disabled: all text, links and the static hero are present.
- [ ] Rendering pauses when the hero is off-screen and when the tab is hidden (show how you checked).
- [ ] Frame time on desktop emulation stays within budget; the adaptive step-down triggers when you throttle the CPU. Report the numbers you measured.
- [ ] First-load transfer size, gzipped, is reported and is under about 1.5 MB (or you explain why it is not).
- [ ] No third-party requests other than Google Fonts and the optional analytics script. Fonts have fallbacks.
- [ ] All copy comes from `ref-products.md` and `ref-brand.md`; none of the unverified counts appear; no testimonials or statistics.
- [ ] Keyboard only: skip link works, focus order is natural, focus rings are visible.
- [ ] Share tags validate (title, description, `og-image.png`); `sitemap.xml` and `robots.txt` exist.

## How to work (to save credit)
1. Read the reference files once. Do not re-read big files.
2. Get Stage A looking finished with the static hero before any 3D. Then build the scene with a small object count first, check frames, then scale up.
3. Check screenshots and numbers at each stage rather than at the end. Commit in small steps.

## Pull request description must include
- What was built, in five lines
- The acceptance checklist with results (real numbers for size and frame time)
- What you could not test (for example a real phone or a real GPU)
- Decisions Riad should know about
