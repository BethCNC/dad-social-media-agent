import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  RefreshCw, 
  Edit, 
  Image as ImageIcon, 
  Video, 
  Calendar,
  Loader2,
  Search,
  Check
} from 'lucide-react';
import { 
  getPostById, 
  updatePost, 
  regeneratePostText, 
  type WeeklyPost 
} from '@/lib/weeklyApi';
import { searchAssets, searchAssetsContextual, type AssetResult } from '@/lib/assetsApi';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

const PILLAR_LABELS: Record<string, string> = {
  education: 'Education',
  routine: 'Routine',
  story: 'Story',
  product_integration: 'Product Integration',
};

export const PostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<WeeklyPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSearchingAlternatives, setIsSearchingAlternatives] = useState(false);
  const [editedPost, setEditedPost] = useState<WeeklyPost | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [alternativeMedia, setAlternativeMedia] = useState<AssetResult[]>([]);
  const [selectedAlternativeId, setSelectedAlternativeId] = useState<string | null>(null);
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  useEffect(() => {
    const loadPost = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const postData = await getPostById(parseInt(id));
        setPost(postData);
        setEditedPost(postData);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load post');
      } finally {
        setIsLoading(false);
      }
    };
    loadPost();
  }, [id]);

  useEffect(() => {
    // Auto-load alternative media when post loads
    if (post && post.shot_plan.length > 0) {
      loadAlternativeMedia();
    }
  }, [post]);

  const loadAlternativeMedia = async () => {
    if (!post) return;
    try {
      setIsSearchingAlternatives(true);
      
      // Use contextual search for better relevance
      const results = await searchAssetsContextual({
        topic: post.topic,
        hook: post.hook,
        script: post.script,
        shot_plan: post.shot_plan,
        content_pillar: post.content_pillar,
        suggested_keywords: post.suggested_keywords || [],
        max_results: 12,
      });
      
      setAlternativeMedia(results);
    } catch (err: any) {
      console.error('Failed to load alternative media:', err);
      // Fallback to simple search
      try {
        const keywords = post.shot_plan.length > 0
          ? post.shot_plan[0].description
          : post.topic;
        if (keywords.trim()) {
          const fallbackResults = await searchAssets(keywords, 12);
          setAlternativeMedia(fallbackResults);
        }
      } catch (fallbackErr) {
        setError('Failed to load alternative media options');
      }
    } finally {
      setIsSearchingAlternatives(false);
    }
  };

  const handleSave = async () => {
    if (!post?.id || !editedPost) return;
    try {
      setError(null);
      const updated = await updatePost(post.id, editedPost);
      setPost(updated);
      setEditedPost(updated);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update post');
    }
  };

  const handleRegenerateText = async () => {
    if (!post?.id) return;
    try {
      setError(null);
      setIsRegenerating(true);
      const regenerated = await regeneratePostText(post.id);
      setPost(regenerated);
      setEditedPost(regenerated);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to regenerate text');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSelectAlternative = (asset: AssetResult) => {
    setSelectedAlternativeId(asset.id);
    // TODO: Update post with new media selection
    // This would require updating the shot_plan or media_url
  };

  const handleFindMoreOptions = async () => {
    setShowMoreOptions(true);
    await loadAlternativeMedia();
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!post || !editedPost) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600">Post not found</p>
            <Button onClick={() => navigate('/')} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const date = parseISO(post.post_date);
  const formattedDate = format(date, 'EEEE, MMMM d, yyyy');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerateText}
            disabled={isRegenerating}
          >
            {isRegenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Regenerating...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Regenerate Text
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Edit className="mr-2 h-4 w-4" />
            {isEditing ? 'Cancel Edit' : 'Edit'}
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Visual Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Visual Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Media */}
            {post.media_url ? (
              <div className="space-y-2">
                <Label>Current {post.template_type === 'image' ? 'Image' : 'Video'}</Label>
                {post.template_type === 'image' ? (
                  <img
                    src={post.media_url}
                    alt="Rendered image"
                    className="w-full rounded-lg border aspect-[9/16] object-cover"
                  />
                ) : (
                  <video
                    src={post.media_url}
                    controls
                    className="w-full rounded-lg border aspect-[9/16]"
                  >
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center min-h-[400px] border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                <div className="text-center">
                  <Video className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">No media rendered yet</p>
                </div>
              </div>
            )}

            {/* Copy Preview */}
            <div className="space-y-3 pt-4 border-t">
              <div>
                <Label className="text-xs text-gray-500">Hook</Label>
                <p className="text-sm font-medium mt-1">{post.hook}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Script</Label>
                <p className="text-sm whitespace-pre-wrap mt-1">{post.script}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Caption</Label>
                <p className="text-sm whitespace-pre-wrap mt-1">{post.caption}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Details & Alternatives */}
        <div className="space-y-6">
          {/* Post Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>{post.topic}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{formattedDate}</p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                  {PILLAR_LABELS[post.content_pillar] || post.content_pillar}
                </span>
                {post.series_name && (
                  <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">
                    {post.series_name}
                  </span>
                )}
                <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded flex items-center gap-1">
                  {post.template_type === 'image' ? (
                    <ImageIcon className="h-3 w-3" />
                  ) : (
                    <Video className="h-3 w-3" />
                  )}
                  {post.template_type}
                </span>
                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                  {post.status}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Change Media Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Change Media</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFindMoreOptions}
                  disabled={isSearchingAlternatives}
                >
                  {isSearchingAlternatives ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="mr-2 h-4 w-4" />
                  )}
                  Find More Options
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isSearchingAlternatives && alternativeMedia.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : alternativeMedia.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500 mb-4">
                    No alternative media found. Try searching with different keywords.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleFindMoreOptions}
                  >
                    <Search className="mr-2 h-4 w-4" />
                    Search for Options
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Select an alternative video/image option:
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                    {(showMoreOptions ? alternativeMedia : alternativeMedia.slice(0, 3)).map((asset) => (
                      <div
                        key={asset.id}
                        className={cn(
                          "relative cursor-pointer rounded-lg border-2 overflow-hidden transition-all",
                          selectedAlternativeId === asset.id
                            ? "border-primary ring-2 ring-primary"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                        onClick={() => handleSelectAlternative(asset)}
                      >
                        <div className="aspect-[9/16] bg-gray-100 relative">
                          <img
                            src={asset.thumbnail_url}
                            alt="Video thumbnail"
                            className="w-full h-full object-cover"
                          />
                          {selectedAlternativeId === asset.id && (
                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                              <div className="bg-primary text-white rounded-full p-2">
                                <Check className="h-4 w-4" />
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="p-2 bg-white">
                          <p className="text-xs text-gray-500 truncate">
                            {asset.duration_seconds}s
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {!showMoreOptions && alternativeMedia.length > 3 && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleFindMoreOptions}
                    >
                      View {alternativeMedia.length - 3} More Options
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Editable Fields */}
          {isEditing && (
            <Card>
              <CardHeader>
                <CardTitle>Edit Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="hook">Hook</Label>
                  <Textarea
                    id="hook"
                    value={editedPost.hook}
                    onChange={(e) => setEditedPost({ ...editedPost, hook: e.target.value })}
                    className="mt-1"
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="script">Script</Label>
                  <Textarea
                    id="script"
                    value={editedPost.script}
                    onChange={(e) => setEditedPost({ ...editedPost, script: e.target.value })}
                    className="mt-1"
                    rows={6}
                  />
                </div>
                <div>
                  <Label htmlFor="caption">Caption</Label>
                  <Textarea
                    id="caption"
                    value={editedPost.caption}
                    onChange={(e) => setEditedPost({ ...editedPost, caption: e.target.value })}
                    className="mt-1"
                    rows={8}
                  />
                </div>
                <div className="flex gap-2 pt-4 border-t">
                  <Button onClick={handleSave}>Save Changes</Button>
                  <Button variant="outline" onClick={() => {
                    setEditedPost(post);
                    setIsEditing(false);
                  }}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

