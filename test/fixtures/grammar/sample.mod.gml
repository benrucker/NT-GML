#pragma include lib/helpers.gml
#pragma using other_mod.mod
#pragma preload data/table.txt
#pragma bogus 1

#macro MAX_HP 20
#macro release:BUILD_TAG "final"
#macro LONG_LIST [ \
	wep_electric_guitar, \
	wep_revolver ]

/// A doc comment: the loader ignores it, the editor does not.
// A plain comment.
/* A block
   comment. */

#define init
	#pragma fast
	global.hp = MAX_HP;
	global.tint = $ff8040;
	global.mask = 0xDE_AD;
	global.bits = 0b1010_0101;
	global.frac = .5;
	global.big = 1_000.25;
	global.name = "a string";
	global.other = 'legacy single quotes';
	global.tmpl = `hp ${global.hp + 1} of $MAX_HP`;
	global.grid = ds_grid_create(4, 4);
	global.map = ds_map_create();
	global.list = ds_list_create();
	trace("loaded " + string(global.hp));

#define cleanup
	ds_grid_destroy(global.grid);

#define step
	#pragma not_fast
	if instance_exists(Player) and not (global.hp <= 0) then {
		global.hp = min(global.hp + 1, MAX_HP);
	} else if global.hp <> 0 or global.hp == MAX_HP {
		global.hp = global.hp ?? 0;
		global.hp ??= 1;
	}
	with (Player) {
		if "wep" in self && wep = wep_electric_guitar {
			mutation_get(mut_throne_butt);
		}
		if not "ammo" in other {
			exit;
		}
	}
	var near = instance_nearest_nonself(x, y, Bandit);
	var pick = global.hp > 10 ? char_fish : char_crystal;
	var slot = global.grid[# 1, 2] + global.map[? "key"] + global.list[| 0];
	var raw = global.arr[@ 0];
	repeat (3) {
		wait 1;
	}
	fork();
	if crown_current == crwn_death and GameCont.area == area_desert {
		sound_play(sndAllyDead);
		draw_set_font(fntSmall);
		shader_set(shd16);
	}
	try {
		throw "bad";
	} catch (e) {
		trace(e);
	}

#define chat_command(cmd, arg)
	if cmd == "hp" {
		global.hp = real(arg) mod 100 div 2;
	}

#define my_helper(a, b)
	return a + b;

#define member_access
	// A name after a `.` is a field of that instance, not the built-in of the
	// same name - unless it is called, in which case it is an API method.
	global.frac = 1;
	other.sprite_index = bak0;
	var near = instance_nearest_nonself(x, y, Bandit);
	near.alarm_set(0, 30);
	near.my_own_field = 1;
	global . spaced = 2;

#define values_and_bitwise
	global.ok = true;
	global.n = undefined;
	global.nothing = null;
	global.z = pi + infinity;
	global.bad = NaN;
	global.bits = (b & c) | (d ^ e) | ~f | (g << 2) | (h >> 1);
	once trace("the first time only");

#define spawn_custom
	var inst = instance_create(x, y, CustomHitme);
	inst.on_death = my_helper;
	inst.maxhealth = 10;
	return inst;

#region folded
#endregion
