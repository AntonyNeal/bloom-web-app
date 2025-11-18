Sunflower Logo Assets

Files created:

- assets/sunflower-logo.svg — master vector logo (transparent background)
- assets/sunflower-logo-square.svg — square logo with white rounded background (1200x1200 viewBox)
- assets/sunflower-logo-landscape.svg — landscape logo (1200x300 viewBox, 4:1)

Why these files?

- Google Ads (Responsive and Image ads) commonly accept square logos and wide logos (4:1). Having vector SVGs lets you export to the exact pixel dimensions required.

Recommended export sizes for Google Ads:

- Square logo: 1200x1200 (recommended), also provide 512x512 and 120x120 for smaller slots
- Landscape: 1200x300 (4:1). Also provide 600x150 for smaller needs

Export tips (if you have Inkscape or ImageMagick):

- Inkscape (GUI) — open the SVG, then export PNG at target pixel size.
- ImageMagick (CLI) — if you have a rasterizer that supports SVG (e.g., ImageMagick + librsvg), you can run:
  magick convert assets/sunflower-logo-square.svg -resize 1200x1200 assets/sunflower-logo-1200x1200.png
  magick convert assets/sunflower-logo-landscape.svg -resize 1200x300 assets/sunflower-logo-1200x300.png

Notes & accessibility:

- The SVGs include role and aria-label attributes for accessibility when embedded inline.
- The square asset includes a white rounded background to ensure logo legibility against dark ad backgrounds. If you prefer a transparent PNG, export the master `sunflower-logo.svg` and place it over your ad background.

Licensing & ownership:

- These assets were programmatically generated for your project; you may use and modify them as you need.

If you want, I can:

- Export PNG versions at the exact sizes you need and add them to `assets/` (if you confirm which sizes you want).
- Add a version with your brand name / wordmark as text beside the sunflower (SVG editable).
- Create a white-on-transparent variant for dark backgrounds.

Which of the above would you like next? (I can export PNGs for you or add text/wordmark.)
