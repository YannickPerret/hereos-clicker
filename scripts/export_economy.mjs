import XLSX from 'xlsx'

const wb = XLSX.utils.book_new()

// ════════════════════════════════════════
// 1. ITEMS
// ════════════════════════════════════════
const items = [
  // Weapons
  ['Plasma Pistol MK-I','weapon','common',100,'attack_boost',5],
  ['Vibro-Blade','weapon','common',200,'attack_boost',8],
  ['Budget Arms Unity+','weapon','common',350,'attack_boost',11],
  ['Neural Disruptor','weapon','uncommon',500,'attack_boost',15],
  ['Kang Tao Shock Carbine','weapon','uncommon',1400,'attack_boost',22],
  ['Railgun X-7','weapon','rare',1500,'attack_boost',25],
  ['Militech Crusher Custom','weapon','rare',8500,'attack_boost',38],
  ['Void Cannon','weapon','epic',5000,'attack_boost',50],
  ['Arasaka Revenant Smartgun','weapon','epic',52000,'attack_boost',78],
  ['OMEGA Protocol','weapon','legendary',20000,'attack_boost',100],
  ['Blackwall Breacher','weapon','legendary',240000,'attack_boost',155],
  // Armor
  ['Kevlar Vest','armor','common',80,'defense_boost',3],
  ['Tyger Claws Reinforced Coat','armor','common',300,'defense_boost',6],
  ['Nanoweave Jacket','armor','uncommon',400,'defense_boost',10],
  ['Trauma Team Ballistic Mesh','armor','uncommon',1250,'defense_boost',15],
  ['Titanium Exosuit','armor','rare',1200,'defense_boost',20],
  ['Militech Bastion Frame','armor','rare',7800,'defense_boost',30],
  ['Quantum Shield Matrix','armor','epic',4000,'defense_boost',40],
  ['Arasaka Specter Weave','armor','epic',47000,'defense_boost',58],
  ['Ghost Shell','armor','legendary',18000,'defense_boost',80],
  ['Mikoshi Nullskin','armor','legendary',210000,'defense_boost',125],
  // Implants
  ['Reflex Booster v1','implant','common',150,'click_multiplier',2],
  ['Kiroshi Pulse Sync','implant','common',400,'click_multiplier',4],
  ['Neural Accelerator','implant','uncommon',600,'click_multiplier',5],
  ['Sandevistan Lite','implant','uncommon',1600,'click_multiplier',8],
  ['Synaptic Overdrive','implant','rare',2000,'click_multiplier',10],
  ['QianT Synapse Rail','implant','rare',9200,'click_multiplier',15],
  ['Quantum Consciousness','implant','epic',8000,'click_multiplier',25],
  ['Mantis Driver Suite','implant','epic',56000,'click_multiplier',36],
  ['Singularity Core','implant','legendary',25000,'click_multiplier',50],
  ['Militech Apogee Sandevistan','implant','legendary',320000,'click_multiplier',95],
  ['Relic Overclock Kernel','implant','legendary',260000,'click_multiplier',82],
  // Clothes
  ['Static Mohawk','clothes_hair','common',900,null,null],
  ['Acid Bob','clothes_hair','uncommon',2600,null,null],
  ['Ghost Braids','clothes_hair','rare',8800,null,null],
  ['Chromehawk Crown','clothes_hair','epic',24000,null,null],
  ['Kiroshi Night Visor','clothes_face','common',1200,null,null],
  ['Carbon Half Mask','clothes_face','uncommon',3100,null,null],
  ['Oni Signal Mask','clothes_face','rare',9600,null,null],
  ['Blackwall Respirator','clothes_face','epic',27000,null,null],
  ['Hexline Jacket','clothes_outer','common',1800,null,null],
  ['Nightglass Trench','clothes_outer','rare',11000,null,null],
  ['Chrome Bolero','clothes_outer','epic',28500,null,null],
  ['Holo Weave Shell','clothes_outer','legendary',72000,null,null],
  ['Backalley Cargos','clothes_legs','common',1400,null,null],
  ['Techwear Striders','clothes_legs','uncommon',4200,null,null],
  ['Zero-G Runners','clothes_legs','rare',12500,null,null],
  ['Exo-Leg Rails','clothes_legs','epic',32000,null,null],
  // Consumables
  ['Stim Pack','consumable','common',25,'hp_restore',30],
  ['MedGel Capsule','consumable','uncommon',80,'hp_restore',75],
  ['Phoenix Serum','consumable','rare',300,'hp_restore',999],
  ['CyberBoost Energy','consumable','uncommon',100,'temp_click_boost',2],
  ['XP Chip','consumable','rare',400,'xp_boost',500],
  ['Neural Respec Chip','consumable','legendary',50000,'talent_respec',1],
  // Upgrades
  ['Finger Servos','upgrade','common',5000,'permanent_click',1],
  ['Haptic Amplifier','upgrade','uncommon',50000,'permanent_click',3],
  ['Neural Click Matrix','upgrade','rare',500000,'permanent_click',5],
  ['Quantum Tap Interface','upgrade','epic',5000000,'permanent_click',8],
]

const wsItems = XLSX.utils.aoa_to_sheet([
  ['Nom','Type','Rareté','Prix de base','Effet','Valeur effet'],
  ...items
])
wsItems['!cols'] = [{wch:30},{wch:14},{wch:12},{wch:12},{wch:18},{wch:12}]
XLSX.utils.book_append_sheet(wb, wsItems, 'Items')

// ════════════════════════════════════════
// 2. SHOP
// ════════════════════════════════════════
const shop = [
  ['Plasma Pistol MK-I',100,null,null,true],
  ['Vibro-Blade',200,null,null,true],
  ['Budget Arms Unity+',350,null,null,true],
  ['Neural Disruptor',500,null,5,true],
  ['Kang Tao Shock Carbine',1400,null,5,true],
  ['Railgun X-7',1500,null,3,true],
  ['Militech Crusher Custom',8500,null,3,true],
  ['Void Cannon',5000,null,1,true],
  ['Arasaka Revenant Smartgun',52000,64000,1,true],
  ['Blackwall Breacher',240000,290000,1,true],
  ['Kevlar Vest',80,null,null,true],
  ['Tyger Claws Reinforced Coat',300,null,null,true],
  ['Nanoweave Jacket',400,null,5,true],
  ['Trauma Team Ballistic Mesh',1250,null,5,true],
  ['Titanium Exosuit',1200,null,3,true],
  ['Militech Bastion Frame',7800,null,3,true],
  ['Arasaka Specter Weave',47000,58000,1,true],
  ['Mikoshi Nullskin',210000,260000,1,true],
  ['Reflex Booster v1',150,null,null,true],
  ['Kiroshi Pulse Sync',400,null,null,true],
  ['Neural Accelerator',600,null,5,true],
  ['Sandevistan Lite',1600,null,5,true],
  ['Synaptic Overdrive',2000,null,2,true],
  ['QianT Synapse Rail',9200,null,3,true],
  ['Mantis Driver Suite',56000,62000,1,true],
  ['Militech Apogee Sandevistan',320000,380000,1,true],
  ['Relic Overclock Kernel',260000,330000,1,true],
  ['Stim Pack',25,null,null,true],
  ['MedGel Capsule',80,null,null,true],
  ['Phoenix Serum',300,null,10,true],
  ['CyberBoost Energy',100,null,null,true],
  ['Finger Servos',5000,5000,10,true],
  ['Haptic Amplifier',50000,50000,10,true],
  ['Neural Click Matrix',500000,500000,10,false],
  ['Quantum Tap Interface',5000000,5000000,10,false],
  ['Neural Respec Chip',50000,50000,null,true],
  // Clothes
  ['Static Mohawk',900,null,null,true],
  ['Acid Bob',2600,null,6,true],
  ['Ghost Braids',8800,null,4,true],
  ['Chromehawk Crown',24000,28000,2,true],
  ['Kiroshi Night Visor',1200,null,null,true],
  ['Carbon Half Mask',3100,null,6,true],
  ['Oni Signal Mask',9600,null,4,true],
  ['Blackwall Respirator',27000,32000,2,true],
  ['Hexline Jacket',1800,null,null,true],
  ['Nightglass Trench',11000,null,4,true],
  ['Chrome Bolero',28500,33000,2,true],
  ['Holo Weave Shell',72000,79000,1,true],
  ['Backalley Cargos',1400,null,null,true],
  ['Techwear Striders',4200,null,6,true],
  ['Zero-G Runners',12500,null,4,true],
  ['Exo-Leg Rails',32000,36000,2,true],
]

const wsShop = XLSX.utils.aoa_to_sheet([
  ['Item','Prix base','Prix shop (override)','Stock','Actif'],
  ...shop
])
wsShop['!cols'] = [{wch:30},{wch:12},{wch:18},{wch:8},{wch:8}]
XLSX.utils.book_append_sheet(wb, wsShop, 'Shop')

// ════════════════════════════════════════
// 3. ENEMIES
// ════════════════════════════════════════
const enemies = [
  ['Glitched Drone',1,30,5,2,10,5,15,3,130],
  ['Neon Rat',1,20,8,1,8,3,10,5,140],
  ['Street Thug',1,50,7,3,15,10,25,4,135],
  ['Rogue AI Drone',2,80,15,8,30,20,50,8,155],
  ['Cyber Jackal',2,60,20,5,25,15,40,10,160],
  ['DataWraith',2,70,18,10,35,25,60,7,150],
  ['Corp Security Bot',3,150,25,20,60,50,120,10,170],
  ['Netrunner Assassin',3,100,35,12,70,60,150,15,180],
  ['Mech Walker',3,200,30,25,80,80,200,8,200],
  ['ARCHON',4,500,50,30,200,300,800,12,200],
  ['Chrome Dragon',4,800,60,40,350,500,1500,15,220],
  ['The Void King',4,1200,80,50,500,1000,3000,20,250],
  ['Black ICE Hound',5,1800,110,75,650,3500,6500,16,195],
  ['Maelstrom Ripper',5,2200,125,85,720,4000,7500,18,205],
  ['Militech Suppressor',5,2600,135,95,820,5200,9000,14,190],
  ['Arasaka Counter-Intel',6,3200,155,110,1000,7000,12000,20,215],
  ['Sandevistan Duelist',6,3500,168,112,1080,7600,13500,25,230],
  ['Cyberpsycho Dragoon',6,3900,175,120,1150,8500,15000,22,225],
  ['Cerberus Siege Frame',6,4700,195,135,1325,11000,19000,16,210],
  ['Blackwall Seraph',7,6200,230,165,1750,18000,30000,24,235],
  ['Mikoshi Warden',7,7800,255,185,2200,24000,42000,26,245],
  ['Soulkiller Prime',7,9800,285,220,2800,32000,55000,28,260],
]

const wsEnemies = XLSX.utils.aoa_to_sheet([
  ['Nom','Tier','HP','ATK','DEF','XP','Credits Min','Credits Max','Crit%','CritDmg%'],
  ...enemies
])
wsEnemies['!cols'] = [{wch:25},{wch:6},{wch:8},{wch:8},{wch:8},{wch:8},{wch:12},{wch:12},{wch:8},{wch:10}]
XLSX.utils.book_append_sheet(wb, wsEnemies, 'Ennemis')

// ════════════════════════════════════════
// 4. LOOT TABLE
// ════════════════════════════════════════
const loot = [
  ['Glitched Drone','Stim Pack',0.30],
  ['Glitched Drone','Finger Servos',0.10],
  ['Neon Rat','Stim Pack',0.20],
  ['Street Thug','Plasma Pistol MK-I',0.15],
  ['Street Thug','Kevlar Vest',0.10],
  ['Rogue AI Drone','Neural Disruptor',0.15],
  ['Rogue AI Drone','Neural Accelerator',0.10],
  ['Cyber Jackal','Nanoweave Jacket',0.15],
  ['DataWraith','Haptic Amplifier',0.12],
  ['DataWraith','MedGel Capsule',0.20],
  ['Corp Security Bot','Titanium Exosuit',0.12],
  ['Netrunner Assassin','Railgun X-7',0.10],
  ['Netrunner Assassin','Synaptic Overdrive',0.08],
  ['Mech Walker','Neural Click Matrix',0.10],
  ['Mech Walker','Phoenix Serum',0.15],
  ['ARCHON','Void Cannon',0.20],
  ['ARCHON','Quantum Consciousness',0.15],
  ['Chrome Dragon','Quantum Shield Matrix',0.20],
  ['Chrome Dragon','Quantum Tap Interface',0.15],
  ['The Void King','OMEGA Protocol',0.10],
  ['The Void King','Ghost Shell',0.10],
  ['The Void King','Singularity Core',0.08],
  ['Black ICE Hound','Kiroshi Pulse Sync',0.12],
  ['Black ICE Hound','Sandevistan Lite',0.08],
  ['Maelstrom Ripper','Budget Arms Unity+',0.10],
  ['Maelstrom Ripper','Tyger Claws Reinforced Coat',0.10],
  ['Militech Suppressor','Kang Tao Shock Carbine',0.10],
  ['Militech Suppressor','Trauma Team Ballistic Mesh',0.10],
  ['Arasaka Counter-Intel','Militech Bastion Frame',0.10],
  ['Arasaka Counter-Intel','QianT Synapse Rail',0.08],
  ['Sandevistan Duelist','QianT Synapse Rail',0.12],
  ['Sandevistan Duelist','Mantis Driver Suite',0.06],
  ['Cyberpsycho Dragoon','Militech Crusher Custom',0.10],
  ['Cyberpsycho Dragoon','Mantis Driver Suite',0.08],
  ['Cerberus Siege Frame','Arasaka Revenant Smartgun',0.10],
  ['Cerberus Siege Frame','Arasaka Specter Weave',0.08],
  ['Blackwall Seraph','Blackwall Breacher',0.08],
  ['Blackwall Seraph','Relic Overclock Kernel',0.06],
  ['Mikoshi Warden','Mikoshi Nullskin',0.08],
  ['Mikoshi Warden','Militech Apogee Sandevistan',0.06],
  ['Soulkiller Prime','Blackwall Breacher',0.12],
  ['Soulkiller Prime','Mikoshi Nullskin',0.12],
  ['Soulkiller Prime','Militech Apogee Sandevistan',0.08],
  ['Soulkiller Prime','Relic Overclock Kernel',0.08],
]

const wsLoot = XLSX.utils.aoa_to_sheet([
  ['Ennemi','Item','Chance de drop'],
  ...loot
])
wsLoot['!cols'] = [{wch:25},{wch:30},{wch:15}]
XLSX.utils.book_append_sheet(wb, wsLoot, 'Loot Table')

// ════════════════════════════════════════
// 5. DUNGEON FLOORS
// ════════════════════════════════════════
const floors = [
  [1,'Neon Alley',1,'Glitched Drone, Neon Rat, Street Thug',null,1,4],
  [2,'Abandoned Metro',3,'Glitched Drone, Neon Rat, Street Thug, Rogue AI Drone',null,1,4],
  [3,'Data Catacombs',5,'Rogue AI Drone, Cyber Jackal, DataWraith','ARCHON',1,4],
  [4,'Corporate Spire - Lower',8,'Cyber Jackal, DataWraith, Corp Security Bot, Netrunner Assassin',null,2,4],
  [5,'Corporate Spire - Upper',10,'Corp Security Bot, Netrunner Assassin, Mech Walker','Chrome Dragon',2,4],
  [6,'The Void',15,'Mech Walker, ARCHON, Chrome Dragon','The Void King',3,4],
  [7,'Pacifica Black Site',20,'Black ICE Hound, Maelstrom Ripper, Militech Suppressor',null,2,4],
  [8,'Dogtown Kill Corridors',24,'Black ICE Hound, Militech Suppressor, Arasaka Counter-Intel','Cyberpsycho Dragoon',2,4],
  [9,'Arasaka Counterintel Vault',29,'Militech Suppressor, Arasaka Counter-Intel, Sandevistan Duelist, Cyberpsycho Dragoon',null,2,4],
  [10,'Cynosure Relay',34,'Arasaka Counter-Intel, Sandevistan Duelist, Cyberpsycho Dragoon, Cerberus Siege Frame','Blackwall Seraph',3,4],
  [11,'Mikoshi Access Spine',40,'Cerberus Siege Frame, Blackwall Seraph, Mikoshi Warden',null,3,4],
  [12,'Blackwall Breach',48,'Blackwall Seraph, Mikoshi Warden, Soulkiller Prime','Soulkiller Prime',4,4],
]

const wsFloors = XLSX.utils.aoa_to_sheet([
  ['Etage','Nom','Niveau min','Ennemis','Boss','Joueurs min','Joueurs max'],
  ...floors
])
wsFloors['!cols'] = [{wch:6},{wch:28},{wch:10},{wch:55},{wch:22},{wch:12},{wch:12}]
XLSX.utils.book_append_sheet(wb, wsFloors, 'Donjon')

// ════════════════════════════════════════
// 6. COMPANIONS
// ════════════════════════════════════════
const companions = [
  ['Micro-Drone MK1','common','cpc_flat',2,500],
  ['Rat Cybernétique','common','cps_flat',1,800],
  ['Bot Bouclier','common','def_flat',3,600],
  ['Falcon Electrique','uncommon','crit_chance',3,2500],
  ['Spider-Bot','uncommon','atk_flat',5,3000],
  ['Nanites Collecteurs','uncommon','cps_flat',3,3500],
  ['Drone Tactique V2','rare','cpc_flat',8,10000],
  ['Loup Chrome','rare','atk_flat',10,12000],
  ['Medic-Bot','rare','hp_flat',50,8000],
  ['Phoenix Digital','epic','crit_chance',8,35000],
  ['Golem de Données','epic','def_flat',20,40000],
  ['NEXUS - IA Rogue','legendary','cpc_flat',20,100000],
  ['Dragon Holographique','legendary','crit_chance',15,150000],
]

const wsComp = XLSX.utils.aoa_to_sheet([
  ['Nom','Rareté','Type bonus','Valeur bonus','Prix'],
  ...companions
])
wsComp['!cols'] = [{wch:22},{wch:12},{wch:14},{wch:12},{wch:10}]
XLSX.utils.book_append_sheet(wb, wsComp, 'Companions')

// ════════════════════════════════════════
// 7. LEVEL PROGRESSION (1-150)
// ════════════════════════════════════════
const levelRows = []
let totalHP = 100, totalATK = 10, totalDEF = 5, totalCPC = 1, totalCPS = 0
let totalCritChance = 0, totalCritDmg = 150, totalTalentPts = 1
let totalXPNeeded = 0

for (let lvl = 1; lvl <= 150; lvl++) {
  if (lvl > 1) {
    const xpNeeded = (lvl - 1) * 100
    totalXPNeeded += xpNeeded
    totalHP += 8 + Math.floor(lvl * 1.5)
    totalATK += 2 + Math.floor(lvl / 5)
    totalDEF += 1 + Math.floor(lvl / 5)
    if (lvl % 3 === 0) totalCPC += 1
    if (lvl % 5 === 0) { totalCritChance += 1; totalCritDmg += 5 }
    if (lvl % 10 === 0) totalCPS += 1
    totalTalentPts += 1
  }
  levelRows.push([lvl, lvl * 100, totalXPNeeded, totalHP, totalATK, totalDEF, totalCPC, totalCPS, Math.min(totalCritChance, 100), totalCritDmg, totalTalentPts])
}

const wsLevels = XLSX.utils.aoa_to_sheet([
  ['Niveau','XP pour next','XP cumulé','HP Max','ATK','DEF','CPC','CPS','Crit%','CritDmg%','Talent Pts cumulés'],
  ...levelRows
])
wsLevels['!cols'] = [{wch:8},{wch:12},{wch:12},{wch:8},{wch:8},{wch:8},{wch:8},{wch:8},{wch:8},{wch:10},{wch:18}]
XLSX.utils.book_append_sheet(wb, wsLevels, 'Progression Niveaux')

// ════════════════════════════════════════
// 8. DAILY MISSIONS
// ════════════════════════════════════════
const missions = [
  ['Routine de hack','click',100,'credits',200],
  ['Hack intensif','click',500,'credits',1000],
  ['Overdrive','click',1000,'xp',500],
  ['Nettoyage de rue','kill',3,'credits',500],
  ['Chasseur de primes','kill',10,'credits',2000],
  ['Exterminateur','kill',20,'xp',1000],
  ['Exploration','dungeon_clear',1,'credits',800],
  ['Plongee profonde','dungeon_clear',3,'credits',3000],
  ['Premier million','earn_credits',5000,'xp',300],
  ['Flux de données','earn_credits',20000,'credits',5000],
  ['Gladiateur','pvp_win',1,'credits',1000],
  ['Champion de l\'arene','pvp_win',3,'credits',5000],
]

const wsMissions = XLSX.utils.aoa_to_sheet([
  ['Nom','Type','Objectif','Récompense type','Récompense valeur'],
  ...missions
])
wsMissions['!cols'] = [{wch:24},{wch:14},{wch:10},{wch:16},{wch:16}]
XLSX.utils.book_append_sheet(wb, wsMissions, 'Missions')

// ════════════════════════════════════════
// 9. TALENTS (costs & levels)
// ════════════════════════════════════════
const tierLevels = [1,5,12,20,30,38,46,54,62,70,76,82,88,94,100,110,120,130,140,150]
function tierCost(t) { return t <= 5 ? 1 : t <= 10 ? 2 : t <= 15 ? 3 : 5 }

let cumulCost = 0
const talentRows = tierLevels.map((lvl, i) => {
  const tier = i + 1
  const cost = tierCost(tier)
  cumulCost += cost
  return [tier, lvl, cost, cumulCost]
})

const wsTalents = XLSX.utils.aoa_to_sheet([
  ['Tier','Niveau requis','Coût (PT)','PT cumulés'],
  ...talentRows
])
wsTalents['!cols'] = [{wch:6},{wch:14},{wch:10},{wch:12}]
XLSX.utils.book_append_sheet(wb, wsTalents, 'Talents')

// ════════════════════════════════════════
// 10. COMBAT SKILLS
// ════════════════════════════════════════
const skills = [
  ['Hacker','Breach Protocol',3,'debuff_def',50,2,4],
  ['Hacker','Short Circuit',7,'pure_damage',150,0,3],
  ['Hacker','Backdoor',12,'steal_damage',120,0,4],
  ['Hacker','Kernel Panic',18,'damage_stun',200,1,5],
  ['Netrunner','Ping Scan',3,'guaranteed_crit',0,1,3],
  ['Netrunner','ICE Breaker',7,'purge_damage',80,0,3],
  ['Netrunner','Neural Overload',12,'damage_stun',100,1,4],
  ['Netrunner','System Restore',18,'heal_percent',40,0,5],
  ['Samurai','Wired Reflexes',3,'double_hit',0,0,3],
  ['Samurai','Mono-Edge Slash',7,'damage_dot',130,3,4],
  ['Samurai','Subdermal Shield',12,'shield',0,1,5],
  ['Samurai','Adrenaline Surge',18,'mega_strike',300,0,6],
  ['Chrome Dealer','Deploy Turret',3,'turret',40,3,4],
  ['Chrome Dealer','Repair Nanobots',7,'heal_percent',30,0,4],
  ['Chrome Dealer','EMP Blast',12,'debuff_atk',50,2,4],
  ['Chrome Dealer','Chrome Overcharge',18,'buff_all',50,3,6],
]

const wsSkills = XLSX.utils.aoa_to_sheet([
  ['Spec','Skill','Tier requis','Type effet','Valeur','Durée (tours)','Cooldown (tours)'],
  ...skills
])
wsSkills['!cols'] = [{wch:14},{wch:20},{wch:10},{wch:16},{wch:8},{wch:14},{wch:16}]
XLSX.utils.book_append_sheet(wb, wsSkills, 'Combat Skills')

// ════════════════════════════════════════
// WRITE FILE
// ════════════════════════════════════════
XLSX.writeFile(wb, 'hereos_economy.xlsx')
console.log('✅ hereos_economy.xlsx créé avec 10 onglets')
