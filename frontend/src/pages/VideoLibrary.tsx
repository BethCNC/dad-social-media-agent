import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Trash2, Video, Loader2, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { listUserVideos, uploadVideo, deleteUserVideo, type UserVideo } from '@/lib/assetsApi';
import { cn } from '@/lib/utils';
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

export const VideoLibrary = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<UserVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTags, setUploadTags] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [videoToDelete, setVideoToDelete] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      setIsLoading(true);
      const videoList = await listUserVideos();
      setVideos(videoList);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load videos');
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

      // Reload videos
      await loadVideos();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload video');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = (videoId: number) => {
    setVideoToDelete(videoId);
  };

  const confirmDelete = async () => {
    if (!videoToDelete) return;

    try {
      await deleteUserVideo(videoToDelete);
      await loadVideos();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete video');
    } finally {
      setVideoToDelete(null);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown';
    return `${seconds}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Video Library</h1>
          <p className="text-muted-foreground mt-2">
            Upload your own B-roll and background footage to use in your posts
          </p>
        </div>
        <Button
          onClick={() => setShowUploadModal(true)}
          size="lg"
          className="gap-2"
        >
          <Upload className="w-5 h-5" />
          Upload Video
        </Button>
      </div>

      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="py-4">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : videos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Video className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No videos uploaded yet</h3>
            <p className="text-muted-foreground mb-6">
              Upload your first video to get started
            </p>
            <Button onClick={() => setShowUploadModal(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Video
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((video) => (
            <Card key={video.id} className="overflow-hidden">
              <div className="aspect-video bg-muted relative">
                {video.thumbnail_url ? (
                  <img
                    src={video.thumbnail_url}
                    alt={video.original_filename}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-black/75 text-white px-2 py-1 rounded text-sm">
                  {formatDuration(video.duration_seconds)}
                </div>
              </div>
              <CardHeader>
                <CardTitle className="text-lg truncate">{video.original_filename}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {video.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {video.description}
                  </p>
                )}
                {video.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {video.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-muted px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                  <span>Used {video.use_count} times</span>
                  <span>{formatDate(video.created_at)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      // Navigate to wizard with this video pre-selected
                      // We need to map UserVideo to AssetResult-like structure if needed, 
                      // but passing the whole object is fine for now
                      navigate('/wizard', {
                        state: {
                          preselectedVideo: video
                        }
                      });
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Post
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={() => handleDelete(parseInt(video.id))}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Upload Video</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadFile(null);
                    setUploadTags('');
                    setUploadDescription('');
                    setError(null);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
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
                {uploadFile && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Selected: {uploadFile.name}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={uploadTags}
                  onChange={(e) => setUploadTags(e.target.value)}
                  placeholder="e.g., nature, wellness, morning"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Describe this video..."
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleUpload}
                  disabled={!uploadFile || isUploading}
                  className="flex-1"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadFile(null);
                    setUploadTags('');
                    setUploadDescription('');
                    setError(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <AlertDialog open={!!videoToDelete} onOpenChange={(open) => !open && setVideoToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the video from your library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

