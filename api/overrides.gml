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
