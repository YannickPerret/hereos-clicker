import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

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

function formatTurns(turns: number, t: (key: string, options?: Record<string, any>) => string) {
  return turns > 1
    ? t('common:skillTooltip.turnPlural', { count: turns })
    : t('common:skillTooltip.turnSingular', { count: turns })
}

function getEffectSummary(
  skill: CombatSkillTooltipData,
  t: (key: string, options?: Record<string, any>) => string
) {
  switch (skill.effectType) {
    case 'debuff_def':
      return t('common:skillTooltip.effects.debuffDef', { value: skill.effectValue })
    case 'debuff_atk':
      return t('common:skillTooltip.effects.debuffAtk', { value: skill.effectValue })
    case 'pure_damage':
      return t('common:skillTooltip.effects.pureDamage', { value: skill.effectValue })
    case 'steal_damage':
      return t('common:skillTooltip.effects.stealDamage', { value: skill.effectValue })
    case 'damage_stun':
      return t('common:skillTooltip.effects.damageStun', { value: skill.effectValue })
    case 'guaranteed_crit':
      return t('common:skillTooltip.effects.guaranteedCrit')
    case 'purge_damage':
      return t('common:skillTooltip.effects.purgeDamage', { value: skill.effectValue })
    case 'heal_percent':
      return t('common:skillTooltip.effects.healPercent', { value: skill.effectValue })
    case 'double_hit':
      return t('common:skillTooltip.effects.doubleHit')
    case 'damage_dot':
      return t('common:skillTooltip.effects.damageDot', { value: skill.effectValue })
    case 'shield':
      return t('common:skillTooltip.effects.shield')
    case 'mega_strike':
      return t('common:skillTooltip.effects.megaStrike', { value: skill.effectValue })
    case 'turret':
      return t('common:skillTooltip.effects.turret', { value: skill.effectValue })
    case 'buff_all':
      return t('common:skillTooltip.effects.buffAll', { value: skill.effectValue })
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
  const { t } = useTranslation('common')

  return (
    <div className="group/skill relative">
      {children}

      <div className="pointer-events-none invisible absolute left-1/2 top-full z-30 mt-2 w-72 max-w-[calc(100vw-2rem)] -translate-x-1/2 translate-y-1 rounded-lg border border-cyber-purple/40 bg-cyber-black/95 p-3 text-left opacity-0 shadow-[0_0_24px_rgba(184,41,221,0.18)] backdrop-blur-sm transition-all duration-150 group-hover/skill:visible group-hover/skill:translate-y-0 group-hover/skill:opacity-100 group-focus-within/skill:visible group-focus-within/skill:translate-y-0 group-focus-within/skill:opacity-100">
        <div className="text-[10px] uppercase tracking-widest text-cyber-purple">
          {t('skillTooltip.program')}
        </div>
        <div className="mt-1 text-sm font-bold text-white">{skill.name}</div>
        <div className="mt-2 text-xs leading-relaxed text-gray-300">{skill.description}</div>

        <div className="mt-3 flex flex-wrap gap-1.5 text-[10px]">
          <span className="rounded border border-cyber-purple/30 bg-cyber-purple/10 px-2 py-1 text-cyber-purple">
            {getEffectSummary(skill, t)}
          </span>
          <span className="rounded border border-gray-700 bg-cyber-dark px-2 py-1 text-gray-300">
            CD {formatTurns(skill.cooldown, t)}
          </span>
          {skill.duration > 0 && (
            <span className="rounded border border-gray-700 bg-cyber-dark px-2 py-1 text-gray-300">
              {t('skillTooltip.duration')} {formatTurns(skill.duration, t)}
            </span>
          )}
          {(skill.currentCooldown || 0) > 0 && (
            <span className="rounded border border-cyber-red/30 bg-cyber-red/10 px-2 py-1 text-cyber-red">
              {t('skillTooltip.recharge')} {formatTurns(skill.currentCooldown || 0, t)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
