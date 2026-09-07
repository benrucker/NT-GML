// Generated at 1/2/2003 4:05:06 AM
// Format is `ObjectName : ParentName { ... variables }
// `default` means support for built-in variables (x, y, sprite_index, etc.)
// `*` means support for mod-defined variables.

// A root entry: `default` first, `*` last, no parent.
Root { default, alpha, beta, * }
// A child: the format repeats everything the parent lists.
Child : Root { default, alpha, beta, gamma, * }
// A grandchild, so the de-flattening walk has more than one step to make.
Grandchild : Child { default, alpha, beta, gamma, delta, * }
// A parent-less entry that shares a field name with the Root chain.
Loner { default, alpha, * }
// `default` is not always written first (fields.gml:Sapling does this).
Odd : Root { alpha, default, beta, epsilon, * }
// The one entry shape without `default` (fields.gml:GmlMod does this).
NoDefault { zeta, * }
// The one entry shape without `*` (fields.gml:UberCont is the mirror image).
NoStar { default, eta }
// A parent that has no entry of its own; the entry is a chain root anyway.
Orphan : NotHere { default, theta, * }
