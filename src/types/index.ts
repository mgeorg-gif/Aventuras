export interface Campaign {
  id: string
  userId: string
  name: string
  description: string
  setting: string
  rules: string
  createdAt: string
  updatedAt: string
}

export interface Character {
  id: string
  campaignId: string
  userId: string
  name: string
  role: 'pc' | 'npc' | 'gm'
  surfacePersonality: string
  hiddenMotivations: string
  deepSecrets: string
  appearance: string
  voice: string
  traitsJson: string
  createdAt: string
  updatedAt: string
}

export interface CharacterTraits {
  [key: string]: string | number
}

export interface Scene {
  id: string
  campaignId: string
  userId: string
  title: string
  summary: string
  status: 'active' | 'completed' | 'paused'
  createdAt: string
  updatedAt: string
}

export interface Message {
  id: string
  sceneId: string
  role: 'user' | 'assistant' | 'system' | 'narrator'
  characterId: string | null
  characterName: string
  content: string
  createdAt: string
}
