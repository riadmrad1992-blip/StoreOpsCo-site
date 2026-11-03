/*
  StoreOpsCo: your links live here.

  How to change them: open this file in Notepad, paste each link between the
  quotes (keep the quotes and the comma), then save. Refresh the page.
  Leave a value empty ("") and that button or section simply stays hidden.
*/
/*
  The latest long videos, newest first. The homepage shows the first 3.
  To add a new video, copy the first line, paste it at the top of the list and
  change the id and title. The id is the 11 characters after "v=" in the
  video's link (youtube.com/watch?v=xYTuBKvYrl0 -> "xYTuBKvYrl0").
*/
window.VIDEOS = [
  // Not public until Nov 7. Then remove the "//" below and delete the qESs1upqcWg line.
  // { id: "xYTuBKvYrl0", title: "Etsy Can Close Your Shop Overnight: Do These 3 Things Before It Happens" },
  { id: "qESs1upqcWg", title: "Etsy Pricing Strategy: I Priced a $10 Product Properly (It Should Be $19.53)" },
  { id: "BeY-vG3XrxE", title: "Etsy Price Calculator (Free): What Should Your Product Really Cost?" },
  { id: "UfcUz0_u0qY", title: "Etsy SEO 2026: How to Write Titles and Tags That Get Found" }
];

window.CONFIG = {
  // The address of this website once it is live, for example
  // "https://yourname.github.io/storeopsco-site/" or "https://storeopsco.com/".
  // Used for the share image and search engines. Include the https:// and the last slash.
  SITE_URL: "https://storeopsco.com/",

  // Your Etsy shop address. Not used on the product cards for now: every card says "Coming soon".
  ETSY_SHOP_URL: "",

  // Your YouTube channel address. Empty = the YouTube buttons are hidden.
  YOUTUBE_URL: "https://www.youtube.com/@storeopsco",

  // Your TikTok profile address. Empty = no TikTok link in the footer.
  TIKTOK_URL: "https://www.tiktok.com/@storeopsco",

  // Your Instagram profile address. Empty = no Instagram link in the footer.
  INSTAGRAM_URL: "",

  // Your LinkedIn profile or page address. Empty = no LinkedIn link in the footer.
  LINKEDIN_URL: "https://www.linkedin.com/in/riad-mrad-0980a9437",

  // The free Etsy price calculator. Already filled in. Change it only if the calculator moves.
  CALCULATOR_URL: "https://storeopsco.com/etsy-price-calculator/",

  // The page where people join your email list (a sign-up page from your email tool).
  // Used by the email sign-up box (signup-box.js). Empty = no sign-up button.
  EMAIL_SIGNUP_URL: "https://storeopsco.kit.com/a3fb02a7c9",

  // An email address people can write to, for example "hello@yourdomain.com".
  // Empty = no email shown in the footer.
  CONTACT_EMAIL: "",

  // Optional visitor counter that does not use cookies (for example Plausible or Umami).
  // Paste only the script address it gives you. Empty = no counter, no extra request.
  ANALYTICS_SCRIPT_SRC: "",

  // Extra settings that counter asks for, for example { "data-domain": "storeopsco.com" }.
  // Leave as {} if it asked for none.
  ANALYTICS_ATTRS: {}
};
