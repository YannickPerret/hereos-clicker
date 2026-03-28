import type { TFunction } from 'i18next'

const BACKEND_MESSAGE_MAP: Record<string, string> = {
  'Not enough credits': 'backendMsg.notEnoughCredits',
  'Credits insuffisants': 'backendMsg.notEnoughCredits',
  'Out of stock': 'backendMsg.outOfStock',
  'Rupture de stock': 'backendMsg.outOfStock',
  'Deja dans un groupe': 'backendMsg.alreadyInParty',
  'Groupe introuvable ou deja en donjon': 'backendMsg.partyNotFoundOrInDungeon',
  'Groupe plein': 'backendMsg.partyFull',
  'Deja dans ce groupe': 'backendMsg.alreadyInThisParty',
  'Report envoye. Merci, Netrunner.': 'backendMsg.reportSent',
  'Item equipe': 'backendMsg.itemEquipped',
  'Item retire': 'backendMsg.itemUnequipped',
  'Item utilise': 'backendMsg.itemUsed',
  'Item jete': 'backendMsg.itemDiscarded',
  'Compagnon active': 'backendMsg.companionActivated',
  'Compagnon desactive': 'backendMsg.companionDeactivated',
  'Compagnon ameliore': 'backendMsg.companionUpgraded',
  "Demande d'ami envoyee": 'backendMsg.friendRequestSent',
  "Demande d'ami acceptee": 'backendMsg.friendRequestAccepted',
  'Ami retire': 'backendMsg.friendRemoved',
  'Mission reclamee': 'backendMsg.missionClaimed',
  'Recompense reclamee': 'backendMsg.rewardClaimed',
  'Guest account upgraded': 'backendMsg.guestAccountUpgraded',
}

export function translateBackendMessage(message: string, t: TFunction): string {
  const key = BACKEND_MESSAGE_MAP[message]
  if (key) return t(key)
  return message
}
