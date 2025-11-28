import { useState, type FormEvent } from 'react';
import { generatePlan, type ContentBrief, type GeneratedPlan } from '../../lib/contentApi';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ContentBriefFormProps {
  onPlanGenerated: (plan: GeneratedPlan, templateType: string) => void;
}

export const ContentBriefForm = ({ onPlanGenerated }: ContentBriefFormProps) => {
  const [idea, setIdea] = useState('');
  const [tone, setTone] = useState('friendly');
  const [platforms, setPlatforms] = useState<string[]>(['TikTok']);
  const [lengthSeconds, setLengthSeconds] = useState<number | null>(null);
  const [templateType, setTemplateType] = useState<string>('video');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toneOptions = [
    'friendly',
    'educational',
    'inspiring',
    'humorous',
    'professional',
    'casual',
  ];

  const platformOptions = ['TikTok', 'Instagram'];

  const handlePlatformToggle = (platform: string) => {
    setPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const brief: ContentBrief = {
        idea,
        platforms,
        tone,
        length_seconds: lengthSeconds || null,
        template_type: templateType,
      };

      const plan = await generatePlan(brief);
      onPlanGenerated(plan, templateType);
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
        'We couldn\'t generate your content plan. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Content Brief</CardTitle>
        <CardDescription>
          Describe your video idea and preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="idea" className="text-base font-semibold">
              What's your video idea?
            </Label>
            <Textarea
              id="idea"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              required
              rows={6}
              className="text-base min-h-[120px]"
              placeholder="Describe what you want your video to be about..."
              aria-describedby="idea-description"
            />
            <p id="idea-description" className="text-sm text-muted-foreground">
              Be as detailed as possible. The AI will use this to create your script and caption.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="templateType" className="text-base font-semibold">
              Content Type
            </Label>
            <Select value={templateType} onValueChange={setTemplateType}>
              <SelectTrigger id="templateType" className="text-base h-11">
                <SelectValue placeholder="Select content type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="image">Image</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Choose whether to create a video or static image post
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tone" className="text-base font-semibold">
              Tone
            </Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger id="tone" className="text-base h-11">
                <SelectValue placeholder="Select a tone" />
              </SelectTrigger>
              <SelectContent>
                {toneOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Platforms
            </Label>
            <div className="space-y-3">
              {platformOptions.map((platform) => (
                <div key={platform} className="flex items-center space-x-3">
                  <Checkbox
                    id={`platform-${platform}`}
                    checked={platforms.includes(platform)}
                    onCheckedChange={() => handlePlatformToggle(platform)}
                    aria-label={`Select ${platform}`}
                  />
                  <Label
                    htmlFor={`platform-${platform}`}
                    className="text-base font-normal cursor-pointer"
                  >
                    {platform}
                  </Label>
                </div>
              ))}
            </div>
            {platforms.length === 0 && (
              <p className="text-sm text-destructive">
                Please select at least one platform
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="length" className="text-base font-semibold">
              Video Length (seconds) - Optional
            </Label>
            <Input
              id="length"
              type="number"
              min="15"
              max="60"
              value={lengthSeconds || ''}
              onChange={(e) =>
                setLengthSeconds(e.target.value ? parseInt(e.target.value) : null)
              }
              className="text-base h-11"
              placeholder="e.g., 30"
              aria-describedby="length-description"
            />
            <p id="length-description" className="text-sm text-muted-foreground">
              Recommended: 15-60 seconds for short-form content
            </p>
          </div>

          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg" role="alert">
              <p className="text-destructive text-base font-medium">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading || !idea.trim() || platforms.length === 0}
            size="lg"
            className="w-full text-base font-semibold"
            aria-label="Generate content plan"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                Generating...
              </>
            ) : (
              'Generate Content Plan'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
