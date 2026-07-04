import { createFileRoute, useNavigate, useParams, Link } from '@tanstack/react-router'
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
  Textarea,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  Page,
  PageHeader,
  PageTitle,
  PageDescription,
  PageBody,
} from '@blinkdotnew/ui'
import { ArrowLeft, Save, Shield, Eye, Heart } from 'lucide-react'
import { useState } from 'react'
import { useCreateCharacter } from '@/hooks/useData'

export const Route = createFileRoute('/_app/campaigns/$id/characters/new')({
  head: () => ({ meta: [{ title: 'Create Character · Tales of the Void' }] }),
  component: CreateCharacter,
})

const ROLES = [
  { value: 'pc', label: 'Player Character (PC)' },
  { value: 'npc', label: 'Non-Player Character (NPC)' },
  { value: 'gm', label: 'Game Master' },
]

function CreateCharacter() {
  const { id } = useParams({ strict: false }) as { id: string }
  const createCharacter = useCreateCharacter()
  const navigate = useNavigate()

  // Layer 1: Surface
  const [name, setName] = useState('')
  const [role, setRole] = useState<string>('npc')
  const [appearance, setAppearance] = useState('')
  const [voice, setVoice] = useState('')
  const [surfacePersonality, setSurfacePersonality] = useState('')

  // Layer 2: Hidden
  const [hiddenMotivations, setHiddenMotivations] = useState('')
  const [drivingGoals, setDrivingGoals] = useState('')

  // Layer 3: Deep
  const [deepSecrets, setDeepSecrets] = useState('')
  const [fears, setFears] = useState('')
  const [trueNature, setTrueNature] = useState('')

  const handleSave = async () => {
    if (!name.trim()) return
    try {
      const character = await createCharacter.mutateAsync({
        name: name.trim(),
        role: role as 'pc' | 'npc' | 'gm',
        campaignId: id,
        appearance: appearance.trim(),
        voice: voice.trim(),
        surfacePersonality: surfacePersonality.trim(),
        hiddenMotivations: [hiddenMotivations.trim(), drivingGoals.trim()]
          .filter(Boolean)
          .join(' | '),
        deepSecrets: [deepSecrets.trim(), fears.trim(), trueNature.trim()]
          .filter(Boolean)
          .join(' | '),
        traitsJson: '{}',
      })
      if (character?.id) {
        navigate({ to: '/campaigns/$id', params: { id } })
      }
    } catch {
      // error handled by hook
    }
  }

  return (
    <Page>
      <PageHeader>
        <div className="flex items-center gap-3">
          <Link
            to="/campaigns/$id"
            params={{ id }}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <PageTitle className="font-serif text-2xl tracking-tight">
              Create Character
            </PageTitle>
            <PageDescription>
              Craft a soul for your dark fantasy world — layer by layer.
            </PageDescription>
          </div>
        </div>
      </PageHeader>

      <PageBody>
        <div className="max-w-3xl space-y-8">
          {/* ── Layer 1: Surface ─────────────────────── */}
          <Card className="border-l-2 border-l-primary">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle className="font-serif text-lg">Layer 1 — Surface</CardTitle>
              </div>
              <CardDescription>
                The face the world sees. First impressions, manner, and visible identity.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Name</label>
                  <Input
                    placeholder="Seraphina Darkmere"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Role</label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Appearance</label>
                <Textarea
                  placeholder="Tall and gaunt, with silver-streaked hair and eyes like storm clouds..."
                  value={appearance}
                  onChange={(e) => setAppearance(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Voice & Style</label>
                <Input
                  placeholder="Measured, slow cadence. Speaks in riddles and half-truths."
                  value={voice}
                  onChange={(e) => setVoice(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Surface Personality</label>
                <Textarea
                  placeholder="Aloof and calculating, but unfailingly polite. Hides a sharp intellect behind courtly manners."
                  value={surfacePersonality}
                  onChange={(e) => setSurfacePersonality(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* ── Layer 2: Hidden ──────────────────────── */}
          <Card className="border-l-2 border-l-accent">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-accent" />
                <CardTitle className="font-serif text-lg">Layer 2 — Hidden</CardTitle>
              </div>
              <CardDescription>
                The currents beneath the surface. What drives them when no one is watching.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Hidden Motivations</label>
                <Textarea
                  placeholder="Seeks the forbidden texts of the Old Kingdom, believing they hold the key to undoing a personal tragedy..."
                  value={hiddenMotivations}
                  onChange={(e) => setHiddenMotivations(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Driving Goals</label>
                <Textarea
                  placeholder="To find and destroy the Lich King who cursed her bloodline, even if it costs her soul..."
                  value={drivingGoals}
                  onChange={(e) => setDrivingGoals(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* ── Layer 3: Deep ────────────────────────── */}
          <Card className="border-l-2 border-l-purple-500/60">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-purple-400" />
                <CardTitle className="font-serif text-lg">Layer 3 — Deep</CardTitle>
              </div>
              <CardDescription>
                The truth buried in shadow. Secrets, fears, and the core of their being.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Deep Secrets</label>
                <Textarea
                  placeholder="She was the one who opened the gate. The Lich King did not invade — she invited him, and has told no one."
                  value={deepSecrets}
                  onChange={(e) => setDeepSecrets(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Deepest Fears</label>
                <Textarea
                  placeholder="Terrified that the darkness she touched now lives inside her, slowly consuming what remains of her humanity..."
                  value={fears}
                  onChange={(e) => setFears(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">True Nature</label>
                <Textarea
                  placeholder="At her core, she is still the frightened girl who watched her family die. Every act of power is a desperate attempt to never be that helpless again."
                  value={trueNature}
                  onChange={(e) => setTrueNature(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* ── Actions ───────────────────────────────── */}
          <div className="flex items-center gap-3 pt-4">
            <Button onClick={handleSave} disabled={!name.trim() || createCharacter.isPending} className="gap-2">
              <Save className="h-4 w-4" />
              {createCharacter.isPending ? 'Saving...' : 'Save Character'}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate({ to: '/campaigns/$id', params: { id } })}
            >
              Cancel
            </Button>
          </div>
        </div>
      </PageBody>
    </Page>
  )
}
