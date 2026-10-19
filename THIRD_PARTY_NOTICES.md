# Third-party data and attribution

## Taiwan administrative boundaries

- Upstream project: https://github.com/dkaoster/taiwan-atlas
- Pinned version: 2021.9.20; `towns-10t.json`.
- Project license: MIT. Full upstream notice: `dist/assets/taiwan-atlas-LICENSE.txt`.
- Original source: Ministry of the Interior, National Land Surveying and Mapping Center (內政部國土測繪中心).
- Original dataset: https://data.gov.tw/dataset/7441
- Original dataset terms: Open Government Data License, version 1 (政府資料開放授權條款第1版).

The topology is decoded into GeoJSON, retaining its historical administrative coverage. It is used for boundaries and a land mask; it is not a current cadastral boundary source.

## Terrain Tiles

- Dataset: https://registry.opendata.aws/terrain-tiles/
- Provider/project: Mapzen / Tilezen.
- Format and decoding: https://github.com/tilezen/joerd/blob/master/docs/formats.md
- Attribution and provider terms: https://github.com/tilezen/joerd/blob/master/docs/attribution.md
- Access date for bundled tiles: 2026-10-19.

SRTM and GMTED2010 terrain data courtesy of the U.S. Geological Survey.

Global ETOPO1 terrain data: DOC/NOAA/NESDIS/NCEI — National Centers for Environmental Information, NESDIS, NOAA, U.S. Department of Commerce.

The application decodes Terrarium elevations, applies a hypsometric color ramp, computes hillshade, and masks the result to the Taiwan land geometry. These visualization modifications are made by this project and are not presented as upstream data-provider endorsements. Other providers and territories have their own terms; consult the upstream attribution documentation before extending the bundled data to other regions.

## Application source

Application code is distributed under the MIT License in LICENSE, copyright 2026 Yu-Chun Hsiao, continuing the existing project's application license. This does not relicense any third-party datasets. The Taiwan Atlas notice is retained separately, and other providers retain their respective terms.
