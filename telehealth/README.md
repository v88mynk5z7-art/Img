# Aumbry: private online clinic storefront

A complete, multi-page storefront for a UK telehealth brand: prescription treatments sold through an online consultation, plus supplements, skincare and home blood tests sold directly. Plain HTML, CSS and JavaScript, so there is no build step.

Open `index.html` in a browser, or upload the `telehealth` folder to any static host (Netlify, Vercel, GitHub Pages).

## Pages

| Page | What it does |
|---|---|
| `index.html` | Home: hero, treatment areas, how it works, weight programme with dose chart, bestsellers, discreet delivery, clinical standards, FAQ |
| `shop.html` | All 17 products with category filters (`shop.html#weight`, `#hair`, `#sexual`, `#skin`, `#hormones`, `#wellness`, `#testing`), type filter and price sort |
| `product.html#<id>` | Product page: gallery, dose/strength picker, plan pricing, consultation or add-to-bag, details, safety, dose schedule, related products |
| `consultation.html` | 5-step clinical questionnaire. Includes a live BMI calculator (cm/kg or ft/st), condition-specific questions, contraindication screening and an eligibility result |
| `checkout.html` | Contact, delivery address, delivery options (chilled for pens), pharmacy questions for P medicines, order summary and confirmation |
| `account.html` | Patient portal (clearly labelled example data): current treatment, next delivery, weight progress chart, clinician messages, orders, blood results, details |
| `how-it-works.html`, `about.html`, `help.html`, `legal.html` | Process, brand and clinical governance, help centre with contact form, policy templates |

The bag works across every page and is saved in the browser.

## Editing products and prices

Everything lives in `assets/js/catalogue.js`: names, prices, doses, plans and discounts, descriptions, how-to-use notes and safety information. Every page reads from it.

`kind` controls how a product is sold:
- `rx`: prescription only. The button says "Start consultation".
- `p`: pharmacy medicine. Added to the bag, with pharmacist questions at checkout.
- `gsl`: general sale. Added straight to the bag.

## Design system

`assets/css/aumbry.css` holds every colour, font and spacing token at the top. The fonts are Bodoni Moda (display), Hanken Grotesk (body) and IBM Plex Mono (clinical labels), loaded from Google Fonts.

## Product photography

Every product image is a 3D studio render of Aumbry-branded packaging, made with the renderer in `tools/packaging-renderer`. To change the brand name, label text or colours and re-render:

```bash
cd tools/packaging-renderer
npm install
npx playwright install chromium
npm run render          # writes PNGs to ./out
```

Then resize the PNGs to 960×1200 JPEGs and put them in `assets/img/products/`. Label text and colours are in `specs.cjs`; the wordmark is in `render.js`. When you have real product photography, replace the files in `assets/img/` and keep the same names.

## Replace before launch

Everything in a cream highlight on the site is a placeholder.

- **Brand name.** "Aumbry" is a working name. Run a trademark search before using it.
- **Company and regulatory numbers** (footer, `legal.html`, `about.html`): company number, CQC provider ID, GPhC pharmacy registration, GMC number, ICO registration and clinical team names.
- **Emails**: `care@aumbry.health` and the placeholders in `legal.html`.
- **Prices**: in `catalogue.js`.
- **Legal text**: `legal.html` is a template. Have a solicitor and your clinical governance lead review it.

## What needs a back end before taking real patients

This is the complete front end. These parts show the full experience but don't send data anywhere yet:

1. **Payments.** The checkout marks where your payment provider's secure card form goes (for example Stripe or Shopify Payments). Prescription items should be authorised, then charged only after clinician approval.
2. **Consultations.** Answers must be stored securely and sent to a prescriber dashboard. Health data needs UK GDPR-compliant hosting.
3. **Identity checks**, patient accounts and sign-in links, clinician messaging, and the contact and newsletter forms.

## Compliance notes (UK)

- Advertising prescription-only medicines to the public is restricted in the UK (Human Medicines Regulations 2012, MHRA Blue Guide, ASA/CAP Code). The MHRA and ASA have acted against online clinics that promote weight-loss injections by name with prices. Have the product pages, and any ads pointing to them, reviewed by a regulatory specialist. A common approach is to present a condition and consultation first and show medicine names only after assessment.
- Online prescribing services must be registered with the CQC (England), and the dispensing pharmacy with the GPhC. Follow the GPhC guidance for registered pharmacies providing services at a distance, including over the internet.
- Supplement copy uses only authorised EFSA/GB health claims. Keep it that way when you edit.
- Clinical figures (SURMOUNT-1, STEP-1, the finasteride two-year data) are quoted from the published trials. Ask your medical director to check all clinical copy before launch.
