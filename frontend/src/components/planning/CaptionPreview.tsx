import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit2, Save, X } from 'lucide-react';

interface CaptionPreviewProps {
  caption: string;
  onCaptionChange: (caption: string) => void;
}

export const CaptionPreview = ({ caption, onCaptionChange }: CaptionPreviewProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedCaption, setEditedCaption] = useState(caption);

  const handleSave = () => {
    onCaptionChange(editedCaption);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedCaption(caption);
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Caption</CardTitle>
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              aria-label="Edit caption"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <Textarea
              value={editedCaption}
              onChange={(e) => setEditedCaption(e.target.value)}
              rows={8}
              className="text-base min-h-[150px]"
              aria-label="Edit caption"
            />
            <div className="flex gap-3">
              <Button
                onClick={handleSave}
                aria-label="Save caption changes"
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                aria-label="Cancel editing"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-base text-foreground whitespace-pre-wrap leading-relaxed">
              {caption}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
