# StoreOpsCo

The back office for small online shops. StoreOpsCo makes Notion systems for Etsy sellers (Customer Response Bank, Refund & Dispute Manager, Profit Pilot, AI Assistant and the Back Office + AI bundle) and a faceless YouTube channel of the same name. This system is the reference for every video, thumbnail, Short, Etsy listing image and web page we make.

## The idea in one line

**Chaos snaps into one connected system.** Every piece of design tells that story: messy shop work (messages, refunds, fees, guesswork) becomes calm, ordered and lit. The four products are four *engines* stacked into one system.

| Engine | Product | Colour token |
| --- | --- | --- |
| 01 Communicate | Customer Response Bank | `engine-communicate` |
| 02 Resolve | Refund & Dispute Manager | `engine-resolve` |
| 03 Know your profit | Profit Pilot | `engine-profit` (= `ledger`) |
| 04 Automate | AI Assistant | `engine-automate` (= `signal`) |

## Content fundamentals

- **Voice:** a calm operator who has done the maths for you. Plain words, short sentences, real numbers. Never hype ("game-changer", "unlock"), never fear-mongering.
- **Lead with a number.** "$10 → $19.53" beats "Price smarter". Numbers are specific (two decimals for money) and always come from real sample data; if a number changes in the product, it changes in the design.
- **One message per frame.** A listing image or Short frame must be understood in two seconds: one headline (max ~8 words), one proof (a number or a screenshot), nothing else.
- **Headline pattern:** statement + one orange phrase. "Know your **real profit** on every sale." Only one phrase per headline is `signal-text`.
- **Examples of good lines:** "Stop guessing your prices." · "Every hidden cost. Counted." · "3 steps. 20 minutes." · "All connected. One system."
- **Honesty rule:** only claim what the product does today. Mark example figures "Example numbers · US Etsy rates" when fees are involved.
- Wordmark is always **StoreOpsCo** with **Co** in `signal`. Product names keep their case: Profit Pilot, Customer Response Bank, Refund & Dispute Manager, Back Office + AI.

## Visual foundations

- **Dark first.** `ground` (Midnight) is the default for all video and listing work; the Paper theme is for documents and light web pages.
- **Ground recipe:** a vertical gradient from `ground-deep` → `ground`, one soft radial highlight at the top (a lighter blue-grey), and one faint `signal` glow in a lower corner. Over it, a hairline grid at `space-16` pitch at about 3.5% `ink` opacity.
- **Cards float.** Every card is `surface` → `surface-raised` gradient, 1px `line` border, `radius-lg`, `shadow-card`. Depth comes from shadow and perspective, not from outlines.
- **One glow per frame.** Only the most important thing gets `glow-signal` (the recommended price, the beam, the core light). Two glows = no glow.
- **Status colours are small.** `loss`, `caution`, `ledger` appear as dots, pills and numbers, never as large fields. Tell them apart by label as well as colour (Losing money / Below target / Healthy).
- **Type:** Plus Jakarta Sans 800 for display and numbers (tight tracking), Inter for UI and body. Numbers use tabular figures. Kickers are uppercase `kicker` style in `ink-muted`.
- **Layout:** generous margins (`space-12` at 1080px, 128px at 2000px), content centred, text never under the bottom 24% of a 9:16 frame (platform UI covers it).
- **Avoid:** blue-purple gradients, rainbow palettes, stock-photo people, emoji-heavy cards, left-border accent cards, clip-art icons. Emojis appear only where they are really in the Notion product.

## Motion and 3D (the "wow")

Every animated piece follows **Hook → Order → Reveal**, uses real 3D depth (three.js scenes or CSS perspective), and has exactly one "snap" moment where chaos becomes order. The full recipe (camera, easing, timing, scene objects, formats) is in the **Motion and 3D** section. Short version:

- Hook in the first 1.5s with motion *and* a question or a number.
- Objects are physical: paper message cards, kraft parcels, metallic coins, glowing orange crystals, hexagonal platforms.
- Easing: ease-out for arrivals, ease-in-out for camera, a small overshoot (back-out) for "pops". Nothing linear except slow ambient rotation.
- The camera always orbits slowly; the reveal pulls back and up.

## Iconography

No icon set yet. Use status dots, the hexagon platform shape, and simple geometric marks. Where the Notion product uses emoji page icons (🧭 Profit Pilot, 🩸 Profit Leaks, 🏆 Best Earners), show them only inside real screenshots or tiles that mirror the product.

## Logo

Logo files live in the **logos** asset group: `storeopsco-logo.svg` (use this first, it scales cleanly), primary and horizontal lock-ups and the icon as PNGs (transparent versions for placing on `ground`), the YouTube banner, and the rendered intro and outro videos. When a file cannot be used, set the wordmark in type: "StoreOps" in `ink` + "Co" in `signal`, Plus Jakarta Sans 800, tracking -0.03em. Never redraw or recolour the mark.

## The 3D showcase

The brand film is the **Showcase3D** component (live three.js preview) and the full 15-second version is published at https://claude.ai/artifact/K4n6s2nJfFtQCZ5vWq2s23 with 9:16, 4:5 and 16:9 formats and a Clean mode for recording. New animated work starts from it.

---

## Consuming this system (generated — do not edit)

Every path named below is under `project/` in this design system: read `project/api/tokens.md`, not `api/tokens.md`.

If the text above differs on what to load or read, follow this section.

5 components are documented without a runnable `components/bundle.js`: read each card and long README and build to those guidelines. Tokens: read the values from the token cards; a Slides deck or Design canvas also takes `tokens.json` by file path.

**Read, per thing:** a component’s props, parts and examples: `api/components/<Comp>.md`; token values: `api/tokens.md`; stored assets and their paths: `api/assets/<Group>.md`. After this README, fetch the cards and fonts you need in ONE message as parallel calls — none depends on another.

**Two rules.** Before you use a thing — a component, a token group, an icon, an asset — read its card from the index below; a value you did not read from a card is a guess. `tokens.json`, `manifest.json` and `design-system.json` are sources for tools: hand them over unread. `components/<Comp>/README.md` and `assets/<Group>/README.md` are the long-form second read a card links to; `SKILL.md` and `artifact-type/` beside them are authoring guidance, not needed to consume the system.

## Index (generated — do not edit)

**Tokens**

- `api/tokens.md` — Every token: surface, text, fill, palette, type, spacing, radius, shadow. (6.5k)

**Icons and assets**

- `api/assets/logos.md` — 12 files, by asset id. (1.7k)

**Components** (`api/components/<Comp>.md`, 5)

- **Actions**: `Button` — Pill-shaped action used for CTAs on web pages, outros and listing mockups ("Try Profit Pilot →", "Subscribe")
- **Status**: `HealthBadge` — Status pill that mirrors Profit Pilot's Health column: Losing money, Below target, Healthy, No price yet
- **Proof**: `PriceJump` — The signature proof moment: the old price struck through, an arrow, and the recommended price counting up in signal-text with glow-signal
- **3D**: `ProductCube` — A spinning CSS 3D product (a wax-melt cube) with a flip price tag: the hook of product films and Shorts · `TiltTiles` — A 2×2 grid of product tiles tilted in CSS 3D perspective: the "dashboard reveal" used in listing images, showcases and web heroes
