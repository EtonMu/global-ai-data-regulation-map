# Geographic data

`natural-earth-land-110m.json` is a GeoJSON snapshot of the Natural Earth **1:110m physical
land** layer. It contains physical land polygons and coastlines only; the globe
does not load or draw national, subnational, claimed, or disputed boundaries.

- Upstream project: <https://www.naturalearthdata.com/downloads/110m-physical-vectors/>
- Source snapshot: <https://github.com/nvkelso/natural-earth-vector/blob/v5.1.2/geojson/ne_110m_land.geojson>
- Terms: public domain, per <https://www.naturalearthdata.com/about/terms-of-use/>
- Snapshot tag: `v5.1.2`
- SHA-256: `9e0729ee253ca7d7a5c4ae9395fb1902264c5377c52e224d13dd85010e2835d9`

The client samples this published geometry with `d3-geo`'s `geoContains` to
produce land-filled point clouds. Selected coastline vertices are also rendered
as dots, never as boundary paths.
