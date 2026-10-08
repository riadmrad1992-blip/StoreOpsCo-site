# StoreOpsCo website

A one-page website for StoreOpsCo: a 3D story that scrolls (shop chaos snaps into one connected system), then the products, the free calculator, the YouTube channel and an About. Every section below the story has its own small 3D scene that plays as you scroll.
No installing, no building: it is plain files.

## See it on your laptop
Double-click `index.html`. It opens in your browser.

## Change your links
1. Open `config.js` in Notepad (right-click, Open with, Notepad).
2. Paste each link between the quotes. Keep the quotes and the comma.
3. Save, then refresh the page.

Leave a value empty and that button or section stays hidden. While `ETSY_SHOP_URL` is empty, every product says "Coming soon on Etsy".

## Publish for free with GitHub Pages
1. The repository must be **public** (free GitHub account).
2. On GitHub open the repository, then **Settings → Pages**.
3. Under **Build and deployment**, set Source to **Deploy from a branch**.
4. Choose branch `main` and folder `/ (root)`, then press **Save**.
5. Wait 1 to 2 minutes and refresh. The page shows your link, which looks like `https://USERNAME.github.io/REPOSITORY/`.

Later changes to `main` republish by themselves.

## Using your own domain later (optional)
1. Buy a domain from any registrar.
2. In GitHub go to **Settings → Pages → Custom domain**, type the domain, and save.
3. GitHub shows the DNS records to add. Add them at your registrar. The exact screens differ from one registrar to another, so look for "DNS" or "DNS records" in their help.
4. Wait for the check to pass. HTTPS ("Enforce HTTPS") turns on by itself after that.
5. Put the new address in `SITE_URL` in `config.js`. Also replace `https://riadmrad1992-blip.github.io/StoreOpsCo-site/` in `robots.txt` and `sitemap.xml` with it. (Share previews on some apps are read without JavaScript, so those files cannot take the address from `config.js`.)

## Check before sharing
- Click every button.
- Look at it on a phone and on a laptop.
- Look at it with the sound off (there is no sound, so nothing should depend on it).
- Turn JavaScript off and reload: all the text, links and the still picture of the system should still be there.

## What is inside
`index.html` (content), `styles.css` (look), `scene.js` (the 3D story), `world.js` (the 3D scenes beside each section), `app.js` (links, small effects), `config.js` (your links), `vendor/three.min.js` (three.js r128, MIT licence, kept here so nothing loads from the internet). Reduced-motion visitors and browsers without WebGL see the still picture instead of the 3D story, and the section scenes are left out completely (no empty gaps).

## The section scenes
Each section has an empty `<div class="stage" data-stage="...">` that marks where its scene sits: beside the text on laptops, above the text on phones. The names are `day` (the problem), `tower` (the system), `pages` (products), `tag` (calculator), `screen` (watch), `mail` (email list) and `core` (about). Delete a stage line in `index.html` to remove that scene. The scenes only draw while their section is on screen, and they lower their quality on slow devices.
