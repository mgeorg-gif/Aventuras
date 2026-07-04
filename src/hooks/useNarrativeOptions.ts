import { useState, useEffect, useCallback } from 'react'
import type { NarrativeOptions } from '@/lib/prompts/narrative'

const STORAGE_PREFIX = 'narrative_options_'
const DEFAULT_OPTIONS: NarrativeOptions = {
  mode: 'adventure',
  pov: 'second',
  tense: 'present',
  targetWordCount: 250,
}

function readOptions(campaignId: string): NarrativeOptions {
  if (typeof window === 'undefined') return DEFAULT_OPTIONS
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + campaignId)
    if (!raw) return DEFAULT_OPTIONS
    const parsed = JSON.parse(raw) as Partial<NarrativeOptions>
    return { ...DEFAULT_OPTIONS, ...parsed }
  } catch {
    return DEFAULT_OPTIONS
  }
}

function writeOptions(campaignId: string, opts: NarrativeOptions) {
  try {
    localStorage.setItem(STORAGE_PREFIX + campaignId, JSON.stringify(opts))
  } catch {
    // ignore
  }
}

/**
 * Per-campaign narrative options (POV, tense, mode, target word count).
 * Persisted in localStorage so each campaign remembers its own style.
 */
export function useNarrativeOptions(campaignId: string) {
  const [options, setOptionsState] = useState<NarrativeOptions>(DEFAULT_OPTIONS)

  useEffect(() => {
    if (campaignId) setOptionsState(readOptions(campaignId))
  }, [campaignId])

  const setOptions = useCallback(
    (next: Partial<NarrativeOptions>) => {
      setOptionsState((prev) => {
        const merged = { ...prev, ...next }
        writeOptions(campaignId, merged)
        return merged
      })
    },
    [campaignId],
  )

  const reset = useCallback(() => {
    setOptionsState(DEFAULT_OPTIONS)
    try {
      localStorage.removeItem(STORAGE_PREFIX + campaignId)
    } catch {
      // ignore
    }
  }, [campaignId])

  return { options, setOptions, reset }
}
