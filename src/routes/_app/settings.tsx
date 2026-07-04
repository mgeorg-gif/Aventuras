import { createFileRoute } from '@tanstack/react-router'
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
  Badge,
  Page,
  PageHeader,
  PageTitle,
  PageDescription,
  PageBody,
} from '@blinkdotnew/ui'
import {
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Key,
  Globe,
  Cpu,
  RotateCcw,
  ExternalLink,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAIConfig } from '@/hooks/useAIConfig'
import { normalizeBaseUrl } from '@/lib/aiProvider'

export const Route = createFileRoute('/_app/settings')({
  head: () => ({ meta: [{ title: 'Settings · Tales of the Void' }] }),
  component: SettingsPage,
})

interface ProviderPreset {
  id: string
  label: string
  description: string
  baseUrl: string
  model: string
  apiKeyLabel: string
  apiKeyHelp: string
  apiKeyLink?: { href: string; label: string }
  requiresKey: boolean
}

const PRESETS: ProviderPreset[] = [
  {
    id: 'openai',
    label: 'OpenAI',
    description: 'GPT-4o, GPT-4.1, o-series, etc.',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    apiKeyLabel: 'OpenAI API Key',
    apiKeyHelp: 'Get a key from platform.openai.com → API keys.',
    apiKeyLink: { href: 'https://platform.openai.com/api-keys', label: 'platform.openai.com/api-keys' },
    requiresKey: true,
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    description: 'Aggregate of 100+ models (Claude, GPT, Llama, etc.)',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'openai/gpt-4o-mini',
    apiKeyLabel: 'OpenRouter API Key',
    apiKeyHelp: 'Get a key from openrouter.ai → Keys. Use the format anthropic/claude-3.5-sonnet, openai/gpt-4o, etc.',
    apiKeyLink: { href: 'https://openrouter.ai/keys', label: 'openrouter.ai/keys' },
    requiresKey: true,
  },
  {
    id: 'groq',
    label: 'Groq',
    description: 'Fast inference for Llama, Mixtral, Gemma',
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'llama-3.1-70b-versatile',
    apiKeyLabel: 'Groq API Key',
    apiKeyHelp: 'Get a key from console.groq.com → API Keys.',
    apiKeyLink: { href: 'https://console.groq.com/keys', label: 'console.groq.com/keys' },
    requiresKey: true,
  },
  {
    id: 'together',
    label: 'Together AI',
    description: 'Open models at scale (Llama, Qwen, DeepSeek)',
    baseUrl: 'https://api.together.xyz/v1',
    model: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
    apiKeyLabel: 'Together API Key',
    apiKeyHelp: 'Get a key from api.together.xyz → Settings → API Keys.',
    apiKeyLink: { href: 'https://api.together.xyz/settings/api-keys', label: 'api.together.xyz' },
    requiresKey: true,
  },
  {
    id: 'lmstudio',
    label: 'LM Studio (local)',
    description: 'Run models on your own machine (OpenAI-compat server)',
    baseUrl: 'http://localhost:1234/v1',
    model: 'local-model',
    apiKeyLabel: 'API Key (optional)',
    apiKeyHelp: 'Enable the local server in LM Studio (Developer tab). API key is usually not required for local.',
    requiresKey: false,
  },
  {
    id: 'ollama',
    label: 'Ollama (local)',
    description: 'Local models via Ollama\'s OpenAI-compatible endpoint',
    baseUrl: 'http://localhost:11434/v1',
    model: 'llama3.1',
    apiKeyLabel: 'API Key (optional)',
    apiKeyHelp: 'Ollama exposes an OpenAI-compatible API on :11434 by default. No key required for local.',
    requiresKey: false,
  },
  {
    id: 'custom',
    label: 'Custom endpoint',
    description: 'Any other OpenAI-compatible API (vLLM, LocalAI, etc.)',
    baseUrl: '',
    model: '',
    apiKeyLabel: 'API Key',
    apiKeyHelp: 'Provide the full base URL (e.g. https://api.example.com/v1) and the model identifier.',
    requiresKey: true,
  },
]

function SettingsPage() {
  const { config, setConfig, setApiKey, clearApiKey, reset, isReady } = useAIConfig()

  const [showKey, setShowKey] = useState(false)
  const [baseUrlInput, setBaseUrlInput] = useState(config.baseUrl)
  const [apiKeyInput, setApiKeyInput] = useState(config.apiKey)
  const [modelInput, setModelInput] = useState(config.model)
  const [savedAt, setSavedAt] = useState<number | null>(null)

  // Keep local inputs in sync with the persisted config (after hydration)
  useEffect(() => {
    setBaseUrlInput(config.baseUrl)
    setApiKeyInput(config.apiKey)
    setModelInput(config.model)
  }, [config.baseUrl, config.apiKey, config.model])

  const activePreset = PRESETS.find(
    (p) => normalizeBaseUrl(p.baseUrl) === normalizeBaseUrl(config.baseUrl),
  )

  const handleSave = () => {
    setConfig({
      baseUrl: baseUrlInput.trim(),
      apiKey: apiKeyInput.trim(),
      model: modelInput.trim(),
    })
    setSavedAt(Date.now())
  }

  const handleApplyPreset = (preset: ProviderPreset) => {
    setBaseUrlInput(preset.baseUrl)
    setModelInput(preset.model || config.model)
    setConfig({
      baseUrl: preset.baseUrl,
      model: preset.model || config.model,
    })
    setSavedAt(Date.now())
  }

  const handleReset = () => {
    reset()
    setBaseUrlInput('https://api.openai.com/v1')
    setApiKeyInput('')
    setModelInput('gpt-4o-mini')
    setSavedAt(null)
  }

  const handleClear = () => {
    clearApiKey()
    setApiKeyInput('')
  }

  const normalizedUrl = normalizeBaseUrl(baseUrlInput)
  const maskedKey = config.apiKey
    ? config.apiKey.slice(0, 8) + '••••••••' + config.apiKey.slice(-4)
    : ''

  return (
    <Page>
      <PageHeader>
        <div>
          <PageTitle className="font-serif text-2xl tracking-tight">Settings</PageTitle>
          <PageDescription>
            Configure your storytelling engine and AI provider.
          </PageDescription>
        </div>
      </PageHeader>

      <PageBody>
        <div className="max-w-2xl space-y-6">
          {/* ── Provider presets ──────────────────────── */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                <CardTitle className="font-serif text-lg">AI Provider</CardTitle>
              </div>
              <CardDescription>
                Pick a preset to populate the base URL and model, then add your API key.
                Works with any OpenAI-compatible endpoint.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PRESETS.map((preset) => {
                  const isActive =
                    activePreset?.id === preset.id ||
                    (!activePreset && preset.id === 'custom')
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className={
                        'text-left rounded-md border px-3 py-2 transition-colors ' +
                        (isActive
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50 hover:bg-muted/30')
                      }
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{preset.label}</span>
                        {isActive && (
                          <Badge variant="secondary" className="text-[9px]">active</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                        {preset.description}
                      </p>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* ── Connection settings ───────────────────── */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                <CardTitle className="font-serif text-lg">Connection</CardTitle>
              </div>
              <CardDescription>
                The base URL, API key, and model are stored locally in your browser and
                never sent to any server except the provider you choose.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status */}
              <div className="flex items-center gap-2 flex-wrap">
                {isReady ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-chart-4" />
                    <span className="text-sm text-chart-4 font-medium">Configured</span>
                    {maskedKey && (
                      <Badge variant="secondary" className="text-[10px] font-mono">
                        {maskedKey}
                      </Badge>
                    )}
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <span className="text-sm text-destructive font-medium">
                      API key required
                    </span>
                  </>
                )}
                {savedAt && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    Saved
                  </span>
                )}
              </div>

              {/* Base URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Base URL
                </label>
                <Input
                  type="text"
                  placeholder="https://api.openai.com/v1"
                  value={baseUrlInput}
                  onChange={(e) => setBaseUrlInput(e.target.value)}
                  className="font-mono text-sm"
                />
                <p className="text-[11px] text-muted-foreground">
                  Requests go to <code className="bg-muted px-1 rounded">{normalizedUrl || '(empty)'}/chat/completions</code>
                </p>
              </div>

              {/* API key */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  API Key
                </label>
                <div className="relative">
                  <Input
                    type={showKey ? 'text' : 'password'}
                    placeholder="sk-..."
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    className="pr-10 font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showKey ? 'Hide API key' : 'Show API key'}
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Leave blank if your local server doesn't require auth (LM Studio, Ollama).
                </p>
              </div>

              {/* Model */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu className="h-3 w-3" /> Model
                </label>
                <Input
                  type="text"
                  placeholder="gpt-4o-mini"
                  value={modelInput}
                  onChange={(e) => setModelInput(e.target.value)}
                  className="font-mono text-sm"
                />
                <p className="text-[11px] text-muted-foreground">
                  {activePreset && activePreset.id !== 'custom'
                    ? `Default for ${activePreset.label}: ${activePreset.model}`
                    : 'Use the exact model identifier your provider expects (e.g. gpt-4o-mini, claude-3-5-sonnet-20241022, llama3.1).'}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-1">
                <Button onClick={handleSave}>Save</Button>
                {config.apiKey && (
                  <Button
                    variant="outline"
                    onClick={handleClear}
                    className="text-destructive border-destructive/30 hover:bg-destructive/10"
                  >
                    Remove Key
                  </Button>
                )}
                <Button
                  variant="ghost"
                  onClick={handleReset}
                  className="ml-auto"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* ── Provider help ─────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-lg">Getting a key</CardTitle>
              <CardDescription>
                Most providers offer a free tier or trial credits. Local servers (LM Studio,
                Ollama) work without a key.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <ul className="space-y-2">
                {PRESETS.filter((p) => p.apiKeyLink).map((p) => (
                  <li key={p.id} className="flex items-start gap-2">
                    <span className="font-medium text-foreground shrink-0">{p.label}:</span>
                    {p.apiKeyLink && (
                      <a
                        href={p.apiKeyLink.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        {p.apiKeyLink.label}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
              <p className="text-xs leading-relaxed pt-2">
                For the best storytelling experience we recommend large, instruction-tuned
                models such as{' '}
                <code className="text-[11px] bg-muted px-1 rounded">gpt-4o-mini</code>,{' '}
                <code className="text-[11px] bg-muted px-1 rounded">claude-3-5-sonnet</code>, or{' '}
                <code className="text-[11px] bg-muted px-1 rounded">llama-3.1-70b</code>.
              </p>
            </CardContent>
          </Card>

          {/* ── About ─────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-lg">About Tales of the Void</CardTitle>
              <CardDescription>
                A local-first dark fantasy AI roleplay experience.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Your characters are built with a three-layer personality system — Surface, Hidden,
                and Deep — giving the AI Game Master rich context to weave immersive, character-driven
                narratives.
              </p>
              <p>
                Everything stays in your browser. Campaigns, characters, scenes, and messages are
                stored in <code className="text-[11px] bg-muted px-1 rounded">localStorage</code>;
                your AI provider config never leaves this device.
              </p>
            </CardContent>
          </Card>
        </div>
      </PageBody>
    </Page>
  )
}
