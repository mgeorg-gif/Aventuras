import { useState, useEffect, useCallback } from 'react'
import { normalizeBaseUrl, type AIConfig } from '@/lib/aiProvider'

const STORAGE_KEY = 'ai_provider_config_v1'
const DEFAULT_BASE_URL = 'https://api.openai.com/v1'
const DEFAULT_MODEL = 'gpt-4o-mini'

interface StoredConfig {
  baseUrl: string
  apiKey: string
  model: string
}

const DEFAULT_CONFIG: StoredConfig = {
  baseUrl: DEFAULT_BASE_URL,
  apiKey: '',
  model: DEFAULT_MODEL,
}

function readStoredConfig(): StoredConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_CONFIG
    const parsed = JSON.parse(raw) as Partial<StoredConfig>
    return {
      baseUrl: typeof parsed.baseUrl === 'string' && parsed.baseUrl.trim()
        ? parsed.baseUrl
        : DEFAULT_CONFIG.baseUrl,
      apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : DEFAULT_CONFIG.apiKey,
      model: typeof parsed.model === 'string' && parsed.model.trim()
        ? parsed.model
        : DEFAULT_CONFIG.model,
    }
  } catch {
    return DEFAULT_CONFIG
  }
}

function writeStoredConfig(config: StoredConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch {
    // localStorage unavailable
  }
}

/**
 * Manages the AI provider configuration (base URL, API key, model) in localStorage.
 * Works with any OpenAI-compatible endpoint — OpenAI, OpenRouter, LM Studio,
 * Ollama (OpenAI-compat mode), vLLM, Together, Groq, etc.
 *
 * Must be wrapped in <BlinkClientBoundary> — reads localStorage.
 */
export function useAIConfig() {
  const [config, setConfigState] = useState<StoredConfig>(DEFAULT_CONFIG)

  // Hydrate from localStorage on mount
  useEffect(() => {
    setConfigState(readStoredConfig())
  }, [])

  const setConfig = useCallback((next: Partial<StoredConfig>) => {
    setConfigState((prev) => {
      const merged: StoredConfig = {
        baseUrl: next.baseUrl ?? prev.baseUrl,
        apiKey: next.apiKey ?? prev.apiKey,
        model: next.model ?? prev.model,
      }
      // Normalize the base URL so the saved value is always clean
      merged.baseUrl = normalizeBaseUrl(merged.baseUrl)
      writeStoredConfig(merged)
      return merged
    })
  }, [])

  const setApiKey = useCallback((key: string) => {
    setConfig({ apiKey: key })
  }, [setConfig])

  const clearApiKey = useCallback(() => {
    setConfig({ apiKey: '' })
  }, [setConfig])

  const reset = useCallback(() => {
    setConfigState(DEFAULT_CONFIG)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }, [])

  const aiConfig: AIConfig = {
    baseUrl: config.baseUrl,
    apiKey: config.apiKey,
    model: config.model,
  }

  return {
    config,
    aiConfig,
    setConfig,
    setApiKey,
    clearApiKey,
    reset,
    /** True when both a base URL and API key are present (and a model is set). */
    isReady: config.baseUrl.trim().length > 0 && config.apiKey.trim().length > 0 && config.model.trim().length > 0,
    hasKey: config.apiKey.length > 0,
  }
}
