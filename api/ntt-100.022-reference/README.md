# NTT 100.022 reference API (hand-annotated)

Copied from `YAL-Game-Tools/bits-of-nuclear-throne` (`GMEdit/` directory, generated 2025-04-27, NTT 100.022). Superseded by `../ntt-100.034/` for names and signatures. Kept because:

- `api.gml` carries 126 hand-added argument type hints (`arg:index`, `:string`) that `/gmlapi` never emits. Merge them into the 100.034 signatures by argument *position* (names were changed, e.g. `obj_or_array` -> `obj`).
- `default.gml` lists the 57 built-in instance variables; `/gmlapi` does not produce it.
- `config.json` is the GMEdit dialect config for NTT (keyword list, feature flags).
- `raw-assets.gml` is the 100.022 asset list (clean, single file). Reference only.
