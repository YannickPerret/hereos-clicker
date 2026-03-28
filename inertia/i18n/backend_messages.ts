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
  'Guest session expired after 3 days. Start a new guest run or create an account.':
    'backendMsg.guestSessionExpired',
  'La session invite a expire apres 3 jours. Lance une nouvelle partie ou cree un compte.':
    'backendMsg.guestSessionExpired',
  'Guests cannot send chat messages. Create an account first.': 'backendMsg.guestChatRestricted',
  'Les invites ne peuvent pas parler dans le chat. Cree un compte d abord.':
    'backendMsg.guestChatRestricted',
  'Guest accounts cannot use party features. Create an account first.':
    'backendMsg.guestPartyRestricted',
  'Les comptes invites ne peuvent pas utiliser les groupes. Cree un compte d abord.':
    'backendMsg.guestPartyRestricted',
  'Guest accounts cannot join parties. They must create an account first.':
    'backendMsg.guestCannotJoinParty',
  'Les comptes invites ne peuvent pas rejoindre un groupe. Ils doivent creer un compte.':
    'backendMsg.guestCannotJoinParty',
  'Guest accounts cannot use the friends system. Create an account first.':
    'backendMsg.guestFriendsRestricted',
  'Les comptes invites ne peuvent pas utiliser le systeme d amis. Cree un compte d abord.':
    'backendMsg.guestFriendsRestricted',
  'Guest accounts cannot receive friend requests. They must create an account first.':
    'backendMsg.guestCannotReceiveFriendRequest',
  'Les comptes invites ne peuvent pas recevoir de demandes d ami. Ils doivent creer un compte.':
    'backendMsg.guestCannotReceiveFriendRequest',
  'Guest accounts cannot join PvP. Create an account first.': 'backendMsg.guestPvpRestricted',
  'Les comptes invites ne peuvent pas faire de PvP. Cree un compte d abord.':
    'backendMsg.guestPvpRestricted',
  'Le PvP classe est desactive pour la saison active': 'backendMsg.rankedPvpDisabled',
  'Ranked PvP is disabled for the active season': 'backendMsg.rankedPvpDisabled',
  'Mode indisponible': 'backendMsg.modeUnavailable',
  'Mode unavailable': 'backendMsg.modeUnavailable',
  'Nom du personnage requis': 'backendMsg.characterNameRequired',
  'Nom du personnage requis.': 'backendMsg.characterNameRequired',
  'Character name is required': 'backendMsg.characterNameRequired',
  'Personnage introuvable': 'backendMsg.characterNotFound',
  'Personnage introuvable.': 'backendMsg.characterNotFound',
  'Character not found': 'backendMsg.characterNotFound',
  'Tu ne peux pas t ajouter toi-meme': 'backendMsg.cannotAddYourself',
  "Tu ne peux pas t'inviter toi-meme": 'backendMsg.cannotInviteYourself',
  "Tu ne peux pas t'inviter toi-meme.": 'backendMsg.cannotInviteYourself',
  'Une demande est deja en attente': 'backendMsg.friendRequestAlreadyPending',
  'Demande d ami introuvable': 'backendMsg.friendRequestNotFound',
  'Demande introuvable': 'backendMsg.requestNotFound',
  'Ami introuvable': 'backendMsg.friendNotFound',
  'Groupe introuvable': 'backendMsg.partyNotFound',
  'Seul le leader peut expulser un membre': 'backendMsg.onlyLeaderCanKick',
  "Impossible d'expulser un membre pendant un donjon": 'backendMsg.cannotKickDuringDungeon',
  'Membre introuvable': 'backendMsg.memberNotFound',
  "Le leader ne peut pas s'expulser lui-meme": 'backendMsg.leaderCannotKickSelf',
  'Membre introuvable dans ce groupe': 'backendMsg.memberNotFoundInParty',
  'Seul le leader peut lancer': 'backendMsg.onlyLeaderCanLaunch',
  'Tous les membres doivent etre prets': 'backendMsg.allMembersMustBeReady',
  'Seul le leader peut inviter.': 'backendMsg.onlyLeaderCanInvite',
  "Impossible d'inviter pendant un donjon ou un countdown.":
    'backendMsg.cannotInviteDuringDungeonOrCountdown',
  'Le groupe est deja plein.': 'backendMsg.partyAlreadyFull',
  'Ce joueur est deja dans un groupe.': 'backendMsg.playerAlreadyInParty',
  'Invitation deja envoyee.': 'backendMsg.invitationAlreadySent',
  'Les invitations ne sont pas encore activees. Lance la migration.':
    'backendMsg.invitesNotEnabled',
  'Tu es deja dans un groupe.': 'backendMsg.youAreAlreadyInParty',
  'Invitation introuvable.': 'backendMsg.invitationNotFound',
  "Cette invitation n'est plus valide.": 'backendMsg.invitationNoLongerValid',
  'Message invalide': 'backendMsg.invalidMessage',
  'You are sending messages too fast. Please wait a moment.': 'backendMsg.chatRateLimited',
  'Tu envoies des messages trop vite. Attends un instant.': 'backendMsg.chatRateLimited',
  'Message blocked by the chat filter.': 'backendMsg.chatObscenityBlocked',
  'Message bloque par le filtre du chat.': 'backendMsg.chatObscenityBlocked',
  'Salon inconnu': 'backendMsg.unknownChannel',
  'Tu ne fais pas partie de ce groupe': 'backendMsg.notInThisParty',
  'Mot de passe incorrect': 'backendMsg.incorrectPassword',
  'Nom de salon invalide (2-30 caracteres, lettres/chiffres)': 'backendMsg.invalidChannelName',
  'Ce salon existe deja': 'backendMsg.channelAlreadyExists',
  'Salon introuvable': 'backendMsg.channelNotFound',
  "Ce donjon n'est plus actif.": 'backendMsg.dungeonNoLongerActive',
  'Donjon introuvable.': 'backendMsg.dungeonNotFound',
  'Run introuvable': 'backendMsg.runNotFound',
  'Ton personnage est KO. Attends la fin du combat.': 'backendMsg.characterKoWaitCombatEnd',
  'Impossible de rejoindre la file PvP': 'backendMsg.cannotJoinPvpQueue',
  'Impossible de recuperer la recompense': 'backendMsg.cannotClaimReward',
  'Impossible de reclamer cette recompense': 'backendMsg.cannotClaimThisReward',
  'Impossible de reclamer la recompense journaliere': 'backendMsg.cannotClaimDailyReward',
  'Missions quotidiennes reinitialisees gratuitement': 'backendMsg.dailyMissionsResetFree',
  'Impossible de reinitialiser les missions': 'backendMsg.cannotResetMissions',
  'Tes HP sont deja au maximum': 'backendMsg.hpAlreadyFull',
  'Tu possedes deja ce compagnon': 'backendMsg.alreadyOwnCompanion',
}

export function translateBackendMessage(message: string, t: TFunction): string {
  const key = BACKEND_MESSAGE_MAP[message]
  if (key) return t(key, { ns: 'common' })

  const requiresActiveParty = message.match(
    /^(?:SoloQ|DuoQ|TrioQ) requiert un groupe actif de (\d+) joueurs$/
  )
  if (requiresActiveParty) {
    return t('backendMsg.requiresActiveParty', {
      count: Number(requiresActiveParty[1]),
      ns: 'common',
    })
  }

  const leaderOnlyQueue = message.match(/^Seul le leader peut lancer la (SoloQ|DuoQ|TrioQ)$/)
  if (leaderOnlyQueue) {
    return t('backendMsg.leaderOnlyQueue', { mode: leaderOnlyQueue[1], ns: 'common' })
  }

  const exactPartySizeForMode = message.match(
    /^Ton groupe doit contenir exactement (\d+) joueurs pour (SoloQ|DuoQ|TrioQ)$/
  )
  if (exactPartySizeForMode) {
    return t('backendMsg.exactPartySizeForMode', {
      count: Number(exactPartySizeForMode[1]),
      mode: exactPartySizeForMode[2],
      ns: 'common',
    })
  }

  const friendAlreadyAdded = message.match(/^(.+) est deja dans tes amis$/)
  if (friendAlreadyAdded) {
    return t('backendMsg.friendAlreadyAdded', { name: friendAlreadyAdded[1], ns: 'common' })
  }

  const friendAutoAccepted = message.match(/^(.+) a ete ajoute automatiquement a tes amis$/)
  if (friendAutoAccepted) {
    return t('backendMsg.friendAutoAccepted', { name: friendAutoAccepted[1], ns: 'common' })
  }

  const friendRequestSentTo = message.match(/^Demande d ami envoyee a (.+)$/)
  if (friendRequestSentTo) {
    return t('backendMsg.friendRequestSentTo', {
      name: friendRequestSentTo[1],
      ns: 'common',
    })
  }

  const friendAdded = message.match(/^(.+) a ete ajoute a tes amis$/)
  if (friendAdded) {
    return t('backendMsg.friendAdded', { name: friendAdded[1], ns: 'common' })
  }

  const friendRequestDeclined = message.match(/^Demande de (.+) refusee$/)
  if (friendRequestDeclined) {
    return t('backendMsg.friendRequestDeclined', {
      name: friendRequestDeclined[1],
      ns: 'common',
    })
  }

  const friendRequestCancelled = message.match(/^Demande annulee pour (.+)$/)
  if (friendRequestCancelled) {
    return t('backendMsg.friendRequestCancelled', {
      name: friendRequestCancelled[1],
      ns: 'common',
    })
  }

  const friendRemovedByName = message.match(/^(.+) a ete retire de tes amis$/)
  if (friendRemovedByName) {
    return t('backendMsg.friendRemovedByName', {
      name: friendRemovedByName[1],
      ns: 'common',
    })
  }

  const inviteSentTo = message.match(/^(?:Invitation envoyee a|Invitation sent to) (.+)\.$/)
  if (inviteSentTo) {
    return t('backendMsg.invitationSentTo', { name: inviteSentTo[1], ns: 'common' })
  }

  const kickedFromParty = message.match(/^(.+) a ete expulse du groupe$/)
  if (kickedFromParty) {
    return t('backendMsg.kickedFromParty', { name: kickedFromParty[1], ns: 'common' })
  }

  const minimumPlayersRequired = message.match(/^Minimum (\d+) joueurs requis$/)
  if (minimumPlayersRequired) {
    return t('backendMsg.minimumPlayersRequired', {
      count: Number(minimumPlayersRequired[1]),
      ns: 'common',
    })
  }

  const levelRequired = message.match(/^(.+) n'a pas le niveau requis \((\d+)\)$/)
  if (levelRequired) {
    return t('backendMsg.levelRequiredForPartyMember', {
      name: levelRequired[1],
      level: Number(levelRequired[2]),
      ns: 'common',
    })
  }

  const seasonRewardClaimed = message.match(/^Recompense de saison recuperee: \+(\d+) credits$/)
  if (seasonRewardClaimed) {
    return t('backendMsg.seasonRewardClaimed', {
      amount: Number(seasonRewardClaimed[1]),
      ns: 'common',
    })
  }

  const missionRewardClaimed = message.match(/^Recompense recue: \+(\d+) (.+)$/)
  if (missionRewardClaimed) {
    return t('backendMsg.missionRewardClaimed', {
      amount: Number(missionRewardClaimed[1]),
      rewardType: missionRewardClaimed[2],
      ns: 'common',
    })
  }

  const dailyRewardClaimed = message.match(/^Recompense journaliere recue: (.+) • streak (\d+)$/)
  if (dailyRewardClaimed) {
    return t('backendMsg.dailyRewardClaimed', {
      rewards: dailyRewardClaimed[1],
      streak: Number(dailyRewardClaimed[2]),
      ns: 'common',
    })
  }

  const dailyMissionsResetPaid = message.match(
    /^Missions quotidiennes reinitialisees pour (.+) credits$/
  )
  if (dailyMissionsResetPaid) {
    return t('backendMsg.dailyMissionsResetPaid', {
      cost: dailyMissionsResetPaid[1],
      ns: 'common',
    })
  }

  return message
}
