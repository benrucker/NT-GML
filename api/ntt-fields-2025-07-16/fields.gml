// Generated at 7/16/2025 10:37:04 PM
// Format is `ObjectName : ParentName { ... variables }
// `default` means support for built-in variables (x, y, sprite_index, etc.)
// `*` means support for mod-defined variables.
Player : hitme { default, footstep, chickencorpse, frogcharge, rogueammo, canspec, notoxic, spr_sit1, horrornorad, snd_hurt, curse, swapmove, spr_idle, spr_hurt, lsthealth, snd_cptn, bleed, typ_amax, sprite_angle, wkick, spr_dead, snd_spch, joyx, can_shoot, gunshine, nearwep, roll, snd_dead, aimDirection, joyaimx, horrorstopsnd, hammering, reloadspeed, infammo, wepflip, p, race, snd_lowa, spr_walk, canswap, interfacepop, bwep, hammerhead, canwalk, drawlowhp, spr_shadow_y, lasthit, alias, clicked, bwepangle, snd_chst, specfiring, canspirit, snd_thrn, wave, spiriteffect, chickendeaths, canaim, canscope, maxhealth, accuracy, usespec, smoke, gunangle, wepangle, stream_submit, canrogue, dogammo, size, wepright, bwepflip, safeheadloss, prepareScoreGet, drawemptyb, joyaimy, candie, binterfacepop, reload, showhp, canpick, spr_sit2, snd_crwn, turn, bcan_shoot, breload, joyy, typ_name, back, snd_idpd, bwkick, footextra, bskin, spr_fire, raddrop, snd_valt, ammo, team, bcurse, footkind, drawempty, wep, boilcap, typ_ammo, maxspeed, right, horrorcharge, race_id, spr_shadow_x, snd_lowh, angle, my_health, nexthurt, canfire, canfeet, snd_wrld, spr_shadow, index, * }
GammaBlast { default, creator, team, * }
CrystalShield { default, spr_shadow_y, creator, walk, time, bskin, team, spr_shadow_x, spr_shadow, * }
CrystalShieldDisappear { default, creator, bskin, * }
Crown { default, spr_idle, spr_walk, spr_shadow_y, new, walking, maxspeed, spr_shadow_x, spr_shadow, * }
TangleSeed : projectile { default, deflected, p, damage, creator, hitid, bskin, force, team, typ, * }
Tangle { default, p, creator, bskin, team, typ, * }
Sapling : hitme { target, default, snd_hurt, spr_idle, spr_hurt, wkick, spr_dead, snd_dead, spr_walk, snd_mele, spr_shadow_y, maxhealth, size, creator, walk, spr_fire, raddrop, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
Ally : hitme { target, default, snd_hurt, spr_idle, spr_hurt, wkick, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, gunangle, size, creator, walk, spr_fire, raddrop, gunspr, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
ThrownWep : projectile { default, curse, deflected, rotspeed, damage, creator, hitid, force, team, typ, wep, * }
RogueStrike { default, p, creator, index, * }
RogueBomb { default, team, * }
SharpTeeth { default, damage, creator, * }
DogMissile : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, corpse, size, creator, hitid, canfly, spr_fire, raddrop, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, index, * }
Revive { default, rogueammo, canrevive, p, race, savior, revivetime, bwep, hammerhead, chickendeaths, maxhealth, corpse, ammo, revive, wep, * }
PlayerSit { default, spr_sit1, spr_idle, snd_cptn, snd_spch, spr_sit2, bskin, * }
UberCont { default, opt_freeze, hardmode, opt_bossintros, opt_shake }
BackCont { default, shadalpha, shadcol, followspd, * }
GameCont { default, hqseed, seenhq, novans, wepmuts, wepseed, junglevisits, waypoints, crown, subarea, proto, nochest, lastarea, radmaxextra, hard, popolevel, areanum, patseed, crownpoints, candestiny, lastsubarea, baseseed, endpoints, kills, gameovertext, wepdrops, junseed, canspirit, droppedsword, rad, skillpoints, codpick, crownvisits, win, levseed, demoend, loops, area, horror, atseed, mutindex, endcount, mutseed, gameseed, norads, killenemies, endskill, patpick, deathcause, wepmuted, codseed, vaults, timer, droppedguitar, level, junpick, endgame, hud_patience, ultra_post, * }
TopCont { default, fogscroll, darkness, fade, go_stage, go_addy2, wave, fadeout, go_addy1, mapanim, dead, gameovertime, fog, gameoversplat, * }
GenCont { default, spawn_y, safedist, agol, rgol, gol, wgol, spawn_x, safespawn, tip, goal, * }
MenuGen { default, * }
SpiralCont { default, wave, area, charn, time, type, seed, active, * }
Spiral { default, colors, langle, grow, type, lsound, lanim, seed, * }
SpiralDebris { default, dist, rotspeed, sound, grow, area, turnspeed, angle, seed, * }
SpiralStar { default, dist, grow, angle, * }
NothingSpiral { default, * }
BanditBoss : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, shot, chargewait, sndhalfhp, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, gunangle, tauntdelay, corpse, size, walk, hitid, canfly, charge, spr_fire, raddrop, sndtaunt, ammo, intro, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
WantBoss : becomenemy { target, default, number, enemies, * }
BecomeScrapBoss : prop { target, default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, timer, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
ScrapBossMissile : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, corpse, size, anim, hitid, canfly, spr_fire, raddrop, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
ScrapBoss : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, sndhalfhp, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, gunangle, i, tauntdelay, corpse, obj, size, walk, turn, hitid, canfly, spr_fire, raddrop, sndtaunt, ammo, intro, team, spr_chrg, right, dir, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
BigDogExplo { default, spr_shadow_y, size, hitid, spr_shadow_x, spr_shadow, * }
LilHunterDie { default, trn, bounces, hitid, team, typ, * }
WantLH : becomenemy { default, * }
LHBouncer : projectile { default, deflected, damage, creator, rot, bounce, hitid, force, team, typ, * }
LilHunter : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, sndhalfhp, z, spr_walk, kills, snd_mele, spr_shadow_y, dodge, maxhealth, gunangle, tauntdelay, corpse, size, walk, hitid, canfly, spr_fire, raddrop, sndtaunt, intro, spawns, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
LilHunterFly : becomenemy { default, z, spr_shadow_y, spr_shadow_x, spr_shadow, * }
Nothing : enemy { introwalk, dmg, target, default, footstep, canmelee, snd_hurt, flanim, spr_idle, spr_hurt, wepseed, addangle, wkick, spr_dead, snd_dead, sndhalfhp, mode, spr_walk, kills, snd_mele, targetx, spr_shadow_y, wave, maxhealth, tauntdelay, corpse, size, walkdir, flame, walk, hitid, canfly, spr_fire, raddrop, sndtaunt, ammo, team, spr_chrg, right, targety, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
NothingInactive : prop { default, snd_hurt, flanim, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, flame, hitid, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, active, * }
Generator : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
NothingIntroMask : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
BecomeNothing { default, deadanim, hitid, team, * }
NothingDeath { default, hitid, raddrop, * }
ThroneStatue : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
GeneratorInactive : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
ThroneBeam : EnemyBullet1 { default, deflected, damage, creator, hitid, force, team, typ, * }
BigGuardianBullet : EnemyBullet1 { default, deflected, damage, creator, hitid, force, team, typ, * }
Carpet { default, * }
SitDown { default, * }
NothingBeam { default, disappear, snd, creator, anim, hitid, charge, team, * }
BecomeNothing2 : becomenemy { default, hitid, active, * }
Nothing2Death { default, hitid, raddrop, * }
Throne2Ball : EnemyBullet1 { default, deflected, timeout, damage, creator, hitid, force, team, typ, angle, * }
Nothing2 : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, aimdir, side, sndhalfhp, spr_walk, kills, snd_mele, spr_shadow_y, shots, maxhealth, tauntdelay, corpse, size, walkdir, walk, flip, hitid, canfly, attack, spr_fire, raddrop, sndtaunt, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
FrogQueenBall : EnemyBullet1 { default, deflected, damage, creator, hitid, force, team, typ, * }
FrogEgg : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
FrogQueenDie { default, spr_shadow_y, size, hitid, team, spr_shadow_x, spr_shadow, * }
FrogQueen : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, sndhalfhp, sndlowhp, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, tauntdelay, corpse, size, walk, hitid, canfly, spr_fire, raddrop, sndtaunt, ammo, intro, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
HyperCrystal : enemy { target, default, fastspin, dist, canmelee, snd_hurt, cnumber, spr_idle, spr_hurt, wepseed, wkick, spr_dead, crystals, snd_dead, sndhalfhp, sndlowhp, spr_walk, kills, snd_mele, spr_shadow_y, nospin, maxhealth, wantdist, tauntdelay, corpse, size, hitid, canfly, spr_fire, raddrop, sndtaunt, intro, team, spr_chrg, crystal, right, spr_shadow_x, angle, my_health, nexthurt, meleedamage, spr_shadow, * }
NecroReviveArea { default, * }
TechnoMancer : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, drawspr, corpse, size, main, hitid, canfly, spr_fire, raddrop, drawimg, intro, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
LastBall : EnemyBullet1 { default, deflected, damage, creator, hitid, force, team, typ, * }
LastIntro : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, transtime, spr_shadow_y, maxhealth, size, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
BigTV : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
LastCutscene : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
Last : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, sndhalfhp, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, gunangle, drawspr, tauntdelay, corpse, size, walk, attacktype, introcharge, hitid, canfly, charge, spr_fire, raddrop, sndtaunt, ammo, drawimg, intro, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
Messenger { default, spr_shadow_y, walk, maxspeed, spr_shadow_x, spr_shadow, * }
LastFire { default, * }
LastExecute : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
LastDie { default, spr_shadow_y, hitid, team, spr_shadow_x, spr_shadow, * }
DramaCamera { default, * }
BigFish : enemy { target, default, canmelee, mydir, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, gunangle, corpse, size, walk, canfly, hitid, spr_fire, raddrop, ammo, spawns, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
FloorMaker { dst, default, trn, diy, goal, dix, styleb, * }
NOWALLSHEREPLEASE { default, * }
Wall { l, default, h, topindex, outspr, r, topspr, area, outindex, w, * }
InvisiWall { default, * }
Floor { default, material, area, traction, styleb, * }
SnowFloor { default, * }
FloorMiddle { default, * }
PizzaEntrance { default, * }
FloorExplo : Floor { default, material, area, traction, styleb, * }
CharredGround { default, * }
Scorch { default, * }
ScorchGreen { default, * }
ScorchTop { default, * }
Portal { default, type, timer, endgame, * }
BigPortal : Portal { default, type, timer, endgame, * }
Top { default, * }
TopSmall { default, area, active, * }
Detail { default, * }
VenuzCarpet { default, * }
SpawnWall { default, dir, * }
ProtoStatue : prop { default, snd_hurt, spr_idle, spr_hurt, charged, spr_dead, snd_dead, canim, spr_walk, spr_shadow_y, rad, maxhealth, size, anim, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
Barrel : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
ToxicBarrel : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
GoldBarrel : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
WaterMine : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
MineExplosion { default, team, * }
Car : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
CarVenus : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
CarVenusFixed : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, spr_shadow_x, my_health, nexthurt, name, spr_shadow, * }
CarVenus2 : CarVenusFixed { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, spr_shadow_x, my_health, nexthurt, name, spr_shadow, * }
Campfire : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
LogMenu : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
Cactus : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
PlantPot : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
Bush : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
TutorialTarget : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
BigFlower : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
IceFlower : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, feed, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, spr_shadow_x, my_health, nexthurt, name, spr_shadow, * }
WaterPlant : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
LightBeam { default, * }
Pipe : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
OasisBarrel : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
Chandelier : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
Pillar : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, dir, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
SmallGenerator : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
Table : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, dir, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
Server : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
Terminal : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
YungCuz { default, wepsound, spr_idle, spr_heya, spr_to, chestsound, spr_from, * }
VenuzTV : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
VenuzCouch : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
TV : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, pushpow, size, myscreen, anim, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, tv, * }
SodaMachine : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
Hydrant : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
StreetLight : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
BigSkull : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
BonePile : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
BonePileNight : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
Anchor : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
NightCactus : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
CrystalProp : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
InvCrystal : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
Tube : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
MutantTube : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
YVStatue : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
MoneyPile : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
Tires : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
PizzaBox : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
Torch : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, creator, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
Cocoon : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, ang, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
SnowMan : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
Bones { default, * }
prop : hitme { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
TopPot { default, dir, * }
TopDecalCity : TopPot { default, dir, * }
TopDecalPalace : TopPot { default, dir, * }
TopDecalSewers : TopPot { default, dir, * }
TopDecalPizzaSewers : TopPot { default, dir, * }
TopDecalCave : TopPot { default, dir, * }
TopDecalInvCave : TopPot { default, dir, * }
TopDecalDesert : TopPot { default, dir, * }
TopDecalJungle : TopPot { default, dir, * }
TopDecalNightDesert : TopPot { default, dir, * }
TopDecalScrapyard : TopPot { default, dir, * }
BouncerBullet : projectile { default, deflected, damage, creator, rot, bounce, hitid, force, team, typ, * }
Bullet1 : projectile { default, spr_dead, deflected, damage, creator, hitid, force, team, typ, * }
AllyBullet : projectile { default, deflected, damage, creator, hitid, force, team, typ, * }
UltraBullet : projectile { default, deflected, damage, creator, hitid, force, team, typ, * }
HeavyBullet : projectile { default, deflected, damage, creator, hitid, force, team, typ, * }
Burst { default, creator, time, ammo, team, * }
GoldBurst { default, creator, time, ammo, team, * }
HeavyBurst { default, creator, time, ammo, team, * }
HyperBurst { default, delay, creator, time, ammo, team, * }
RogueBurst { default, creator, time, ammo, team, * }
SentryGun : hitme { default, snd_hurt, spr_idle, spr_hurt, wkick, spr_dead, snd_dead, sticky, spr_walk, spr_shadow_y, maxhealth, gunangle, size, walk, raddrop, ammo, team, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
Slash : projectile { default, deflected, walled, damage, creator, hitid, force, team, typ, * }
GuitarSlash : projectile { default, deflected, walled, snd, damage, creator, hitid, force, team, typ, * }
BloodSlash : projectile { default, damaged, deflected, walled, damage, creator, hitid, force, team, typ, * }
EnergySlash : projectile { default, deflected, walled, damage, creator, hitid, force, team, typ, * }
Shank : projectile { default, canfix, deflected, damage, creator, hitid, force, team, typ, * }
EnergyShank : projectile { default, deflected, damage, creator, hitid, force, team, typ, * }
SawBurst { default, delay, creator, time, ammo, team, * }
EnergyHammerSlash : projectile { default, deflected, walled, damage, creator, hitid, force, team, typ, * }
LightningSlash : projectile { default, deflected, walled, damage, creator, hitid, force, team, typ, * }
Bolt : projectile { default, deflected, canhurt, damage, creator, hitid, force, team, typ, * }
Seeker : projectile { default, deflected, damage, creator, hitid, force, team, typ, * }
HeavyBolt : projectile { default, deflected, canhurt, damage, creator, hitid, force, team, typ, * }
ToxicBolt : projectile { default, deflected, canhurt, damage, creator, hitid, force, team, typ, * }
Splinter : projectile { default, deflected, canhurt, damage, creator, hitid, force, team, typ, * }
Disc : projectile { default, dist, sprite_angle, deflected, damage, creator, hitid, force, team, typ, * }
UltraBolt : projectile { default, deflected, canhurt, damage, creator, hitid, force, team, typ, * }
SplinterBurst { default, delay, creator, time, ammo, team, * }
LightningBall : projectile { default, deflected, snd, damage, creator, hitid, force, team, typ, * }
PlasmaBall : projectile { default, deflected, damage, creator, hitid, force, team, typ, * }
PlasmaBig : projectile { default, deflected, damage, creator, hitid, force, team, typ, * }
Lightning : projectile { default, deflected, damage, creator, hitid, ammo, force, team, typ, * }
IonBurst { default, targetx, delay, creator, time, ammo, team, targety, * }
LaserCannon { default, delay, damage, creator, time, hitid, ammo, force, team, * }
Laser : projectile { default, deflected, img, damage, creator, hitid, force, team, typ, * }
Devastator : projectile { default, deflected, damage, creator, hitid, force, team, typ, * }
PlasmaImpact { default, damage, creator, hitid, force, team, * }
PlasmaHuge : projectile { default, deflected, damage, creator, hitid, force, team, typ, * }
Explosion { default, ang, damage, hitid, force, team, * }
GreenExplosion : Explosion { default, ang, damage, hitid, force, team, * }
SmallExplosion : Explosion { default, ang, damage, hitid, force, team, * }
FlameBall : projectile { default, deflected, snd, damage, creator, hitid, force, team, typ, * }
NadeBurst { default, delay, creator, time, ammo, team, * }
ToxicDelay { default, creator, team, * }
DragonBurst { default, delay, creator, time, ammo, team, * }
ToxicGrenade : Grenade { default, offx, deflected, sticky, damage, creator, offy, hitid, force, team, typ, * }
Grenade : projectile { default, offx, deflected, sticky, damage, creator, offy, hitid, force, team, typ, * }
HeavyNade : Grenade { default, offx, deflected, sticky, damage, creator, offy, hitid, force, team, typ, * }
BloodGrenade : Grenade { default, offx, deflected, sticky, damage, creator, offy, hitid, force, team, typ, * }
BloodBall : Grenade { default, offx, deflected, sticky, spin, snd, damage, creator, offy, hitid, force, team, typ, * }
Flare : Grenade { default, offx, deflected, sticky, damage, creator, offy, hitid, force, team, typ, * }
ClusterNade : Grenade { default, offx, deflected, sticky, damage, creator, offy, hitid, force, team, typ, * }
ConfettiBall : Grenade { default, offx, deflected, sticky, mycol, damage, creator, offy, hitid, force, team, typ, * }
HyperGrenade : projectile { default, deflected, damage, creator, hitid, force, team, typ, * }
MiniNade : Grenade { default, offx, deflected, sticky, damage, creator, offy, hitid, force, team, typ, * }
Nuke : projectile { default, deflected, snd, damage, creator, hitid, force, team, typ, active, index, * }
UltraGrenade : Grenade { default, offx, deflected, sticky, damage, creator, offy, sucksnd, hitid, force, team, typ, * }
Rocket : projectile { default, deflected, snd, damage, creator, hitid, force, team, typ, active, * }
MeatExplosion { default, damage, hitid, force, team, dir, * }
Mine { default, offx, offy, * }
ToxicBurst { default, delay, creator, time, ammo, team, * }
DragonSound { default, timeout, * }
FlameBurst { default, delay, creator, time, ammo, team, * }
FlameSound { default, timeout, * }
Flame : projectile { default, deflected, damage, creator, hitid, force, team, typ, * }
Bullet2 : projectile { default, wallbounce, deflected, bonus, damage, creator, hitid, force, team, typ, * }
FlameShell : projectile { default, wallbounce, deflected, bonus, damage, creator, hitid, force, team, typ, * }
HeavySlug : projectile { default, wallbounce, deflected, bonus, damage, creator, hitid, force, team, typ, * }
UltraShell : projectile { default, wallbounce, deflected, bonus, damage, creator, hitid, force, team, typ, * }
SuperFlakBullet : projectile { default, deflected, bonus, damage, creator, hitid, force, team, typ, * }
FlakBullet : projectile { default, deflected, bonus, damage, creator, hitid, force, team, typ, * }
Slug : projectile { default, wallbounce, deflected, bonus, damage, creator, hitid, force, team, typ, * }
HyperSlug : projectile { default, wallbounce, deflected, bonus, damage, creator, hitid, force, team, typ, * }
WaveBurst { default, delay, creator, time, ammo, team, * }
SlugBurst { default, creator, time, ammo, team, * }
PopBurst { default, creator, time, ammo, team, * }
projectile { default, deflected, damage, creator, hitid, force, team, typ, * }
BECOMETARGET { default, creator, * }
RadMaggot : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, corpse, size, hitid, canfly, spr_fire, raddrop, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
GoldScorpion : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, gunangle, corpse, size, walk, hitid, canfly, spr_fire, raddrop, ammo, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
MaggotSpawn : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, corpse, size, canfly, hitid, spr_fire, raddrop, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
BigMaggot : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, rage, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, corpse, size, hitid, canfly, spr_fire, raddrop, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
Maggot : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, corpse, size, hitid, canfly, spr_fire, raddrop, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
Scorpion : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, gunangle, corpse, size, walk, hitid, canfly, spr_fire, raddrop, ammo, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
Bandit : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, gunangle, corpse, size, walk, hitid, canfly, spr_fire, raddrop, gunspr, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
EnemyBullet1 : projectile { default, deflected, damage, creator, hitid, force, team, typ, * }
FireBall : projectile { default, deflected, damage, creator, hitid, force, team, typ, * }
EnemyBullet2 : EnemyBullet1 { default, deflected, damage, creator, hitid, force, team, typ, * }
MaggotExplosion : becomenemy { default, dir, * }
RadMaggotExplosion : becomenemy { default, dir, * }
BigMaggotBurrow : becomenemy { default, right, * }
Mimic : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, corpse, size, hitid, canfly, spr_fire, raddrop, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
SuperFrog : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, close, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, corpse, size, hitid, canfly, spr_fire, raddrop, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
Exploder : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, close, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, corpse, size, hitid, canfly, spr_fire, raddrop, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
Gator : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, gunangle, corpse, size, walk, hitid, canfly, spr_fire, raddrop, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
BuffGator : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, gunangle, corpse, size, walk, hitid, canfly, spr_fire, raddrop, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
Ratking : enemy { target, default, canmelee, mydir, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, gunangle, corpse, size, walk, hitid, canfly, spr_fire, raddrop, ammo, spawns, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
GatorSmoke : prop { target, default, snd_hurt, spr_idle, spr_hurt, wkick, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, gunangle, size, walk, hitid, raddrop, team, timer, right, spr_shadow_x, my_health, nexthurt, spr_shadow, meleedamage, * }
Rat : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, corpse, size, walk, hitid, canfly, spr_fire, raddrop, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
FastRat : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, corpse, size, walk, hitid, canfly, spr_fire, raddrop, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
RatkingRage : enemy { target, default, canmelee, mydir, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, gunangle, corpse, size, walk, hitid, canfly, spr_fire, raddrop, ammo, spawns, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
EFlakBullet : projectile { default, deflected, bonus, damage, creator, hitid, force, team, typ, * }
EnemySlash : projectile { default, deflected, damage, creator, hitid, force, team, typ, * }
EnemyBullet3 : projectile { default, wallbounce, deflected, damage, creator, hitid, force, team, typ, * }
ToxicGas : projectile { default, deflected, growspeed, damage, creator, rot, hitid, force, team, typ, * }
MeleeBandit : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, wepflip, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, gunangle, wepangle, corpse, size, walk, hitid, canfly, spr_fire, raddrop, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
MeleeFake : prop { target, default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, wepflip, spr_walk, spr_shadow_y, maxhealth, gunangle, wepangle, size, walk, hitid, raddrop, team, right, spr_shadow_x, my_health, nexthurt, spr_shadow, meleedamage, * }
SuperMimic : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, corpse, size, hitid, canfly, spr_fire, raddrop, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
Sniper : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, gunangle, corpse, size, gonnafire, walk, hitid, canfly, spr_fire, raddrop, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
Raven : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, nofly, z, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, gunangle, corpse, size, walk, hitid, canfly, spr_fire, raddrop, ammo, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
RavenFly : becomenemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wkick, spr_dead, snd_dead, nofly, z, spr_walk, kills, snd_mele, targetx, spr_shadow_y, maxhealth, gunangle, corpse, size, walk, hitid, canfly, spr_fire, raddrop, ammo, team, spr_chrg, right, targety, spr_shadow_x, nexthurt, meleedamage, spr_shadow, * }
Trap { default, fire, side, delay, hitid, * }
Salamander : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, spr_walk, kills, snd_mele, spr_shadow_y, wave, maxhealth, gunangle, corpse, myloop, size, walk, hitid, canfly, spr_fire, raddrop, ammo, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
EnemyBullet4 : projectile { default, deflected, damage, creator, hitid, force, team, typ, * }
TrapFire : projectile { default, deflected, damage, creator, hitid, force, team, typ, * }
Spider : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, corpse, size, walk, hitid, canfly, spr_fire, raddrop, team, spr_chrg, maxspeed, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
LaserCrystal : crystaltype { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, spr_walk, kills, snd_mele, spr_shadow_y, explode, maxhealth, gunangle, corpse, size, hitid, canfly, spr_fire, raddrop, ammo, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
EnemyLightning : projectile { default, deflected, damage, creator, hitid, ammo, force, team, typ, * }
LightningCrystal : crystaltype { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, spr_walk, kills, snd_mele, spr_shadow_y, explode, maxhealth, gunangle, corpse, size, hitid, canfly, spr_fire, raddrop, ammo, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
EnemyLaser : projectile { default, deflected, img, damage, creator, hitid, force, team, typ, * }
SnowTank : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, rest, snd_dead, spr_walk, kills, snd_mele, spr_shadow_y, wave, maxhealth, gunangle, corpse, size, hitid, canfly, spr_fire, raddrop, ammo, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
GoldSnowTank : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, rest, snd_dead, spr_walk, kills, snd_mele, spr_shadow_y, wave, maxhealth, gunangle, corpse, size, hitid, canfly, spr_fire, raddrop, ammo, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
SnowBot : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, gunangle, corpse, size, walk, hitid, canfly, spr_fire, raddrop, ammo, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
CarThrow : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, hitid, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
Wolf : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, close, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, corpse, size, walk, hitid, canfly, spr_fire, raddrop, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
SnowBotCar : SnowBot { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, gunangle, corpse, size, walk, hitid, canfly, spr_fire, raddrop, ammo, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
SnowTankExplode { default, ang, spr_shadow_y, size, hitid, right, spr_shadow_x, spr_shadow, * }
RhinoFreak : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, corpse, size, walk, hitid, canfly, spr_fire, raddrop, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
Freak : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, corpse, size, walk, hitid, canfly, spr_fire, raddrop, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
Turret : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, offset, snd_dead, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, gunangle, corpse, size, hitid, canfly, spr_fire, raddrop, ammo, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
ExploFreak : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, corpse, size, walk, hitid, canfly, spr_fire, raddrop, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, active, * }
Necromancer : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, gunangle, corpse, size, walk, hitid, canfly, spr_fire, raddrop, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
ReviveArea { default, * }
BecomeTurret : becomenemy { default, * }
ExploGuardian : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, close, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, corpse, size, hitid, canfly, spr_fire, raddrop, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
DogGuardian : enemy { target, default, canmelee, snd_hurt, zspeed, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, jumpdir, leap, z, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, corpse, size, bounced, hitid, canfly, jumpdist, spr_fire, raddrop, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
GhostGuardian : enemy { target, default, canmelee, snd_hurt, aimangle, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, corpse, size, canfly, hitid, spr_fire, raddrop, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
Guardian : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, corpse, size, hitid, canfly, spr_fire, raddrop, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
GuardianBullet : EnemyBullet1 { default, deflected, damage, creator, hitid, force, team, typ, * }
CrownGuardianOld : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, spr_walk, candeflect, kills, snd_mele, spr_shadow_y, maxhealth, gunangle, corpse, size, walk, hitid, canfly, spr_fire, raddrop, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, canfire, meleedamage, spr_shadow, * }
CrownGuardian : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, corpse, size, hitid, canfly, spr_fire, raddrop, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
OldGuardianStatue : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
GuardianStatue : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
GuardianDeflect : projectile { default, deflected, damage, creator, hitid, force, team, typ, * }
Molefish : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, gunangle, corpse, size, walk, hitid, canfly, spr_fire, raddrop, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
FireBaller : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, corpse, size, hitid, canfly, spr_fire, raddrop, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
JockRocket : projectile { default, deflected, snd, damage, creator, hitid, force, team, typ, active, * }
SuperFireBaller : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, corpse, size, hitid, canfly, spr_fire, raddrop, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
Jock : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, gunangle, corpse, size, walk, hitid, canfly, spr_fire, raddrop, ammo, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
Molesarge : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, gunangle, corpse, size, walk, hitid, canfly, spr_fire, raddrop, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
Turtle : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, corpse, size, walk, hitid, canfly, spr_fire, raddrop, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
Van : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, walls, snd_dead, drivespeed, spr_walk, kills, snd_mele, spr_shadow_y, drive, maxhealth, drawspr, corpse, size, hitid, canfly, spr_fire, raddrop, drawimg, team, spr_chrg, freak, right, spr_shadow_x, my_health, nexthurt, name, meleedamage, spr_shadow, * }
WantPopo : becomenemy { target, default, spawnmoment, enemies, * }
WantVan : becomenemy { target, default, canspawn, spawnmoment, enemies, * }
PopoExplosion : Explosion { default, ang, damage, hitid, force, team, * }
IDPDSpawn { default, freak, elite, * }
VanSpawn { default, * }
PopoSlug : projectile { default, wallbounce, deflected, damage, creator, hitid, force, team, typ, * }
PopoPlasmaBall : projectile { default, deflected, damage, creator, hitid, force, team, typ, * }
PopoRocket : projectile { default, deflected, snd, damage, creator, hitid, force, team, typ, active, * }
PopoNade : Grenade { default, offx, deflected, sticky, damage, creator, offy, hitid, force, team, typ, * }
PopoFreak : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, gunangle, corpse, size, walkdir, walk, hitid, canfly, spr_fire, raddrop, ammo, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
Grunt : enemy { target, default, canmelee, snd_hurt, grenades, spr_idle, spr_hurt, wepseed, wkick, spr_dead, roll, snd_dead, lastx, male, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, gunangle, corpse, size, walk, lasty, hitid, canfly, spr_fire, raddrop, team, spr_chrg, freeze, right, spr_shadow_x, angle, my_health, nexthurt, meleedamage, spr_shadow, * }
EliteGrunt : enemy { target, default, canmelee, snd_hurt, grenades, fuel, spr_idle, spr_hurt, wepseed, wkick, spr_dead, roll, snd_dead, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, gunangle, corpse, size, walk, hitid, canfly, spr_fire, raddrop, ammo, team, spr_chrg, freeze, right, spr_shadow_x, angle, my_health, nexthurt, meleedamage, spr_shadow, * }
Shielder : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, roll, snd_dead, male, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, gunangle, corpse, size, walk, hitid, canfly, spr_fire, raddrop, ammo, team, spr_chrg, freeze, right, spr_shadow_x, angle, my_health, nexthurt, meleedamage, spr_shadow, * }
EliteShielder : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, roll, snd_dead, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, gunangle, corpse, size, walk, hitid, canfly, spr_fire, raddrop, ammo, team, spr_chrg, freeze, right, spr_shadow_x, angle, my_health, nexthurt, meleedamage, spr_shadow, * }
Inspector : enemy { target, default, canmelee, snd_hurt, grenades, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, lastx, male, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, gunangle, corpse, size, walk, lasty, control, hitid, canfly, spr_fire, raddrop, team, spr_chrg, freeze, right, spr_shadow_x, angle, my_health, nexthurt, meleedamage, spr_shadow, * }
EliteInspector : enemy { target, default, canmelee, snd_hurt, grenades, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, lastx, wepflip, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, gunangle, wepangle, corpse, size, walk, lasty, control, hitid, canfly, spr_fire, raddrop, team, spr_chrg, freeze, right, spr_shadow_x, angle, my_health, nexthurt, meleedamage, spr_shadow, * }
IDPDBullet : projectile { default, deflected, damage, creator, hitid, force, team, typ, * }
PopoShield { default, spr_dead, creator, hitid, team, * }
RevivePopoFreak { default, * }
WantRevivePopoFreak { default, * }
Crab : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, gunangle, corpse, size, walk, hitid, canfly, spr_fire, raddrop, ammo, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
OasisBoss : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, gunangle, corpse, size, walkdir, walk, hitid, canfly, spr_fire, sweep, raddrop, ammo, type, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
BoneFish : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, corpse, size, walk, hitid, canfly, spr_fire, raddrop, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
InvLaserCrystal : crystaltype { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, spr_walk, kills, snd_mele, spr_shadow_y, explode, maxhealth, gunangle, corpse, size, hitid, canfly, spr_fire, raddrop, ammo, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
InvSpider : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, corpse, size, walk, hitid, canfly, spr_fire, raddrop, team, spr_chrg, maxspeed, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
JungleAssassin : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, wepflip, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, gunangle, wepangle, corpse, size, walk, hitid, canfly, spr_fire, raddrop, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
FiredMaggot : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, corpse, size, hitid, canfly, spr_fire, raddrop, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
JungleFly : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, fire, snd_dead, rage, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, gunangle, corpse, size, hitid, canfly, spr_fire, raddrop, ammo, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
JungleAssassinHide : prop { target, default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, wepflip, spr_walk, spr_shadow_y, maxhealth, gunangle, wepangle, size, walk, hitid, raddrop, team, right, spr_shadow_x, my_health, nexthurt, spr_shadow, meleedamage, * }
JungleBandit : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, gunangle, corpse, size, walk, hitid, canfly, spr_fire, raddrop, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
EnemyHorror : enemy { gunoffset, target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, gunangle, corpse, size, walk, hitid, canfly, charge, spr_fire, raddrop, ammo, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, meleedamage, spr_shadow, * }
HorrorBullet : projectile { default, deflected, bonus, damage, creator, hitid, bskin, force, team, typ, * }
becomenemy { default, * }
enemy : hitme { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, corpse, size, canfly, hitid, spr_fire, raddrop, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
crystaltype : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, snd_dead, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, corpse, size, canfly, hitid, spr_fire, raddrop, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
hitme { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
PotentialYeti { default, safe, timer, * }
Corpse { default, size, do_portal, * }
ScrapBossCorpse : Corpse { default, size, do_portal, * }
Nothing2Corpse : Corpse { default, size, do_portal, * }
PlasmaTrail : Effect { default, * }
EatRad : Effect { default, * }
NothingBeamHit : Effect { default, * }
RobotA : Effect { default, * }
EliteGruntFlame : Effect { default, * }
TangleKill : Effect { default, * }
FrogHeal : Effect { default, * }
CrystTrail : Effect { default, bskin, * }
PortalL : Effect { default, * }
BloodGamble : Effect { default, * }
GunGun : Effect { default, * }
ChickenB : Effect { default, * }
FishA : Effect { default, * }
Debris : Effect { default, size, * }
ChestOpen : Effect { default, * }
RabbitPaw : Effect { default, * }
Scorchmark : Effect { default, * }
MeltSplat : Effect { default, * }
TrapScorchMark : Effect { default, * }
Dust : Effect { default, growspeed, rot, * }
Bubble : Effect { default, * }
ImpactWrists : Effect { default, * }
ThrowHit : Effect { default, * }
Hammerhead : Effect { default, * }
AssassinNotice : Effect { default, * }
FishBoost : Effect { default, * }
Curse : Effect { default, * }
Wind : Effect { default, * }
BubblePop : Effect { default, * }
ReviveFX : Effect { default, * }
Breath : Effect { default, * }
CaveSparkle : Effect { default, * }
RainSplash : Effect { default, * }
RainDrop : Effect { default, addy, addx, * }
SnowFlake : Effect { default, addy, wave, addx, * }
Drip : Effect { default, * }
WindNight : Effect { default, * }
FireFly : Effect { default, * }
Smoke : Effect { default, growspeed, rot, * }
LevelUp : Effect { default, creator, * }
StrongSpirit : Effect { default, creator, * }
BloodLust : Effect { default, creator, * }
HorrorTB : Effect { default, creator, * }
SteroidsTB : Effect { default, creator, * }
RecycleGland : Effect { default, * }
AllyDamage : Effect { default, * }
RobotEat : Effect { default, creator, * }
LaserBrain : Effect { default, creator, * }
WepSwap : Effect { default, creator, * }
DiscBounce : Effect { default, * }
Deflect : Effect { default, * }
DiscDisappear : Effect { default, * }
DiscTrail : Effect { default, * }
MeleeHitWall : Effect { default, * }
BulletHit : Effect { default, * }
GroundFlame : Effect { default, * }
BlueFlame : Effect { default, * }
BloodStreak : Effect { default, * }
AcidStreak : Effect { default, * }
EBulletHit : Effect { default, * }
FXChestOpen : Effect { default, * }
SmallChestPickup : Effect { default, * }
HealFX : Effect { default, * }
SmallChestFade : Effect { default, * }
GunWarrantEmpty : Effect { default, * }
ScorpionBulletHit : Effect { default, * }
LightningSpawn : Effect { default, * }
LightningHit : Effect { default, * }
PopupText : Effect { target, default, text, time, mytext, * }
Shell : Effect { default, * }
Feather : Effect { default, rot, fall, * }
ExploderExplo : Effect { default, dir, * }
DustOLD : Effect { default, * }
SmokeOLD : Effect { default, * }
BoltStick : Effect { target, default, * }
PortalShock { default, * }
PortalClear { default, * }
LaserCharge : Effect { default, * }
IDPDPortalCharge : Effect { default, * }
Confetti : Effect { default, rotspeed, z, mycol, * }
Sweat : Effect { default, * }
PhantomBolt : Effect { default, * }
BoltTrail : Effect { default, creator, * }
NothingBeamParticle : Effect { default, * }
NothingBeamChargeParticle : Effect { default, * }
Rad : Pickup { default, blink, rad, * }
BigRad : Pickup { default, blink, rad, * }
AmmoChest : chestprop { default, spr_shadow_y, spr_shadow_x, spr_shadow, * }
RogueChest : chestprop { default, spr_shadow_y, spr_shadow_x, spr_shadow, * }
AmmoChestMystery : AmmoChest { default, spr_shadow_y, spr_shadow_x, spr_shadow, * }
IDPDChest : AmmoChest { default, spr_shadow_y, spr_shadow_x, spr_shadow, * }
HealthChest : chestprop { default, spr_dead, spr_shadow_y, num, spr_shadow_x, spr_shadow, * }
WeaponChest : chestprop { default, curse, spr_shadow_y, spr_shadow_x, spr_shadow, * }
ProtoChest : chestprop { default, spr_shadow_y, wep, spr_shadow_x, spr_shadow, * }
GoldChest : chestprop { default, curse, spr_shadow_y, spr_shadow_x, spr_shadow, * }
BigWeaponChest : WeaponChest { default, curse, spr_shadow_y, spr_shadow_x, spr_shadow, * }
BigCursedChest : WeaponChest { default, curse, spr_shadow_y, spr_shadow_x, spr_shadow, * }
GiantWeaponChest : WeaponChest { default, curse, spr_shadow_y, spr_shadow_x, spr_shadow, * }
GiantAmmoChest : chestprop { default, curse, spr_shadow_y, spr_shadow_x, spr_shadow, * }
RadChest : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
RadMaggotChest : RadChest { default, snd_hurt, spr_idle, spr_hurt, spr_dead, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
VenuzWeaponSpawn { default, curse, * }
VenuzAmmoSpawn { default, curse, * }
HPPickup : Pickup { default, blink, num, * }
AmmoPickup : Pickup { default, blink, num, cursed, * }
RoguePickup : Pickup { default, blink, * }
WepPickup : Pickup { default, curse, rotation, roll, rotspeed, creator, ammo, type, wep, name, * }
chestprop { default, spr_shadow_y, spr_shadow_x, spr_shadow, * }
CrownPickup { default, ang2, spr_shadow_y, spr_shadow_x, ang1, spr_shadow, * }
CrownPed { default, * }
Menu { default, widescreen, select, p, img, mode, texty, wave, extra, charsplat, namey, thanks, maxselect, logoin, charx, * }
BackFromCharSelect : button { default, canspec, mouseovery, noinput, buttonanim, * }
CharSelect : menubutton { default, overy, mouseover, p, race, locked, noinput, race_id, index, * }
Loadout : button { default, overy, openanim, introsettle, mode, selected, anim, * }
LoadoutSkin : loadbutton { default, overy, addy, diy, locked, skin, * }
CampChar { default, lastx, spr_to, hammerhead, spr_shadow_y, spr_slct, spr_from, num, spr_menu, lasty, spr_shadow_x, spr_shadow, * }
CrownIcon : mutbutton { default, crown, text, addy, p, num, creator, name, index, * }
SkillIcon : mutbutton { default, text, addy, p, noinput, skill, num, creator, name, index, * }
EGSkillIcon : mutbutton { default, text, addy, p, race, noinput, skill, num, creator, result, race_id, name, index, * }
CoopSkillIcon : EGSkillIcon { default, text, addy, p, race, noinput, skill, num, creator, result, race_id, name, index, * }
LevCont { default, select, titley, pick, wave, titleanim, codpick, maxselect, txty, patpick, junpick, splatanim, * }
mutbutton : menubutton { default, creator, * }
EmoteIndicator { default, p, key, wave, maxwave, index, * }
GameObject { default, * }
Effect { default, * }
Pickup { default, * }
CustomObject { default, on_destroy, on_cleanup, on_end_step, on_step, on_draw, on_begin_step, * }
CustomHitme : hitme { default, snd_hurt, spr_idle, spr_hurt, spr_dead, on_destroy, snd_dead, spr_walk, spr_shadow_y, maxhealth, on_cleanup, size, on_end_step, on_step, on_draw, on_hurt, on_begin_step, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
CustomProp : prop { default, snd_hurt, spr_idle, spr_hurt, spr_dead, on_death, snd_dead, spr_walk, spr_shadow_y, maxhealth, size, on_step, raddrop, team, spr_shadow_x, my_health, nexthurt, spr_shadow, * }
CustomProjectile : projectile { default, deflected, on_destroy, on_wall, on_hit, on_cleanup, damage, on_end_step, creator, on_step, on_draw, on_begin_step, hitid, force, team, typ, on_anim, * }
CustomSlash : CustomProjectile { default, deflected, on_destroy, on_wall, candeflect, on_hit, on_cleanup, damage, on_end_step, creator, on_step, on_draw, on_begin_step, hitid, force, team, typ, on_grenade, on_projectile, on_anim, * }
CustomEnemy : enemy { target, default, canmelee, snd_hurt, spr_idle, spr_hurt, wepseed, wkick, spr_dead, on_death, on_destroy, snd_dead, spr_walk, kills, snd_mele, spr_shadow_y, maxhealth, on_cleanup, corpse, size, on_end_step, on_step, candie, on_draw, on_hurt, on_begin_step, canfly, hitid, spr_fire, raddrop, team, spr_chrg, right, spr_shadow_x, my_health, nexthurt, spr_shadow, meleedamage, * }
CustomScript { default, script, * }
CustomBeginStep : CustomScript { default, script, * }
CustomStep : CustomScript { default, script, * }
CustomEndStep : CustomScript { default, script, * }
CustomDraw : CustomScript { default, script, * }
FireCont { default, wkick, can_shoot, aimDirection, infammo, race, wshake, accuracy, wshift, gunangle, wepangle, reload, team, right, index, * }
CorpseActive : Corpse { default, size, do_portal, * }
GmlMod { * }
