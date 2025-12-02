import { useState } from 'react';
import { type WeeklyPost } from '../../lib/weeklyApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { X, RefreshCw, Edit, Image as ImageIcon, Video, Calendar, Loader2 } from 'lucide-react';
import { updatePost, regeneratePostText } from '../../lib/weeklyApi';
import { format, parseISO } from 'date-fns';

interface PostEditorProps {
  post: WeeklyPost;
  onClose: () => void;
  onUpdate: (post: WeeklyPost) => void;
  onRender?: (post: WeeklyPost) => void;
  onSchedule?: (post: WeeklyPost) => void;
  onChangeMedia?: (post: WeeklyPost) => void;
}

const PILLAR_LABELS: Record<string, string> = {
  education: 'Education',
  routine: 'Routine',
  story: 'Story',
  product_integration: 'Product Integration',
};

export const PostEditor = ({
  post,
  onClose,
  onUpdate,
  onRender,
  onSchedule,
  onChangeMedia,
}: PostEditorProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [editedPost, setEditedPost] = useState<WeeklyPost>(post);
  const [error, setError] = useState<string | null>(null);

  const date = parseISO(post.post_date);
  const formattedDate = format(date, 'EEEE, MMMM d, yyyy');

  const handleSave = async () => {
    try {
      setError(null);
      if (!post.id) {
        setError('Post ID is missing');
        return;
      }
      const updated = await updatePost(post.id, editedPost);
      onUpdate(updated);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update post');
    }
  };

  const handleRegenerateText = async () => {
    try {
      setError(null);
      setIsRegenerating(true);
      if (!post.id) {
        setError('Post ID is missing');
        return;
      }
      const regenerated = await regeneratePostText(post.id);
      setEditedPost(regenerated);
      onUpdate(regenerated);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to regenerate text');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleManualEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditedPost(post);
    setIsEditing(false);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 sticky top-0 bg-white z-10 border-b">
          <div>
            <CardTitle>{editedPost.topic}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{formattedDate}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
              {error}
            </div>
          )}

          {/* Metadata */}
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
              {PILLAR_LABELS[editedPost.content_pillar] || editedPost.content_pillar}
            </span>
            {editedPost.series_name && (
              <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">
                {editedPost.series_name}
              </span>
            )}
            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded flex items-center gap-1">
              {editedPost.template_type === 'image' ? (
                <ImageIcon className="h-3 w-3" />
              ) : (
                <Video className="h-3 w-3" />
              )}
              {editedPost.template_type}
            </span>
            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
              {editedPost.status}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
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
              onClick={handleManualEdit}
              disabled={isEditing}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Manually
            </Button>
            {onChangeMedia && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onChangeMedia(editedPost)}
              >
                <ImageIcon className="mr-2 h-4 w-4" />
                Change Media
              </Button>
            )}
            {onRender && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRender(editedPost)}
                disabled={!editedPost.script || editedPost.shot_plan.length === 0}
              >
                <Video className="mr-2 h-4 w-4" />
                Render {editedPost.template_type === 'image' ? 'Image' : 'Video'}
              </Button>
            )}
            {onSchedule && editedPost.media_url && (
              <Button
                variant="default"
                size="sm"
                onClick={() => onSchedule(editedPost)}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Post
              </Button>
            )}
          </div>

          {/* Hook */}
          <div>
            <Label htmlFor="hook">Hook (First 1-3 seconds)</Label>
            {isEditing ? (
              <Textarea
                id="hook"
                value={editedPost.hook}
                onChange={(e) => setEditedPost({ ...editedPost, hook: e.target.value })}
                className="mt-1"
                rows={2}
              />
            ) : (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md mt-1">
                <p className="text-sm font-medium">{editedPost.hook}</p>
              </div>
            )}
          </div>

          {/* Script */}
          <div>
            <Label htmlFor="script">Script</Label>
            {isEditing ? (
              <Textarea
                id="script"
                value={editedPost.script}
                onChange={(e) => setEditedPost({ ...editedPost, script: e.target.value })}
                className="mt-1"
                rows={6}
              />
            ) : (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md mt-1">
                <p className="text-sm whitespace-pre-wrap">{editedPost.script}</p>
              </div>
            )}
          </div>

          {/* Caption */}
          <div>
            <Label htmlFor="caption">Caption</Label>
            {isEditing ? (
              <Textarea
                id="caption"
                value={editedPost.caption}
                onChange={(e) => setEditedPost({ ...editedPost, caption: e.target.value })}
                className="mt-1"
                rows={8}
              />
            ) : (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md mt-1">
                <p className="text-sm whitespace-pre-wrap">{editedPost.caption}</p>
              </div>
            )}
          </div>

          {/* Shot Plan */}
          <div>
            <Label>Shot Plan</Label>
            <div className="mt-1 space-y-2">
              {editedPost.shot_plan.map((shot, index) => (
                <div key={index} className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                  <div className="flex justify-between items-start">
                    <p className="text-sm">{shot.description}</p>
                    <span className="text-xs text-gray-500 ml-2">{shot.duration_seconds}s</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Suggested Keywords */}
          {editedPost.suggested_keywords.length > 0 && (
            <div>
              <Label>Suggested Keywords (for SEO/On-screen text)</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {editedPost.suggested_keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded border border-blue-200"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Media URL (if rendered) */}
          {editedPost.media_url && (
            <div>
              <Label>Rendered Media</Label>
              <div className="mt-1">
                {editedPost.template_type === 'image' ? (
                  <img
                    src={editedPost.media_url}
                    alt="Rendered image"
                    className="max-w-full h-auto rounded-lg border"
                  />
                ) : (
                  <video
                    src={editedPost.media_url}
                    controls
                    className="max-w-full rounded-lg border"
                  >
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
            </div>
          )}

          {/* Edit Mode Actions */}
          {isEditing && (
            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={handleSave}>Save Changes</Button>
              <Button variant="outline" onClick={handleCancelEdit}>
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

