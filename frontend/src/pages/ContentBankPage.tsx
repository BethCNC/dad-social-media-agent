import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchBankItems,
  updateBankItem,
  generateVoiceover,
  renderFromBank,
  generateBatchContent,
  type BankItem,
} from '@/lib/bankApi';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  PlayCircle,
  Edit,
  CheckCircle,
  Archive,
  Volume2,
  Video,
  Settings,
  Download,
  Sparkles,
  Info
} from 'lucide-react';
import { ComplianceQuickRef } from '@/components/compliance/ComplianceQuickRef';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const ContentBankPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [items, setItems] = useState<BankItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [editingItem, setEditingItem] = useState<BankItem | null>(null);
  const [editForm, setEditForm] = useState({ title: '', script: '', caption: '' });
  const [processingItemId, setProcessingItemId] = useState<number | null>(null);

  // Batch Generation State
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);
  const [batchForm, setBatchForm] = useState({
    topic_theme: '',
    count: '5',
    content_pillar: 'education'
  });

  useEffect(() => {
    loadItems();
  }, [isAdminMode]);

  const loadItems = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // For main user view: prioritize unused items for variety (non-repeating content)
      // For admin: show all statuses, newest first
      const filters: any = {
        status: isAdminMode ? undefined : 'approved',
        limit: 20,
        prioritize_unused: !isAdminMode, // Prioritize unused for dad's daily view to avoid repetition
      };
      const data = await fetchBankItems(filters);
      setItems(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Could not load content bank. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFromBankItem = (item: BankItem) => {
    // For v1, send the script + caption into the existing wizard as a pre-filled plan.
    navigate('/wizard', {
      state: {
        trendIdea: {
          hook_script: item.script,
          suggested_caption: item.caption,
        },
      },
    });
  };

  const handleEdit = (item: BankItem) => {
    setEditingItem(item);
    setEditForm({
      title: item.title,
      script: item.script,
      caption: item.caption,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;

    try {
      setProcessingItemId(editingItem.id);
      await updateBankItem(editingItem.id, {
        title: editForm.title,
        script: editForm.script,
        caption: editForm.caption,
      });
      toast({
        title: 'Saved!',
        description: 'Content updated successfully.',
      });
      setEditingItem(null);
      loadItems();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.detail || 'Failed to update content.',
        variant: 'destructive',
      });
    } finally {
      setProcessingItemId(null);
    }
  };

  const handleStatusChange = async (itemId: number, newStatus: 'approved' | 'archived') => {
    try {
      setProcessingItemId(itemId);
      await updateBankItem(itemId, { status: newStatus });
      toast({
        title: 'Status updated',
        description: `Item marked as ${newStatus}.`,
      });
      loadItems();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to update status.',
        variant: 'destructive',
      });
    } finally {
      setProcessingItemId(null);
    }
  };

  const handleGenerateVoiceover = async (item: BankItem) => {
    try {
      setProcessingItemId(item.id);
      await generateVoiceover(item.id);
      toast({
        title: 'Voiceover generated!',
        description: 'Voiceover audio is ready.',
      });
      loadItems();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.detail || 'Failed to generate voiceover.',
        variant: 'destructive',
      });
    } finally {
      setProcessingItemId(null);
    }
  };

  const handleRenderVideo = async (item: BankItem) => {
    try {
      setProcessingItemId(item.id);
      const result = await renderFromBank(item.id, 'video');
      if (result.video_url) {
        toast({
          title: 'Video rendered!',
          description: 'Your video is ready to download.',
        });
        loadItems();
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.detail || 'Failed to render video.',
        variant: 'destructive',
      });
    } finally {
      setProcessingItemId(null);
    }
  };

  const handleBatchGenerate = async () => {
    if (!batchForm.topic_theme.trim()) {
      toast({
        title: "Topic required",
        description: "Please enter a topic or theme.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsGeneratingBatch(true);
      await generateBatchContent({
        topic_theme: batchForm.topic_theme,
        content_pillars: [batchForm.content_pillar],
        count: parseInt(batchForm.count),
      });

      toast({
        title: "Generation started",
        description: `Generating ${batchForm.count} new ideas. This may take a moment.`,
      });

      setShowBatchModal(false);
      setBatchForm({ topic_theme: '', count: '5', content_pillar: 'education' });

      // Since it's synchronous in backend currently, we can reload to see drafts
      // If it were async, we'd poll or wait.
      loadItems();

      if (!isAdminMode) {
        toast({
          title: "Switch to Admin Mode",
          description: "New items are created as 'Drafts'. Switch to Admin Mode to review and approve them.",
        });
      }
    } catch (err: any) {
      toast({
        title: "Generation failed",
        description: err.response?.data?.detail || "Could not generate batch.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingBatch(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
          <p className="text-fg-subtle text-lg">Loading your content bank...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <Card className="border-border-error bg-bg-error-subtle">
          <CardContent className="py-6">
            <p className="text-fg-error text-lg font-medium">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-fg-headings flex items-center gap-2">
              Content Bank
              <span className="text-sm font-normal text-fg-subtle bg-bg-secondary px-2 py-1 rounded-full">
                {items.length} items
              </span>
            </h1>
            <p className="text-fg-subtle text-base mt-2">
              {isAdminMode
                ? 'Review drafts, approve scripts, and manage your library.'
                : 'Pick a ready-made script to start filming instantly.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAdminMode(!isAdminMode)}
              className="gap-2"
            >
              <Settings className="w-4 h-4" />
              {isAdminMode ? 'User Mode' : 'Admin Mode'}
            </Button>
            {isAdminMode && (
              <Button onClick={() => setShowBatchModal(true)} className="gap-2">
                <Sparkles className="w-4 h-4" />
                Generate Ideas
              </Button>
            )}
          </div>
        </div>

        {/* User Instructions */}
        <Card className="bg-bg-subtle border-none">
          <CardContent className="flex items-start gap-3 py-4">
            <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1 text-sm text-fg-body">
              <p className="font-medium text-fg-headings">How to use the Content Bank:</p>
              <ul className="list-disc list-inside space-y-0.5 ml-1">
                {isAdminMode ? (
                  <>
                    <li>Use <strong>Generate Ideas</strong> to bulk-create scripts based on a theme.</li>
                    <li>Review <strong>Drafts</strong>, edit them if needed, and hit <strong>Approve</strong>.</li>
                    <li>Only <strong>Approved</strong> items show up for the daily user view.</li>
                  </>
                ) : (
                  <>
                    <li>These scripts are pre-approved and ready for you.</li>
                    <li>Click <strong>Use This Script</strong> to load it into the creator workspace.</li>
                  </>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {items.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader className="text-center py-12">
            <div className="mx-auto w-12 h-12 bg-bg-secondary rounded-full flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-xl">
              {isAdminMode ? 'Bank is empty' : 'No approved scripts yet'}
            </CardTitle>
            <CardDescription className="max-w-md mx-auto mt-2">
              {isAdminMode
                ? 'Get started by generating a batch of ideas based on trending topics or your pillars.'
                : 'Ask your admin (or switch to Admin Mode) to generate and approve some scripts for you!'}
            </CardDescription>
            {isAdminMode && (
              <Button onClick={() => setShowBatchModal(true)} className="mt-6 mx-auto">
                Generate First Batch
              </Button>
            )}
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => {
            const isProcessing = processingItemId === item.id;
            const isEditing = editingItem?.id === item.id;

            return (
              <Card key={item.id} className="border-border-default overflow-hidden">
                <CardHeader className="bg-bg-subtle/50 py-3 px-4 flex flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${item.status === 'approved' ? 'bg-green-500' :
                      item.status === 'draft' ? 'bg-orange-400' : 'bg-gray-400'
                      }`} />
                    <span className="text-sm font-medium text-fg-subtle uppercase tracking-wider">
                      {item.content_pillar}
                    </span>
                  </div>
                  {isAdminMode && (
                    <div className="flex gap-2">
                      {item.status === 'draft' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => handleStatusChange(item.id, 'approved')}
                          disabled={isProcessing}
                        >
                          <CheckCircle className="w-4 h-4 mr-1.5" />
                          Approve
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8"
                        onClick={() => handleEdit(item)}
                        disabled={isProcessing}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </CardHeader>

                <CardContent className="p-4 space-y-4">
                  {isEditing ? (
                    <div className="space-y-4">
                      <Input
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        placeholder="Hook/Title"
                        className="font-bold"
                      />
                      <Textarea
                        value={editForm.script}
                        onChange={(e) => setEditForm({ ...editForm, script: e.target.value })}
                        placeholder="Script..."
                        className="min-h-[100px]"
                      />
                      <Textarea
                        value={editForm.caption}
                        onChange={(e) => setEditForm({ ...editForm, caption: e.target.value })}
                        placeholder="Caption..."
                      />
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setEditingItem(null)}>Cancel</Button>
                        <Button onClick={handleSaveEdit}>Save Changes</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <h3 className="text-lg font-bold text-fg-headings mb-1 leading-tight">{item.title}</h3>
                        <p className="text-sm text-fg-subtle">{item.tone} • ~{item.length_seconds}s</p>
                      </div>

                      <div className="bg-bg-subtle rounded-md p-3 text-sm text-fg-body whitespace-pre-wrap">
                        {item.script}
                      </div>

                      {!isAdminMode && (
                        <Button
                          className="w-full gap-2"
                          size="lg"
                          onClick={() => handleCreateFromBankItem(item)}
                        >
                          <PlayCircle className="w-5 h-5" />
                          Use This Script
                        </Button>
                      )}

                      {isAdminMode && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-border-default">
                          {item.status === 'approved' && !item.voiceover_url && (
                            <Button size="sm" variant="outline" onClick={() => handleGenerateVoiceover(item)} disabled={isProcessing}>
                              <Volume2 className="w-4 h-4 mr-2" />
                              Gen VO
                            </Button>
                          )}
                          {item.status === 'approved' && (
                            <Button size="sm" variant="outline" onClick={() => handleRenderVideo(item)} disabled={isProcessing}>
                              <Video className="w-4 h-4 mr-2" />
                              Render
                            </Button>
                          )}
                          {item.rendered_video_url && (
                            <Button size="sm" variant="outline" onClick={() => window.open(item.rendered_video_url!, '_blank')}>
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="ml-auto text-fg-subtle hover:text-fg-error"
                            onClick={() => handleStatusChange(item.id, 'archived')}
                          >
                            <Archive className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Batch Generation Modal */}
      <Dialog open={showBatchModal} onOpenChange={setShowBatchModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Content Ideas</DialogTitle>
            <DialogDescription>
              We'll use AI to brainstorm scripts based on a theme. These will be saved as drafts for you to review.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="theme">Topic / Theme</Label>
              <Input
                id="theme"
                placeholder="e.g., Afternoon Energy Slump, Healthy Breakfasts..."
                value={batchForm.topic_theme}
                onChange={(e) => setBatchForm({ ...batchForm, topic_theme: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Pillar</Label>
                <Select
                  value={batchForm.content_pillar}
                  onValueChange={(val) => setBatchForm({ ...batchForm, content_pillar: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="routine">Routine</SelectItem>
                    <SelectItem value="story">Story</SelectItem>
                    <SelectItem value="product_integration">Product</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Count</Label>
                <Select
                  value={batchForm.count}
                  onValueChange={(val) => setBatchForm({ ...batchForm, count: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 Ideas</SelectItem>
                    <SelectItem value="5">5 Ideas</SelectItem>
                    <SelectItem value="10">10 Ideas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBatchModal(false)}>Cancel</Button>
            <Button onClick={handleBatchGenerate} disabled={isGeneratingBatch} className="gap-2">
              {isGeneratingBatch ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mt-8">
        <ComplianceQuickRef />
      </div>
    </div>
  );
};
