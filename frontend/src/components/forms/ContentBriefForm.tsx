import { useState, useEffect, type FormEvent } from 'react';
import { generatePlan, type ContentBrief, type GeneratedPlan } from '../../lib/contentApi';
import { getUpcomingHolidays, type Holiday } from '../../lib/holidaysApi';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ContentBriefFormProps {
  onPlanGenerated: (plan: GeneratedPlan, templateType?: 'image' | 'video') => void;
  initialTopic?: string;
  onGeneratingChange?: (isGenerating: boolean) => void;
  formId?: string;
}

export const ContentBriefForm = ({ onPlanGenerated, initialTopic, onGeneratingChange, formId }: ContentBriefFormProps) => {
  const [mode, setMode] = useState<'manual' | 'auto'>('manual');
  const [userTopic, setUserTopic] = useState(initialTopic || '');
  const [useHolidays, setUseHolidays] = useState(false);
  const [selectedHolidayId, setSelectedHolidayId] = useState<string | null>(null);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoadingHolidays, setIsLoadingHolidays] = useState(false);
  const [tone, setTone] = useState('friendly');
  const [platforms, setPlatforms] = useState<string[]>(['TikTok']);
  const [lengthSeconds, setLengthSeconds] = useState<number | null>(null);
  const [templateType, setTemplateType] = useState<'image' | 'video'>('video');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const toneOptions = [
    'friendly',
    'educational',
    'inspiring',
    'humorous',
    'professional',
    'casual',
  ];

  const platformOptions = ['TikTok', 'Instagram'];

  // Update topic if initialTopic changes
  useEffect(() => {
    if (initialTopic) {
      setUserTopic(initialTopic);
      setMode('manual'); // Switch to manual mode when topic is pre-filled
    }
  }, [initialTopic]);

  // Fetch holidays when auto mode is selected
  useEffect(() => {
    if (mode === 'auto') {
      setIsLoadingHolidays(true);
      getUpcomingHolidays(14)
        .then((data) => {
          // Filter to marketing-relevant holidays only
          const marketingRelevant = data.filter((h) => h.is_marketing_relevant);
          setHolidays(marketingRelevant);
        })
        .catch((err) => {
          console.error('Failed to fetch holidays:', err);
          setHolidays([]);
        })
        .finally(() => {
          setIsLoadingHolidays(false);
        });
    } else {
      setHolidays([]);
      setUseHolidays(false);
      setSelectedHolidayId(null);
    }
  }, [mode]);

  const handlePlatformToggle = (platform: string) => {
    setPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const formatHolidayDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (mode === 'manual' && !userTopic.trim()) {
      setError(`Please describe what you want your ${templateType === 'image' ? 'image post' : 'video'} to be about.`);
      return;
    }

    if (platforms.length === 0) {
      setError('Please select at least one platform.');
      return;
    }

    setIsLoading(true);
    onGeneratingChange?.(true);

    try {
      const brief: ContentBrief = {
        mode,
        user_topic: mode === 'manual' ? userTopic : null,
        use_holidays: mode === 'auto' ? useHolidays : false,
        selected_holiday_id: mode === 'auto' && useHolidays ? selectedHolidayId : null,
        // Legacy field for backward compatibility
        idea: mode === 'manual' ? userTopic : null,
        platforms,
        tone,
        length_seconds: lengthSeconds || null,
        template_type: templateType,
      };

      const plan = await generatePlan(brief, imageFile || undefined);
      onPlanGenerated(plan, templateType);
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
        'The helper got stuck. Please try again.'
      );
    } finally {
      setIsLoading(false);
      onGeneratingChange?.(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">What do you want to talk about?</CardTitle>
        <CardDescription className="text-lg">
          We'll help you write the words for your {templateType === 'image' ? 'image post' : 'video'}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id={formId} onSubmit={handleSubmit} className="space-y-8">
          {/* Template Type Selection - FIRST */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">
              What type of content do you want to create?
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setTemplateType('image')}
                className={cn(
                  'p-6 border-2 rounded-lg text-left transition-all',
                  templateType === 'image'
                    ? 'border-border-primary bg-bg-action/5'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <div className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <span>📸</span> Image Post
                </div>
                <div className="text-sm text-fg-subtle">
                  Create an animated image post with movement effects and text overlay. Perfect for quotes, tips, or announcements.
                </div>
              </button>
              <button
                type="button"
                onClick={() => setTemplateType('video')}
                className={cn(
                  'p-6 border-2 rounded-lg text-left transition-all',
                  templateType === 'video'
                    ? 'border-border-primary bg-bg-action/5'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <div className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <span>🎬</span> Video Post
                </div>
                <div className="text-sm text-fg-subtle">
                  Create a dynamic video post with multiple clips. Great for tutorials, stories, or engaging content.
                </div>
              </button>
            </div>
          </div>

          {/* Mode Selection */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">
              Choose how you'd like to create your content
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setMode('manual')}
                className={cn(
                  'p-6 border-2 rounded-lg text-left transition-all',
                  mode === 'manual'
                    ? 'border-border-primary bg-bg-action/5'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <div className="font-semibold text-lg mb-2">I already have a topic</div>
                <div className="text-sm text-fg-subtle">
                  Describe what you want your video to be about, and we'll create the script and caption for you.
                </div>
              </button>
              <button
                type="button"
                onClick={() => setMode('auto')}
                className={cn(
                  'p-6 border-2 rounded-lg text-left transition-all',
                  mode === 'auto'
                    ? 'border-border-primary bg-bg-action/5'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <div className="font-semibold text-lg mb-2">Suggest a topic for me</div>
                <div className="text-sm text-fg-subtle">
                  Let the AI suggest a topic based on what's relevant right now, including upcoming holidays.
                </div>
              </button>
            </div>
          </div>

          {/* Manual Mode: User Topic */}
          {mode === 'manual' && (
            <div className="space-y-3">
              <Label htmlFor="userTopic" className="text-lg font-semibold">
                Describe what you want this {templateType === 'image' ? 'image post' : 'video'} to be about
              </Label>
              <Textarea
                id="userTopic"
                value={userTopic}
                onChange={(e) => setUserTopic(e.target.value)}
                required={mode === 'manual'}
                rows={6}
                className="text-lg min-h-[140px]"
                placeholder="For example: '3 tips for feeling more stable energy throughout the day' or 'My morning routine for better focus'..."
                aria-describedby="topic-description"
              />
              <p id="topic-description" className="text-base text-fg-subtle">
                Be as detailed as possible. The AI will use this to create your script and caption.
              </p>

              {/* Optional Image Upload */}
              <div className="space-y-3 pt-2">
                <Label htmlFor="imageUpload" className="text-lg font-semibold">
                  Snap a photo for inspiration (Optional)
                </Label>
                <Input
                  id="imageUpload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImageFile(file);
                      // Create preview
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setImagePreview(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    } else {
                      setImageFile(null);
                      setImagePreview(null);
                    }
                  }}
                  className="text-lg"
                />
                {imagePreview && (
                  <div className="mt-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-w-xs max-h-48 rounded-lg border border-border"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                      className="mt-2"
                    >
                      Remove image
                    </Button>
                  </div>
                )}
                <p className="text-sm text-fg-subtle">
                  Upload an image to help guide the script generation. The AI will analyze the image and create content inspired by it.
                </p>
              </div>
            </div>
          )}

          {/* Auto Mode: Holiday Selection */}
          {mode === 'auto' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="useHolidays"
                  checked={useHolidays}
                  onCheckedChange={(checked) => {
                    setUseHolidays(checked as boolean);
                    if (!checked) {
                      setSelectedHolidayId(null);
                    }
                  }}
                />
                <Label htmlFor="useHolidays" className="text-lg font-normal cursor-pointer">
                  Use upcoming holidays if relevant
                </Label>
              </div>

              {useHolidays && (
                <div className="space-y-3">
                  <Label className="text-lg font-semibold">
                    Select a holiday (optional)
                  </Label>
                  {isLoadingHolidays ? (
                    <div className="flex items-center gap-2 text-fg-subtle">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Loading holidays...</span>
                    </div>
                  ) : holidays.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {holidays.map((holiday) => (
                        <button
                          key={holiday.id}
                          type="button"
                          onClick={() =>
                            setSelectedHolidayId(
                              selectedHolidayId === holiday.id ? null : holiday.id
                            )
                          }
                          className={cn(
                            'px-4 py-2 rounded-lg border-2 transition-all text-base',
                            selectedHolidayId === holiday.id
                              ? 'border-border-primary bg-bg-action text-fg-inverse'
                              : 'border-border hover:border-primary/50'
                          )}
                        >
                          {holiday.name} – {formatHolidayDate(holiday.date)}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-base text-fg-subtle">
                      No upcoming holidays found. The AI will suggest a general wellness topic.
                    </p>
                  )}
                  <p className="text-sm text-fg-subtle">
                    {selectedHolidayId
                      ? 'The AI will create content related to the selected holiday.'
                      : 'The AI will choose a relevant holiday or suggest a general wellness topic.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tone */}
          <div className="space-y-3">
            <Label htmlFor="tone" className="text-lg font-semibold">
              Tone
            </Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger id="tone" className="text-lg h-12">
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

          {/* Platforms */}
          <div className="space-y-3">
            <Label className="text-lg font-semibold">Platforms</Label>
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
                    className="text-lg font-normal cursor-pointer"
                  >
                    {platform}
                  </Label>
                </div>
              ))}
            </div>
            {platforms.length === 0 && (
              <p className="text-base text-destructive">
                Please select at least one platform
              </p>
            )}
          </div>

          {/* Video Length (Optional) */}
          <div className="space-y-3">
            <Label className="text-lg font-semibold">
              Video Length - Optional
            </Label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setLengthSeconds(lengthSeconds === 30 ? null : 30)}
                className={cn(
                  'p-4 border-2 rounded-lg text-center transition-all',
                  lengthSeconds === 30
                    ? 'border-border-primary bg-bg-action text-fg-inverse'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <div className="font-semibold text-base">Short</div>
                <div className="text-sm opacity-90">30 seconds</div>
              </button>
              <button
                type="button"
                onClick={() => setLengthSeconds(lengthSeconds === 45 ? null : 45)}
                className={cn(
                  'p-4 border-2 rounded-lg text-center transition-all',
                  lengthSeconds === 45
                    ? 'border-border-primary bg-bg-action text-fg-inverse'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <div className="font-semibold text-base">Medium</div>
                <div className="text-sm opacity-90">45 seconds</div>
              </button>
              <button
                type="button"
                onClick={() => setLengthSeconds(lengthSeconds === 60 ? null : 60)}
                className={cn(
                  'p-4 border-2 rounded-lg text-center transition-all',
                  lengthSeconds === 60
                    ? 'border-border-primary bg-bg-action text-fg-inverse'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <div className="font-semibold text-base">Long</div>
                <div className="text-sm opacity-90">60 seconds</div>
              </button>
            </div>
            <p className="text-base text-fg-subtle">
              Choose a length, or leave blank to let the AI decide
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div
              className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg"
              role="alert"
            >
              <p className="text-destructive text-lg font-medium">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={
              isLoading ||
              (mode === 'manual' && !userTopic.trim()) ||
              platforms.length === 0
            }
            size="lg"
            className="w-full text-lg font-semibold py-6"
            aria-label="Generate content plan"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                <span className="ml-2">Generating...</span>
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
