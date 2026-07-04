import { createFileRoute, useParams, Link } from '@tanstack/react-router'
import {
  Button,
  Badge,
  Textarea,
} from '@blinkdotnew/ui'
import { ArrowLeft, Send, Loader2, Swords } from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  useCampaign,
  useCharacters,
  useScene,
  useMessages,
  useCreateMessage,
} from '@/hooks/useData'
import { useAIConfig } from '@/hooks/useAIConfig'
import { useNarrativeOptions } from '@/hooks/useNarrativeOptions'
import { buildGMContext, streamChat } from '@/lib/aiProvider'
import { cn } from '@/lib/utils'
import type { Campaign, Character, Message } from '@/types'

export const Route = createFileRoute('/_app/campaigns/$id/scenes/$sceneId')({
  head: () => ({ meta: [{ title: 'Scene · Tales of the Void' }] }),
  component: ScenePlayer,
})

const ROLE_BADGE_CLASSES: Record<string, string> = {
  pc: 'border-primary text-primary',
  npc: 'border-accent text-accent',
  gm: 'border-purple-400/50 text-purple-300',
}

/** Parse AI response into structured message parts */
function parseAIResponse(
  text: string,
  characters: Character[],
): { role: 'assistant' | 'narrator'; characterId: string | null; characterName: string; content: string }[] {
  const parts: {
    role: 'assistant' | 'narrator'
    characterId: string | null
    characterName: string
    content: string
  }[] = []

  // Look for "CHARACTER_NAME:" pattern
  const dialogRegex = /^([A-Z][A-Za-z\s]+?):\s*(.+)$/gm
  let narrativeBuffer = text
  const characterDialogs: { name: string; content: string }[] = []

  let match: RegExpExecArray | null
  while ((match = dialogRegex.exec(text)) !== null) {
    const charName = match[1].trim()
    const content = match[2].trim()
    characterDialogs.push({ name: charName, content })
    narrativeBuffer = narrativeBuffer.replace(match[0], '')
  }

  narrativeBuffer = narrativeBuffer.trim()

  // Add narrative first if present
  if (narrativeBuffer) {
    parts.push({
      role: 'narrator',
      characterId: null,
      characterName: '',
      content: narrativeBuffer,
    })
  }

  // Add character dialogues
  for (const dialog of characterDialogs) {
    const matchedChar = characters.find(
      (c) => c.name.toLowerCase() === dialog.name.toLowerCase(),
    )
    parts.push({
      role: 'assistant',
      characterId: matchedChar?.id || null,
      characterName: dialog.name,
      content: dialog.content,
    })
  }

  return parts
}

function ScenePlayer() {
  const { id, sceneId } = useParams({ strict: false }) as { id: string; sceneId: string }
  const { data: campaign } = useCampaign(id)
  const { data: characters } = useCharacters(id)
  const { data: scene } = useScene(sceneId)
  const { data: messages } = useMessages(sceneId)
  const createMessage = useCreateMessage()
  const { aiConfig, isReady } = useAIConfig()
  const { options: narrativeOptions, setOptions: setNarrative } = useNarrativeOptions(id)

  const [inputValue, setInputValue] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [localMessages, setLocalMessages] = useState<Message[]>([])
  const [streamingContent, setStreamingContent] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Sync DB messages into local state
  useEffect(() => {
    if (messages) setLocalMessages(messages as Message[])
  }, [messages])

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [localMessages, streamingContent])

  const handleSend = useCallback(async () => {
    const text = inputValue.trim()
    if (!text || !campaign || !characters) return
    if (!isReady) {
      setInputValue('')
      // Add a system note about missing config
      const systemMsg: Message = {
        id: crypto.randomUUID(),
        sceneId,
        role: 'system',
        characterId: null,
        characterName: '',
        content: '⚠️ AI provider not configured. Go to Settings to set the base URL, API key, and model.',
        createdAt: new Date().toISOString(),
      }
      setLocalMessages((prev) => [...prev, systemMsg])
      return
    }

    setInputValue('')

    // 1. Add user message
    const userMsg: Message = {
      id: crypto.randomUUID(),
      sceneId,
      role: 'user',
      characterId: null,
      characterName: '',
      content: text,
      createdAt: new Date().toISOString(),
    }
    setLocalMessages((prev) => [...prev, userMsg])
    try {
      await createMessage.mutate(userMsg)
    } catch {
      // proceed optimistically
    }

    // 2. Build context
    const allMessages = [...(localMessages as Message[]), userMsg]
    const gmPrompt = buildGMContext(
      campaign as Campaign,
      characters as Character[],
      allMessages,
      narrativeOptions,
    )

    // 3. Stream AI response
    setIsStreaming(true)
    setStreamingContent('')

    const chatMessages = [
      { role: 'system', content: gmPrompt },
      ...allMessages.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : m.role === 'user' ? 'user' : 'system',
        content: m.characterName
          ? `${m.characterName}: ${m.content}`
          : m.content,
      })),
    ]

    let fullResponse = ''
    try {
      for await (const chunk of streamChat(chatMessages, aiConfig)) {
        fullResponse += chunk
        setStreamingContent(fullResponse)
      }
    } catch {
      fullResponse = 'The void swallows your words... (AI response failed)'
      setStreamingContent(fullResponse)
    }

    // 4. Parse and store
    const parts = parseAIResponse(fullResponse, characters as Character[])

    for (const part of parts) {
      const msg: Message = {
        id: crypto.randomUUID(),
        sceneId,
        role: part.role,
        characterId: part.characterId,
        characterName: part.characterName,
        content: part.content,
        createdAt: new Date().toISOString(),
      }
      setLocalMessages((prev) => [...prev, msg])
      try {
        await createMessage.mutate(msg)
      } catch {
        // proceed
      }
    }

    setIsStreaming(false)
    setStreamingContent('')
  }, [inputValue, campaign, characters, localMessages, sceneId, aiConfig, isReady, narrativeOptions, createMessage])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!isStreaming && inputValue.trim()) handleSend()
    }
  }

  const getCharRole = (charName: string): string => {
    if (!characters) return 'npc'
    const char = (characters as Character[]).find(
      (c) => c.name.toLowerCase() === charName.toLowerCase(),
    )
    return char?.role || 'npc'
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-3.5rem)] md:h-dvh">
      {/* ── Header ──────────────────────────────────── */}
      <header className="shrink-0 flex items-center gap-3 px-4 h-14 border-b border-border bg-background/95 backdrop-blur-sm">
        <Link
          to="/campaigns/$id"
          params={{ id }}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h2 className="font-serif font-semibold text-foreground truncate">
            {scene?.title || 'Loading...'}
          </h2>
          {campaign && (
            <p className="text-xs text-muted-foreground truncate">
              {(campaign as Campaign).name}
            </p>
          )}
        </div>
        {!isReady && (
          <Link to="/settings">
            <Badge variant="destructive" className="text-[10px] cursor-pointer">
              AI Provider Required
            </Badge>
          </Link>
        )}
        <button
          type="button"
          onClick={() => {
            // Cycle POV: first → second → third → first (only meaningful in creative-writing for first)
            const next =
              narrativeOptions.pov === 'first'
                ? 'second'
                : narrativeOptions.pov === 'second'
                ? 'third'
                : 'first'
            setNarrative({ pov: next })
          }}
          className="hidden sm:inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
          title="Click to cycle POV"
        >
          <span className="uppercase tracking-wider">{narrativeOptions.pov} person</span>
          <span className="text-muted-foreground/50">·</span>
          <span className="uppercase tracking-wider">{narrativeOptions.tense}</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setNarrative({ tense: narrativeOptions.tense === 'present' ? 'past' : 'present' })
          }}
          className="sm:hidden inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
          title="Toggle tense"
        >
          {narrativeOptions.pov}/{narrativeOptions.tense}
        </button>
      </header>

      {/* ── Messages ────────────────────────────────── */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto px-4 py-6 space-y-5"
      >
        {/* Welcome message */}
        {(!localMessages || localMessages.length === 0) && !isStreaming && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 opacity-60">
            <Swords className="h-10 w-10 text-primary/50" />
            <p className="font-serif text-lg text-muted-foreground">
              The scene unfolds before you...
            </p>
            <p className="text-sm text-muted-foreground max-w-md">
              {isReady
                ? 'Describe your actions and the story will come alive.'
                : 'Configure your AI provider in Settings to begin.'}
            </p>
          </div>
        )}

        {Array.isArray(localMessages) &&
          localMessages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              charRole={msg.characterName ? getCharRole(msg.characterName) : undefined}
            />
          ))}

        {/* Streaming preview */}
        {isStreaming && streamingContent && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 pl-1">
              <div className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs text-muted-foreground italic font-serif">
                The void whispers...
              </span>
            </div>
            <div className="text-sm text-foreground/70 italic leading-relaxed px-1 border-l-2 border-primary/30 pl-3 font-serif">
              {streamingContent.slice(-300)}
            </div>
          </div>
        )}

        {isStreaming && !streamingContent && (
          <div className="flex items-center gap-2 pl-1">
            <div className="flex gap-1">
              <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs text-muted-foreground italic font-serif">
              The void whispers...
            </span>
          </div>
        )}
      </div>

      {/* ── Input ────────────────────────────────────── */}
      <div className="shrink-0 border-t border-border bg-background/95 backdrop-blur-sm p-3">
        <div className="flex items-end gap-2 max-w-4xl mx-auto">
          <Textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isReady
                ? 'Describe your action... (Enter to send, Shift+Enter for new line)'
                : 'Set up your AI provider in Settings first...'
            }
            className="min-h-[44px] max-h-[120px] resize-none font-serif"
            rows={1}
            disabled={isStreaming || !isReady}
          />
          <Button
            size="sm"
            onClick={handleSend}
            disabled={isStreaming || !inputValue.trim() || !isReady}
            className="shrink-0 h-[44px] w-[44px] p-0"
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({
  message,
  charRole,
}: {
  message: Message
  charRole?: string
}) {
  // System messages
  if (message.role === 'system') {
    return (
      <div className="flex justify-center">
        <span className="text-xs text-accent bg-accent/10 rounded-full px-3 py-1">
          {message.content}
        </span>
      </div>
    )
  }

  // Narrator messages
  if (message.role === 'narrator') {
    return (
      <div className="flex justify-center">
        <p className="text-sm text-muted-foreground italic max-w-xl text-center leading-relaxed font-serif px-4 py-2">
          {message.content}
        </p>
      </div>
    )
  }

  // User messages (right-aligned)
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] md:max-w-[60%] rounded-xl rounded-br-sm border border-primary/40 bg-primary/5 px-4 py-3">
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>
      </div>
    )
  }

  // Character (assistant) messages (left-aligned)
  const roleClass = charRole ? ROLE_BADGE_CLASSES[charRole] || '' : ''

  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] md:max-w-[60%] space-y-1.5">
        {message.characterName && (
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn('text-[10px] py-0 px-2 font-medium', roleClass)}
            >
              {message.characterName}
            </Badge>
          </div>
        )}
        <div className="rounded-xl rounded-bl-sm border border-border bg-card px-4 py-3">
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>
      </div>
    </div>
  )
}
