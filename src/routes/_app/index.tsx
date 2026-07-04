import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Input,
  Textarea,
  Badge,
  Page,
  PageHeader,
  PageTitle,
  PageDescription,
  PageActions,
  PageBody,
  EmptyState,
} from '@blinkdotnew/ui'
import { Plus, Swords, BookOpen, Users } from 'lucide-react'
import { useState } from 'react'
import { useCampaigns, useCreateCampaign } from '@/hooks/useData'
import type { Campaign } from '@/types'

export const Route = createFileRoute('/_app/')({
  head: () => ({ meta: [{ title: 'Campaigns · Tales of the Void' }] }),
  component: CampaignDashboard,
})

function CampaignDashboard() {
  const { data: campaigns, isLoading } = useCampaigns()
  const createCampaign = useCreateCampaign()
  const navigate = useNavigate()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [setting, setSetting] = useState('')

  const handleCreate = async () => {
    if (!name.trim()) return
    try {
      const campaign = await createCampaign.mutateAsync({
        name: name.trim(),
        description: description.trim(),
        setting: setting.trim(),
      })
      setDialogOpen(false)
      setName('')
      setDescription('')
      setSetting('')
      if (campaign?.id) {
        navigate({ to: '/campaigns/$id', params: { id: campaign.id } })
      }
    } catch {
      // error handled by hook
    }
  }

  return (
    <Page>
      <PageHeader>
        <div>
          <PageTitle className="font-serif text-2xl tracking-tight">Your Campaigns</PageTitle>
          <PageDescription>
            Weave dark tales and guide your characters through perilous realms.
          </PageDescription>
        </div>
        <PageActions>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Campaign
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-serif text-xl">Create Campaign</DialogTitle>
                <DialogDescription>
                  Give your dark fantasy tale a name, a world, and a purpose.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Name</label>
                  <Input
                    placeholder="The Shadow of Evernight"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Setting</label>
                  <Input
                    placeholder="A crumbling kingdom beneath an eternal eclipse..."
                    value={setting}
                    onChange={(e) => setSetting(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Description</label>
                  <Textarea
                    placeholder="Describe the world, the conflict, and what draws your heroes together..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={!name.trim() || createCampaign.isPending}>
                  {createCampaign.isPending ? 'Creating...' : 'Create Campaign'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </PageActions>
      </PageHeader>

      <PageBody>
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 w-3/4 rounded bg-muted" />
                  <div className="h-4 w-1/2 rounded bg-muted mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 w-full rounded bg-muted" />
                  <div className="h-4 w-2/3 rounded bg-muted mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !campaigns || campaigns.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="h-10 w-10" />}
            title="No campaigns yet"
            description="Your saga awaits. Create your first campaign and begin weaving a dark fantasy tale of heroes, villains, and forgotten realms."
            action={{ label: 'Create Campaign', onClick: () => setDialogOpen(true) }}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(campaigns as Campaign[]).map((campaign) => (
              <Card
                key={campaign.id}
                className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 group"
                onClick={() =>
                  navigate({ to: '/campaigns/$id', params: { id: campaign.id } })
                }
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="font-serif text-lg leading-tight group-hover:text-primary transition-colors">
                      {campaign.name}
                    </CardTitle>
                    <Swords className="h-4 w-4 shrink-0 text-muted-foreground/40 mt-1" />
                  </div>
                  {campaign.setting && (
                    <CardDescription className="line-clamp-1 italic">
                      {campaign.setting}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {campaign.description || 'No description yet.'}
                  </p>
                </CardContent>
                <CardFooter className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Characters
                  </span>
                  <Badge variant="secondary" className="text-[10px]">
                    {new Date(campaign.createdAt).toLocaleDateString()}
                  </Badge>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </PageBody>
    </Page>
  )
}
