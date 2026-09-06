// Generated at 1/1/2026 12:00:00 AM
// Hand-written fixture for tools/parse-api.ts. One line per annotation form
// from NTGML-SPEC.md section 5. Goldens: api.golden.json.
game_version = 100034

//{ Plain
plain(a, b)
returns(a):
returns_typed(x:number, y:number):number
pure_returns(x):#
no_args()
//}

//{ Prefixes
:self_only(x)
::self_and_other(etype, enumb)
:::self_maybe_other(inst)
${raw}raw_call(?inst, ?flag)
${raw}raw_typed(inst:instance):
//}

//{ Arguments
optional_q(a, ?b, ?c)
optional_brackets(str, delim, [remove_empty], [max_splits])
defaults(a, b=1, c="x", d=[])
rest_named(fmt, ...values)
rest_bare(fmt, ...)
unnamed_type(:sound, :color, r)
nested_default(a, b=array(1, 2), c=f(g(3), 4)):
generic_name<T>(v:T):T
//}

//{ Flags
deprecated_fn(x)&
uk_twin_colour(c)£
us_twin_color(c)$
feature_flagged(x)^flag
commented(x) // trailing comment is dropped
flag_soup(x)&£#:
//}

//{ Constants
plain_const = 1
string_const = "text"
negative_const = -3.5
hex_const = $FF
expr_const = 1 << 3 // comment after value
flagged_const#
deprecated_const#&
uk_twin_const#£
us_twin_const#$
typed_const#:int
//}

//{ Variables
plain_var
readonly_var*
typed_var:number
readonly_typed*:string
per_player[player]
per_player_readonly[player]*
uk_variable£
feature_var^flag
deprecated_var&
//}

//{ Nesting
outer_fn(a)
//{ inner group
inner_fn(b)
//}
after_inner(c)
//}

/* a block comment line is skipped */
* a continuation line is skipped
	indented_line_is_skipped(x)
