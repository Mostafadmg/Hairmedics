# Hair Medics UK

A complete static redesign prepared for GitHub Pages. Includes 52 product pages, 12 categories, search, filters, sorting, exact priced options, service and policy pages, and a brand gallery with 4K image downloads.

GitHub repository: `Mostafadmg/Hairmedics`. Pages address: `https://mostafadmg.github.io/Hairmedics/`.

## Run locally

```sh
node build.cjs
python3 -m http.server 4173
```

Open `http://localhost:4173/`. There are no dependencies to install and no external services required for rendering. Fonts and images are self hosted.

## Publish with GitHub Pages

Upload this directory to an empty repository. In **Settings → Pages → Build and deployment**, select **Deploy from a branch**, branch **main**, folder **/ (root)**, and save. The `.nojekyll` file keeps the static files unchanged.

All page links support a project subdirectory. If the GitHub username or repository name changes, set `SITE_URL` when running the build or update the default public URL in `build.cjs`; the sitemap and 404 asset base use that URL.

## Commerce and medical services

GitHub Pages serves the catalogue and information pages. Ordering, accounts, assessments, personal information, and payments continue through the existing secure Hair Medics UK WooCommerce service. Product option selections are passed to the original product page. This does not replace the checkout backend or migrate customer records.

## Brand

- Forest `#243e35`, sage `#dfe5d7`, ivory `#f8f7f3`, ink `#26342e`.
- Libre Caslon Display for expressive headlines; DM Sans for interfaces and body copy.
- Voice: calm, clear, personal, specific. No invented testimonials, medical credentials, guarantees, or statistics.
- Wordmark: `assets/logo.svg`; monogram: `assets/favicon.svg`.
- Visit `/brand/` for the visual brand foundations and image downloads.

## Photography

All 52 catalogue visuals, five additional gallery angles, and the homepage hero were generated from the original source imagery and service subjects. Native square image output is 1254×1254. The catalogue and gallery WebP files in `assets/4k/` are **4096×4096 upscaled exports**, not native 4K generations. `assets/products/` contains optimised web images. Native generated PNG files remain in the local ignored `assets/masters/` directory.

AI image labels can differ slightly from actual packaging. Product text, supplied packaging, and clinician directions remain authoritative. The source site has not been modified.

## Source and content

Source: https://hairmedicsuk.shop, audited in this workspace. Product prices and 62 variants were captured from the public WooCommerce data. Three zero-price, non-purchasable products display “Contact for availability”. The concatenated Finasteride product name was corrected. Old unsupported concentration comparisons were removed in favour of source prescribing qualifications. Public source policies contained inconsistent return details and unfinished legal business identification; the owner should resolve those with the service operator. The source policy links remain available.

See `AUDIT.md` for browser coverage and verification limits.
