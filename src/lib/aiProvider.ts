import type { Campaign, Character, Message } from '@/types'
import { buildNarrativePrompt, type NarrativeOptions } from '@/lib/prompts/narrative'

/**
 * Configuration for connecting to any OpenAI-compatible chat completions API.
 * Compatible with OpenAI, OpenRouter, LM Studio, Ollama (OpenAI-compat mode),
 * vLLM, Together, Groq, etc. — anything that speaks the `/v1/chat/completions`
 * streaming protocol.
 */
export interface AIConfig {
  /** Base URL of the API, e.g. https://api.openai.com/v1 or http://localhost:1234/v1 */
  baseUrl: string
  /** API key. Empty string is fine for local servers that don't require auth. */
  apiKey: string
  /** Model name to request from the provider, e.g. gpt-4o-mini, llama3.1, etc. */
  model: string
}

interface AIStreamDelta {
  content?: string
}

interface AIStreamChoice {
  delta: AIStreamDelta
  index: number
  finish_reason: string | null
}

interface AIStreamChunk {
  choices: AIStreamChoice[]
}

/** Normalize a user-provided base URL — strip trailing slash, ensure /v1 suffix. */
export function normalizeBaseUrl(input: string): string {
  let url = (input || '').trim()
  // Strip trailing slashes
  url = url.replace(/\/+$/, '')
  // If the user already pointed at /chat/completions, trim it back to the base
  url = url.replace(/\/chat\/completions\/?$/, '')
  // Auto-append /v1 if the path is empty or doesn't end with a version segment
  if (!/\/v\d+($|\/)/.test(url)) {
    url = `${url}/v1`
  }
  return url
}

/** Build the full chat-completions URL for a given base URL. */
export function buildChatCompletionsUrl(baseUrl: string): string {
  return `${normalizeBaseUrl(baseUrl)}/chat/completions`
}

/**
 * Streams a chat completion from any OpenAI-compatible provider.
 * Yields text chunks as they arrive from the SSE stream.
 */
export async function* streamChat(
  messages: { role: string; content: string }[],
  config: AIConfig,
  signal?: AbortSignal,
): AsyncGenerator<string, void, undefined> {
  const url = buildChatCompletionsUrl(config.baseUrl)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: config.model,
      messages,
      stream: true,
    }),
    signal,
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error')
    throw new Error(`AI provider error (${response.status}): ${errorText}`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('No response body available for streaming')
  }

  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data: ')) continue

        const data = trimmed.slice(6)
        if (data === '[DONE]') return

        try {
          const parsed: AIStreamChunk = JSON.parse(data)
          const content = parsed.choices?.[0]?.delta?.content
          if (content) yield content
        } catch {
          // Skip unparseable chunks
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

/**
 * Builds the GM system prompt string from campaign + character context.
 * Backward-compatible wrapper around the rich narrative prompt template.
 * Defaults: adventure mode, second-person, present tense.
 */
export function buildGMContext(
  campaign: Campaign,
  characters: Character[],
  _sceneHistory: Message[],
  options?: Partial<NarrativeOptions>,
): string {
  return buildNarrativePrompt(campaign, characters, {
    mode: 'adventure',
    pov: 'second',
    tense: 'present',
    targetWordCount: 250,
    ...options,
  })
}
