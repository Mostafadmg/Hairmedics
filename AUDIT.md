# Browser audit

Checked the original site and the redesign in local headless Chromium. Tests used desktop 1440×900, tablet 768×1024 and mobile 390×844. Additional targeted checks used 360px and 320px widths. No contact or assessment forms were submitted, payments made, or orders placed.

## Original site

- 88 distinct public URLs across desktop, tablet and mobile: 264 page checks.
- All returned HTTP 200; no JavaScript page exceptions or broken visible product images found.
- Three mobile product pages overflowed because of long or malformed product names.
- The mobile menu button was 32×19px, below a comfortable touch target.
- One Finasteride title incorrectly appended a Spironolactone product name.
- Variable product 1/3/6 bottle choices and the prices £39.99/£94.99/£154.99 were verified. Add-to-basket and removal were verified without checkout.
- Public policies contained inconsistent return information, unfinished legal identity fields, and older product claims that conflicted with newer prescribing qualifications.

## Redesign

- 90 routes across desktop, tablet and mobile: 270 page checks.
- Every route returns HTTP 200, contains one H1, and has no JavaScript page exceptions or horizontal page overflow at these sizes.
- Search, category filters, price/name sorting, empty results, product price options, links to the secure shop, contact links, FAQ expansion and mobile navigation were exercised in the browser.
- Product1/3/6bottle choices show the correct £39.99/£94.99/£154.99 prices and hand the selected option to the original product URL.
- Direct product URLs and navigation were checked beneath the GitHub Pages project prefix `/hairmedics-uk/`.
- Mobile headline clipping was fixed. 320px/360px category strip spacing was corrected.
- Source policy/product HTML has no scripts, embedded forms, iframes, event-handler attributes or JavaScript URLs.
- All 57 web product/gallery images and 57 square 4K exports passed HTTP and dimension checks. Gallery thumbnails, SVG downloads, and password reset were verified at all three main screen sizes.
- Product photographs are AI recreations. 4K assets are 4096×4096 exports upscaled from 1254×1254 native images.

## Scope and limits

This is a static storefront. Accounts, checkout, clinical assessments and booking continue through the existing Hair Medics UK site. It does not replace WooCommerce or its customer/order data. Browser coverage exercises loading, layout, images and the listed interactions; it is not a payment, clinical or legal compliance certification. The owner should reconcile the source policy inconsistencies and supply the missing legal business details.

Detailed machine-readable reports and screenshots remain in `/workspace/hairmedics-audit/browser/`.
