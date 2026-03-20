import type { ReactNode } from 'react'

export interface CombatSkillTooltipData {
  id: number
  name: string
  description: string
  effectType: string
  effectValue: number
  cooldown: number
  duration: number
  currentCooldown?: number
}

function formatTurns(turns: number) {
  return `${turns} tour${turns > 1 ? 's' : ''}`
}

function getEffectSummary(skill: CombatSkillTooltipData) {
  switch (skill.effectType) {
    case 'debuff_def':
      return `DEF ennemie -${skill.effectValue}%`
    case 'debuff_atk':
      return `ATK ennemie -${skill.effectValue}%`
    case 'pure_damage':
      return `${skill.effectValue} degats purs`
    case 'steal_damage':
      return `${skill.effectValue} degats + vol`
    case 'damage_stun':
      return `${skill.effectValue} degats + stun`
    case 'guaranteed_crit':
      return 'Critique garanti'
    case 'purge_damage':
      return `${skill.effectValue} degats + purge`
    case 'heal_percent':
      return `Soin ${skill.effectValue}% HP max`
    case 'double_hit':
      return 'Deux frappes'
    case 'damage_dot':
      return `${skill.effectValue} degats + DOT`
    case 'shield':
      return 'Absorbe le prochain coup'
    case 'mega_strike':
      return `Frappe critique ${skill.effectValue}`
    case 'turret':
      return `Tourelle ${skill.effectValue}/tour`
    case 'buff_all':
      return `ATK/DEF +${skill.effectValue}%`
    default:
      return skill.effectType
  }
}

export default function CombatSkillTooltip({
  skill,
  children,
}: {
  skill: CombatSkillTooltipData
  children: ReactNode
}) {
  return (
    <div className="group/skill relative">
      {children}

      <div className="pointer-events-none invisible absolute left-1/2 top-full z-30 mt-2 w-72 max-w-[calc(100vw-2rem)] -translate-x-1/2 translate-y-1 rounded-lg border border-cyber-purple/40 bg-cyber-black/95 p-3 text-left opacity-0 shadow-[0_0_24px_rgba(184,41,221,0.18)] backdrop-blur-sm transition-all duration-150 group-hover/skill:visible group-hover/skill:translate-y-0 group-hover/skill:opacity-100 group-focus-within/skill:visible group-focus-within/skill:translate-y-0 group-focus-within/skill:opacity-100">
        <div className="text-[10px] uppercase tracking-widest text-cyber-purple">Programme</div>
        <div className="mt-1 text-sm font-bold text-white">{skill.name}</div>
        <div className="mt-2 text-xs leading-relaxed text-gray-300">{skill.description}</div>

        <div className="mt-3 flex flex-wrap gap-1.5 text-[10px]">
          <span className="rounded border border-cyber-purple/30 bg-cyber-purple/10 px-2 py-1 text-cyber-purple">
            {getEffectSummary(skill)}
          </span>
          <span className="rounded border border-gray-700 bg-cyber-dark px-2 py-1 text-gray-300">
            CD {formatTurns(skill.cooldown)}
          </span>
          {skill.duration > 0 && (
            <span className="rounded border border-gray-700 bg-cyber-dark px-2 py-1 text-gray-300">
              Duree {formatTurns(skill.duration)}
            </span>
          )}
          {(skill.currentCooldown || 0) > 0 && (
            <span className="rounded border border-cyber-red/30 bg-cyber-red/10 px-2 py-1 text-cyber-red">
              Recharge {formatTurns(skill.currentCooldown || 0)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
