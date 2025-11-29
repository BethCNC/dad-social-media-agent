import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Search, Loader2 } from 'lucide-react';
import { ContentBriefForm } from '../components/forms/ContentBriefForm';
import { ScriptPreview } from '../components/planning/ScriptPreview';
import { CaptionPreview } from '../components/planning/CaptionPreview';
import { AssetGrid } from '../components/assets/AssetGrid';
import { RenderStatusCard } from '../components/video/RenderStatusCard';
import { ScheduleForm } from '../components/social/ScheduleForm';
import { ScheduleGenerator } from '../components/schedule/ScheduleGenerator';
import { ScheduleCalendar } from '../components/schedule/ScheduleCalendar';
import { ContentPreviewModal } from '../components/schedule/ContentPreviewModal';
import { type GeneratedPlan } from '../lib/contentApi';
import { type MonthlySchedule, type ScheduledContentItem } from '../lib/scheduleApi';
import { searchAssets, searchAssetsContextual, type AssetResult } from '../lib/assetsApi';
import { renderVideo, type VideoRenderRequest } from '../lib/videoApi';
import { type ScheduleResponse } from '../lib/socialApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type WizardStep = 0 | 1 | 2 | 3 | 4 | 5;

export const NewPostWizard = () => {
  const [currentStep, setCurrentStep] = useState<WizardStep>(0);
  const [monthlySchedule, setMonthlySchedule] = useState<MonthlySchedule | null>(null);
  const [selectedScheduleItem, setSelectedScheduleItem] = useState<ScheduledContentItem | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);
  const [templateType, setTemplateType] = useState<string>('video');
  const [script, setScript] = useState<string>('');
  const [caption, setCaption] = useState<string>('');
  const [assets, setAssets] = useState<AssetResult[]>([]);
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());
  const [selectedAssetOrder, setSelectedAssetOrder] = useState<string[]>([]); // Track selection order
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [renderJobId, setRenderJobId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  const handleScheduleGenerated = (schedule: MonthlySchedule) => {
    setMonthlySchedule(schedule);
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
    setTemplateType(item.template_type);
    setScript(item.script);
    setCaption(item.caption);
    setShowScheduleModal(false);
    setSelectedScheduleItem(null);
    setCurrentStep(2); // Skip to step 2 (review script & caption)
  };

  const handleSkipSchedule = () => {
    setCurrentStep(1);
  };

  const handlePlanGenerated = (plan: GeneratedPlan, templateTypeFromForm: string) => {
    setGeneratedPlan(plan);
    setTemplateType(templateTypeFromForm);
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
      }
    }
  }, [currentStep]);

  // Auto-search when entering step 3 using contextual search
  useEffect(() => {
    if (currentStep === 3 && generatedPlan && assets.length === 0 && script && caption) {
      // Use contextual search for better relevance
      handleContextualSearch();
    } else if (currentStep === 3 && generatedPlan && assets.length === 0) {
      // Fallback: extract keywords from shot plan if contextual search not ready
      const keywords = generatedPlan.shot_plan
        .map((shot) => shot.description)
        .join(' ')
        .split(' ')
        .slice(0, 5)
        .join(' ');
      
      if (keywords) {
        setSearchQuery(keywords);
        handleSearch(keywords);
      }
    }
  }, [currentStep, generatedPlan, script, caption]);

  // Auto-start render when entering step 4
  useEffect(() => {
    if (currentStep === 4 && !renderJobId && !videoUrl && selectedAssetIds.size > 0) {
      startRender();
    }
  }, [currentStep]);

  const handleContextualSearch = async () => {
    if (!generatedPlan || !script || !caption) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      // Use contextual search for better relevance
      const results = await searchAssetsContextual({
        topic: '', // We don't have topic in wizard, use first shot description
        hook: caption.split('\n')[0] || '', // First line is usually hook
        script: script,
        shot_plan: generatedPlan.shot_plan,
        content_pillar: 'education', // Default, could be enhanced
        suggested_keywords: [],
        max_results: 12,
      });
      setAssets(results);
    } catch (err: any) {
      // Fallback to simple search
      const keywords = generatedPlan.shot_plan
        .map((shot) => shot.description)
        .join(' ')
        .split(' ')
        .slice(0, 5)
        .join(' ');
      if (keywords) {
        await handleSearch(keywords);
      } else {
        setSearchError(
          err.response?.data?.detail ||
          'We couldn\'t search for videos. Please try again.'
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
        'We couldn\'t search for videos right now. Please try again.'
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleAssetSelectionChange = (id: string, selected: boolean) => {
    const maxSelection = templateType === 'image' ? 1 : 2;
    
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
  };

  const startRender = async () => {
    const requiredCount = templateType === 'image' ? 1 : 2;
    if (selectedAssetIds.size !== requiredCount || !script.trim()) {
      const assetTypeLabel = templateType === 'image' ? 'image' : 'video clips';
      setRenderError(`Please select exactly ${requiredCount} ${assetTypeLabel} and ensure script is filled.`);
      return;
    }

    setIsRendering(true);
    setRenderError(null);

    try {
      // Get selected assets with their URLs in selection order
      const selectedAssets = selectedAssetOrder
        .map(id => assets.find(asset => asset.id === id))
        .filter((asset): asset is NonNullable<typeof asset> => asset !== undefined);

      // Validate we have the correct number of assets
      const requiredCount = templateType === 'image' ? 1 : 2;
      if (selectedAssets.length !== requiredCount) {
        const assetTypeLabel = templateType === 'image' ? 'image' : 'video clips';
        setRenderError(`Please select exactly ${requiredCount} ${assetTypeLabel}. Currently selected: ${selectedAssets.length}`);
        setIsRendering(false);
        return;
      }

      console.log('Selected assets for rendering:', selectedAssets.map(a => ({ id: a.id, url: a.video_url })));
      console.log('Script to render:', script);

      const renderRequest: VideoRenderRequest = {
        assets: selectedAssets.map((asset) => ({
          id: asset.video_url, // Use video URL for Creatomate
          start_at: null,
          end_at: null,
        })),
        script: script,
        title: null,
        template_type: templateType,
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
        // For step 3, require exactly the right number of assets based on template type
        if (currentStep === 3) {
          const requiredCount = templateType === 'image' ? 1 : 2;
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
    'Step 1: Monthly Schedule (Optional)',
    'Step 2: Choose Your Topic',
    'Step 3: Review Your Script & Caption',
    'Step 4: Select Video Clips',
    `Step 5: Create Your ${templateType === 'image' ? 'Image' : 'Video'}`,
    'Step 6: Schedule Your Post',
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            {!monthlySchedule ? (
              <ScheduleGenerator onScheduleGenerated={handleScheduleGenerated} />
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Your Monthly Schedule</h2>
                  <Button variant="outline" onClick={() => setMonthlySchedule(null)}>
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
            )}
          </div>
        );
      case 1:
        return <ContentBriefForm onPlanGenerated={handlePlanGenerated} />;
      case 2:
        if (!generatedPlan) {
          return (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground text-xl">
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
        const maxSelection = templateType === 'image' ? 1 : 2;
        const requiredCount = maxSelection;
        const hasCorrectSelection = selectedAssetIds.size === requiredCount;
        const assetTypeLabel = templateType === 'image' ? 'image' : 'video clips';
        const searchPlaceholder = templateType === 'image' 
          ? 'Search for images...' 
          : 'Search for video clips...';

        return (
          <div className="space-y-6">
            {/* Template Requirements Info */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="py-4">
                <p className="text-blue-900 font-semibold text-lg mb-2">
                  Template Requirements
                </p>
                <p className="text-blue-800 text-base">
                  {templateType === 'image' 
                    ? 'Please select exactly 1 image for the image template.'
                    : 'Please select exactly 2 video clips for the video template.'}
                </p>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                placeholder={searchPlaceholder}
                className="text-lg h-12"
                aria-label={searchPlaceholder}
              />
              <Button
                onClick={() => handleSearch()}
                disabled={isSearching || !searchQuery.trim()}
                size="lg"
                className="py-6 px-8 text-lg"
                aria-label="Search"
              >
                {isSearching ? (
                  <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                ) : (
                  <Search className="w-5 h-5" aria-hidden="true" />
                )}
                <span className="ml-2">Search</span>
              </Button>
            </div>

            {searchError && (
              <Card className="border-destructive/20 bg-destructive/10">
                <CardContent className="py-4">
                  <p className="text-destructive text-lg font-medium">{searchError}</p>
                </CardContent>
              </Card>
            )}

            <AssetGrid
              assets={assets}
              selectedIds={selectedAssetIds}
              selectedOrder={selectedAssetOrder}
              onSelectionChange={handleAssetSelectionChange}
              maxSelection={maxSelection}
              templateType={templateType as 'image' | 'video'}
            />

            {!hasCorrectSelection && assets.length > 0 && (
              <Card className={selectedAssetIds.size === 0 ? "border-amber-200 bg-amber-50" : "border-destructive/20 bg-destructive/10"}>
                <CardContent className="py-4">
                  <p className={cn(
                    "text-lg font-medium",
                    selectedAssetIds.size === 0 ? "text-amber-800" : "text-destructive"
                  )}>
                    {selectedAssetIds.size === 0
                      ? `Please select ${requiredCount} ${assetTypeLabel} to continue.`
                      : selectedAssetIds.size < requiredCount
                      ? `Please select ${requiredCount - selectedAssetIds.size} more ${assetTypeLabel.slice(0, -1)} to continue.`
                      : `Please select exactly ${requiredCount} ${assetTypeLabel}. You have selected ${selectedAssetIds.size}.`}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        );
      case 4:
        if (renderError) {
          return (
            <div className="space-y-4">
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
                aria-label="Retry video rendering"
              >
                Try Again
              </Button>
            </div>
          );
        }

        if (videoUrl) {
          return (
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600 text-2xl">Your video is ready!</CardTitle>
              </CardHeader>
              <CardContent>
                <video
                  src={videoUrl}
                  controls
                  className="w-full rounded-lg shadow-lg"
                  aria-label="Rendered video preview"
                >
                  Your browser does not support the video tag.
                </video>
              </CardContent>
            </Card>
          );
        }

        if (renderJobId) {
          return (
            <RenderStatusCard
              jobId={renderJobId}
              onComplete={handleRenderComplete}
              onError={handleRenderError}
            />
          );
        }

        return (
          <Card>
            <CardContent className="py-12 text-center">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" aria-hidden="true" />
              <p className="text-muted-foreground text-xl">We're building your video, this may take under a minute.</p>
            </CardContent>
          </Card>
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
            {currentStep === 0 ? (
              <Button
                onClick={handleSkipSchedule}
                size="lg"
                className="py-6 px-8 text-lg"
                aria-label="Skip to manual content creation"
              >
                Skip to Manual Content
                <ChevronRight className="w-5 h-5 ml-2" aria-hidden="true" />
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={
                  currentStep === 5 ||
                  (currentStep >= 2 && !generatedPlan) ||
                  (currentStep === 3 && (() => {
                    const requiredCount = templateType === 'image' ? 1 : 2;
                    return selectedAssetIds.size !== requiredCount;
                  })()) ||
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
