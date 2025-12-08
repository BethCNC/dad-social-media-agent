import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Trash2, Video, Loader2, Plus, Sparkles, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  listUserVideos, uploadVideo, deleteUserVideo,
  listUserImages, deleteUserImage, populateAssets,
  type UserVideo, type UserImage
} from '@/lib/assetsApi';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export const VideoLibrary = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'videos' | 'images'>('videos');

  // Data State
  const [videos, setVideos] = useState<UserVideo[]>([]);
  const [images, setImages] = useState<UserImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Upload State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTags, setUploadTags] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');

  // Populate State
  const [showPopulateModal, setShowPopulateModal] = useState(false);
  const [isPopulating, setIsPopulating] = useState(false);
  const [populateForm, setPopulateForm] = useState({
    type: 'video' as 'video' | 'image',
    topic: '',
    count: '5'
  });

  // Delete State
  const [itemToDelete, setItemToDelete] = useState<{ id: number, type: 'video' | 'image' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAssets();
  }, [activeTab]);

  const loadAssets = async () => {
    try {
      setIsLoading(true);
      setError(null);
      if (activeTab === 'videos') {
        const data = await listUserVideos();
        setVideos(data);
      } else {
        const data = await listUserImages();
        setImages(data);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load assets');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        setError('Please select a video file (MP4, MOV, AVI, etc.)');
        return;
      }
      setUploadFile(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      setError('Please select a video file');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      await uploadVideo(
        uploadFile,
        uploadTags || undefined,
        uploadDescription || undefined
      );

      // Reset form
      setUploadFile(null);
      setUploadTags('');
      setUploadDescription('');
      setShowUploadModal(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      toast({
        title: "Success",
        description: "Video uploaded successfully",
      });

      // Reload videos
      if (activeTab === 'videos') await loadAssets();
      else setActiveTab('videos'); // Switch to videos tab

    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload video');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePopulate = async () => {
    if (!populateForm.topic) return;

    try {
      setIsPopulating(true);

      const result = await populateAssets(
        populateForm.type,
        populateForm.topic,
        parseInt(populateForm.count)
      );

      toast({
        title: "Assets Fetched!",
        description: `Successfully added ${result.count} new ${populateForm.type}s to your library.`,
      });

      setShowPopulateModal(false);
      setPopulateForm({ ...populateForm, topic: '' }); // Reset topic

      // key refresh
      if (activeTab === populateForm.type + 's') {
        await loadAssets();
      } else {
        // Should switch tab? Maybe just stay and user switches.
        // Let's reload anyway.
        if (activeTab === 'videos' && populateForm.type === 'video') await listUserVideos().then(setVideos);
        if (activeTab === 'images' && populateForm.type === 'image') await listUserImages().then(setImages);

        // Notify user to switch tabs if needed
        if ((activeTab === 'videos' && populateForm.type === 'image') || (activeTab === 'images' && populateForm.type === 'video')) {
          toast({ title: "Check other tab", description: `Switch to ${populateForm.type}s tab to see new assets.` });
        }
      }

    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.detail || "Failed to fetch assets.",
        variant: "destructive"
      });
    } finally {
      setIsPopulating(false);
    }
  };

  const handleDelete = (id: number, type: 'video' | 'image') => {
    setItemToDelete({ id, type });
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      if (itemToDelete.type === 'video') {
        await deleteUserVideo(itemToDelete.id);
      } else {
        await deleteUserImage(itemToDelete.id);
      }

      toast({ title: "Deleted", description: "Asset removed from library." });
      await loadAssets();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete asset');
    } finally {
      setItemToDelete(null);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    return `${seconds}s`;
  };



  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-fg-headings">Asset Library</h1>
          <p className="text-fg-subtle mt-1 text-base">
            Manage your stock videos and AI generated images.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowPopulateModal(true)}
            size="lg"
            variant="outline"
            className="gap-2"
          >
            <Sparkles className="w-5 h-5 text-purple-500" />
            Fetch Stock/AI
          </Button>
          <Button
            onClick={() => setShowUploadModal(true)}
            size="lg"
            className="gap-2"
          >
            <Upload className="w-5 h-5" />
            Upload Video
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
          <TabsTrigger value="videos" className="gap-2">
            <Video className="w-4 h-4" /> Videos
          </TabsTrigger>
          <TabsTrigger value="images" className="gap-2">
            <ImageIcon className="w-4 h-4" /> Images
          </TabsTrigger>
        </TabsList>

        <TabsContent value="videos" className="mt-0">
          {error && activeTab === 'videos' && (
            <Card className="border-border-error bg-bg-error-subtle mb-6">
              <CardContent className="py-4"><p className="text-fg-error">{error}</p></CardContent>
            </Card>
          )}

          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
          ) : videos.length === 0 ? (
            <div className="text-center py-12 bg-bg-subtle rounded-lg border border-border-default">
              <Video className="w-12 h-12 mx-auto text-fg-subtle mb-4" />
              <h3 className="text-xl font-semibold mb-2">No videos yet</h3>
              <p className="text-fg-subtle mb-6">Fetch stock videos or upload your own.</p>
              <Button onClick={() => setShowPopulateModal(true)} variant="outline">Fetch Stock Videos</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map((video) => (
                <Card key={video.id} className="overflow-hidden group">
                  <div className="aspect-[9/16] bg-black relative">
                    <video
                      src={video.video_url}
                      className="w-full h-full object-cover"
                      controls
                      preload="metadata"
                    />
                    <div className="absolute top-2 right-2 bg-black/75 text-white px-2 py-1 rounded text-xs font-mono">
                      {formatDuration(video.duration_seconds)}
                    </div>
                  </div>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm font-medium truncate" title={video.original_filename}>
                      {video.original_filename}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-3">
                    {/* Tags */}
                    {video.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {video.tags.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="text-[10px] bg-bg-subtle px-1.5 py-0.5 rounded uppercase tracking-wide">
                            {tag.replace('source:', '')}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="default" size="sm" className="w-full text-xs"
                        onClick={() => navigate('/wizard', { state: { preselectedVideo: video } })}
                      >
                        <Plus className="w-3 h-3 mr-1" /> Use
                      </Button>
                      <Button
                        variant="destructive" size="sm" className="w-1/3"
                        onClick={() => handleDelete(parseInt(video.id), 'video')}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="images" className="mt-0">
          {error && activeTab === 'images' && (
            <Card className="border-border-error bg-bg-error-subtle mb-6">
              <CardContent className="py-4"><p className="text-fg-error">{error}</p></CardContent>
            </Card>
          )}

          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
          ) : images.length === 0 ? (
            <div className="text-center py-12 bg-bg-subtle rounded-lg border border-border-default">
              <ImageIcon className="w-12 h-12 mx-auto text-fg-subtle mb-4" />
              <h3 className="text-xl font-semibold mb-2">No images yet</h3>
              <p className="text-fg-subtle mb-6">Generate unique AI images for your brand.</p>
              <Button onClick={() => {
                setPopulateForm(p => ({ ...p, type: 'image' }));
                setShowPopulateModal(true);
              }} variant="outline">Generate Images</Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((img) => (
                <Card key={img.id} className="overflow-hidden group">
                  <div className="aspect-[9/16] bg-bg-subtle relative cursor-pointer" onClick={() => window.open(img.image_url, '_blank')}>
                    <img
                      src={img.thumbnail_url || img.image_url}
                      alt={img.description}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <CardContent className="p-3 space-y-2">
                    <p className="text-xs text-fg-subtle line-clamp-2" title={img.description}>
                      {img.description}
                    </p>
                    <div className="flex gap-2">
                      {/* Future: Use Image in Wizard */}
                      <Button
                        variant="default" size="sm" className="w-full h-8 text-xs"
                        onClick={() => navigate('/wizard', { state: { preselectedImage: img } })}
                      >
                        <Plus className="w-3 h-3 mr-1" /> Use
                      </Button>
                      <Button
                        variant="destructive" size="sm" className="w-1/3 h-8"
                        onClick={() => handleDelete(parseInt(img.id), 'image')}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Upload Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Output Video</DialogTitle>
            <DialogDescription>
              Upload your own B-roll or background footage.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="file">Video File</Label>
              <Input
                id="file"
                type="file"
                accept="video/*"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={uploadTags}
                onChange={(e) => setUploadTags(e.target.value)}
                placeholder="morning, coffee, gym..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadModal(false)}>Cancel</Button>
            <Button onClick={handleUpload} disabled={isUploading || !uploadFile}>
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Populate Modal */}
      <Dialog open={showPopulateModal} onOpenChange={setShowPopulateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fetch Stock & AI Assets</DialogTitle>
            <DialogDescription>
              Automatically gather content so you don't have to search every time.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={populateForm.type}
                  onValueChange={(val: 'video' | 'image') => setPopulateForm({ ...populateForm, type: val })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Stock Videos (Pexels)</SelectItem>
                    <SelectItem value="image">AI Images</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Count</Label>
                <Select
                  value={populateForm.count}
                  onValueChange={(val) => setPopulateForm({ ...populateForm, count: val })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 Assets</SelectItem>
                    <SelectItem value="5">5 Assets</SelectItem>
                    <SelectItem value="10">10 Assets</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Topic / Theme</Label>
              <Input
                placeholder={populateForm.type === 'video' ? "e.g., Peaceful Nature, Healthy Food" : "e.g., Wellness aesthetic, golden hour"}
                value={populateForm.topic}
                onChange={(e) => setPopulateForm({ ...populateForm, topic: e.target.value })}
              />
              <p className="text-xs text-fg-subtle">
                {populateForm.type === 'video'
                  ? "We'll find high-quality vertical videos from Pexels."
                  : "AI will generate unique images based on this prompt."}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPopulateModal(false)}>Cancel</Button>
            <Button onClick={handlePopulate} disabled={isPopulating || !populateForm.topic} className="gap-2">
              {isPopulating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {populateForm.type === 'video' ? 'Fetch Videos' : 'Generate Images'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Asset?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove it from your library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-bg-error text-fg-inverse">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

