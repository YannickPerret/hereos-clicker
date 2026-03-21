import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Talent from '#models/talent'

// Cost: T1-T5=1, T6-T10=2, T11-T15=3, T16-T20=5
function tierCost(tier: number) {
  if (tier <= 5) return 1
  if (tier <= 10) return 2
  if (tier <= 15) return 3
  return 5
}

// Level req: T1-T5 → up to 30, T6-T10 → up to 70, T11-T15 → up to 100, T16-T20 → up to 150
const TIER_LEVELS = [
  1, 5, 12, 20, 30,         // T1-T5
  38, 46, 54, 62, 70,       // T6-T10
  76, 82, 88, 94, 100,      // T11-T15
  110, 120, 130, 140, 150,  // T16-T20
]

interface TalentDef {
  name: string
  description: string
  effectType: string
  effectValue: number
  icon: string
}

// Each spec has 20 tiers, 2 choices per tier [choiceA, choiceB]
const HACKER_TREE: [TalentDef, TalentDef][] = [
  // T1
  [
    { name: 'Exploit Script', description: '+2 credits par clic.', effectType: 'cpc_flat', effectValue: 2, icon: 'terminal' },
    { name: 'Rootkit Seed', description: '+1 credit/sec passif.', effectType: 'cps_flat', effectValue: 1, icon: 'rootkit' },
  ],
  // T2
  [
    { name: 'Buffer Overflow', description: '+5 credits par clic.', effectType: 'cpc_flat', effectValue: 5, icon: 'overflow' },
    { name: 'Trojan Protocol', description: '+10% puissance de clic.', effectType: 'cpc_percent', effectValue: 10, icon: 'trojan' },
  ],
  // T3
  [
    { name: 'Zero-Day', description: 'Clics +25%.', effectType: 'cpc_percent', effectValue: 25, icon: 'zeroday' },
    { name: 'SQL Inject', description: '+8 credits par clic.', effectType: 'cpc_flat', effectValue: 8, icon: 'inject' },
  ],
  // T4
  [
    { name: 'Brute Force', description: '+12 credits par clic.', effectType: 'cpc_flat', effectValue: 12, icon: 'bruteforce' },
    { name: 'Worm Propagation', description: '+3 credits/sec.', effectType: 'cps_flat', effectValue: 3, icon: 'worm' },
  ],
  // T5
  [
    { name: 'Kernel Panic', description: 'Clics +30%.', effectType: 'cpc_percent', effectValue: 30, icon: 'kernel' },
    { name: 'RAT Controller', description: '+5 credits/sec.', effectType: 'cps_flat', effectValue: 5, icon: 'rat' },
  ],
  // T6
  [
    { name: 'Payload Injector', description: '+18 credits par clic.', effectType: 'cpc_flat', effectValue: 18, icon: 'payload' },
    { name: 'Polymorphic Engine', description: 'Clics +20%.', effectType: 'cpc_percent', effectValue: 20, icon: 'polymorphic' },
  ],
  // T7
  [
    { name: 'Privilege Escalation', description: '+25 credits par clic.', effectType: 'cpc_flat', effectValue: 25, icon: 'escalation' },
    { name: 'Botnet Cluster', description: '+8 credits/sec.', effectType: 'cps_flat', effectValue: 8, icon: 'botcluster' },
  ],
  // T8
  [
    { name: 'Memory Corruption', description: 'Clics +35%.', effectType: 'cpc_percent', effectValue: 35, icon: 'memcorrupt' },
    { name: 'Stealth Daemon', description: '+20% CPS.', effectType: 'cps_percent', effectValue: 20, icon: 'stealth' },
  ],
  // T9
  [
    { name: 'RCE Exploit', description: '+35 credits par clic.', effectType: 'cpc_flat', effectValue: 35, icon: 'rce' },
    { name: 'Cryptojacker', description: '+12 credits/sec.', effectType: 'cps_flat', effectValue: 12, icon: 'cryptojack' },
  ],
  // T10
  [
    { name: 'Firmware Backdoor', description: 'Clics +40%.', effectType: 'cpc_percent', effectValue: 40, icon: 'firmware' },
    { name: 'Mining Rig', description: '+30% CPS.', effectType: 'cps_percent', effectValue: 30, icon: 'mining' },
  ],
  // T11
  [
    { name: 'Chain Exploit', description: '+50 credits par clic.', effectType: 'cpc_flat', effectValue: 50, icon: 'chain' },
    { name: 'Neural Miner', description: '+18 credits/sec.', effectType: 'cps_flat', effectValue: 18, icon: 'neuralminer' },
  ],
  // T12
  [
    { name: 'Advanced Persistent Threat', description: 'Clics +50%.', effectType: 'cpc_percent', effectValue: 50, icon: 'apt' },
    { name: 'Hashrate Boost', description: '+40% CPS.', effectType: 'cps_percent', effectValue: 40, icon: 'hashrate' },
  ],
  // T13
  [
    { name: 'BIOS Rootkit', description: '+70 credits par clic.', effectType: 'cpc_flat', effectValue: 70, icon: 'bios' },
    { name: 'Distributed Hash', description: '+25 credits/sec.', effectType: 'cps_flat', effectValue: 25, icon: 'distributed' },
  ],
  // T14
  [
    { name: 'Hypervisor Escape', description: 'Clics +60%.', effectType: 'cpc_percent', effectValue: 60, icon: 'hypervisor' },
    { name: 'Quantum Daemon', description: '+50% CPS.', effectType: 'cps_percent', effectValue: 50, icon: 'quantum' },
  ],
  // T15
  [
    { name: 'Supply Chain Inject', description: '+100 credits par clic.', effectType: 'cpc_flat', effectValue: 100, icon: 'supplychain' },
    { name: 'Ghost Protocol', description: '+35 credits/sec.', effectType: 'cps_flat', effectValue: 35, icon: 'ghost' },
  ],
  // T16
  [
    { name: 'AI-Assisted Hack', description: 'Clics +80%.', effectType: 'cpc_percent', effectValue: 80, icon: 'aihack' },
    { name: 'Neural Overclock', description: '+60% CPS.', effectType: 'cps_percent', effectValue: 60, icon: 'overclock' },
  ],
  // T17
  [
    { name: 'Singularity Breach', description: '+150 credits par clic.', effectType: 'cpc_flat', effectValue: 150, icon: 'singularity' },
    { name: 'Hivemind Link', description: '+50 credits/sec.', effectType: 'cps_flat', effectValue: 50, icon: 'hivemind' },
  ],
  // T18
  [
    { name: 'Matrix Override', description: 'Clics +100%.', effectType: 'cpc_percent', effectValue: 100, icon: 'matrix' },
    { name: 'Quantum Mining', description: '+80% CPS.', effectType: 'cps_percent', effectValue: 80, icon: 'quantumine' },
  ],
  // T19
  [
    { name: 'God Mode Exploit', description: '+200 credits par clic.', effectType: 'cpc_flat', effectValue: 200, icon: 'godmode' },
    { name: 'Eternal Daemon', description: '+75 credits/sec.', effectType: 'cps_flat', effectValue: 75, icon: 'eternal' },
  ],
  // T20
  [
    { name: 'Digital Ascension', description: 'Clics +150%. Tu transcendes le code.', effectType: 'cpc_percent', effectValue: 150, icon: 'ascension' },
    { name: 'Omega Network', description: '+100% CPS. Le reseau entier mine pour toi.', effectType: 'cps_percent', effectValue: 100, icon: 'omega' },
  ],
]

const NETRUNNER_TREE: [TalentDef, TalentDef][] = [
  // T1
  [
    { name: 'Daemon v1', description: '+1 credit/sec.', effectType: 'cps_flat', effectValue: 1, icon: 'daemon' },
    { name: 'Click Optimizer', description: '+2 credits par clic.', effectType: 'cpc_flat', effectValue: 2, icon: 'optimizer' },
  ],
  // T2
  [
    { name: 'Botnet Lite', description: '+3 credits/sec.', effectType: 'cps_flat', effectValue: 3, icon: 'botnet' },
    { name: 'Data Siphon', description: '+10% CPS.', effectType: 'cps_percent', effectValue: 10, icon: 'siphon' },
  ],
  // T3
  [
    { name: 'Neural Sync', description: '+20% CPS.', effectType: 'cps_percent', effectValue: 20, icon: 'sync' },
    { name: 'ICE Drill', description: '+5 credits/sec.', effectType: 'cps_flat', effectValue: 5, icon: 'icedrill' },
  ],
  // T4
  [
    { name: 'Proxy Chain', description: '+8 credits/sec.', effectType: 'cps_flat', effectValue: 8, icon: 'proxy' },
    { name: 'Signal Amplifier', description: '+5 credits par clic.', effectType: 'cpc_flat', effectValue: 5, icon: 'signal' },
  ],
  // T5
  [
    { name: 'Deep Net Access', description: '+25% CPS.', effectType: 'cps_percent', effectValue: 25, icon: 'deepnet' },
    { name: 'Bandwidth Burst', description: '+10 credits/sec.', effectType: 'cps_flat', effectValue: 10, icon: 'bandwidth' },
  ],
  // T6
  [
    { name: 'Darknet Relay', description: '+15 credits/sec.', effectType: 'cps_flat', effectValue: 15, icon: 'darknet' },
    { name: 'Packet Injection', description: '+15% CPC.', effectType: 'cpc_percent', effectValue: 15, icon: 'packet' },
  ],
  // T7
  [
    { name: 'Neural Highway', description: '+30% CPS.', effectType: 'cps_percent', effectValue: 30, icon: 'highway' },
    { name: 'Cache Exploit', description: '+12 credits par clic.', effectType: 'cpc_flat', effectValue: 12, icon: 'cache' },
  ],
  // T8
  [
    { name: 'Mesh Network', description: '+20 credits/sec.', effectType: 'cps_flat', effectValue: 20, icon: 'mesh' },
    { name: 'Protocol Override', description: '+35% CPS.', effectType: 'cps_percent', effectValue: 35, icon: 'override' },
  ],
  // T9
  [
    { name: 'Autonomous Agent', description: '+40% CPS.', effectType: 'cps_percent', effectValue: 40, icon: 'autonomous' },
    { name: 'Fiber Optic Tap', description: '+28 credits/sec.', effectType: 'cps_flat', effectValue: 28, icon: 'fiber' },
  ],
  // T10
  [
    { name: 'Distributed Network', description: '+35 credits/sec.', effectType: 'cps_flat', effectValue: 35, icon: 'distnet' },
    { name: 'Recursive Loop', description: '+20 credits par clic.', effectType: 'cpc_flat', effectValue: 20, icon: 'recursive' },
  ],
  // T11
  [
    { name: 'Quantum Tunneling', description: '+50% CPS.', effectType: 'cps_percent', effectValue: 50, icon: 'tunnel' },
    { name: 'Parallel Processing', description: '+45 credits/sec.', effectType: 'cps_flat', effectValue: 45, icon: 'parallel' },
  ],
  // T12
  [
    { name: 'Swarm Intelligence', description: '+55 credits/sec.', effectType: 'cps_flat', effectValue: 55, icon: 'swarm' },
    { name: 'Memory Leak Exploit', description: '+25 credits par clic.', effectType: 'cpc_flat', effectValue: 25, icon: 'memleak' },
  ],
  // T13
  [
    { name: 'Neural Cloud', description: '+60% CPS.', effectType: 'cps_percent', effectValue: 60, icon: 'cloud' },
    { name: 'Deep Packet Mining', description: '+70 credits/sec.', effectType: 'cps_flat', effectValue: 70, icon: 'deeppacket' },
  ],
  // T14
  [
    { name: 'Hive Protocol', description: '+85 credits/sec.', effectType: 'cps_flat', effectValue: 85, icon: 'hive' },
    { name: 'Fractal Algorithm', description: '+70% CPS.', effectType: 'cps_percent', effectValue: 70, icon: 'fractal' },
  ],
  // T15
  [
    { name: 'Singularity Engine', description: '+80% CPS.', effectType: 'cps_percent', effectValue: 80, icon: 'singengine' },
    { name: 'Infinite Loop', description: '+100 credits/sec.', effectType: 'cps_flat', effectValue: 100, icon: 'infinite' },
  ],
  // T16
  [
    { name: 'Consciousness Upload', description: '+120 credits/sec.', effectType: 'cps_flat', effectValue: 120, icon: 'upload' },
    { name: 'Temporal Cache', description: '+90% CPS.', effectType: 'cps_percent', effectValue: 90, icon: 'temporal' },
  ],
  // T17
  [
    { name: 'Reality Compiler', description: '+100% CPS.', effectType: 'cps_percent', effectValue: 100, icon: 'compiler' },
    { name: 'Omega Core', description: '+150 credits/sec.', effectType: 'cps_flat', effectValue: 150, icon: 'omegacore' },
  ],
  // T18
  [
    { name: 'Dimensional Rift', description: '+180 credits/sec.', effectType: 'cps_flat', effectValue: 180, icon: 'rift' },
    { name: 'Entropy Harvest', description: '+120% CPS.', effectType: 'cps_percent', effectValue: 120, icon: 'entropy' },
  ],
  // T19
  [
    { name: 'Multiverse Daemon', description: '+140% CPS.', effectType: 'cps_percent', effectValue: 140, icon: 'multiverse' },
    { name: 'Dark Matter Core', description: '+220 credits/sec.', effectType: 'cps_flat', effectValue: 220, icon: 'darkmatter' },
  ],
  // T20
  [
    { name: 'Digital Godhood', description: '+200% CPS. Tu es le reseau.', effectType: 'cps_percent', effectValue: 200, icon: 'godhood' },
    { name: 'Infinite Engine', description: '+300 credits/sec. Le flux ne s\'arrete jamais.', effectType: 'cps_flat', effectValue: 300, icon: 'infinengine' },
  ],
]

const SAMURAI_TREE: [TalentDef, TalentDef][] = [
  // T1
  [
    { name: 'Cyber Reflexes', description: '+5 ATK.', effectType: 'atk_flat', effectValue: 5, icon: 'reflex' },
    { name: 'Dermal Plating', description: '+5 DEF.', effectType: 'def_flat', effectValue: 5, icon: 'dermal' },
  ],
  // T2
  [
    { name: 'Mono-Wire Fists', description: '+8 ATK.', effectType: 'atk_flat', effectValue: 8, icon: 'monowire' },
    { name: 'Titanium Bones', description: '+8 DEF.', effectType: 'def_flat', effectValue: 8, icon: 'bones' },
  ],
  // T3
  [
    { name: 'Berserker Chip', description: '+15 ATK.', effectType: 'atk_flat', effectValue: 15, icon: 'berserker' },
    { name: 'Kevlar Skin', description: '+15 DEF.', effectType: 'def_flat', effectValue: 15, icon: 'kevlar' },
  ],
  // T4
  [
    { name: 'Combat Stimulant', description: '+10% combat (ATK+DEF).', effectType: 'combat_percent', effectValue: 10, icon: 'stimulant' },
    { name: 'Nano-Regen', description: '+50 HP max.', effectType: 'hp_flat', effectValue: 50, icon: 'nanoregen' },
  ],
  // T5
  [
    { name: 'Mantis Blades', description: '+22 ATK.', effectType: 'atk_flat', effectValue: 22, icon: 'mantis' },
    { name: 'Subdermal Armor', description: '+22 DEF.', effectType: 'def_flat', effectValue: 22, icon: 'subdermal' },
  ],
  // T6
  [
    { name: 'Gorilla Arms', description: '+30 ATK.', effectType: 'atk_flat', effectValue: 30, icon: 'gorilla' },
    { name: 'Ceramic Plating', description: '+30 DEF.', effectType: 'def_flat', effectValue: 30, icon: 'ceramic' },
  ],
  // T7
  [
    { name: 'Adrenaline Pump', description: '+15% combat (ATK+DEF).', effectType: 'combat_percent', effectValue: 15, icon: 'adrenaline' },
    { name: 'Bio-Monitor', description: '+80 HP max.', effectType: 'hp_flat', effectValue: 80, icon: 'biomonitor' },
  ],
  // T8
  [
    { name: 'Projectile Launch', description: '+40 ATK.', effectType: 'atk_flat', effectValue: 40, icon: 'projectile' },
    { name: 'Ballistic Coprocessor', description: '+40 DEF.', effectType: 'def_flat', effectValue: 40, icon: 'ballistic' },
  ],
  // T9
  [
    { name: 'Sandevistan', description: '+20% combat (ATK+DEF).', effectType: 'combat_percent', effectValue: 20, icon: 'sandevistan' },
    { name: 'Second Heart', description: '+120 HP max.', effectType: 'hp_flat', effectValue: 120, icon: 'secondheart' },
  ],
  // T10
  [
    { name: 'Thermal Katana', description: '+55 ATK.', effectType: 'atk_flat', effectValue: 55, icon: 'thermalkat' },
    { name: 'Hardened Shell', description: '+55 DEF.', effectType: 'def_flat', effectValue: 55, icon: 'hardshell' },
  ],
  // T11
  [
    { name: 'Blade Fury', description: '+70 ATK.', effectType: 'atk_flat', effectValue: 70, icon: 'bladefury' },
    { name: 'Fortress Protocol', description: '+70 DEF.', effectType: 'def_flat', effectValue: 70, icon: 'fortress' },
  ],
  // T12
  [
    { name: 'Berserk OS', description: '+30% combat (ATK+DEF).', effectType: 'combat_percent', effectValue: 30, icon: 'berserkos' },
    { name: 'Trauma Team Implant', description: '+180 HP max.', effectType: 'hp_flat', effectValue: 180, icon: 'trauma' },
  ],
  // T13
  [
    { name: 'Plasma Fists', description: '+90 ATK.', effectType: 'atk_flat', effectValue: 90, icon: 'plasma' },
    { name: 'Reactive Armor', description: '+90 DEF.', effectType: 'def_flat', effectValue: 90, icon: 'reactive' },
  ],
  // T14
  [
    { name: 'Cybernetic Fury', description: '+40% combat (ATK+DEF).', effectType: 'combat_percent', effectValue: 40, icon: 'cyberfury' },
    { name: 'Regeneration Core', description: '+250 HP max.', effectType: 'hp_flat', effectValue: 250, icon: 'regencore' },
  ],
  // T15
  [
    { name: 'Molecular Blade', description: '+120 ATK.', effectType: 'atk_flat', effectValue: 120, icon: 'molecblade' },
    { name: 'Diamond Skin', description: '+120 DEF.', effectType: 'def_flat', effectValue: 120, icon: 'diamond' },
  ],
  // T16
  [
    { name: 'Omega Strike', description: '+50% combat (ATK+DEF).', effectType: 'combat_percent', effectValue: 50, icon: 'omegastrike' },
    { name: 'Immortal Frame', description: '+350 HP max.', effectType: 'hp_flat', effectValue: 350, icon: 'immortal' },
  ],
  // T17
  [
    { name: 'Neutron Fists', description: '+160 ATK.', effectType: 'atk_flat', effectValue: 160, icon: 'neutron' },
    { name: 'Quantum Shield', description: '+160 DEF.', effectType: 'def_flat', effectValue: 160, icon: 'qshield' },
  ],
  // T18
  [
    { name: 'Black Hole Strike', description: '+60% combat (ATK+DEF).', effectType: 'combat_percent', effectValue: 60, icon: 'blackhole' },
    { name: 'Phoenix Protocol', description: '+500 HP max.', effectType: 'hp_flat', effectValue: 500, icon: 'phoenix' },
  ],
  // T19
  [
    { name: 'Antimatter Edge', description: '+220 ATK.', effectType: 'atk_flat', effectValue: 220, icon: 'antimatter' },
    { name: 'Event Horizon Armor', description: '+220 DEF.', effectType: 'def_flat', effectValue: 220, icon: 'horizon' },
  ],
  // T20
  [
    { name: 'Apex Predator', description: '+80% combat (ATK+DEF). Arme ultime.', effectType: 'combat_percent', effectValue: 80, icon: 'apex' },
    { name: 'Unkillable', description: '+750 HP max. Tu ne meurs pas.', effectType: 'hp_flat', effectValue: 750, icon: 'unkillable' },
  ],
]

const CHROME_DEALER_TREE: [TalentDef, TalentDef][] = [
  // T1
  [
    { name: 'Street Cred', description: '-5% prix shop.', effectType: 'shop_discount', effectValue: 5, icon: 'cred' },
    { name: 'Scavenger Eye', description: '+10% loot chance.', effectType: 'loot_bonus', effectValue: 10, icon: 'eye' },
  ],
  // T2
  [
    { name: 'Haggler Chip', description: '-5% prix shop.', effectType: 'shop_discount', effectValue: 5, icon: 'haggler' },
    { name: 'Loot Scanner', description: '+10% loot chance.', effectType: 'loot_bonus', effectValue: 10, icon: 'scanner' },
  ],
  // T3
  [
    { name: 'Insider Trading', description: '+15% credits donjon.', effectType: 'dungeon_credits', effectValue: 15, icon: 'insider' },
    { name: 'Lucky Charm', description: '+15% loot chance.', effectType: 'loot_bonus', effectValue: 15, icon: 'lucky' },
  ],
  // T4
  [
    { name: 'Wholesale Access', description: '-8% prix shop.', effectType: 'shop_discount', effectValue: 8, icon: 'wholesale' },
    { name: 'Dungeon Cartographer', description: '+20% credits donjon.', effectType: 'dungeon_credits', effectValue: 20, icon: 'carto' },
  ],
  // T5
  [
    { name: 'Black Market Access', description: '-10% prix shop.', effectType: 'shop_discount', effectValue: 10, icon: 'market' },
    { name: 'Treasure Hunter', description: '+20% loot chance.', effectType: 'loot_bonus', effectValue: 20, icon: 'treasure' },
  ],
  // T6
  [
    { name: 'Corporate Spy', description: '+25% credits donjon.', effectType: 'dungeon_credits', effectValue: 25, icon: 'spy' },
    { name: 'Salvage Expert', description: '+25% loot chance.', effectType: 'loot_bonus', effectValue: 25, icon: 'salvage' },
  ],
  // T7
  [
    { name: 'Price Manipulator', description: '-12% prix shop.', effectType: 'shop_discount', effectValue: 12, icon: 'manipulate' },
    { name: 'Data Broker', description: '+30% credits donjon.', effectType: 'dungeon_credits', effectValue: 30, icon: 'broker' },
  ],
  // T8
  [
    { name: 'Supply Chain Master', description: '-10% prix shop.', effectType: 'shop_discount', effectValue: 10, icon: 'supply' },
    { name: 'Fortune Finder', description: '+30% loot chance.', effectType: 'loot_bonus', effectValue: 30, icon: 'fortune' },
  ],
  // T9
  [
    { name: 'Bounty Hunter', description: '+40% credits donjon.', effectType: 'dungeon_credits', effectValue: 40, icon: 'bounty' },
    { name: 'Master Scavenger', description: '+35% loot chance.', effectType: 'loot_bonus', effectValue: 35, icon: 'masterscav' },
  ],
  // T10
  [
    { name: 'Megacorp Contact', description: '-15% prix shop.', effectType: 'shop_discount', effectValue: 15, icon: 'megacorp' },
    { name: 'Dungeon Mogul', description: '+50% credits donjon.', effectType: 'dungeon_credits', effectValue: 50, icon: 'mogul' },
  ],
  // T11
  [
    { name: 'Contraband Ring', description: '-12% prix shop.', effectType: 'shop_discount', effectValue: 12, icon: 'contraband' },
    { name: 'Artifact Sense', description: '+40% loot chance.', effectType: 'loot_bonus', effectValue: 40, icon: 'artifact' },
  ],
  // T12
  [
    { name: 'War Profiteer', description: '+60% credits donjon.', effectType: 'dungeon_credits', effectValue: 60, icon: 'profiteer' },
    { name: 'Chrome Recycler', description: '+50% loot chance.', effectType: 'loot_bonus', effectValue: 50, icon: 'recycler' },
  ],
  // T13
  [
    { name: 'Monopoly Chip', description: '-15% prix shop.', effectType: 'shop_discount', effectValue: 15, icon: 'monopoly' },
    { name: 'Relic Hunter', description: '+60% loot chance.', effectType: 'loot_bonus', effectValue: 60, icon: 'relic' },
  ],
  // T14
  [
    { name: 'Credit Launderer', description: '+80% credits donjon.', effectType: 'dungeon_credits', effectValue: 80, icon: 'launderer' },
    { name: 'Golden Touch', description: '+70% loot chance.', effectType: 'loot_bonus', effectValue: 70, icon: 'golden' },
  ],
  // T15
  [
    { name: 'Cartel Boss', description: '-18% prix shop.', effectType: 'shop_discount', effectValue: 18, icon: 'cartel' },
    { name: 'Dungeon Baron', description: '+100% credits donjon.', effectType: 'dungeon_credits', effectValue: 100, icon: 'baron' },
  ],
  // T16
  [
    { name: 'Market Crasher', description: '-20% prix shop.', effectType: 'shop_discount', effectValue: 20, icon: 'crasher' },
    { name: 'Legendary Finder', description: '+80% loot chance.', effectType: 'loot_bonus', effectValue: 80, icon: 'legendary' },
  ],
  // T17
  [
    { name: 'Shadow Economy', description: '+120% credits donjon.', effectType: 'dungeon_credits', effectValue: 120, icon: 'shadow' },
    { name: 'Midas Protocol', description: '+100% loot chance.', effectType: 'loot_bonus', effectValue: 100, icon: 'midas' },
  ],
  // T18
  [
    { name: 'Free Trade Zone', description: '-22% prix shop.', effectType: 'shop_discount', effectValue: 22, icon: 'freezone' },
    { name: 'Vault Cracker', description: '+150% credits donjon.', effectType: 'dungeon_credits', effectValue: 150, icon: 'vault' },
  ],
  // T19
  [
    { name: 'Infinite Credit Line', description: '-25% prix shop.', effectType: 'shop_discount', effectValue: 25, icon: 'infinite' },
    { name: 'Dragon Hoard', description: '+120% loot chance.', effectType: 'loot_bonus', effectValue: 120, icon: 'dragon' },
  ],
  // T20
  [
    { name: 'Corporate Overlord', description: '-30% prix. Tu controles le marche.', effectType: 'shop_discount', effectValue: 30, icon: 'overlord' },
    { name: 'Mythic Plunderer', description: '+150% loot. Rien ne t\'echappe.', effectType: 'loot_bonus', effectValue: 150, icon: 'mythic' },
  ],
]

const SPEC_TREES: Record<string, [TalentDef, TalentDef][]> = {
  hacker: HACKER_TREE,
  netrunner: NETRUNNER_TREE,
  samurai: SAMURAI_TREE,
  chrome_dealer: CHROME_DEALER_TREE,
}

export default class extends BaseSeeder {
  async run() {
    // Clear existing talents (cascade will clean character_talents via migration)
    await Talent.query().delete()

    const specs = ['hacker', 'netrunner', 'samurai', 'chrome_dealer'] as const

    for (const spec of specs) {
      const tree = SPEC_TREES[spec]

      for (let tierIndex = 0; tierIndex < tree.length; tierIndex++) {
        const tier = tierIndex + 1
        const [choiceA, choiceB] = tree[tierIndex]

        for (const [choiceGroup, def] of [
          [1, choiceA],
          [2, choiceB],
        ] as [number, TalentDef][]) {
          await Talent.create({
            name: def.name,
            description: def.description,
            spec,
            tier,
            icon: def.icon,
            effectType: def.effectType,
            effectValue: def.effectValue,
            cost: tierCost(tier),
            requiresTalentId: null,
            requiresLevel: TIER_LEVELS[tierIndex],
            choiceGroup,
          })
        }
      }
    }
  }
}
