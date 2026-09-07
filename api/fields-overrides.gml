// NTGML object field overrides.
//
// Same syntax as `api/ntt-fields-2025-07-16/fields.gml` (see that folder's
// README): one `ObjectName { field, field }` entry per line, optionally with
// `: ParentName` before the brace. The `default` and `*` markers are accepted
// here too but are not needed: an entry in this file only adds fields, it
// never replaces an entry from the dump.
//
// `tools/generate-api.ts` parses this file last and merges it over the parsed
// fields.gml and the docs pages. Every field added here is marked
// `source: 'hand'` in `src/generated/object-fields.ts`. An object named here
// must exist in the 100.034 dump's object list; if it has no fields.gml entry
// it gets a new, parent-less one.
//
// Use it only for fields that are documented somewhere authoritative but are
// in neither the 2025-07-16 fields.gml nor the vendored
// `api/ntt-docs/objects/*.html` pages. Cite the source on each line.

// api/ntt-docs/Changelog.md:225-226 (100r1): "In NTT, new settings can be
// accessed through the `UberCont.opt` struct. Existing settings are kept as
// `UberCont.opt_*` for backwards compatibility."
// api/ntt-docs/Changelog.md:215 (100r1): "Mods can change these dynamically
// using `UberCont.custom` (enable/disable) and `UberCont.customMode` (custom
// mode struct)".
// `UberCont.tips` (Changelog.md:576) is NOT listed here: the vendored
// `api/ntt-docs/objects/UberCont.html` page already declares `tips: TipsStruct`.
UberCont { opt, custom, customMode }
