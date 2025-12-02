import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchBankItems,
  updateBankItem,
  generateVoiceover,
  renderFromBank,
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
} from 'lucide-react';
import { ComplianceQuickRef } from '@/components/compliance/ComplianceQuickRef';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

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

  useEffect(() => {
    const load = async () => {
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

    void load();
  }, [isAdminMode]);

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
      // Reload items
      const filters: any = {
        status: isAdminMode ? undefined : 'approved',
        limit: 20,
        prioritize_unused: !isAdminMode,
      };
      const data = await fetchBankItems(filters);
      setItems(data);
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
      // Reload items
      const filters: any = {
        status: isAdminMode ? undefined : 'approved',
        limit: 20,
        prioritize_unused: !isAdminMode,
      };
      const data = await fetchBankItems(filters);
      setItems(data);
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
      // Reload items
      const filters: any = {
        status: isAdminMode ? undefined : 'approved',
        limit: 20,
        prioritize_unused: !isAdminMode,
      };
      const data = await fetchBankItems(filters);
      setItems(data);
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
        // Reload items
        const filters: any = {
          status: isAdminMode ? undefined : 'approved',
          limit: 20,
          prioritize_unused: !isAdminMode,
        };
        const data = await fetchBankItems(filters);
        setItems(data);
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
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-fg-headings">Content Bank</h1>
          <p className="text-fg-subtle text-base">
            {isAdminMode
              ? 'Review, edit, and manage all content bank items.'
              : 'Pick a ready-made script and caption, then we\'ll walk you through creating the video.'}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAdminMode(!isAdminMode)}
          className="gap-2"
        >
          <Settings className="w-4 h-4" />
          {isAdminMode ? 'User Mode' : 'Admin Mode'}
        </Button>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              {isAdminMode ? 'No content items found' : 'No approved scripts yet'}
            </CardTitle>
            <CardDescription>
              {isAdminMode
                ? 'Try adjusting your filters or generate new content.'
                : 'Once you add or approve scripts in the bank, they\'ll show up here for easy daily posting.'}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const isProcessing = processingItemId === item.id;
            const isEditing = editingItem?.id === item.id;

            return (
              <Card key={item.id} className="border-border-default">
                <CardHeader className="space-y-1">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {isEditing ? (
                        <Input
                          value={editForm.title}
                          onChange={(e) =>
                            setEditForm({ ...editForm, title: e.target.value })
                          }
                          className="text-xl font-bold mb-2"
                          placeholder="Title/Hook"
                        />
                      ) : (
                        <CardTitle className="text-xl">{item.title}</CardTitle>
                      )}
                      <CardDescription className="text-sm text-fg-subtle mt-1">
                        {item.content_pillar} • {item.tone}
                        {item.length_seconds ? ` • ~${item.length_seconds}s` : ''}
                        {item.topic_cluster && ` • ${item.topic_cluster}`}
                        {item.series_name && ` • Series: ${item.series_name}`}
                      </CardDescription>
                    </div>
                    {isAdminMode && (
                      <div className="flex gap-2 ml-4">
                        {item.status === 'draft' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(item.id, 'approved')}
                            disabled={isProcessing}
                            className="gap-1"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </Button>
                        )}
                        {item.status === 'approved' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(item.id, 'archived')}
                            disabled={isProcessing}
                            className="gap-1"
                          >
                            <Archive className="w-4 h-4" />
                            Archive
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(item)}
                          disabled={isProcessing}
                          className="gap-1"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-fg-headings mb-1">Script</p>
                    {isEditing ? (
                      <Textarea
                        value={editForm.script}
                        onChange={(e) =>
                          setEditForm({ ...editForm, script: e.target.value })
                        }
                        className="min-h-[100px] text-sm"
                        placeholder="Script text..."
                      />
                    ) : (
                      <p className="text-sm text-fg-body whitespace-pre-wrap line-clamp-4">
                        {item.script}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-fg-headings mb-1">Caption</p>
                    {isEditing ? (
                      <Textarea
                        value={editForm.caption}
                        onChange={(e) =>
                          setEditForm({ ...editForm, caption: e.target.value })
                        }
                        className="min-h-[80px] text-sm"
                        placeholder="Caption text..."
                      />
                    ) : (
                      <p className="text-sm text-fg-body whitespace-pre-wrap line-clamp-3">
                        {item.caption}
                      </p>
                    )}
                  </div>

                  {isAdminMode && (
                    <div className="pt-2 border-t border-border-default space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-xs text-fg-subtle">
                        <div>
                          Status: <span className="font-semibold">{item.status}</span>
                        </div>
                        <div>
                          Used: <span className="font-semibold">{item.times_used}x</span>
                        </div>
                        {item.voiceover_url && (
                          <div className="col-span-2">
                            VO: <span className="font-mono text-xs">✓ Ready</span>
                          </div>
                        )}
                        {item.rendered_video_url && (
                          <div className="col-span-2">
                            Video: <span className="font-mono text-xs">✓ Rendered</span>
                          </div>
                        )}
                        {item.last_render_status && item.last_render_status !== 'succeeded' && (
                          <div className="col-span-2 text-fg-error">
                            Last render: {item.last_render_status}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {!item.voiceover_url && item.status === 'approved' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleGenerateVoiceover(item)}
                            disabled={isProcessing}
                            className="gap-1"
                          >
                            {isProcessing ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Volume2 className="w-4 h-4" />
                            )}
                            Generate VO
                          </Button>
                        )}
                        {item.status === 'approved' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRenderVideo(item)}
                            disabled={isProcessing}
                            className="gap-1"
                          >
                            {isProcessing ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Video className="w-4 h-4" />
                            )}
                            Render Video
                          </Button>
                        )}
                        {item.rendered_video_url && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              window.open(item.rendered_video_url!, '_blank');
                            }}
                            className="gap-1"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {isEditing && (
                    <div className="flex gap-2 pt-2 border-t border-border-default">
                      <Button size="sm" onClick={handleSaveEdit} disabled={isProcessing}>
                        {isProcessing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Save'
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingItem(null)}
                        disabled={isProcessing}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}

                  {!isAdminMode && !isEditing && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                      <Button
                        size="lg"
                        className="w-full sm:w-auto gap-2"
                        onClick={() => handleCreateFromBankItem(item)}
                      >
                        <PlayCircle className="w-5 h-5" />
                        Use This Script
                      </Button>
                      <p className="text-xs text-fg-subtle text-right sm:text-left">
                        Used {item.times_used} {item.times_used === 1 ? 'time' : 'times'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="mt-6">
        <ComplianceQuickRef />
      </div>
    </div>
  );
};
