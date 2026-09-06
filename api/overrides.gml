// NTGML API overrides.
//
// Same syntax as the `/gmlapi` dump's `api.gml` (see NTGML-SPEC.md §5).
// `tools/generate-api.ts` parses this file last and merges it over the dump:
// an entry here replaces the dump's entry with the same name, and an entry
// with a name the dump does not have is added.
//
// Use it for signatures the dump gets wrong or leaves untyped, e.g.
//
//   :instance_create(x, y, obj:object):instance
//   #macro-ish constants are written as `name = value`
//
// Keep this file empty unless something is actually wrong: everything here is
// hand-maintained and will drift when the game updates.

// Neither of these carries the `&` flag in the dump, but the dump does say so
// in comments the parser never reads: api/ntt-100.034/api.gml:266 opens a
// `/// deprecated:` block, and the `// use ds_map_keys_to_array` /
// `// use ds_map_values_to_array` hints sit on :267 and :269, directly above
// the two declarations. The docs state it outright. Signatures below are
// copied verbatim from api/ntt-100.034/api.gml with the `&` flag appended.

// api/ntt-docs/scripting/API-DS.dmd:77 - "Deprecated, use `ds_map_keys_to_array`."
ds_map_keys(map, ?array):&
// api/ntt-docs/scripting/API-DS.dmd:80 - "Deprecated, use `ds_map_values_to_array`."
ds_map_values(map, ?array):&
