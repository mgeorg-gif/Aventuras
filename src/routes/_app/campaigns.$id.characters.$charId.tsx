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
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@blinkdotnew/ui'
import { ArrowLeft, Save, Shield, Eye, Heart, Trash2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useCharacter, useUpdateCharacter, useDeleteCharacter } from '@/hooks/useData'

export const Route = createFileRoute('/_app/campaigns/$id/characters/$charId')({
  head: () => ({ meta: [{ title: 'Edit Character · Tales of the Void' }] }),
  component: EditCharacter,
})

const ROLES = [
  { value: 'pc', label: 'Player Character (PC)' },
  { value: 'npc', label: 'Non-Player Character (NPC)' },
  { value: 'gm', label: 'Game Master' },
]

function EditCharacter() {
  const { id, charId } = useParams({ strict: false }) as { id: string; charId: string }
  const { data: character, isLoading } = useCharacter(charId)
  const updateCharacter = useUpdateCharacter()
  const deleteCharacter = useDeleteCharacter()
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

  const [deleteOpen, setDeleteOpen] = useState(false)

  useEffect(() => {
    if (!character) return
    setName(character.name || '')
    setRole(character.role || 'npc')
    setAppearance(character.appearance || '')
    setVoice(character.voice || '')
    setSurfacePersonality(character.surfacePersonality || '')

    // Parse combined hidden motivations back
    const hiddenParts = (character.hiddenMotivations || '').split(' | ')
    setHiddenMotivations(hiddenParts[0] || '')
    setDrivingGoals(hiddenParts[1] || '')

    const deepParts = (character.deepSecrets || '').split(' | ')
    setDeepSecrets(deepParts[0] || '')
    setFears(deepParts[1] || '')
    setTrueNature(deepParts[2] || '')
  }, [character])

  const handleSave = async () => {
    if (!name.trim()) return
    try {
      await updateCharacter.mutate({
        id: charId,
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
      navigate({ to: '/campaigns/$id', params: { id } })
    } catch {
      // error handled by hook
    }
  }

  const handleDelete = async () => {
    await deleteCharacter.mutate(charId)
    navigate({ to: '/campaigns/$id', params: { id } })
  }

  if (isLoading || !character) {
    return (
      <Page>
        <PageBody>
          <div className="max-w-3xl space-y-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-lg bg-muted" />
            ))}
          </div>
        </PageBody>
      </Page>
    )
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
              Edit — {character.name}
            </PageTitle>
            <PageDescription>Refine the layers of this character&apos;s soul.</PageDescription>
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
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Role</label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger>
                      <SelectValue />
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
                  value={appearance}
                  onChange={(e) => setAppearance(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Voice & Style</label>
                <Input value={voice} onChange={(e) => setVoice(e.target.value)} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Surface Personality</label>
                <Textarea
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
                  value={hiddenMotivations}
                  onChange={(e) => setHiddenMotivations(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Driving Goals</label>
                <Textarea
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
                  value={deepSecrets}
                  onChange={(e) => setDeepSecrets(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Deepest Fears</label>
                <Textarea
                  value={fears}
                  onChange={(e) => setFears(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">True Nature</label>
                <Textarea
                  value={trueNature}
                  onChange={(e) => setTrueNature(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* ── Actions ───────────────────────────────── */}
          <div className="flex items-center gap-3 pt-4">
            <Button onClick={handleSave} disabled={!name.trim() || updateCharacter.isPending} className="gap-2">
              <Save className="h-4 w-4" />
              {updateCharacter.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate({ to: '/campaigns/$id', params: { id } })}
            >
              Cancel
            </Button>

            <div className="flex-1" />

            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10 gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-serif text-xl">Delete Character</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete &ldquo;{character.name}&rdquo;? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleteCharacter.isPending}
                  >
                    {deleteCharacter.isPending ? 'Deleting...' : 'Delete Forever'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </PageBody>
    </Page>
  )
}
