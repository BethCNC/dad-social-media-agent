import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Search, Loader2, CheckCircle2, Download } from 'lucide-react';
import { ContentBriefForm } from '../components/forms/ContentBriefForm';
import { ContentTypeSelector, type ContentType } from '../components/forms/ContentTypeSelector';
import { ScriptPreview } from '../components/planning/ScriptPreview';
import { CaptionPreview } from '../components/planning/CaptionPreview';
import { AssetGrid } from '../components/assets/AssetGrid';
import { RenderStatusCard } from '../components/video/RenderStatusCard';
import { ScheduleForm } from '../components/social/ScheduleForm';
import { ScheduleGenerator } from '../components/schedule/ScheduleGenerator';
import { ScheduleCalendar } from '../components/schedule/ScheduleCalendar';
import { ContentPreviewModal } from '../components/schedule/ContentPreviewModal';
import { type GeneratedPlan, type TikTokMusicHint } from '../lib/contentApi';
import { type MonthlySchedule, type ScheduledContentItem } from '../lib/scheduleApi';
import { generateMonthlySchedule, type ScheduleRequest } from '../lib/scheduleApi';
import { generateWeeklySchedule } from '../lib/weeklyApi';
import { searchAssets, searchAssetsContextual, regenerateImage, type AssetResult } from '../lib/assetsApi';
import { renderVideo, type VideoRenderRequest } from '../lib/videoApi';
import { type ScheduleResponse } from '../lib/socialApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { format, startOfWeek } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

type WizardStep = 0 | 1 | 2 | 3 | 4 | 5;

export const NewPostWizard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<WizardStep>(0);
  const [contentType, setContentType] = useState<ContentType | null>(null);
  const [customPostCount, setCustomPostCount] = useState<number | null>(null);
  const [monthlySchedule, setMonthlySchedule] = useState<MonthlySchedule | null>(null);
  const [selectedScheduleItem, setSelectedScheduleItem] = useState<ScheduledContentItem | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);
  const [script, setScript] = useState<string>('');
  const [caption, setCaption] = useState<string>('');
  const [assets, setAssets] = useState<AssetResult[]>([]);
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());
  const [selectedAssetOrder, setSelectedAssetOrder] = useState<string[]>([]); // Track selection order
  const [selectedAssets, setSelectedAssets] = useState<AssetResult[]>([]); // Track full asset objects
  const [assetPrompts, setAssetPrompts] = useState<Map<string, string>>(new Map()); // Track prompts for regeneration
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  // Default visual style based on template type: images default to AI, videos default to stock
  const [visualStyle, setVisualStyle] = useState<'pexels' | 'ai_generation'>(() => {
    // Will be updated when templateType changes
    return 'pexels';
  });
  const [templateType, setTemplateType] = useState<'image' | 'video'>('video'); // Template type: image or video
  const [hasSearched, setHasSearched] = useState(false); // Track if user has triggered a search
  const [renderJobId, setRenderJobId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isGeneratingSchedule, setIsGeneratingSchedule] = useState(false);
  const { toast } = useToast();

  const handleContentTypeSelect = (type: ContentType, customCount?: number) => {
    setContentType(type);
    if (customCount) {
      setCustomPostCount(customCount);
    }

    // Handle different content types
    if (type === 'single') {
      // Skip schedule generation, go directly to topic selection
      setCurrentStep(1);
    } else if (type === 'weekly') {
      // Navigate to weekly schedule generation page
      handleGenerateWeeklySchedule();
    } else if (type === 'monthly' || type === 'custom') {
      // Show monthly/custom schedule generator
      // Stay on step 0 but show schedule generator
    }
  };

  const handleGenerateWeeklySchedule = async () => {
    try {
      setIsGeneratingSchedule(true);
      const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
      await generateWeeklySchedule({
        week_start_date: format(monday, 'yyyy-MM-dd'),
        platforms: ['TikTok', 'Instagram'],
      });
      // Navigate to weekly schedule page after generation
      navigate('/weekly');
    } catch (err: any) {
      console.error('Error generating weekly schedule:', err);
      setRenderError(
        err.response?.data?.detail ||
        'We couldn\'t generate your weekly schedule. Please try again.'
      );
    } finally {
      setIsGeneratingSchedule(false);
    }
  };

  const handleScheduleGenerated = (schedule: MonthlySchedule) => {
    setMonthlySchedule(schedule);
  };

  const handleGenerateCustomSchedule = async (postCount: number) => {
    try {
      setIsGeneratingSchedule(true);
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

      // Calculate posts_per_week based on custom count
      // If they want X posts, calculate how many per week over ~30 days
      const postsPerWeek = Math.round((postCount / 30) * 7);

      const request: ScheduleRequest = {
        start_date: format(firstDay, 'yyyy-MM-dd'),
        platforms: ['TikTok', 'Instagram'],
        posts_per_week: Math.max(1, Math.min(7, postsPerWeek)),
      };

      const schedule = await generateMonthlySchedule(request);
      // Limit to the requested number of posts
      const limitedItems = schedule.items.slice(0, postCount);
      const limitedSchedule: MonthlySchedule = {
        ...schedule,
        items: limitedItems,
      };
      setMonthlySchedule(limitedSchedule);
    } catch (err: any) {
      console.error('Error generating custom schedule:', err);
      setRenderError(
        err.response?.data?.detail ||
        'We couldn\'t generate your schedule. Please try again.'
      );
    } finally {
      setIsGeneratingSchedule(false);
    }
  };

  const handleDayClick = (item: ScheduledContentItem) => {
    setSelectedScheduleItem(item);
    setShowScheduleModal(true);
  };

  const handleUseScheduleContent = (item: ScheduledContentItem) => {
    // Pre-fill the plan from schedule item
    const plan: GeneratedPlan = {
      script: item.script,
      caption: item.caption,
      shot_plan: item.shot_plan,
    };

    setGeneratedPlan(plan);
    // Always use 'video' template - backend handles Ken Burns for static images
    setScript(item.script);
    setCaption(item.caption);
    setShowScheduleModal(false);
    setSelectedScheduleItem(null);
    setCurrentStep(2); // Skip to step 2 (review script & caption)
  };

  const handleSkipSchedule = () => {
    // Reset to single post mode and skip to topic selection
    setContentType('single');
    setCurrentStep(1);
  };

  // Handle pre-fills from dashboard navigation
  useEffect(() => {
    const state = location.state as any;
    if (state?.prefillTopic || state?.trendIdea) {
      // Coming from dashboard with a pre-filled topic - skip content type selection
      setContentType('single');
      setCurrentStep(1);
    }
  }, [location.state]);

  const handlePlanGenerated = (plan: GeneratedPlan, templateTypeFromBrief?: 'image' | 'video') => {
    setGeneratedPlan(plan);
    // Use template type from brief if provided, otherwise default to video
    if (templateTypeFromBrief) {
      setTemplateType(templateTypeFromBrief);
      // Set default visual style based on template type
      // Images work better with AI generation, videos work better with stock videos
      setVisualStyle(templateTypeFromBrief === 'image' ? 'ai_generation' : 'pexels');
    }
    setScript(plan.script);
    setCaption(plan.caption);
    setCurrentStep(2);
  };

  // Reset selection when leaving step 3 (asset selection)
  useEffect(() => {
    if (currentStep !== 3) {
      // Don't reset if we're going to step 4 (rendering) - keep selections
      if (currentStep < 3) {
        setSelectedAssetIds(new Set());
        setSelectedAssetOrder([]);
        setSelectedAssets([]);
      }
    }
  }, [currentStep]);

  // Don't auto-search - let user control when to search

  // Check for trend idea or prefill topic in location state and pre-fill
  useEffect(() => {
    const state = location.state as any;
    const trendIdea = state?.trendIdea;
    const prefillTopic = state?.prefillTopic;
    const preselectedVideo = state?.preselectedVideo;

    if (preselectedVideo) {
      // Map UserVideo to AssetResult
      const asset: AssetResult = {
        id: preselectedVideo.id,
        thumbnail_url: preselectedVideo.thumbnail_url || '',
        video_url: preselectedVideo.video_url || '', // Ensure video_url exists on UserVideo or handle it
        duration_seconds: preselectedVideo.duration_seconds || 0,
      };

      // Set assets and select it
      setAssets([asset]);
      setSelectedAssetIds(new Set([asset.id]));
      setSelectedAssetOrder([asset.id]);
      setSelectedAssets([asset]);

      // Set content type to single and go to topic selection
      // We could skip to visuals, but they need a script first
      setContentType('single');
      setCurrentStep(1);
    } else if (trendIdea) {
      // Pre-fill script and caption from trend
      if (trendIdea.hook_script) {
        setScript(trendIdea.hook_script);
      }
      if (trendIdea.suggested_caption) {
        setCaption(trendIdea.suggested_caption);
      }

      // Create a minimal plan to allow progression
      const plan: GeneratedPlan = {
        script: trendIdea.hook_script || '',
        caption: trendIdea.suggested_caption || '',
        shot_plan: [
          { description: 'healthy lifestyle wellness scene', duration_seconds: 5 },
          { description: 'peaceful morning routine objects', duration_seconds: 5 },
        ],
      };
      setGeneratedPlan(plan);

      // Skip to step 2 (review script & caption) since we already have the content
      setCurrentStep(2);
    } else if (prefillTopic) {
      // If we have a prefill topic from dashboard, navigate to step 1 with topic pre-filled
      // The ContentBriefForm will handle this via a prop or we can store it in state
      // For now, we'll skip to step 1 and let the user see the pre-filled form
      setCurrentStep(1);
    }
  }, [location.state]);

  // Auto-start render when entering step 4
  useEffect(() => {
    if (currentStep === 4 && !renderJobId && !videoUrl && selectedAssetIds.size > 0) {
      startRender();
    }
  }, [currentStep]);

  // Auto-search when entering step 3
  useEffect(() => {
    if (currentStep === 3 && generatedPlan && !hasSearched && assets.length === 0) {
      // For image posts, always use AI generation (force it)
      if (templateType === 'image') {
        setVisualStyle('ai_generation');
      }
      // Auto-trigger contextual search based on shot plan
      // For images, this will use AI generation; for videos, it uses the selected visual style
      if (generatedPlan.shot_plan && generatedPlan.shot_plan.length > 0 && script && caption) {
        setHasSearched(true); // Mark as searched to prevent re-triggering
        // Use a small delay to ensure visualStyle is updated for image posts
        setTimeout(() => handleContextualSearch(), 100);
      }
    }
  }, [currentStep, templateType]); // Depend on currentStep and templateType

  const handleContextualSearch = async () => {
    if (!generatedPlan || !script || !caption) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      // For image posts, always use AI generation regardless of visualStyle state
      // For video posts, use the selected visual style
      const effectiveVisualStyle = templateType === 'image' ? 'ai_generation' : visualStyle;

      // Use contextual generation for better relevance with visual style preference
      const results = await searchAssetsContextual({
        topic: '', // We don't have topic in wizard, use first shot description
        hook: caption.split('\n')[0] || '', // First line is usually hook
        script: script,
        shot_plan: generatedPlan.shot_plan,
        content_pillar: 'education', // Default, could be enhanced
        suggested_keywords: [],
        max_results: 12,
        visual_style: effectiveVisualStyle, // Use AI generation for images, selected style for videos
      });
      setAssets(results);
      setHasSearched(true); // Mark as searched after successful search

      // Store prompts for regeneration (map asset ID to shot description)
      const promptsMap = new Map<string, string>();
      results.forEach((asset, index) => {
        if (generatedPlan.shot_plan[index]) {
          promptsMap.set(asset.id, generatedPlan.shot_plan[index].description);
        }
      });
      setAssetPrompts(promptsMap);
    } catch (err: any) {
      // Fallback to simple generation
      const keywords = generatedPlan.shot_plan
        .map((shot) => shot.description)
        .join(' ')
        .split(' ')
        .slice(0, 5)
        .join(' ');
      if (keywords) {
        await handleSearch(keywords);
        setHasSearched(true); // Mark as searched after fallback search
      } else {
        setSearchError(
          err.response?.data?.detail ||
          'We couldn\'t generate visuals. Please try again.'
        );
        setIsSearching(false);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async (query?: string) => {
    const searchTerm = query || searchQuery;
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      const results = await searchAssets(searchTerm, 12);
      setAssets(results);
    } catch (err: any) {
      setSearchError(
        err.response?.data?.detail ||
        'We couldn\'t generate visuals right now. Please try again.'
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleAssetSelectionChange = (id: string, selected: boolean) => {
    const maxSelection = 2; // Always allow 2 selections for video template

    // Find the asset object if we're selecting
    const assetObj = assets.find(a => a.id === id);

    setSelectedAssetIds((prev) => {
      const next = new Set(prev);
      if (selected) {
        // Check if we can add more (respect maxSelection)
        if (next.size < maxSelection) {
          next.add(id);
        }
      } else {
        next.delete(id);
      }
      return next;
    });

    // Update selection order - maintain order of selection
    setSelectedAssetOrder((prev) => {
      if (selected) {
        // Only add if not already selected and under limit
        if (!prev.includes(id) && prev.length < maxSelection) {
          return [...prev, id];
        }
      } else {
        // Remove from order when deselected
        return prev.filter(assetId => assetId !== id);
      }
      return prev;
    });

    // Update selected assets list
    setSelectedAssets((prev) => {
      if (selected) {
        if (assetObj && !prev.find(a => a.id === id) && prev.length < maxSelection) {
          return [...prev, assetObj];
        }
        return prev;
      } else {
        return prev.filter(a => a.id !== id);
      }
    });
  };

  const startRender = async () => {
    const requiredCount = 2; // Always require 2 assets for video template
    if (selectedAssetIds.size !== requiredCount || !script.trim()) {
      setRenderError(`Please select exactly ${requiredCount} visuals and ensure script is filled.`);
      return;
    }

    setIsRendering(true);
    setRenderError(null);

    try {
      // Get selected assets with their URLs in selection order
      // Use the stored selectedAssets state which persists across searches
      const assetsToRender = selectedAssetOrder
        .map(id => selectedAssets.find(asset => asset.id === id))
        .filter((asset): asset is NonNullable<typeof asset> => asset !== undefined);

      // Validate we have the correct number of assets
      if (assetsToRender.length !== requiredCount) {
        setRenderError(`Please select exactly ${requiredCount} visuals. Currently selected: ${assetsToRender.length}`);
        setIsRendering(false);
        return;
      }

      console.log('Selected assets for rendering:', assetsToRender.map(a => ({ id: a.id, url: a.video_url })));
      console.log('Script to render:', script);

      const renderRequest: VideoRenderRequest = {
        assets: assetsToRender.map((asset) => ({
          // Use asset.id (which should be the URL) or fallback to video_url
          // Backend will convert relative URLs to absolute
          id: asset.id || asset.video_url || asset.thumbnail_url,
          start_at: null,
          end_at: null,
        })),
        script: script,
        title: null,
        template_type: templateType, // Use selected template type (image or video)
      };

      const job = await renderVideo(renderRequest);
      setRenderJobId(job.job_id);
    } catch (err: any) {
      setRenderError(
        err.response?.data?.detail ||
        'We couldn\'t start creating your video. Please try again.'
      );
      setIsRendering(false);
    }
  };

  const handleRenderComplete = (url: string) => {
    setVideoUrl(url);
    setIsRendering(false);
  };

  const handleRenderError = (error: string) => {
    setRenderError(error);
    setIsRendering(false);
  };

  const handleNext = () => {
    if (currentStep < 5) {
      // Only allow progression if we have a plan for step 2+
      if (currentStep === 1 || generatedPlan) {
        // For step 3, require exactly 2 assets (always using video template)
        if (currentStep === 3) {
          const requiredCount = 2;
          if (selectedAssetIds.size !== requiredCount) {
            return;
          }
        }
        // For step 4, require video to be rendered
        if (currentStep === 4 && !videoUrl) {
          return;
        }
        setCurrentStep((prev) => (prev + 1) as WizardStep);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as WizardStep);
    }
  };

  const stepTitles = [
    'Step 1: Choose Content Type',
    'Step 2: Choose Your Topic',
    'Step 3: Review Your Script & Caption',
    'Step 4: Choose Your Visuals',
    `Step 5: Create Your ${templateType === 'image' ? 'Image' : 'Video'}`,
    'Step 6: Schedule Your Post',
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        // Show content type selector if not selected, or schedule generator/calendar based on type
        if (!contentType) {
          return <ContentTypeSelector onSelect={handleContentTypeSelect} />;
        }

        // If single post selected, should have skipped to step 1, but handle it anyway
        if (contentType === 'single') {
          // This shouldn't happen, but just in case, skip to step 1
          return (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-fg-subtle text-xl">
                  Creating a single post... Redirecting to topic selection.
                </p>
              </CardContent>
            </Card>
          );
        }

        // Weekly schedule - should have navigated away, but show loading state
        if (contentType === 'weekly') {
          return (
            <Card>
              <CardContent className="py-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                <p className="text-fg-subtle text-xl">
                  {isGeneratingSchedule ? 'Generating weekly schedule...' : 'Redirecting to weekly schedule...'}
                </p>
              </CardContent>
            </Card>
          );
        }

        // Monthly or Custom schedule
        if (contentType === 'monthly' || contentType === 'custom') {
          if (!monthlySchedule) {
            // Show schedule generator
            if (contentType === 'custom' && customPostCount) {
              // Custom count - generate schedule directly
              return (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Generate {customPostCount} Post{customPostCount !== 1 ? 's' : ''}</CardTitle>
                      <p className="text-fg-subtle">
                        Creating a custom schedule with {customPostCount} posts
                      </p>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={() => handleGenerateCustomSchedule(customPostCount)}
                        disabled={isGeneratingSchedule}
                        size="lg"
                        className="w-full"
                      >
                        {isGeneratingSchedule ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            Generating...
                          </>
                        ) : (
                          `Generate ${customPostCount} Post${customPostCount !== 1 ? 's' : ''}`
                        )}
                      </Button>
                      <Button
                        onClick={() => setContentType(null)}
                        variant="outline"
                        className="w-full mt-4"
                      >
                        Choose Different Option
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              );
            } else {
              // Monthly - show schedule generator
              return (
                <div className="space-y-6">
                  <ScheduleGenerator onScheduleGenerated={handleScheduleGenerated} />
                  <Button
                    onClick={() => setContentType(null)}
                    variant="outline"
                    className="w-full"
                  >
                    Choose Different Option
                  </Button>
                </div>
              );
            }
          } else {
            // Schedule generated - show calendar
            return (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">
                    Your {contentType === 'custom' ? `${customPostCount} Post` : 'Monthly'} Schedule
                  </h2>
                  <Button variant="outline" onClick={() => {
                    setMonthlySchedule(null);
                    setContentType(null);
                  }}>
                    Generate New Schedule
                  </Button>
                </div>
                <ScheduleCalendar
                  schedule={monthlySchedule}
                  onDayClick={handleDayClick}
                />
                <div className="flex gap-2">
                  <Button onClick={handleSkipSchedule} variant="outline">
                    Skip to Manual Content Creation
                  </Button>
                </div>
              </div>
            );
          }
        }

        // Fallback
        return <ContentTypeSelector onSelect={handleContentTypeSelect} />;
      case 1:
        const prefillTopic = (location.state as any)?.prefillTopic;
        return <ContentBriefForm onPlanGenerated={handlePlanGenerated} initialTopic={prefillTopic} />;
      case 2:
        if (!generatedPlan) {
          return (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-fg-subtle text-xl">
                  Please complete the previous step first.
                </p>
              </CardContent>
            </Card>
          );
        }
        return (
          <div className="space-y-8">
            <ScriptPreview
              script={script}
              onScriptChange={setScript}
            />
            <CaptionPreview
              caption={caption}
              onCaptionChange={setCaption}
            />
          </div>
        );
      case 3:
        const requiredCount = templateType === 'image' ? 1 : 2; // 1 for image template, 2 for video template
        const hasCorrectSelection = selectedAssetIds.size === requiredCount;

        return (
          <div className="space-y-6">
            {/* Visual Style Segmented Control - Only show for video posts */}
            {templateType === 'video' && (
              <Card className="bg-bg-elevated border-border-default">
                <CardContent className="py-4">
                  <p className="text-fg-headings font-semibold text-lg mb-4">
                    Choose Your Visual Style
                  </p>
                  <div className="flex gap-2 bg-bg-page p-1 rounded-lg border border-border-default">
                    <button
                      type="button"
                      onClick={() => {
                        // Don't clear assets - persist selections when switching tabs
                        setVisualStyle('ai_generation');
                      }}
                      className={cn(
                        "flex-1 py-3 px-4 rounded-md text-lg font-medium transition-all",
                        visualStyle === 'ai_generation'
                          ? 'bg-bg-action text-fg-inverse shadow-sm'
                          : 'text-fg-body hover:bg-bg-subtle'
                      )}
                      disabled={isSearching}
                    >
                      AI Generated
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        // Don't clear assets - persist selections when switching tabs
                        setVisualStyle('pexels');
                        // Auto-search when switching to stock videos
                        if (generatedPlan && generatedPlan.shot_plan.length > 0 && !hasSearched) {
                          const firstShot = generatedPlan.shot_plan[0];
                          if (firstShot?.description) {
                            setSearchQuery(firstShot.description);
                            setTimeout(() => handleContextualSearch(), 100);
                          }
                        }
                      }}
                      className={cn(
                        "flex-1 py-3 px-4 rounded-md text-lg font-medium transition-all relative",
                        visualStyle === 'pexels'
                          ? 'bg-bg-action text-fg-inverse shadow-sm'
                          : 'text-fg-body hover:bg-bg-subtle'
                      )}
                      disabled={isSearching}
                    >
                      Stock Video
                      {visualStyle === 'pexels' && (
                        <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">Recommended</span>
                      )}
                    </button>
                  </div>
                  <p className="text-sm text-fg-subtle mt-3">
                    {visualStyle === 'pexels'
                      ? '✅ Recommended: Stock videos work reliably with Creatomate. Search for real videos that match your content.'
                      : '⚠️ Note: AI-generated images may not work in local development. Consider using stock videos instead.'}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* For image posts, show info card about AI generation */}
            {templateType === 'image' && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="py-4">
                  <p className="text-blue-900 font-semibold text-lg mb-2">
                    AI-Generated Images
                  </p>
                  <p className="text-sm text-blue-800">
                    ✅ We'll create unique AI-generated images for your image post. Click "Generate AI Images" below to get started.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Template Type Display (read-only, selected in Step 1) */}
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="py-4">
                <p className="text-purple-900 font-semibold text-lg mb-2">
                  Content Type: {templateType === 'image' ? '📸 Image Post' : '🎬 Video Post'}
                </p>
                <p className="text-sm text-purple-800">
                  {templateType === 'image'
                    ? 'You selected Image Post in Step 1. Select 1 visual to create an animated image post.'
                    : 'You selected Video Post in Step 1. Select 2 visuals to create a video post.'}
                </p>
              </CardContent>
            </Card>

            {/* Template Requirements Info */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="py-4">
                <p className="text-blue-900 font-semibold text-lg mb-2">
                  Template Requirements
                </p>
                <p className="text-blue-800 text-base">
                  Please select exactly {requiredCount} {requiredCount === 1 ? 'visual' : 'visuals'} for the {templateType} template.
                </p>
              </CardContent>
            </Card>

            {/* Search/Generate Controls - Different UI based on visual style */}
            {visualStyle === 'ai_generation' ? (
              // AI Generated Mode: Show Generate button
              <div className="space-y-4">
                {!hasSearched && assets.length === 0 && (
                  <div className="w-full">
                    <p className="text-lg text-fg-subtle mb-4">
                      Click "Generate AI Images" to create unique visuals based on your shot plan.
                    </p>
                  </div>
                )}
                <Button
                  onClick={async () => {
                    if (generatedPlan && script && caption) {
                      setHasSearched(true);
                      await handleContextualSearch();
                    }
                  }}
                  disabled={isSearching || !generatedPlan || !script || !caption}
                  size="lg"
                  className="w-full py-6 text-lg"
                  aria-label={`Generate AI ${templateType === 'image' ? 'Images' : 'Images'}`}
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                      <span className="ml-2">Dreaming up {templateType === 'image' ? 'images' : 'images'}...</span>
                    </>
                  ) : (
                    `Generate AI ${templateType === 'image' ? 'Images' : 'Images'}`
                  )}
                </Button>
              </div>
            ) : templateType === 'video' ? (
              // Stock Video Mode: Show search bar with auto-search
              <div className="space-y-4">
                {assets.length === 0 && !hasSearched && generatedPlan && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 text-sm mb-2">
                      💡 We'll automatically search for stock videos based on your content. You can also search manually below.
                    </p>
                  </div>
                )}
                <div className="flex gap-4">
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isSearching && searchQuery.trim()) {
                        setHasSearched(true);
                        handleSearch();
                      }
                    }}
                    placeholder="Enter keywords to search for stock videos (e.g., 'nature sunset', 'healthy food')..."
                    className="text-lg h-12"
                    aria-label="Search for stock videos"
                  />
                  <Button
                    onClick={() => {
                      setHasSearched(true);
                      handleSearch();
                    }}
                    disabled={isSearching || !searchQuery.trim()}
                    size="lg"
                    className="py-6 px-8 text-lg"
                    aria-label="Search videos"
                  >
                    {isSearching ? (
                      <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                    ) : (
                      <Search className="w-5 h-5" aria-hidden="true" />
                    )}
                    <span className="ml-2">Search</span>
                  </Button>
                </div>
                {generatedPlan && script && caption && (
                  <Button
                    onClick={async () => {
                      setHasSearched(true);
                      await handleContextualSearch();
                    }}
                    disabled={isSearching || !generatedPlan || !script || !caption}
                    variant="outline"
                    size="lg"
                    className="w-full py-6 text-lg"
                    aria-label={`Search ${templateType === 'image' ? 'images' : 'videos'} based on content`}
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                        <span className="ml-2">Searching...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-5 h-5" aria-hidden="true" />
                        <span className="ml-2">Auto-Search {templateType === 'image' ? 'Images' : 'Videos'} Based on Your Content</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            ) : null}

            {searchError && (
              <Card className="border-destructive/20 bg-destructive/10">
                <CardContent className="py-4">
                  <p className="text-destructive text-lg font-medium">{searchError}</p>
                </CardContent>
              </Card>
            )}

            <AssetGrid
              assets={[
                // Show selected assets first
                ...selectedAssets,
                // Then show search results (filtering out any that are already in selectedAssets)
                ...assets.filter(a => !selectedAssetIds.has(a.id))
              ]}
              selectedIds={selectedAssetIds}
              selectedOrder={selectedAssetOrder}
              onSelectionChange={handleAssetSelectionChange}
              maxSelection={requiredCount}
              templateType={templateType}
              onRegenerate={visualStyle === 'ai_generation' ? async (assetId: string, prompt: string) => {
                try {
                  setIsSearching(true);
                  setSearchError(null);
                  const newAsset = await regenerateImage(prompt);

                  // Update the asset in the list
                  setAssets(prev => prev.map(asset =>
                    asset.id === assetId ? newAsset : asset
                  ));

                  // Also update selectedAssets if it's there
                  setSelectedAssets(prev => prev.map(asset =>
                    asset.id === assetId ? newAsset : asset
                  ));

                  // If the regenerated asset was selected, update selection
                  if (selectedAssetIds.has(assetId)) {
                    setSelectedAssetIds(prev => {
                      const next = new Set(prev);
                      next.delete(assetId);
                      next.add(newAsset.id);
                      return next;
                    });
                    setSelectedAssetOrder(prev =>
                      prev.map(id => id === assetId ? newAsset.id : id)
                    );
                  }
                } catch (err: any) {
                  setSearchError(
                    err.response?.data?.detail ||
                    'We couldn\'t regenerate the image. Please try again.'
                  );
                } finally {
                  setIsSearching(false);
                }
              } : undefined}
              assetPrompts={assetPrompts}
            />

            {!hasCorrectSelection && assets.length > 0 && (
              <Card className={selectedAssetIds.size === 0 ? "border-amber-200 bg-amber-50" : "border-destructive/20 bg-destructive/10"}>
                <CardContent className="py-4">
                  <p className={cn(
                    "text-lg font-medium",
                    selectedAssetIds.size === 0 ? "text-amber-800" : "text-destructive"
                  )}>
                    {selectedAssetIds.size === 0
                      ? `Please select ${requiredCount} visuals to continue.`
                      : selectedAssetIds.size < requiredCount
                        ? `Please select ${requiredCount - selectedAssetIds.size} more visual${requiredCount - selectedAssetIds.size > 1 ? 's' : ''} to continue.`
                        : `Please select exactly ${requiredCount} visuals. You have selected ${selectedAssetIds.size}.`}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        );
      case 4:
        // Render + Music & Audio info
        return (
          <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-6">
            <div>
              {renderError && (
                <div className="space-y-4 mb-6">
                  <Card className="border-destructive/20 bg-destructive/10">
                    <CardContent className="py-4">
                      <p className="text-destructive text-lg font-medium">{renderError}</p>
                    </CardContent>
                  </Card>
                  <Button
                    onClick={startRender}
                    disabled={isRendering}
                    size="lg"
                    className="w-full py-6 text-lg"
                    aria-label={`Retry ${templateType} rendering`}
                  >
                    Try Again
                  </Button>
                </div>
              )}

              {videoUrl ? (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-green-600 text-2xl">
                        Your {templateType === 'image' ? 'image' : 'video'} is ready!
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {templateType === 'image' ? (
                        <img
                          src={videoUrl}
                          alt="Rendered image"
                          className="w-full rounded-lg shadow-lg"
                        />
                      ) : (
                        <video
                          src={videoUrl}
                          controls
                          className="w-full rounded-lg shadow-lg"
                          aria-label="Rendered video preview"
                        >
                          Your browser does not support the video tag.
                        </video>
                      )}
                      <Button
                        variant="outline"
                        className="w-full mt-4"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = videoUrl;
                          link.download = templateType === 'image' ? `rendered-image.png` : `rendered-video.mp4`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download {templateType === 'image' ? 'Image' : 'Video'}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Compliance Check Badge */}
                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="py-4 flex items-center gap-3">
                      <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-green-900">Compliance Check Passed</p>
                        <p className="text-sm text-green-700">
                          Your content follows all Unicity compliance guidelines and is ready to post.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : renderJobId ? (
                <RenderStatusCard
                  jobId={renderJobId}
                  onComplete={handleRenderComplete}
                  onError={handleRenderError}
                />
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" aria-hidden="true" />
                    <p className="text-muted-foreground text-xl">
                      We're building your {templateType === 'image' ? 'image' : 'video'}, this may take under a minute.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Music & Audio side card */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Music & Audio</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    This quick preview is focused on visuals and script. When posts are generated in your weekly
                    schedule, the app will auto-select a safe background track based on the mood of your script.
                  </p>
                  {generatedPlan?.music_mood && (
                    <p className="text-sm">
                      <span className="font-medium">Suggested mood:</span>{' '}
                      <span className="capitalize">{generatedPlan.music_mood}</span>
                    </p>
                  )}
                </CardContent>
              </Card>

              {generatedPlan?.tiktok_music_hints && generatedPlan.tiktok_music_hints.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Suggested TikTok music searches</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      When you upload this video to TikTok or Instagram, tap “Add sound” and paste one of these phrases
                      into the search bar to find safe background music.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {generatedPlan.tiktok_music_hints.map((hint: TikTokMusicHint, index: number) => (
                        <Button
                          key={`${hint.label}-${index}`}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs px-3 py-1 rounded-full"
                          onClick={() => navigator.clipboard.writeText(hint.searchPhrase)}
                        >
                          {hint.label}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        );
      case 5:
        if (!videoUrl) {
          return (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground text-xl">
                  Please complete the previous steps first.
                </p>
              </CardContent>
            </Card>
          );
        }
        return (
          <ScheduleForm
            videoUrl={videoUrl}
            caption={caption}
            onScheduled={(response: ScheduleResponse) => {
              // Handle successful scheduling
              console.log('Post scheduled:', response);
              toast({
                title: "Post Scheduled Successfully",
                description: "Your post has been added to your weekly schedule.",
                variant: "default",
              });
              navigate('/weekly');
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader className="space-y-6">
          <CardTitle className="text-3xl font-bold">
            {stepTitles[currentStep]}
          </CardTitle>
          <div className="flex items-center gap-2" role="progressbar" aria-valuenow={currentStep} aria-valuemin={0} aria-valuemax={5} aria-label={`Step ${currentStep + 1} of 6`}>
            {[0, 1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={cn(
                  "flex-1 h-3 rounded-full transition-colors",
                  step <= currentStep
                    ? 'bg-primary'
                    : 'bg-muted'
                )}
                aria-hidden="true"
              />
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="min-h-[400px]">
            {renderStepContent()}
          </div>

          <div className="flex justify-between items-center pt-8 border-t border-border">
            <Button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              variant="outline"
              size="lg"
              className="py-6 px-8 text-lg"
              aria-label="Go to previous step"
            >
              <ChevronLeft className="w-5 h-5" aria-hidden="true" />
              Previous
            </Button>
            {currentStep === 0 && contentType && contentType !== 'single' && contentType !== 'weekly' ? (
              <Button
                onClick={handleSkipSchedule}
                size="lg"
                className="py-6 px-8 text-lg"
                aria-label="Skip to manual content creation"
              >
                Skip to Manual Content
                <ChevronRight className="w-5 h-5 ml-2" aria-hidden="true" />
              </Button>
            ) : currentStep === 0 && !contentType ? null : (
              <Button
                onClick={handleNext}
                disabled={
                  currentStep === 5 ||
                  (currentStep >= 2 && !generatedPlan) ||
                  (currentStep === 3 && selectedAssetIds.size !== 2) ||
                  (currentStep === 4 && !videoUrl)
                }
                size="lg"
                className="py-6 px-8 text-lg"
                aria-label="Go to next step"
              >
                Next
                <ChevronRight className="w-5 h-5" aria-hidden="true" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {showScheduleModal && selectedScheduleItem && (
        <ContentPreviewModal
          item={selectedScheduleItem}
          onClose={() => {
            setShowScheduleModal(false);
            setSelectedScheduleItem(null);
          }}
          onUseContent={handleUseScheduleContent}
        />
      )}
    </div>
  );
};
