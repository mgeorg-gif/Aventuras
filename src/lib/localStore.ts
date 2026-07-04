import type { Campaign, Character, Message, Scene } from '@/types'

/**
 * localStorage-backed data store for the local-only roleplay app.
 * Mirrors the Blink DB shape so the rest of the app doesn't change.
 *
 * Storage layout — one JSON blob per table under distinct keys:
 *   tv_campaigns   -> Campaign[]
 *   tv_characters  -> Character[]
 *   tv_scenes      -> Scene[]
 *   tv_messages    -> Message[]
 *
 * Each table lives entirely in memory after hydration; mutations
 * persist synchronously and broadcast to subscribers so React Query
 * caches invalidate.
 */

type Listener = () => void

const KEYS = {
  campaigns: 'tv_campaigns',
  characters: 'tv_characters',
  scenes: 'tv_scenes',
  messages: 'tv_messages',
} as const

const subscribers = new Map<string, Set<Listener>>()

function emit(tableKey: string) {
  const set = subscribers.get(tableKey)
  if (!set) return
  for (const fn of set) fn()
}

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readTable<T>(key: string): T[] {
  if (!isBrowser()) return []
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}

function writeTable<T>(key: string, rows: T[]) {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(key, JSON.stringify(rows))
  } catch {
    // localStorage full or unavailable — silently drop; UI is still functional in-memory
  }
  emit(key)
}

function subscribe(tableKey: string, fn: Listener) {
  let set = subscribers.get(tableKey)
  if (!set) {
    set = new Set()
    subscribers.set(tableKey, set)
  }
  set.add(fn)
  return () => {
    set?.delete(fn)
  }
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Fallback for very old environments
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function nowIso(): string {
  return new Date().toISOString()
}

// ---------------------------------------------------------------------------
// Campaign
// ---------------------------------------------------------------------------

export const localCampaigns = {
  list(opts: { where?: { userId?: string } } = {}): Campaign[] {
    const rows = readTable<Campaign>(KEYS.campaigns)
    if (opts.where?.userId) {
      return rows.filter((r) => r.userId === opts.where!.userId)
    }
    return rows
  },
  get(id: string): Campaign | null {
    return readTable<Campaign>(KEYS.campaigns).find((r) => r.id === id) ?? null
  },
  create(
    data: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<Campaign, 'id'>>,
  ): Campaign {
    const rows = readTable<Campaign>(KEYS.campaigns)
    const row: Campaign = {
      ...data,
      id: data.id ?? uuid(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }
    rows.push(row)
    writeTable(KEYS.campaigns, rows)
    return row
  },
  update(id: string, patch: Partial<Omit<Campaign, 'id'>>): Campaign | null {
    const rows = readTable<Campaign>(KEYS.campaigns)
    const idx = rows.findIndex((r) => r.id === id)
    if (idx < 0) return null
    const updated: Campaign = { ...rows[idx], ...patch, id, updatedAt: nowIso() }
    rows[idx] = updated
    writeTable(KEYS.campaigns, rows)
    return updated
  },
  delete(id: string): void {
    const rows = readTable<Campaign>(KEYS.campaigns).filter((r) => r.id !== id)
    writeTable(KEYS.campaigns, rows)
    // Cascade: remove characters, scenes, messages belonging to this campaign
    localCharacters.deleteManyForCampaign(id)
    localScenes.deleteManyForCampaign(id)
  },
  subscribe(fn: Listener) {
    return subscribe(KEYS.campaigns, fn)
  },
}

// ---------------------------------------------------------------------------
// Character
// ---------------------------------------------------------------------------

export const localCharacters = {
  list(opts: { where?: { campaignId?: string } } = {}): Character[] {
    const rows = readTable<Character>(KEYS.characters)
    if (opts.where?.campaignId) {
      return rows.filter((r) => r.campaignId === opts.where!.campaignId)
    }
    return rows
  },
  get(id: string): Character | null {
    return readTable<Character>(KEYS.characters).find((r) => r.id === id) ?? null
  },
  create(
    data: Omit<Character, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<Character, 'id'>>,
  ): Character {
    const rows = readTable<Character>(KEYS.characters)
    const row: Character = {
      ...data,
      id: data.id ?? uuid(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }
    rows.push(row)
    writeTable(KEYS.characters, rows)
    return row
  },
  update(id: string, patch: Partial<Omit<Character, 'id'>>): Character | null {
    const rows = readTable<Character>(KEYS.characters)
    const idx = rows.findIndex((r) => r.id === id)
    if (idx < 0) return null
    const updated: Character = { ...rows[idx], ...patch, id, updatedAt: nowIso() }
    rows[idx] = updated
    writeTable(KEYS.characters, rows)
    return updated
  },
  delete(id: string): void {
    const rows = readTable<Character>(KEYS.characters).filter((r) => r.id !== id)
    writeTable(KEYS.characters, rows)
  },
  deleteManyForCampaign(campaignId: string): void {
    const rows = readTable<Character>(KEYS.characters).filter(
      (r) => r.campaignId !== campaignId,
    )
    writeTable(KEYS.characters, rows)
  },
  subscribe(fn: Listener) {
    return subscribe(KEYS.characters, fn)
  },
}

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------

export const localScenes = {
  list(opts: { where?: { campaignId?: string } } = {}): Scene[] {
    const rows = readTable<Scene>(KEYS.scenes)
    if (opts.where?.campaignId) {
      return rows.filter((r) => r.campaignId === opts.where!.campaignId)
    }
    return rows
  },
  get(id: string): Scene | null {
    return readTable<Scene>(KEYS.scenes).find((r) => r.id === id) ?? null
  },
  create(
    data: Omit<Scene, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<Scene, 'id'>>,
  ): Scene {
    const rows = readTable<Scene>(KEYS.scenes)
    const row: Scene = {
      ...data,
      id: data.id ?? uuid(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }
    rows.push(row)
    writeTable(KEYS.scenes, rows)
    return row
  },
  update(id: string, patch: Partial<Omit<Scene, 'id'>>): Scene | null {
    const rows = readTable<Scene>(KEYS.scenes)
    const idx = rows.findIndex((r) => r.id === id)
    if (idx < 0) return null
    const updated: Scene = { ...rows[idx], ...patch, id, updatedAt: nowIso() }
    rows[idx] = updated
    writeTable(KEYS.scenes, rows)
    return updated
  },
  delete(id: string): void {
    const rows = readTable<Scene>(KEYS.scenes).filter((r) => r.id !== id)
    writeTable(KEYS.scenes, rows)
    localMessages.deleteManyForScene(id)
  },
  deleteManyForCampaign(campaignId: string): void {
    const rows = readTable<Scene>(KEYS.scenes)
    const removed = rows.filter((r) => r.campaignId === campaignId)
    const kept = rows.filter((r) => r.campaignId !== campaignId)
    writeTable(KEYS.scenes, kept)
    for (const s of removed) localMessages.deleteManyForScene(s.id)
  },
  subscribe(fn: Listener) {
    return subscribe(KEYS.scenes, fn)
  },
}

// ---------------------------------------------------------------------------
// Message
// ---------------------------------------------------------------------------

export const localMessages = {
  list(opts: { where?: { sceneId?: string } } = {}): Message[] {
    const rows = readTable<Message>(KEYS.messages)
    if (opts.where?.sceneId) {
      return rows.filter((r) => r.sceneId === opts.where!.sceneId)
    }
    return rows
  },
  create(
    data: Omit<Message, 'id' | 'createdAt'> & Partial<Pick<Message, 'id'>>,
  ): Message {
    const rows = readTable<Message>(KEYS.messages)
    const row: Message = {
      ...data,
      id: data.id ?? uuid(),
      createdAt: nowIso(),
    }
    rows.push(row)
    writeTable(KEYS.messages, rows)
    return row
  },
  deleteManyForScene(sceneId: string): void {
    const rows = readTable<Message>(KEYS.messages).filter((r) => r.sceneId !== sceneId)
    writeTable(KEYS.messages, rows)
  },
  subscribe(fn: Listener) {
    return subscribe(KEYS.messages, fn)
  },
}

// ---------------------------------------------------------------------------
// Anonymous local user
// ---------------------------------------------------------------------------

const USER_KEY = 'tv_local_user_id'

/** Returns a stable per-browser anonymous id. Creates one on first call. */
export function getLocalUserId(): string {
  if (!isBrowser()) return 'local'
  try {
    const existing = window.localStorage.getItem(USER_KEY)
    if (existing) return existing
    const id = 'local-' + uuid()
    window.localStorage.setItem(USER_KEY, id)
    return id
  } catch {
    return 'local'
  }
}
