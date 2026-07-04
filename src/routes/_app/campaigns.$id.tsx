import { createFileRoute, useNavigate, useParams, Link } from '@tanstack/react-router'
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Page,
  PageHeader,
  PageTitle,
  PageDescription,
  PageActions,
  PageBody,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Input,
  EmptyState,
} from '@blinkdotnew/ui'
import {
  ArrowLeft,
  Plus,
  Users,
  ScrollText,
  Play,
  Pause,
  CheckCircle2,
  Clock,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import {
  useCampaign,
  useCharacters,
  useScenes,
  useCreateScene,
  useDeleteCampaign,
} from '@/hooks/useData'
import type { Character, Scene } from '@/types'

export const Route = createFileRoute('/_app/campaigns/$id')({
  head: () => ({ meta: [{ title: 'Campaign · Tales of the Void' }] }),
  component: CampaignDetail,
})

const ROLE_BADGE_CLASSES: Record<string, string> = {
  pc: 'border-primary text-primary',
  npc: 'border-accent text-accent',
  gm: 'border-purple-400/50 text-purple-300',
}

const ROLE_LABELS: Record<string, string> = {
  pc: 'Player',
  npc: 'NPC',
  gm: 'Game Master',
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  active: <Play className="h-3.5 w-3.5 text-primary" />,
  completed: <CheckCircle2 className="h-3.5 w-3.5 text-chart-4" />,
  paused: <Pause className="h-3.5 w-3.5 text-muted-foreground" />,
}

function CampaignDetail() {
  const { id } = useParams({ strict: false }) as { id: string }
  const { data: campaign, isLoading: campaignLoading } = useCampaign(id)
  const { data: characters, isLoading: charsLoading } = useCharacters(id)
  const { data: scenes, isLoading: scenesLoading } = useScenes(id)
  const createScene = useCreateScene()
  const deleteCampaign = useDeleteCampaign()
  const navigate = useNavigate()

  const [sceneDialogOpen, setSceneDialogOpen] = useState(false)
  const [sceneTitle, setSceneTitle] = useState('')

  const handleCreateScene = async () => {
    if (!sceneTitle.trim()) return
    try {
      const scene = await createScene.mutateAsync({
        title: sceneTitle.trim(),
        campaignId: id,
      })
      setSceneDialogOpen(false)
      setSceneTitle('')
      if (scene?.id) {
        navigate({ to: '/campaigns/$id/scenes/$sceneId', params: { id, sceneId: scene.id } })
      }
    } catch {
      // error handled by hook
    }
  }

  const handleDeleteCampaign = async () => {
    if (!confirm('Delete this campaign and all its characters and scenes? This cannot be undone.'))
      return
    await deleteCampaign.mutate(id)
    navigate({ to: '/' })
  }

  if (campaignLoading || !campaign) {
    return (
      <Page>
        <PageBody>
          <div className="space-y-4 animate-pulse">
            <div className="h-8 w-1/3 rounded bg-muted" />
            <div className="h-4 w-2/3 rounded bg-muted" />
            <div className="h-24 rounded bg-muted" />
          </div>
        </PageBody>
      </Page>
    )
  }

  return (
    <Page>
      <PageHeader>
        <div className="flex items-center gap-3">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <PageTitle className="font-serif text-2xl tracking-tight">{campaign.name}</PageTitle>
            <PageDescription>
              {campaign.setting && (
                <span className="italic">{campaign.setting}</span>
              )}
            </PageDescription>
          </div>
        </div>
        <PageActions>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={handleDeleteCampaign}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </PageActions>
      </PageHeader>

      {campaign.description && (
        <div className="px-6 pb-2">
          <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
            {campaign.description}
          </p>
        </div>
      )}

      <PageBody>
        <Tabs defaultValue="characters">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="characters" className="gap-2">
                <Users className="h-4 w-4" />
                Characters
              </TabsTrigger>
              <TabsTrigger value="scenes" className="gap-2">
                <ScrollText className="h-4 w-4" />
                Scenes
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ── Characters Tab ─────────────────────────── */}
          <TabsContent value="characters">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {charsLoading
                  ? 'Loading...'
                  : `${(characters as Character[])?.length || 0} characters`}
              </p>
              <Link to="/campaigns/$id/characters/new" params={{ id }}>
                <Button size="sm" className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  New Character
                </Button>
              </Link>
            </div>

            {charsLoading ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-5 w-3/4 rounded bg-muted" />
                    </CardHeader>
                    <CardContent>
                      <div className="h-4 w-full rounded bg-muted" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : !characters || (characters as Character[]).length === 0 ? (
              <EmptyState
                icon={<Users className="h-8 w-8" />}
                title="No characters yet"
                description="Create your first character to populate this dark fantasy world."
                action={{
                  label: 'Create Character',
                  onClick: () =>
                    navigate({ to: '/campaigns/$id/characters/new', params: { id } }),
                }}
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(characters as Character[]).map((char) => (
                  <Link
                    key={char.id}
                    to="/campaigns/$id/characters/$charId"
                    params={{ id, charId: char.id }}
                  >
                    <Card className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 h-full">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-base font-serif">{char.name}</CardTitle>
                          <Badge
                            variant="outline"
                            className={ROLE_BADGE_CLASSES[char.role] || 'border-muted text-muted-foreground'}
                          >
                            {ROLE_LABELS[char.role] || char.role}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2 italic">
                          {char.surfacePersonality || 'No personality defined.'}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Scenes Tab ─────────────────────────────── */}
          <TabsContent value="scenes">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {scenesLoading
                  ? 'Loading...'
                  : `${(scenes as Scene[])?.length || 0} scenes`}
              </p>
              <Dialog open={sceneDialogOpen} onOpenChange={setSceneDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5">
                    <Plus className="h-4 w-4" />
                    New Scene
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="font-serif text-xl">Create Scene</DialogTitle>
                    <DialogDescription>
                      Begin a new chapter in your dark tale.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Scene Title</label>
                      <Input
                        placeholder="The Gate of Shadows"
                        value={sceneTitle}
                        onChange={(e) => setSceneTitle(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setSceneDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateScene}
                      disabled={!sceneTitle.trim() || createScene.isPending}
                    >
                      {createScene.isPending ? 'Creating...' : 'Create Scene'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {scenesLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : !scenes || (scenes as Scene[]).length === 0 ? (
              <EmptyState
                icon={<ScrollText className="h-8 w-8" />}
                title="No scenes yet"
                description="Create a scene to begin roleplaying. Each scene is a chapter in your saga."
                action={{ label: 'Create Scene', onClick: () => setSceneDialogOpen(true) }}
              />
            ) : (
              <div className="space-y-2">
                {(scenes as Scene[]).map((scene) => (
                  <Link
                    key={scene.id}
                    to="/campaigns/$id/scenes/$sceneId"
                    params={{ id, sceneId: scene.id }}
                  >
                    <Card className="cursor-pointer transition-all duration-200 hover:border-primary/30 hover:shadow-sm group">
                      <CardContent className="flex items-center gap-4 py-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                              {scene.title}
                            </span>
                            {scene.status && STATUS_ICONS[scene.status] && (
                              <span className="shrink-0">{STATUS_ICONS[scene.status]}</span>
                            )}
                          </div>
                          {scene.summary && (
                            <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                              {scene.summary}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                          {scene.status && (
                            <Badge variant="secondary" className="capitalize">
                              {scene.status}
                            </Badge>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(scene.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </PageBody>
    </Page>
  )
}
