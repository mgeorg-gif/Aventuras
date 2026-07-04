import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  localCampaigns,
  localCharacters,
  localScenes,
  localMessages,
} from '@/lib/localStore'
import { useUserId } from './useUserId'
import type { Campaign, Character, Scene, Message } from '@/types'

// ---------------------------------------------------------------------------
// Query key factories
// ---------------------------------------------------------------------------
const campaignKeys = {
  all: ['campaigns'] as const,
  list: (userId: string) => ['campaigns', 'list', userId] as const,
  detail: (id: string) => ['campaigns', 'detail', id] as const,
}

const characterKeys = {
  all: ['characters'] as const,
  list: (campaignId: string) => ['characters', 'list', campaignId] as const,
  detail: (id: string) => ['characters', 'detail', id] as const,
}

const sceneKeys = {
  all: ['scenes'] as const,
  list: (campaignId: string) => ['scenes', 'list', campaignId] as const,
  detail: (id: string) => ['scenes', 'detail', id] as const,
}

const messageKeys = {
  list: (sceneId: string) => ['messages', 'list', sceneId] as const,
}

/** Hook up a subscription to the local store; invalidates a query key on writes. */
function useLocalSync(table: { subscribe: (fn: () => void) => () => void }, keys: readonly unknown[]) {
  const qc = useQueryClient()
  useEffect(() => {
    return table.subscribe(() => {
      qc.invalidateQueries({ queryKey: keys as unknown[] })
    })
  }, [qc, table, keys])
}

// ===========================================================================
// CAMPAIGNS
// ===========================================================================

export function useCampaigns() {
  const userId = useUserId()
  useLocalSync(localCampaigns, campaignKeys.all)
  return useQuery({
    queryKey: campaignKeys.list(userId),
    queryFn: () =>
      localCampaigns
        .list({ where: { userId } })
        .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)),
  })
}

export function useCampaign(id: string | undefined) {
  useLocalSync(localCampaigns, campaignKeys.all)
  return useQuery({
    queryKey: campaignKeys.detail(id ?? ''),
    queryFn: () => (id ? localCampaigns.get(id) : null),
    enabled: !!id,
  })
}

export function useCreateCampaign() {
  const userId = useUserId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name: string; description?: string; setting?: string; rules?: string }) => {
      return localCampaigns.create({
        userId,
        name: data.name,
        description: data.description ?? '',
        setting: data.setting ?? '',
        rules: data.rules ?? '',
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: campaignKeys.list(userId) })
    },
  })
}

export function useUpdateCampaign() {
  const userId = useUserId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Campaign> & { id: string }) => {
      return localCampaigns.update(id, data)
    },
    onSuccess: (_result, variables) => {
      qc.invalidateQueries({ queryKey: campaignKeys.detail(variables.id) })
      qc.invalidateQueries({ queryKey: campaignKeys.list(userId) })
    },
  })
}

export function useDeleteCampaign() {
  const userId = useUserId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      localCampaigns.delete(id)
      return id
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: campaignKeys.list(userId) })
    },
  })
}

// ===========================================================================
// CHARACTERS
// ===========================================================================

export function useCharacters(campaignId: string | undefined) {
  useLocalSync(localCharacters, characterKeys.all)
  return useQuery({
    queryKey: characterKeys.list(campaignId ?? ''),
    queryFn: () =>
      localCharacters
        .list({ where: { campaignId: campaignId! } })
        .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1)),
    enabled: !!campaignId,
  })
}

export function useCharacter(id: string | undefined) {
  useLocalSync(localCharacters, characterKeys.all)
  return useQuery({
    queryKey: characterKeys.detail(id ?? ''),
    queryFn: () => (id ? localCharacters.get(id) : null),
    enabled: !!id,
  })
}

export function useCreateCharacter() {
  const userId = useUserId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (
      data: Omit<Character, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
    ) => {
      return localCharacters.create({ ...data, userId })
    },
    onSuccess: (_result, variables) => {
      qc.invalidateQueries({ queryKey: characterKeys.list(variables.campaignId) })
    },
  })
}

export function useUpdateCharacter() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Character> & { id: string }) => {
      return localCharacters.update(id, data)
    },
    onSuccess: (_result, variables) => {
      qc.invalidateQueries({ queryKey: characterKeys.detail(variables.id) })
      if (variables.campaignId) {
        qc.invalidateQueries({ queryKey: characterKeys.list(variables.campaignId) })
      }
    },
  })
}

export function useDeleteCharacter() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: string | { id: string; campaignId?: string }) => {
      const id = typeof input === 'string' ? input : input.id
      localCharacters.delete(id)
      return id
    },
    onSuccess: (_result, variables) => {
      const campaignId = typeof variables === 'string' ? undefined : variables.campaignId
      if (campaignId) {
        qc.invalidateQueries({ queryKey: characterKeys.list(campaignId) })
      }
    },
  })
}

// ===========================================================================
// SCENES
// ===========================================================================

export function useScenes(campaignId: string | undefined) {
  useLocalSync(localScenes, sceneKeys.all)
  return useQuery({
    queryKey: sceneKeys.list(campaignId ?? ''),
    queryFn: () =>
      localScenes
        .list({ where: { campaignId: campaignId! } })
        .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)),
    enabled: !!campaignId,
  })
}

export function useScene(id: string | undefined) {
  useLocalSync(localScenes, sceneKeys.all)
  return useQuery({
    queryKey: sceneKeys.detail(id ?? ''),
    queryFn: () => (id ? localScenes.get(id) : null),
    enabled: !!id,
  })
}

export function useCreateScene() {
  const userId = useUserId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (
      data: { title: string; campaignId: string; summary?: string; status?: Scene['status'] },
    ) => {
      return localScenes.create({
        userId,
        title: data.title,
        campaignId: data.campaignId,
        summary: data.summary ?? '',
        status: data.status ?? 'active',
      })
    },
    onSuccess: (_result, variables) => {
      qc.invalidateQueries({ queryKey: sceneKeys.list(variables.campaignId) })
    },
  })
}

export function useUpdateScene() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Scene> & { id: string }) => {
      return localScenes.update(id, data)
    },
    onSuccess: (_result, variables) => {
      qc.invalidateQueries({ queryKey: sceneKeys.detail(variables.id) })
      if (variables.campaignId) {
        qc.invalidateQueries({ queryKey: sceneKeys.list(variables.campaignId) })
      }
    },
  })
}

// ===========================================================================
// MESSAGES
// ===========================================================================

export function useMessages(sceneId: string | undefined) {
  useLocalSync(localMessages, messageKeys.list(sceneId ?? ''))
  return useQuery({
    queryKey: messageKeys.list(sceneId ?? ''),
    queryFn: () =>
      localMessages
        .list({ where: { sceneId: sceneId! } })
        .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1)),
    enabled: !!sceneId,
  })
}

export function useCreateMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Omit<Message, 'id' | 'createdAt'>) => {
      return localMessages.create(data)
    },
    onSuccess: (_result, variables) => {
      qc.invalidateQueries({ queryKey: messageKeys.list(variables.sceneId) })
    },
  })
}
