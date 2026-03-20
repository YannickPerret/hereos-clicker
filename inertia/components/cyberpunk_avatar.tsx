interface EquippedAvatarItem {
  item: {
    type: string
    name: string
    rarity: string
    icon?: string | null
  }
}

interface Props {
  name: string
  chosenSpec?: string | null
  equippedItems: EquippedAvatarItem[]
}

const SPEC_ACCENT: Record<string, string> = {
  hacker: '#00ff85',
  netrunner: '#00f0ff',
  samurai: '#ff355e',
  chrome_dealer: '#ffe600',
}

const RARITY_ACCENT: Record<string, string> = {
  common: '#8b8f9a',
  uncommon: '#00ff85',
  rare: '#00f0ff',
  epic: '#c258ff',
  legendary: '#ffe600',
}

function accentFor(item?: EquippedAvatarItem | null, fallback = '#00f0ff') {
  if (!item) return fallback
  return RARITY_ACCENT[item.item.rarity] || fallback
}

function renderHair(icon: string, color: string) {
  switch (icon) {
    case 'bob':
      return (
        <>
          <div
            className="absolute left-1/2 top-[40px] h-12 w-24 -translate-x-1/2 rounded-t-[999px] rounded-b-2xl"
            style={{ background: `linear-gradient(180deg, ${color}, #111827)` }}
          />
          <div
            className="absolute left-[104px] top-[70px] h-12 w-5 rounded-b-full"
            style={{ backgroundColor: color }}
          />
          <div
            className="absolute right-[104px] top-[70px] h-12 w-5 rounded-b-full"
            style={{ backgroundColor: color }}
          />
        </>
      )
    case 'braids':
      return (
        <>
          <div
            className="absolute left-1/2 top-[42px] h-10 w-24 -translate-x-1/2 rounded-t-[999px]"
            style={{ background: `linear-gradient(180deg, ${color}, #111827)` }}
          />
          <div
            className="absolute left-[106px] top-[70px] h-20 w-3 rounded-full"
            style={{ backgroundColor: color }}
          />
          <div
            className="absolute right-[106px] top-[70px] h-20 w-3 rounded-full"
            style={{ backgroundColor: color }}
          />
        </>
      )
    case 'chromehawk':
      return (
        <>
          <div
            className="absolute left-1/2 top-[24px] h-16 w-6 -translate-x-1/2 rounded-full"
            style={{ background: `linear-gradient(180deg, ${color}, #f5f5f5)` }}
          />
          <div
            className="absolute left-1/2 top-[48px] h-8 w-24 -translate-x-1/2 rounded-full border border-white/20"
            style={{ backgroundColor: '#0f172a' }}
          />
        </>
      )
    default:
      return (
        <>
          <div
            className="absolute left-1/2 top-[28px] h-16 w-7 -translate-x-1/2 rounded-full"
            style={{ background: `linear-gradient(180deg, ${color}, #111827)` }}
          />
          <div
            className="absolute left-1/2 top-[48px] h-8 w-24 -translate-x-1/2 rounded-full border border-white/10"
            style={{ backgroundColor: '#111827' }}
          />
        </>
      )
  }
}

function renderFace(icon: string, color: string) {
  switch (icon) {
    case 'halfmask':
      return (
        <>
          <div
            className="absolute left-1/2 top-[86px] h-3 w-16 -translate-x-1/2 rounded-full"
            style={{ backgroundColor: `${color}cc`, boxShadow: `0 0 14px ${color}` }}
          />
          <div className="absolute left-1/2 top-[98px] h-8 w-20 -translate-x-1/2 rounded-2xl border border-white/10 bg-slate-900/90" />
        </>
      )
    case 'oni':
      return (
        <>
          <div className="absolute left-1/2 top-[84px] h-12 w-24 -translate-x-1/2 rounded-3xl border border-white/10 bg-slate-950/90" />
          <div
            className="absolute left-[116px] top-[88px] h-2 w-6 rounded-full"
            style={{ backgroundColor: `${color}cc` }}
          />
          <div
            className="absolute right-[116px] top-[88px] h-2 w-6 rounded-full"
            style={{ backgroundColor: `${color}cc` }}
          />
        </>
      )
    case 'respirator':
      return (
        <>
          <div
            className="absolute left-1/2 top-[86px] h-4 w-16 -translate-x-1/2 rounded-full"
            style={{ backgroundColor: `${color}dd`, boxShadow: `0 0 14px ${color}` }}
          />
          <div className="absolute left-1/2 top-[98px] h-9 w-24 -translate-x-1/2 rounded-2xl border border-white/10 bg-slate-900/95" />
          <div className="absolute left-[110px] top-[108px] h-5 w-5 rounded-full border border-white/10 bg-slate-950" />
          <div className="absolute right-[110px] top-[108px] h-5 w-5 rounded-full border border-white/10 bg-slate-950" />
        </>
      )
    default:
      return (
        <div
          className="absolute left-1/2 top-[88px] h-4 w-20 -translate-x-1/2 rounded-full"
          style={{ backgroundColor: `${color}dd`, boxShadow: `0 0 16px ${color}` }}
        />
      )
  }
}

function renderOuter(icon: string, color: string) {
  switch (icon) {
    case 'trench':
      return (
        <div
          className="absolute left-1/2 top-[152px] h-36 w-40 -translate-x-1/2 rounded-t-[2.5rem] rounded-b-[1.75rem]"
          style={{ background: `linear-gradient(180deg, ${color}, #1f2937)` }}
        />
      )
    case 'bolero':
      return (
        <>
          <div
            className="absolute left-[92px] top-[156px] h-24 w-16 rounded-[1.5rem]"
            style={{ backgroundColor: color }}
          />
          <div
            className="absolute right-[92px] top-[156px] h-24 w-16 rounded-[1.5rem]"
            style={{ backgroundColor: color }}
          />
          <div className="absolute left-1/2 top-[176px] h-16 w-20 -translate-x-1/2 rounded-2xl bg-slate-950/90" />
        </>
      )
    case 'holo':
      return (
        <div
          className="absolute left-1/2 top-[152px] h-32 w-40 -translate-x-1/2 rounded-[2rem] border border-white/15"
          style={{ background: `linear-gradient(180deg, ${color}cc, rgba(15,23,42,0.85))` }}
        />
      )
    default:
      return (
        <div
          className="absolute left-1/2 top-[156px] h-28 w-40 -translate-x-1/2 rounded-[2rem]"
          style={{ background: `linear-gradient(180deg, ${color}, #111827)` }}
        />
      )
  }
}

function renderLegs(icon: string, color: string) {
  switch (icon) {
    case 'techwear':
      return (
        <>
          <div
            className="absolute left-[118px] top-[258px] h-24 w-12 rounded-b-2xl"
            style={{ background: `linear-gradient(180deg, ${color}, #111827)` }}
          />
          <div
            className="absolute right-[118px] top-[258px] h-24 w-12 rounded-b-2xl"
            style={{ background: `linear-gradient(180deg, ${color}, #111827)` }}
          />
          <div className="absolute left-[112px] top-[292px] h-2 w-24 bg-black/40" />
          <div className="absolute right-[112px] top-[292px] h-2 w-24 bg-black/40" />
        </>
      )
    case 'runner':
      return (
        <>
          <div
            className="absolute left-[122px] top-[258px] h-24 w-11 rounded-b-full"
            style={{ backgroundColor: color }}
          />
          <div
            className="absolute right-[122px] top-[258px] h-24 w-11 rounded-b-full"
            style={{ backgroundColor: color }}
          />
          <div className="absolute left-[116px] top-[364px] h-4 w-16 rounded-full bg-slate-950" />
          <div className="absolute right-[116px] top-[364px] h-4 w-16 rounded-full bg-slate-950" />
        </>
      )
    case 'exolegs':
      return (
        <>
          <div className="absolute left-[120px] top-[258px] h-24 w-12 rounded-b-xl border border-white/20 bg-slate-800" />
          <div className="absolute right-[120px] top-[258px] h-24 w-12 rounded-b-xl border border-white/20 bg-slate-800" />
          <div
            className="absolute left-[126px] top-[266px] h-20 w-1.5 rounded-full"
            style={{ backgroundColor: color }}
          />
          <div
            className="absolute right-[126px] top-[266px] h-20 w-1.5 rounded-full"
            style={{ backgroundColor: color }}
          />
        </>
      )
    default:
      return (
        <>
          <div
            className="absolute left-[120px] top-[258px] h-24 w-12 rounded-b-2xl"
            style={{ background: `linear-gradient(180deg, ${color}, #111827)` }}
          />
          <div
            className="absolute right-[120px] top-[258px] h-24 w-12 rounded-b-2xl"
            style={{ background: `linear-gradient(180deg, ${color}, #111827)` }}
          />
        </>
      )
  }
}

export default function CyberpunkAvatar({ name, chosenSpec, equippedItems }: Props) {
  const hair = equippedItems.find((entry) => entry.item.type === 'clothes_hair') || null
  const face = equippedItems.find((entry) => entry.item.type === 'clothes_face') || null
  const outer = equippedItems.find((entry) => entry.item.type === 'clothes_outer') || null
  const legs = equippedItems.find((entry) => entry.item.type === 'clothes_legs') || null
  const weapon = equippedItems.find((entry) => entry.item.type === 'weapon') || null
  const implant = equippedItems.find((entry) => entry.item.type === 'implant') || null

  const accent = chosenSpec ? SPEC_ACCENT[chosenSpec] || '#00f0ff' : '#00f0ff'
  const hairColor = accentFor(hair, '#ff4fd8')
  const faceColor = accentFor(face, accent)
  const outerColor = accentFor(outer, '#2dd4bf')
  const legColor = accentFor(legs, '#64748b')
  const implantColor = accentFor(implant, accent)
  const weaponColor = accentFor(weapon, '#94a3b8')
  const wardrobeItems = [hair, face, outer, legs].filter((entry): entry is EquippedAvatarItem =>
    Boolean(entry)
  )

  return (
    <div className="relative overflow-hidden rounded-2xl border border-cyber-blue/20 bg-[#050816] p-4">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,240,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.08) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(circle at 50% 30%, ${accent}22, transparent 45%), radial-gradient(circle at 50% 100%, rgba(194,88,255,0.2), transparent 42%)`,
        }}
      />

      <div className="relative flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-gray-500">
        <span>Cyber Look</span>
        <span>{name}</span>
      </div>

      <div className="relative mt-4 h-[390px] overflow-hidden rounded-[1.5rem] border border-white/5 bg-gradient-to-b from-[#09101f] via-[#0b1020] to-[#03040b]">
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black via-black/70 to-transparent" />
        <div className="absolute left-1/2 top-[56px] h-24 w-24 -translate-x-1/2 rounded-full border border-white/10 bg-gradient-to-b from-[#f3d2be] to-[#9b6a58]" />
        <div className="absolute left-1/2 top-[138px] h-10 w-10 -translate-x-1/2 rounded-b-2xl bg-[#8a5c4a]" />
        {renderHair(hair?.item.icon || 'mohawk', hairColor)}
        {renderFace(face?.item.icon || 'visor', faceColor)}
        {renderOuter(outer?.item.icon || 'jacket', outerColor)}
        <div className="absolute left-[96px] top-[170px] h-[88px] w-8 rounded-full bg-slate-900/90" />
        <div className="absolute right-[96px] top-[170px] h-[88px] w-8 rounded-full bg-slate-900/90" />
        <div
          className="absolute left-[88px] top-[188px] h-[72px] w-5 rounded-full"
          style={{ backgroundColor: `${outerColor}aa` }}
        />
        <div
          className="absolute right-[88px] top-[188px] h-[72px] w-5 rounded-full"
          style={{ backgroundColor: `${outerColor}aa` }}
        />
        <div className="absolute left-1/2 top-[192px] h-16 w-16 -translate-x-1/2 rounded-3xl border border-white/10 bg-black/30" />
        {renderLegs(legs?.item.icon || 'cargos', legColor)}
        <div className="absolute left-[118px] top-[362px] h-4 w-16 rounded-full bg-black/80" />
        <div className="absolute right-[118px] top-[362px] h-4 w-16 rounded-full bg-black/80" />
        <div
          className="absolute left-[120px] top-[88px] h-3 w-3 rounded-full"
          style={{ backgroundColor: implantColor, boxShadow: `0 0 12px ${implantColor}` }}
        />
        <div
          className="absolute right-[120px] top-[88px] h-3 w-3 rounded-full"
          style={{ backgroundColor: implantColor, boxShadow: `0 0 12px ${implantColor}` }}
        />
        {weapon && (
          <div
            className="absolute right-[54px] top-[188px] h-28 w-4 rounded-full"
            style={{ background: `linear-gradient(180deg, ${weaponColor}, #020617)` }}
          />
        )}
        <div className="absolute inset-x-10 bottom-5 flex flex-wrap justify-center gap-2">
          {wardrobeItems.map((entry) => (
            <span
              key={entry.item.type}
              className="rounded-full border border-white/10 bg-black/50 px-2 py-1 text-[10px] uppercase tracking-widest text-gray-300"
            >
              {entry.item.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
