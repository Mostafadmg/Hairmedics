# Hair Medics UK — redesign verification

Tested on 22 October 2026 in local headless Chromium 151. The final preview mirrored the GitHub Pages subdirectory at `/hairmedics-uk/`.

## Full route checks

90 built routes × 3 viewports = 270 browser checks:

- Desktop: 1440 × 900
- Tablet: 768 × 1024
- Mobile: 390 × 844

Every route returned HTTP 200, rendered exactly one H1, and loaded without page JavaScript exceptions. No horizontal document overflow, broken images, or failed local HTTP resources were observed. Product/policy source content contained no script, iframe or form nodes, event-handler attributes, or JavaScript links.

## Interaction checks

- Catalogue starts with all 52 products. Search for “minoxidil” returns the expected 30 matches; the Minoxidil category returns 29 products. Empty search results and clearing filters work.
- Price sorting works, and its selected label stays consistent after returning from the homepage.
- The tested 15% minoxidil pack options show £39.99 / £94.99 / £154.99 for 1 / 3 / 6 bottles and link to the existing shop with the correct pack query.
- Mobile navigation opens, closes with Escape and updates its accessible expanded state.
- Contact telephone, email, map and secure form links point to their expected destinations. FAQ disclosure controls work.
- Direct navigation, internal navigation and catalogue interactions work beneath the GitHub Pages subdirectory.
- At 320px, 360px and 390px, the homepage hero and header fit; home and shop pages have no horizontal overflow.
- The bestseller route returns the expected 3 products, direct query search returns 30 Minoxidil matches, and the custom 404 page renders with the correct asset base.

## Assets

All 57 product photographs (52 primary images and 5 gallery images) and their 57 4K exports exist. Every 4K export measures 4096 × 4096 pixels. All 114 web/4K asset URLs returned HTTP 200. Three representative generated product images were visually inspected for packaging clarity and studio-photo presentation.

The dermapen gallery has four photographs and the laser-comb gallery has three. Every thumbnail was clicked at desktop, tablet and mobile sizes; each loaded the expected main image and left exactly one button visually selected with `aria-pressed="true"`. No gallery overflow or failed resources were observed. The three downloadable SVG brand assets returned HTTP 200 and retain their download attributes. Password reset now has a reset-specific heading and call to action.

## Evidence

- `report.json`: all 270 route/viewport results.
- `interactions.json`: desktop, tablet and mobile interaction results.
- `prefix-small-width-checks.json`: 320px / 360px / 390px and subdirectory checks.
- `all-image-metadata.json`: 57 product photographs and 4K dimensions.
- `asset-statuses.json`: 114 successful web/4K asset requests.
- `gallery-checks.json`: gallery controls, SVG downloads and password-reset checks.
- `screenshots/`: final desktop, tablet and mobile screenshots of home, shop, product and legal pages.

## Limits

Purchases, payment processing, sign-in, contact submissions and medical assessment submissions were not performed. Those workflows continue through the existing secure Hair Medics UK service. The image generator's native outputs were exported/upscaled to the 4K dimensions; pixel dimensions do not imply newly generated native 4K detail.
