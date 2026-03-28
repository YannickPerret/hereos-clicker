import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import frCommon from './locales/fr/common.json'
import frAuth from './locales/fr/auth.json'
import frPlay from './locales/fr/play.json'
import frInventory from './locales/fr/inventory.json'
import frShop from './locales/fr/shop.json'
import frParty from './locales/fr/party.json'
import frDungeon from './locales/fr/dungeon.json'
import frPvp from './locales/fr/pvp.json'
import frTalents from './locales/fr/talents.json'
import frQuests from './locales/fr/quests.json'
import frMissions from './locales/fr/missions.json'
import frFriends from './locales/fr/friends.json'
import frCompanions from './locales/fr/companions.json'
import frLeaderboard from './locales/fr/leaderboard.json'
import frChat from './locales/fr/chat.json'
import frReport from './locales/fr/report.json'
import frDailyReward from './locales/fr/daily_reward.json'
import frProfile from './locales/fr/profile.json'
import frLanding from './locales/fr/landing.json'

import enCommon from './locales/en/common.json'
import enAuth from './locales/en/auth.json'
import enPlay from './locales/en/play.json'
import enInventory from './locales/en/inventory.json'
import enShop from './locales/en/shop.json'
import enParty from './locales/en/party.json'
import enDungeon from './locales/en/dungeon.json'
import enPvp from './locales/en/pvp.json'
import enTalents from './locales/en/talents.json'
import enQuests from './locales/en/quests.json'
import enMissions from './locales/en/missions.json'
import enFriends from './locales/en/friends.json'
import enCompanions from './locales/en/companions.json'
import enLeaderboard from './locales/en/leaderboard.json'
import enChat from './locales/en/chat.json'
import enReport from './locales/en/report.json'
import enDailyReward from './locales/en/daily_reward.json'
import enProfile from './locales/en/profile.json'
import enLanding from './locales/en/landing.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: {
        common: frCommon,
        auth: frAuth,
        play: frPlay,
        inventory: frInventory,
        shop: frShop,
        party: frParty,
        dungeon: frDungeon,
        pvp: frPvp,
        talents: frTalents,
        quests: frQuests,
        missions: frMissions,
        friends: frFriends,
        companions: frCompanions,
        leaderboard: frLeaderboard,
        chat: frChat,
        report: frReport,
        daily_reward: frDailyReward,
        profile: frProfile,
        landing: frLanding,
      },
      en: {
        common: enCommon,
        auth: enAuth,
        play: enPlay,
        inventory: enInventory,
        shop: enShop,
        party: enParty,
        dungeon: enDungeon,
        pvp: enPvp,
        talents: enTalents,
        quests: enQuests,
        missions: enMissions,
        friends: enFriends,
        companions: enCompanions,
        leaderboard: enLeaderboard,
        chat: enChat,
        report: enReport,
        daily_reward: enDailyReward,
        profile: enProfile,
        landing: enLanding,
      },
    },
    fallbackLng: 'fr',
    defaultNS: 'common',
    ns: [
      'common',
      'auth',
      'play',
      'inventory',
      'shop',
      'party',
      'dungeon',
      'pvp',
      'talents',
      'quests',
      'missions',
      'friends',
      'companions',
      'leaderboard',
      'chat',
      'report',
      'daily_reward',
      'profile',
      'landing',
    ],
    detection: {
      order: ['localStorage'],
      lookupLocalStorage: 'hereos-lang',
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
