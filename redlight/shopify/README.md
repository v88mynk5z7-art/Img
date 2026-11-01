# Lumaré Duo — Shopify product page

The luxury Lumaré landing page rebuilt as a real Shopify product page:
16 theme sections + a product template. The buy box is a genuine Shopify
product form, Add to bag goes into the real Shopify cart, and checkout is
Shopify checkout. Every headline, image, review, FAQ and price label is
editable in the theme editor without code.

## Files

| File | What it is |
|---|---|
| `assets/lumare-styles.css` | The whole design system. Every class is `lumare-…`, every variable `--lm-…`, so nothing clashes with your theme. |
| `assets/lumare.js` | Reveal animations, ritual tabs, bundle picker, cart drawer (Shopify AJAX cart), mobile buy bar, email popup. |
| `snippets/lumare-assets.liquid` | Loads the CSS + JS (used by every section). |
| `snippets/lumare-price.liquid` | Prices without “.00” (£89, £74.50). |
| `snippets/lumare-icon.liquid` | Inline SVG icons. |
| `sections/lumare-*.liquid` | Offer bar, hero, scrolling text, statement, nose/ear tabs, how it works, science, features, comparison, reviews, **buy box**, guarantee, FAQ, final push, mobile buy bar, email popup. |
| `templates/product.lumare.json` | Puts all the sections in order with the page content filled in. |

Product photo: `../assets/img/device.png` (transparent cut-out — upload it as the product's main image).

## Set-up

### 1. Create the product
Products → Add product
- **Title:** Lumaré Duo Red Light Device for Nose & Ear
- **Option name:** Bundle, with three values **exactly**:
  - `1 Device` — £89
  - `2 Devices` — £149
  - `3 Devices` — £199
- **Media:** upload `device.png`
- **Theme template** (right-hand column): `lumare` (appears after step 2)

The bundle cards match variants by these exact names. If you rename a
variant, update that Bundle block's “Variant title” in the theme editor.
“Save £X” is calculated honestly against buying single devices.

### 2. Add the theme files
Online Store → Themes → your theme → **⋯ → Duplicate** (work on the copy) →
**⋯ → Edit code**, then create each file above in the matching folder and
paste its contents. Add the template last.

Or with Shopify CLI from this folder:
```
shopify theme push --theme <draft-theme-id> --nodelete \
  --only 'assets/lumare-*' --only 'snippets/lumare-*' \
  --only 'sections/lumare-*' --only 'templates/product.lumare.json'
```

### 3. Check it, then publish
Preview the duplicate theme on the product page. When happy, publish the
theme and set the product to Active.

## Before you go live
- **Reviews are sample content.** Replace them with genuine reviews or add a
  reviews app block (Judge.me, Loox…) to the Reviews section. Fake reviews are
  illegal in the UK (DMCC Act 2024) and the US (FTC rule).
- **Create the discount code `GLOW10`** (Discounts → Create) — the email popup
  promises it. Popup signups are saved to Shopify Customers with marketing consent.
- **Check every spec and offer is true:** 650nm, 10-minute timer, 3 levels,
  USB-C, what's in the box, free express shipping, 60-night trial, 2-year warranty.
- **Health claims:** keep the wellness wording and disclaimers. Don't claim it
  treats hay fever, sinusitis or tinnitus unless the device holds medical
  certification — Meta and TikTok will reject the ads otherwise.
- **Header colour:** for the full luxury look, set your theme header to a dark
  colour scheme in the theme editor.
