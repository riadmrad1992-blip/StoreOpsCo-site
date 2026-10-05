# Motion and 3D

How StoreOpsCo makes eye-catching animated work: brand films, YouTube intros and outros, Shorts hooks, Etsy listing videos and animated web showcases.

## The story every piece tells

1. **Hook (0 – 3s): chaos.** Objects tumble around the camera: paper message cards, kraft parcels, gold coins, orange AI crystals. Words appear one by one ("Messages. Refunds. Fees. Guesswork."). A tiny camera shake is allowed here and nowhere else.
2. **The snap (3 – 4.5s).** Everything pulls toward the centre, the core light swells, a short `paper` flash (35% opacity, 350ms) marks the cut.
3. **Order (4.5 – 10s).** Hexagonal platforms pop in one by one with back-out easing; each set of objects lands in a neat grid on its platform while a label card names the engine. The camera rises floor by floor.
4. **Connect (10 – 11.5s).** A `signal` beam grows through all platforms: "All connected. One system."
5. **Reveal (11.5s – end).** Camera pulls back and up, an orbiting ring of `signal` particles fades in, the wordmark lands with the tagline. Hold at least 2s so it can be read.

Product films use the same arc with a product: a spinning 3D object with a price tag that flips from `paper` to `loss` (hook), a cost card that builds line by line (order), a price counter that climbs to the recommended price in `signal` with `glow-signal` (reveal).

## Scene kit (three.js)

- Library: three.js r128 UMD from cdnjs, pinned. Background and fog colour = `ground`; fog from 14 to 36 units.
- Lights: hemisphere (cool sky, `ground` floor, 0.6), key directional from upper right (0.95), a cool rim light from behind (0.35), and a `signal` point light at the centre whose intensity carries the story (low in chaos, swells at the snap, strongest when the beam lands).
- Objects and materials: message cards `paper` (rough 0.5, faint blue emissive); parcels `kraft` with a lighter tape band; coins `coin`, metalness 0.75, roughness 0.28; AI crystals icosahedrons in `signal` with emissive; platforms flat hexagons in `surface` with edge lines in their engine colour and a thin glowing underside.
- Background dust: a few hundred points in `paper` at 35% opacity, far away, not affected by fog.
- Camera: 45° FOV, always orbiting at a slow constant speed (about 0.26 rad/s). Move distance, height and look-at between keyframes with ease-in-out. On portrait frames push the camera back about 1.5x so the scene fits the width.

## CSS 3D kit (no library)

For listing images, web pages and anything that must render without WebGL:

- **Tilted tile grid:** `perspective: 900px` on the parent; the grid at `rotateX(14deg) rotateZ(-4deg)`; tiles `radius-md`, `shadow-tile`. Entrance: start at `scale(1.7)` with a steeper tilt and ease to rest over 1.5s.
- **Product cube:** six faces with soft pastel gradients and a white highlight, rotating on Y over 5.5s with a fixed -20° X tilt; a blurred `signal` glow behind it, an elliptical shadow under it.
- **Flip tag:** a price tag that flips on X (700ms, slight overshoot) from `paper` "$10.00" to `loss` "−$2.29 lost every sale".

## Timing and easing

| Use | Duration | Easing |
| --- | --- | --- |
| Text fade/slide in | 450 – 600ms | ease-out (cubic-bezier(.2,.8,.2,1)) |
| Pops (platforms, pills, badges) | 400 – 550ms | back-out (cubic-bezier(.3,1.6,.5,1)) |
| Counters (prices, totals) | 600 – 900ms | ease-out cubic |
| Camera moves | 0.5 – 3.5s | ease-in-out cubic |
| Stagger between list items | 140 – 300ms | — |
| Hold on the final frame | ≥ 2s | — |

Rules: one thing moves at a time in the viewer's focus; text arrives after the object it names; never more than one glow; no spinning text; loops restart cleanly from frame 0.

## Formats

| Where | Size | Notes |
| --- | --- | --- |
| YouTube video, intro, outro | 1920 × 1080 (16:9) | Intro 3–5s, outro 5–8s; leave the outro's lower right free for end-screen elements. |
| YouTube thumbnail | 1280 × 720 | One number or one 2-word line, huge; face-free. |
| Shorts, TikTok, Reels | 1080 × 1920 (9:16) | Keep text in the middle band: clear of the top 10% and bottom 24%. |
| Etsy listing photo | 2000 × 2000 (1:1) | Etsy recommends at least 2000px on the shortest side; thumbnails crop, so keep the message in the centre 80%. |
| Etsy listing video | 1080 × 1080 (1:1) or 1080 × 1350 (4:5) | 5 – 15s, plays without sound; the story must work with no audio. |
| Instagram feed | 1080 × 1350 (4:5) | |

Recording a web showcase: open it in a laptop browser, use its Clean mode, screen-record, trim in CapCut, add music only for social platforms.
