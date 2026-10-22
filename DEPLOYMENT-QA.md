# GitHub Pages prefix verification

The case-sensitive `/Hairmedics/` prefix passed targeted local browser checks at desktop 1440 × 900, tablet 768 × 1024 and mobile 390 × 844.

Home, shop, a deep product route, brand assets and the custom 404 page were rendered at all three sizes: 15 route/viewport checks. No page errors, failed HTTP resources, broken images, incorrect local asset prefixes or horizontal overflow were observed.

Internal home → shop → product → home navigation retained `/Hairmedics/`. Searching Minoxidil returned 30 matches. The 3-bottle option showed £94.99 and linked to the existing secure shop with the correct pack query. Brand SVG downloads returned HTTP 200. The 404 page used `/Hairmedics/` as its asset base. All 90 sitemap URLs start with `https://mostafadmg.github.io/Hairmedics/`.

Evidence: `new-prefix-report.json`. The earlier full 90-route, three-viewport QA remains applicable; this check covers the hosting-prefix change. Live GitHub Pages availability is not established by local testing.
