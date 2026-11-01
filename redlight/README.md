# Lumaré — Red Light Therapy for Nose & Ear

A luxury, conversion-focused single-product store page for a red light nose & ear device.
Plain HTML / CSS / JS — no build step. Open `index.html` in a browser to view it.

## What's on the page
- Rotating offer bar, sticky header with cart
- Hero with product, star rating, benefit bullets, primary CTA and trust row
- Scroll-lit "why" statement, interactive Nose / Ear ritual tabs
- How it works (3 steps), the science (650nm spectrum visual), feature grid
- Comparison table, reviews, bundle picker with savings, add-to-bag
- 60-night guarantee, FAQ, final CTA, footer with newsletter
- Slide-out cart with quantity controls and an upgrade-to-bundle nudge
- Sticky "Shop now" bar on mobile, 10%-off email popup (once per visitor, after 25s or on exit intent)

## Make it yours
| What | Where |
|---|---|
| Brand name `Lumaré` | Search & replace in `index.html` |
| Prices, bundles, currency | `CONFIG` at the top of `assets/js/main.js` |
| Checkout link | `CONFIG.checkoutUrl` in `main.js` (Shopify cart permalink, Stripe Payment Link, etc.) |
| Delivery estimate | `CONFIG.deliveryDays` in `main.js` |
| Email signup | The two `TODO` lines in `main.js` (Klaviyo, Mailchimp, Shopify…) |
| Discount code `GLOW10` | `index.html` + `main.js` — create the matching code in your checkout |
| Contact email `hello@lumare.co` | `index.html` |
| Product image | `assets/img/device.png` / `.webp` (transparent cut-out) |

## Before you launch — important
- **Reviews and the 4.9 / 2,140+ rating are placeholders.** Replace them with real, verified customer reviews (or remove them). Fake reviews are illegal in the UK (DMCC Act 2024) and US (FTC rule).
- **Check every product spec** against your actual device: wavelength (650nm), session timer, 3 intensity levels, USB-C, what's in the box, battery life.
- **Offers must be real**: free express shipping, 60-night trial, 2-year warranty. Strike-through prices are calculated from the single-device price × quantity; only add a `compareAt` price if you genuinely sold at it.
- **Health claims**: the copy is written as a wellness device and avoids claiming to treat conditions (e.g. rhinitis, tinnitus). Don't add medical claims unless the device holds the right medical certification (UKCA/CE medical, FDA clearance). Keep the disclaimers.
- Add real Privacy Policy and Terms pages and link them in the footer.

## Publish for free
Drag the `redlight` folder into **Netlify Drop**, or deploy with **GitHub Pages** or **Vercel**.
