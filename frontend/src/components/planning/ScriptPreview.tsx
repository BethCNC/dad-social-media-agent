import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit2, Save, X } from 'lucide-react';

interface ScriptPreviewProps {
  script: string;
  onScriptChange: (script: string) => void;
}

export const ScriptPreview = ({ script, onScriptChange }: ScriptPreviewProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedScript, setEditedScript] = useState(script);

  const handleSave = () => {
    onScriptChange(editedScript);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedScript(script);
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Script</CardTitle>
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              aria-label="Edit script"
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
              value={editedScript}
              onChange={(e) => setEditedScript(e.target.value)}
              rows={12}
              className="text-base min-h-[200px]"
              aria-label="Edit script"
            />
            <div className="flex gap-3">
              <Button
                onClick={handleSave}
                aria-label="Save script changes"
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
              {script}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
