export function getXpForNextLevel(level: number) {
  const safeLevel = Math.max(1, Math.floor(level))
  return 100 + safeLevel * 70 + safeLevel * safeLevel * 7
}
