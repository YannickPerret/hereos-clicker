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
  nameEn: string
  description: string
  descriptionEn: string
  effectType: string
  effectValue: number
  icon: string
}

// Each spec has 20 tiers, 2 choices per tier [choiceA, choiceB]
const HACKER_TREE: [TalentDef, TalentDef][] = [
  // T1
  [
    { name: 'Exploit Script', nameEn: 'Exploit Script', description: '+2 credits par clic.', descriptionEn: '+2 credits per click.', effectType: 'cpc_flat', effectValue: 2, icon: 'terminal' },
    { name: 'Rootkit Seed', nameEn: 'Rootkit Seed', description: '+1 credit/sec passif.', descriptionEn: '+1 passive credit/sec.', effectType: 'cps_flat', effectValue: 1, icon: 'rootkit' },
  ],
  // T2
  [
    { name: 'Buffer Overflow', nameEn: 'Buffer Overflow', description: '+5 credits par clic.', descriptionEn: '+5 credits per click.', effectType: 'cpc_flat', effectValue: 5, icon: 'overflow' },
    { name: 'Trojan Protocol', nameEn: 'Trojan Protocol', description: '+10% puissance de clic.', descriptionEn: '+10% click power.', effectType: 'cpc_percent', effectValue: 10, icon: 'trojan' },
  ],
  // T3
  [
    { name: 'Zero-Day', nameEn: 'Zero-Day', description: 'Clics +25%.', descriptionEn: 'Clicks +25%.', effectType: 'cpc_percent', effectValue: 25, icon: 'zeroday' },
    { name: 'SQL Inject', nameEn: 'SQL Inject', description: '+8 credits par clic.', descriptionEn: '+8 credits per click.', effectType: 'cpc_flat', effectValue: 8, icon: 'inject' },
  ],
  // T4
  [
    { name: 'Brute Force', nameEn: 'Brute Force', description: '+12 credits par clic.', descriptionEn: '+12 credits per click.', effectType: 'cpc_flat', effectValue: 12, icon: 'bruteforce' },
    { name: 'Worm Propagation', nameEn: 'Worm Propagation', description: '+3 credits/sec.', descriptionEn: '+3 credits/sec.', effectType: 'cps_flat', effectValue: 3, icon: 'worm' },
  ],
  // T5
  [
    { name: 'Kernel Panic', nameEn: 'Kernel Panic', description: 'Clics +30%.', descriptionEn: 'Clicks +30%.', effectType: 'cpc_percent', effectValue: 30, icon: 'kernel' },
    { name: 'RAT Controller', nameEn: 'RAT Controller', description: '+5 credits/sec.', descriptionEn: '+5 credits/sec.', effectType: 'cps_flat', effectValue: 5, icon: 'rat' },
  ],
  // T6
  [
    { name: 'Payload Injector', nameEn: 'Payload Injector', description: '+18 credits par clic.', descriptionEn: '+18 credits per click.', effectType: 'cpc_flat', effectValue: 18, icon: 'payload' },
    { name: 'Polymorphic Engine', nameEn: 'Polymorphic Engine', description: 'Clics +20%.', descriptionEn: 'Clicks +20%.', effectType: 'cpc_percent', effectValue: 20, icon: 'polymorphic' },
  ],
  // T7
  [
    { name: 'Privilege Escalation', nameEn: 'Privilege Escalation', description: '+25 credits par clic.', descriptionEn: '+25 credits per click.', effectType: 'cpc_flat', effectValue: 25, icon: 'escalation' },
    { name: 'Botnet Cluster', nameEn: 'Botnet Cluster', description: '+8 credits/sec.', descriptionEn: '+8 credits/sec.', effectType: 'cps_flat', effectValue: 8, icon: 'botcluster' },
  ],
  // T8
  [
    { name: 'Memory Corruption', nameEn: 'Memory Corruption', description: 'Clics +35%.', descriptionEn: 'Clicks +35%.', effectType: 'cpc_percent', effectValue: 35, icon: 'memcorrupt' },
    { name: 'Stealth Daemon', nameEn: 'Stealth Daemon', description: '+20% CPS.', descriptionEn: '+20% CPS.', effectType: 'cps_percent', effectValue: 20, icon: 'stealth' },
  ],
  // T9
  [
    { name: 'RCE Exploit', nameEn: 'RCE Exploit', description: '+35 credits par clic.', descriptionEn: '+35 credits per click.', effectType: 'cpc_flat', effectValue: 35, icon: 'rce' },
    { name: 'Cryptojacker', nameEn: 'Cryptojacker', description: '+12 credits/sec.', descriptionEn: '+12 credits/sec.', effectType: 'cps_flat', effectValue: 12, icon: 'cryptojack' },
  ],
  // T10
  [
    { name: 'Firmware Backdoor', nameEn: 'Firmware Backdoor', description: 'Clics +40%.', descriptionEn: 'Clicks +40%.', effectType: 'cpc_percent', effectValue: 40, icon: 'firmware' },
    { name: 'Mining Rig', nameEn: 'Mining Rig', description: '+30% CPS.', descriptionEn: '+30% CPS.', effectType: 'cps_percent', effectValue: 30, icon: 'mining' },
  ],
  // T11
  [
    { name: 'Chain Exploit', nameEn: 'Chain Exploit', description: '+50 credits par clic.', descriptionEn: '+50 credits per click.', effectType: 'cpc_flat', effectValue: 50, icon: 'chain' },
    { name: 'Neural Miner', nameEn: 'Neural Miner', description: '+18 credits/sec.', descriptionEn: '+18 credits/sec.', effectType: 'cps_flat', effectValue: 18, icon: 'neuralminer' },
  ],
  // T12
  [
    { name: 'Advanced Persistent Threat', nameEn: 'Advanced Persistent Threat', description: 'Clics +50%.', descriptionEn: 'Clicks +50%.', effectType: 'cpc_percent', effectValue: 50, icon: 'apt' },
    { name: 'Hashrate Boost', nameEn: 'Hashrate Boost', description: '+40% CPS.', descriptionEn: '+40% CPS.', effectType: 'cps_percent', effectValue: 40, icon: 'hashrate' },
  ],
  // T13
  [
    { name: 'BIOS Rootkit', nameEn: 'BIOS Rootkit', description: '+70 credits par clic.', descriptionEn: '+70 credits per click.', effectType: 'cpc_flat', effectValue: 70, icon: 'bios' },
    { name: 'Distributed Hash', nameEn: 'Distributed Hash', description: '+25 credits/sec.', descriptionEn: '+25 credits/sec.', effectType: 'cps_flat', effectValue: 25, icon: 'distributed' },
  ],
  // T14
  [
    { name: 'Hypervisor Escape', nameEn: 'Hypervisor Escape', description: 'Clics +60%.', descriptionEn: 'Clicks +60%.', effectType: 'cpc_percent', effectValue: 60, icon: 'hypervisor' },
    { name: 'Quantum Daemon', nameEn: 'Quantum Daemon', description: '+50% CPS.', descriptionEn: '+50% CPS.', effectType: 'cps_percent', effectValue: 50, icon: 'quantum' },
  ],
  // T15
  [
    { name: 'Supply Chain Inject', nameEn: 'Supply Chain Inject', description: '+100 credits par clic.', descriptionEn: '+100 credits per click.', effectType: 'cpc_flat', effectValue: 100, icon: 'supplychain' },
    { name: 'Ghost Protocol', nameEn: 'Ghost Protocol', description: '+35 credits/sec.', descriptionEn: '+35 credits/sec.', effectType: 'cps_flat', effectValue: 35, icon: 'ghost' },
  ],
  // T16
  [
    { name: 'AI-Assisted Hack', nameEn: 'AI-Assisted Hack', description: 'Clics +80%.', descriptionEn: 'Clicks +80%.', effectType: 'cpc_percent', effectValue: 80, icon: 'aihack' },
    { name: 'Neural Overclock', nameEn: 'Neural Overclock', description: '+60% CPS.', descriptionEn: '+60% CPS.', effectType: 'cps_percent', effectValue: 60, icon: 'overclock' },
  ],
  // T17
  [
    { name: 'Singularity Breach', nameEn: 'Singularity Breach', description: '+150 credits par clic.', descriptionEn: '+150 credits per click.', effectType: 'cpc_flat', effectValue: 150, icon: 'singularity' },
    { name: 'Hivemind Link', nameEn: 'Hivemind Link', description: '+50 credits/sec.', descriptionEn: '+50 credits/sec.', effectType: 'cps_flat', effectValue: 50, icon: 'hivemind' },
  ],
  // T18
  [
    { name: 'Matrix Override', nameEn: 'Matrix Override', description: 'Clics +100%.', descriptionEn: 'Clicks +100%.', effectType: 'cpc_percent', effectValue: 100, icon: 'matrix' },
    { name: 'Quantum Mining', nameEn: 'Quantum Mining', description: '+80% CPS.', descriptionEn: '+80% CPS.', effectType: 'cps_percent', effectValue: 80, icon: 'quantumine' },
  ],
  // T19
  [
    { name: 'God Mode Exploit', nameEn: 'God Mode Exploit', description: '+200 credits par clic.', descriptionEn: '+200 credits per click.', effectType: 'cpc_flat', effectValue: 200, icon: 'godmode' },
    { name: 'Eternal Daemon', nameEn: 'Eternal Daemon', description: '+75 credits/sec.', descriptionEn: '+75 credits/sec.', effectType: 'cps_flat', effectValue: 75, icon: 'eternal' },
  ],
  // T20
  [
    { name: 'Digital Ascension', nameEn: 'Digital Ascension', description: 'Clics +150%. Tu transcendes le code.', descriptionEn: 'Clicks +150%. You transcend the code.', effectType: 'cpc_percent', effectValue: 150, icon: 'ascension' },
    { name: 'Omega Network', nameEn: 'Omega Network', description: '+100% CPS. Le reseau entier mine pour toi.', descriptionEn: '+100% CPS. The entire network mines for you.', effectType: 'cps_percent', effectValue: 100, icon: 'omega' },
  ],
]

const NETRUNNER_TREE: [TalentDef, TalentDef][] = [
  // T1
  [
    { name: 'Daemon v1', nameEn: 'Daemon v1', description: '+1 credit/sec.', descriptionEn: '+1 credit/sec.', effectType: 'cps_flat', effectValue: 1, icon: 'daemon' },
    { name: 'Click Optimizer', nameEn: 'Click Optimizer', description: '+2 credits par clic.', descriptionEn: '+2 credits per click.', effectType: 'cpc_flat', effectValue: 2, icon: 'optimizer' },
  ],
  // T2
  [
    { name: 'Botnet Lite', nameEn: 'Botnet Lite', description: '+3 credits/sec.', descriptionEn: '+3 credits/sec.', effectType: 'cps_flat', effectValue: 3, icon: 'botnet' },
    { name: 'Data Siphon', nameEn: 'Data Siphon', description: '+10% CPS.', descriptionEn: '+10% CPS.', effectType: 'cps_percent', effectValue: 10, icon: 'siphon' },
  ],
  // T3
  [
    { name: 'Neural Sync', nameEn: 'Neural Sync', description: '+20% CPS.', descriptionEn: '+20% CPS.', effectType: 'cps_percent', effectValue: 20, icon: 'sync' },
    { name: 'ICE Drill', nameEn: 'ICE Drill', description: '+5 credits/sec.', descriptionEn: '+5 credits/sec.', effectType: 'cps_flat', effectValue: 5, icon: 'icedrill' },
  ],
  // T4
  [
    { name: 'Proxy Chain', nameEn: 'Proxy Chain', description: '+8 credits/sec.', descriptionEn: '+8 credits/sec.', effectType: 'cps_flat', effectValue: 8, icon: 'proxy' },
    { name: 'Signal Amplifier', nameEn: 'Signal Amplifier', description: '+5 credits par clic.', descriptionEn: '+5 credits per click.', effectType: 'cpc_flat', effectValue: 5, icon: 'signal' },
  ],
  // T5
  [
    { name: 'Deep Net Access', nameEn: 'Deep Net Access', description: '+25% CPS.', descriptionEn: '+25% CPS.', effectType: 'cps_percent', effectValue: 25, icon: 'deepnet' },
    { name: 'Bandwidth Burst', nameEn: 'Bandwidth Burst', description: '+10 credits/sec.', descriptionEn: '+10 credits/sec.', effectType: 'cps_flat', effectValue: 10, icon: 'bandwidth' },
  ],
  // T6
  [
    { name: 'Darknet Relay', nameEn: 'Darknet Relay', description: '+15 credits/sec.', descriptionEn: '+15 credits/sec.', effectType: 'cps_flat', effectValue: 15, icon: 'darknet' },
    { name: 'Packet Injection', nameEn: 'Packet Injection', description: '+15% CPC.', descriptionEn: '+15% CPC.', effectType: 'cpc_percent', effectValue: 15, icon: 'packet' },
  ],
  // T7
  [
    { name: 'Neural Highway', nameEn: 'Neural Highway', description: '+30% CPS.', descriptionEn: '+30% CPS.', effectType: 'cps_percent', effectValue: 30, icon: 'highway' },
    { name: 'Cache Exploit', nameEn: 'Cache Exploit', description: '+12 credits par clic.', descriptionEn: '+12 credits per click.', effectType: 'cpc_flat', effectValue: 12, icon: 'cache' },
  ],
  // T8
  [
    { name: 'Mesh Network', nameEn: 'Mesh Network', description: '+20 credits/sec.', descriptionEn: '+20 credits/sec.', effectType: 'cps_flat', effectValue: 20, icon: 'mesh' },
    { name: 'Protocol Override', nameEn: 'Protocol Override', description: '+35% CPS.', descriptionEn: '+35% CPS.', effectType: 'cps_percent', effectValue: 35, icon: 'override' },
  ],
  // T9
  [
    { name: 'Autonomous Agent', nameEn: 'Autonomous Agent', description: '+40% CPS.', descriptionEn: '+40% CPS.', effectType: 'cps_percent', effectValue: 40, icon: 'autonomous' },
    { name: 'Fiber Optic Tap', nameEn: 'Fiber Optic Tap', description: '+28 credits/sec.', descriptionEn: '+28 credits/sec.', effectType: 'cps_flat', effectValue: 28, icon: 'fiber' },
  ],
  // T10
  [
    { name: 'Distributed Network', nameEn: 'Distributed Network', description: '+35 credits/sec.', descriptionEn: '+35 credits/sec.', effectType: 'cps_flat', effectValue: 35, icon: 'distnet' },
    { name: 'Recursive Loop', nameEn: 'Recursive Loop', description: '+20 credits par clic.', descriptionEn: '+20 credits per click.', effectType: 'cpc_flat', effectValue: 20, icon: 'recursive' },
  ],
  // T11
  [
    { name: 'Quantum Tunneling', nameEn: 'Quantum Tunneling', description: '+50% CPS.', descriptionEn: '+50% CPS.', effectType: 'cps_percent', effectValue: 50, icon: 'tunnel' },
    { name: 'Parallel Processing', nameEn: 'Parallel Processing', description: '+45 credits/sec.', descriptionEn: '+45 credits/sec.', effectType: 'cps_flat', effectValue: 45, icon: 'parallel' },
  ],
  // T12
  [
    { name: 'Swarm Intelligence', nameEn: 'Swarm Intelligence', description: '+55 credits/sec.', descriptionEn: '+55 credits/sec.', effectType: 'cps_flat', effectValue: 55, icon: 'swarm' },
    { name: 'Memory Leak Exploit', nameEn: 'Memory Leak Exploit', description: '+25 credits par clic.', descriptionEn: '+25 credits per click.', effectType: 'cpc_flat', effectValue: 25, icon: 'memleak' },
  ],
  // T13
  [
    { name: 'Neural Cloud', nameEn: 'Neural Cloud', description: '+60% CPS.', descriptionEn: '+60% CPS.', effectType: 'cps_percent', effectValue: 60, icon: 'cloud' },
    { name: 'Deep Packet Mining', nameEn: 'Deep Packet Mining', description: '+70 credits/sec.', descriptionEn: '+70 credits/sec.', effectType: 'cps_flat', effectValue: 70, icon: 'deeppacket' },
  ],
  // T14
  [
    { name: 'Hive Protocol', nameEn: 'Hive Protocol', description: '+85 credits/sec.', descriptionEn: '+85 credits/sec.', effectType: 'cps_flat', effectValue: 85, icon: 'hive' },
    { name: 'Fractal Algorithm', nameEn: 'Fractal Algorithm', description: '+70% CPS.', descriptionEn: '+70% CPS.', effectType: 'cps_percent', effectValue: 70, icon: 'fractal' },
  ],
  // T15
  [
    { name: 'Singularity Engine', nameEn: 'Singularity Engine', description: '+80% CPS.', descriptionEn: '+80% CPS.', effectType: 'cps_percent', effectValue: 80, icon: 'singengine' },
    { name: 'Infinite Loop', nameEn: 'Infinite Loop', description: '+100 credits/sec.', descriptionEn: '+100 credits/sec.', effectType: 'cps_flat', effectValue: 100, icon: 'infinite' },
  ],
  // T16
  [
    { name: 'Consciousness Upload', nameEn: 'Consciousness Upload', description: '+120 credits/sec.', descriptionEn: '+120 credits/sec.', effectType: 'cps_flat', effectValue: 120, icon: 'upload' },
    { name: 'Temporal Cache', nameEn: 'Temporal Cache', description: '+90% CPS.', descriptionEn: '+90% CPS.', effectType: 'cps_percent', effectValue: 90, icon: 'temporal' },
  ],
  // T17
  [
    { name: 'Reality Compiler', nameEn: 'Reality Compiler', description: '+100% CPS.', descriptionEn: '+100% CPS.', effectType: 'cps_percent', effectValue: 100, icon: 'compiler' },
    { name: 'Omega Core', nameEn: 'Omega Core', description: '+150 credits/sec.', descriptionEn: '+150 credits/sec.', effectType: 'cps_flat', effectValue: 150, icon: 'omegacore' },
  ],
  // T18
  [
    { name: 'Dimensional Rift', nameEn: 'Dimensional Rift', description: '+180 credits/sec.', descriptionEn: '+180 credits/sec.', effectType: 'cps_flat', effectValue: 180, icon: 'rift' },
    { name: 'Entropy Harvest', nameEn: 'Entropy Harvest', description: '+120% CPS.', descriptionEn: '+120% CPS.', effectType: 'cps_percent', effectValue: 120, icon: 'entropy' },
  ],
  // T19
  [
    { name: 'Multiverse Daemon', nameEn: 'Multiverse Daemon', description: '+140% CPS.', descriptionEn: '+140% CPS.', effectType: 'cps_percent', effectValue: 140, icon: 'multiverse' },
    { name: 'Dark Matter Core', nameEn: 'Dark Matter Core', description: '+220 credits/sec.', descriptionEn: '+220 credits/sec.', effectType: 'cps_flat', effectValue: 220, icon: 'darkmatter' },
  ],
  // T20
  [
    { name: 'Digital Godhood', nameEn: 'Digital Godhood', description: '+200% CPS. Tu es le reseau.', descriptionEn: '+200% CPS. You are the network.', effectType: 'cps_percent', effectValue: 200, icon: 'godhood' },
    { name: 'Infinite Engine', nameEn: 'Infinite Engine', description: '+300 credits/sec. Le flux ne s\'arrete jamais.', descriptionEn: '+300 credits/sec. The flow never stops.', effectType: 'cps_flat', effectValue: 300, icon: 'infinengine' },
  ],
]

const SAMURAI_TREE: [TalentDef, TalentDef][] = [
  // T1
  [
    { name: 'Cyber Reflexes', nameEn: 'Cyber Reflexes', description: '+5 ATK.', descriptionEn: '+5 ATK.', effectType: 'atk_flat', effectValue: 5, icon: 'reflex' },
    { name: 'Dermal Plating', nameEn: 'Dermal Plating', description: '+5 DEF.', descriptionEn: '+5 DEF.', effectType: 'def_flat', effectValue: 5, icon: 'dermal' },
  ],
  // T2
  [
    { name: 'Mono-Wire Fists', nameEn: 'Mono-Wire Fists', description: '+8 ATK.', descriptionEn: '+8 ATK.', effectType: 'atk_flat', effectValue: 8, icon: 'monowire' },
    { name: 'Titanium Bones', nameEn: 'Titanium Bones', description: '+8 DEF.', descriptionEn: '+8 DEF.', effectType: 'def_flat', effectValue: 8, icon: 'bones' },
  ],
  // T3
  [
    { name: 'Berserker Chip', nameEn: 'Berserker Chip', description: '+15 ATK.', descriptionEn: '+15 ATK.', effectType: 'atk_flat', effectValue: 15, icon: 'berserker' },
    { name: 'Kevlar Skin', nameEn: 'Kevlar Skin', description: '+15 DEF.', descriptionEn: '+15 DEF.', effectType: 'def_flat', effectValue: 15, icon: 'kevlar' },
  ],
  // T4
  [
    { name: 'Combat Stimulant', nameEn: 'Combat Stimulant', description: '+10% combat (ATK+DEF).', descriptionEn: '+10% combat (ATK+DEF).', effectType: 'combat_percent', effectValue: 10, icon: 'stimulant' },
    { name: 'Nano-Regen', nameEn: 'Nano-Regen', description: '+50 HP max.', descriptionEn: '+50 max HP.', effectType: 'hp_flat', effectValue: 50, icon: 'nanoregen' },
  ],
  // T5
  [
    { name: 'Mantis Blades', nameEn: 'Mantis Blades', description: '+22 ATK.', descriptionEn: '+22 ATK.', effectType: 'atk_flat', effectValue: 22, icon: 'mantis' },
    { name: 'Subdermal Armor', nameEn: 'Subdermal Armor', description: '+22 DEF.', descriptionEn: '+22 DEF.', effectType: 'def_flat', effectValue: 22, icon: 'subdermal' },
  ],
  // T6
  [
    { name: 'Gorilla Arms', nameEn: 'Gorilla Arms', description: '+30 ATK.', descriptionEn: '+30 ATK.', effectType: 'atk_flat', effectValue: 30, icon: 'gorilla' },
    { name: 'Ceramic Plating', nameEn: 'Ceramic Plating', description: '+30 DEF.', descriptionEn: '+30 DEF.', effectType: 'def_flat', effectValue: 30, icon: 'ceramic' },
  ],
  // T7
  [
    { name: 'Adrenaline Pump', nameEn: 'Adrenaline Pump', description: '+15% combat (ATK+DEF).', descriptionEn: '+15% combat (ATK+DEF).', effectType: 'combat_percent', effectValue: 15, icon: 'adrenaline' },
    { name: 'Bio-Monitor', nameEn: 'Bio-Monitor', description: '+80 HP max.', descriptionEn: '+80 max HP.', effectType: 'hp_flat', effectValue: 80, icon: 'biomonitor' },
  ],
  // T8
  [
    { name: 'Projectile Launch', nameEn: 'Projectile Launch', description: '+40 ATK.', descriptionEn: '+40 ATK.', effectType: 'atk_flat', effectValue: 40, icon: 'projectile' },
    { name: 'Ballistic Coprocessor', nameEn: 'Ballistic Coprocessor', description: '+40 DEF.', descriptionEn: '+40 DEF.', effectType: 'def_flat', effectValue: 40, icon: 'ballistic' },
  ],
  // T9
  [
    { name: 'Sandevistan', nameEn: 'Sandevistan', description: '+20% combat (ATK+DEF).', descriptionEn: '+20% combat (ATK+DEF).', effectType: 'combat_percent', effectValue: 20, icon: 'sandevistan' },
    { name: 'Second Heart', nameEn: 'Second Heart', description: '+120 HP max.', descriptionEn: '+120 max HP.', effectType: 'hp_flat', effectValue: 120, icon: 'secondheart' },
  ],
  // T10
  [
    { name: 'Thermal Katana', nameEn: 'Thermal Katana', description: '+55 ATK.', descriptionEn: '+55 ATK.', effectType: 'atk_flat', effectValue: 55, icon: 'thermalkat' },
    { name: 'Hardened Shell', nameEn: 'Hardened Shell', description: '+55 DEF.', descriptionEn: '+55 DEF.', effectType: 'def_flat', effectValue: 55, icon: 'hardshell' },
  ],
  // T11
  [
    { name: 'Blade Fury', nameEn: 'Blade Fury', description: '+70 ATK.', descriptionEn: '+70 ATK.', effectType: 'atk_flat', effectValue: 70, icon: 'bladefury' },
    { name: 'Fortress Protocol', nameEn: 'Fortress Protocol', description: '+70 DEF.', descriptionEn: '+70 DEF.', effectType: 'def_flat', effectValue: 70, icon: 'fortress' },
  ],
  // T12
  [
    { name: 'Berserk OS', nameEn: 'Berserk OS', description: '+30% combat (ATK+DEF).', descriptionEn: '+30% combat (ATK+DEF).', effectType: 'combat_percent', effectValue: 30, icon: 'berserkos' },
    { name: 'Trauma Team Implant', nameEn: 'Trauma Team Implant', description: '+180 HP max.', descriptionEn: '+180 max HP.', effectType: 'hp_flat', effectValue: 180, icon: 'trauma' },
  ],
  // T13
  [
    { name: 'Plasma Fists', nameEn: 'Plasma Fists', description: '+90 ATK.', descriptionEn: '+90 ATK.', effectType: 'atk_flat', effectValue: 90, icon: 'plasma' },
    { name: 'Reactive Armor', nameEn: 'Reactive Armor', description: '+90 DEF.', descriptionEn: '+90 DEF.', effectType: 'def_flat', effectValue: 90, icon: 'reactive' },
  ],
  // T14
  [
    { name: 'Cybernetic Fury', nameEn: 'Cybernetic Fury', description: '+40% combat (ATK+DEF).', descriptionEn: '+40% combat (ATK+DEF).', effectType: 'combat_percent', effectValue: 40, icon: 'cyberfury' },
    { name: 'Regeneration Core', nameEn: 'Regeneration Core', description: '+250 HP max.', descriptionEn: '+250 max HP.', effectType: 'hp_flat', effectValue: 250, icon: 'regencore' },
  ],
  // T15
  [
    { name: 'Molecular Blade', nameEn: 'Molecular Blade', description: '+120 ATK.', descriptionEn: '+120 ATK.', effectType: 'atk_flat', effectValue: 120, icon: 'molecblade' },
    { name: 'Diamond Skin', nameEn: 'Diamond Skin', description: '+120 DEF.', descriptionEn: '+120 DEF.', effectType: 'def_flat', effectValue: 120, icon: 'diamond' },
  ],
  // T16
  [
    { name: 'Omega Strike', nameEn: 'Omega Strike', description: '+50% combat (ATK+DEF).', descriptionEn: '+50% combat (ATK+DEF).', effectType: 'combat_percent', effectValue: 50, icon: 'omegastrike' },
    { name: 'Immortal Frame', nameEn: 'Immortal Frame', description: '+350 HP max.', descriptionEn: '+350 max HP.', effectType: 'hp_flat', effectValue: 350, icon: 'immortal' },
  ],
  // T17
  [
    { name: 'Neutron Fists', nameEn: 'Neutron Fists', description: '+160 ATK.', descriptionEn: '+160 ATK.', effectType: 'atk_flat', effectValue: 160, icon: 'neutron' },
    { name: 'Quantum Shield', nameEn: 'Quantum Shield', description: '+160 DEF.', descriptionEn: '+160 DEF.', effectType: 'def_flat', effectValue: 160, icon: 'qshield' },
  ],
  // T18
  [
    { name: 'Black Hole Strike', nameEn: 'Black Hole Strike', description: '+60% combat (ATK+DEF).', descriptionEn: '+60% combat (ATK+DEF).', effectType: 'combat_percent', effectValue: 60, icon: 'blackhole' },
    { name: 'Phoenix Protocol', nameEn: 'Phoenix Protocol', description: '+500 HP max.', descriptionEn: '+500 max HP.', effectType: 'hp_flat', effectValue: 500, icon: 'phoenix' },
  ],
  // T19
  [
    { name: 'Antimatter Edge', nameEn: 'Antimatter Edge', description: '+220 ATK.', descriptionEn: '+220 ATK.', effectType: 'atk_flat', effectValue: 220, icon: 'antimatter' },
    { name: 'Event Horizon Armor', nameEn: 'Event Horizon Armor', description: '+220 DEF.', descriptionEn: '+220 DEF.', effectType: 'def_flat', effectValue: 220, icon: 'horizon' },
  ],
  // T20
  [
    { name: 'Apex Predator', nameEn: 'Apex Predator', description: '+80% combat (ATK+DEF). Arme ultime.', descriptionEn: '+80% combat (ATK+DEF). Ultimate weapon.', effectType: 'combat_percent', effectValue: 80, icon: 'apex' },
    { name: 'Unkillable', nameEn: 'Unkillable', description: '+750 HP max. Tu ne meurs pas.', descriptionEn: '+750 max HP. You do not die.', effectType: 'hp_flat', effectValue: 750, icon: 'unkillable' },
  ],
]

const CHROME_DEALER_TREE: [TalentDef, TalentDef][] = [
  // T1
  [
    { name: 'Street Cred', nameEn: 'Street Cred', description: '-5% prix shop.', descriptionEn: '-5% shop price.', effectType: 'shop_discount', effectValue: 5, icon: 'cred' },
    { name: 'Scavenger Eye', nameEn: 'Scavenger Eye', description: '+10% loot chance.', descriptionEn: '+10% loot chance.', effectType: 'loot_bonus', effectValue: 10, icon: 'eye' },
  ],
  // T2
  [
    { name: 'Haggler Chip', nameEn: 'Haggler Chip', description: '-5% prix shop.', descriptionEn: '-5% shop price.', effectType: 'shop_discount', effectValue: 5, icon: 'haggler' },
    { name: 'Loot Scanner', nameEn: 'Loot Scanner', description: '+10% loot chance.', descriptionEn: '+10% loot chance.', effectType: 'loot_bonus', effectValue: 10, icon: 'scanner' },
  ],
  // T3
  [
    { name: 'Insider Trading', nameEn: 'Insider Trading', description: '+15% credits donjon.', descriptionEn: '+15% dungeon credits.', effectType: 'dungeon_credits', effectValue: 15, icon: 'insider' },
    { name: 'Lucky Charm', nameEn: 'Lucky Charm', description: '+15% loot chance.', descriptionEn: '+15% loot chance.', effectType: 'loot_bonus', effectValue: 15, icon: 'lucky' },
  ],
  // T4
  [
    { name: 'Wholesale Access', nameEn: 'Wholesale Access', description: '-8% prix shop.', descriptionEn: '-8% shop price.', effectType: 'shop_discount', effectValue: 8, icon: 'wholesale' },
    { name: 'Dungeon Cartographer', nameEn: 'Dungeon Cartographer', description: '+20% credits donjon.', descriptionEn: '+20% dungeon credits.', effectType: 'dungeon_credits', effectValue: 20, icon: 'carto' },
  ],
  // T5
  [
    { name: 'Black Market Access', nameEn: 'Black Market Access', description: '-10% prix shop.', descriptionEn: '-10% shop price.', effectType: 'shop_discount', effectValue: 10, icon: 'market' },
    { name: 'Treasure Hunter', nameEn: 'Treasure Hunter', description: '+20% loot chance.', descriptionEn: '+20% loot chance.', effectType: 'loot_bonus', effectValue: 20, icon: 'treasure' },
  ],
  // T6
  [
    { name: 'Corporate Spy', nameEn: 'Corporate Spy', description: '+25% credits donjon.', descriptionEn: '+25% dungeon credits.', effectType: 'dungeon_credits', effectValue: 25, icon: 'spy' },
    { name: 'Salvage Expert', nameEn: 'Salvage Expert', description: '+25% loot chance.', descriptionEn: '+25% loot chance.', effectType: 'loot_bonus', effectValue: 25, icon: 'salvage' },
  ],
  // T7
  [
    { name: 'Price Manipulator', nameEn: 'Price Manipulator', description: '-12% prix shop.', descriptionEn: '-12% shop price.', effectType: 'shop_discount', effectValue: 12, icon: 'manipulate' },
    { name: 'Data Broker', nameEn: 'Data Broker', description: '+30% credits donjon.', descriptionEn: '+30% dungeon credits.', effectType: 'dungeon_credits', effectValue: 30, icon: 'broker' },
  ],
  // T8
  [
    { name: 'Supply Chain Master', nameEn: 'Supply Chain Master', description: '-10% prix shop.', descriptionEn: '-10% shop price.', effectType: 'shop_discount', effectValue: 10, icon: 'supply' },
    { name: 'Fortune Finder', nameEn: 'Fortune Finder', description: '+30% loot chance.', descriptionEn: '+30% loot chance.', effectType: 'loot_bonus', effectValue: 30, icon: 'fortune' },
  ],
  // T9
  [
    { name: 'Bounty Hunter', nameEn: 'Bounty Hunter', description: '+40% credits donjon.', descriptionEn: '+40% dungeon credits.', effectType: 'dungeon_credits', effectValue: 40, icon: 'bounty' },
    { name: 'Master Scavenger', nameEn: 'Master Scavenger', description: '+35% loot chance.', descriptionEn: '+35% loot chance.', effectType: 'loot_bonus', effectValue: 35, icon: 'masterscav' },
  ],
  // T10
  [
    { name: 'Megacorp Contact', nameEn: 'Megacorp Contact', description: '-15% prix shop.', descriptionEn: '-15% shop price.', effectType: 'shop_discount', effectValue: 15, icon: 'megacorp' },
    { name: 'Dungeon Mogul', nameEn: 'Dungeon Mogul', description: '+50% credits donjon.', descriptionEn: '+50% dungeon credits.', effectType: 'dungeon_credits', effectValue: 50, icon: 'mogul' },
  ],
  // T11
  [
    { name: 'Contraband Ring', nameEn: 'Contraband Ring', description: '-12% prix shop.', descriptionEn: '-12% shop price.', effectType: 'shop_discount', effectValue: 12, icon: 'contraband' },
    { name: 'Artifact Sense', nameEn: 'Artifact Sense', description: '+40% loot chance.', descriptionEn: '+40% loot chance.', effectType: 'loot_bonus', effectValue: 40, icon: 'artifact' },
  ],
  // T12
  [
    { name: 'War Profiteer', nameEn: 'War Profiteer', description: '+60% credits donjon.', descriptionEn: '+60% dungeon credits.', effectType: 'dungeon_credits', effectValue: 60, icon: 'profiteer' },
    { name: 'Chrome Recycler', nameEn: 'Chrome Recycler', description: '+50% loot chance.', descriptionEn: '+50% loot chance.', effectType: 'loot_bonus', effectValue: 50, icon: 'recycler' },
  ],
  // T13
  [
    { name: 'Monopoly Chip', nameEn: 'Monopoly Chip', description: '-15% prix shop.', descriptionEn: '-15% shop price.', effectType: 'shop_discount', effectValue: 15, icon: 'monopoly' },
    { name: 'Relic Hunter', nameEn: 'Relic Hunter', description: '+60% loot chance.', descriptionEn: '+60% loot chance.', effectType: 'loot_bonus', effectValue: 60, icon: 'relic' },
  ],
  // T14
  [
    { name: 'Credit Launderer', nameEn: 'Credit Launderer', description: '+80% credits donjon.', descriptionEn: '+80% dungeon credits.', effectType: 'dungeon_credits', effectValue: 80, icon: 'launderer' },
    { name: 'Golden Touch', nameEn: 'Golden Touch', description: '+70% loot chance.', descriptionEn: '+70% loot chance.', effectType: 'loot_bonus', effectValue: 70, icon: 'golden' },
  ],
  // T15
  [
    { name: 'Cartel Boss', nameEn: 'Cartel Boss', description: '-18% prix shop.', descriptionEn: '-18% shop price.', effectType: 'shop_discount', effectValue: 18, icon: 'cartel' },
    { name: 'Dungeon Baron', nameEn: 'Dungeon Baron', description: '+100% credits donjon.', descriptionEn: '+100% dungeon credits.', effectType: 'dungeon_credits', effectValue: 100, icon: 'baron' },
  ],
  // T16
  [
    { name: 'Market Crasher', nameEn: 'Market Crasher', description: '-20% prix shop.', descriptionEn: '-20% shop price.', effectType: 'shop_discount', effectValue: 20, icon: 'crasher' },
    { name: 'Legendary Finder', nameEn: 'Legendary Finder', description: '+80% loot chance.', descriptionEn: '+80% loot chance.', effectType: 'loot_bonus', effectValue: 80, icon: 'legendary' },
  ],
  // T17
  [
    { name: 'Shadow Economy', nameEn: 'Shadow Economy', description: '+120% credits donjon.', descriptionEn: '+120% dungeon credits.', effectType: 'dungeon_credits', effectValue: 120, icon: 'shadow' },
    { name: 'Midas Protocol', nameEn: 'Midas Protocol', description: '+100% loot chance.', descriptionEn: '+100% loot chance.', effectType: 'loot_bonus', effectValue: 100, icon: 'midas' },
  ],
  // T18
  [
    { name: 'Free Trade Zone', nameEn: 'Free Trade Zone', description: '-22% prix shop.', descriptionEn: '-22% shop price.', effectType: 'shop_discount', effectValue: 22, icon: 'freezone' },
    { name: 'Vault Cracker', nameEn: 'Vault Cracker', description: '+150% credits donjon.', descriptionEn: '+150% dungeon credits.', effectType: 'dungeon_credits', effectValue: 150, icon: 'vault' },
  ],
  // T19
  [
    { name: 'Infinite Credit Line', nameEn: 'Infinite Credit Line', description: '-25% prix shop.', descriptionEn: '-25% shop price.', effectType: 'shop_discount', effectValue: 25, icon: 'infinite' },
    { name: 'Dragon Hoard', nameEn: 'Dragon Hoard', description: '+120% loot chance.', descriptionEn: '+120% loot chance.', effectType: 'loot_bonus', effectValue: 120, icon: 'dragon' },
  ],
  // T20
  [
    { name: 'Corporate Overlord', nameEn: 'Corporate Overlord', description: '-30% prix. Tu controles le marche.', descriptionEn: '-30% price. You control the market.', effectType: 'shop_discount', effectValue: 30, icon: 'overlord' },
    { name: 'Mythic Plunderer', nameEn: 'Mythic Plunderer', description: '+150% loot. Rien ne t\'echappe.', descriptionEn: '+150% loot. Nothing escapes you.', effectType: 'loot_bonus', effectValue: 150, icon: 'mythic' },
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
            nameEn: def.nameEn,
            description: def.description,
            descriptionEn: def.descriptionEn,
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
