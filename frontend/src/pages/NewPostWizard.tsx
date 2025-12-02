import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Search, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { ContentBriefForm } from '../components/forms/ContentBriefForm';
import { ScriptPreview } from '../components/planning/ScriptPreview';
import { CaptionPreview } from '../components/planning/CaptionPreview';
import { AssetGrid } from '../components/assets/AssetGrid';
import { RenderStatusCard } from '../components/video/RenderStatusCard';
import { type GeneratedPlan } from '../lib/contentApi';
import { searchAssets, searchAssetsContextual, regenerateImage, type AssetResult } from '../lib/assetsApi';
import { renderVideo, type VideoRenderRequest } from '../lib/videoApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  steps: Array<{ number: number; label: string }>;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, totalSteps, steps }) => {
  return (
    <div className="mb-8">
      {/* Step circles with connecting lines */}
      <div className="flex justify-center items-center gap-2 mb-4">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <div className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-colors",
              currentStep === step.number && "bg-bg-action text-fg-inverse",
              currentStep > step.number && "bg-bg-success text-fg-inverse",
              currentStep < step.number && "bg-bg-subtle text-fg-subtle"
            )}>
              {currentStep > step.number ? '✓' : step.number}
            </div>
            {index < steps.length - 1 && (
              <div className={cn(
                "h-0.5 w-12 transition-colors",
                currentStep > step.number ? "bg-bg-success" : "bg-bg-subtle"
              )} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step label */}
      <p className="text-center text-lg font-semibold text-fg-body">
        Step {currentStep} of {totalSteps}: {steps.find(s => s.number === currentStep)?.label}
      </p>
    </div>
  );
};

type WizardStep = 1 | 2 | 3 | 4;

const WIZARD_STEPS: WizardStep[] = [1, 2, 3, 4];

export const NewPostWizard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);
  const [script, setScript] = useState<string>('');
  const [caption, setCaption] = useState<string>('');
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [assets, setAssets] = useState<AssetResult[]>([]);
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());
  const [selectedAssetOrder, setSelectedAssetOrder] = useState<string[]>([]); // Track selection order
  const [selectedAssets, setSelectedAssets] = useState<AssetResult[]>([]); // Track full asset objects
  const [assetPrompts, setAssetPrompts] = useState<Map<string, string>>(new Map()); // Track prompts for regeneration
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  // Lock to stock videos for now
  const [visualStyle] = useState<'pexels' | 'ai_generation'>('pexels');
  const [templateType, setTemplateType] = useState<'image' | 'video'>('video'); // Template type: image or video
  const [hasSearched, setHasSearched] = useState(false); // Track if user has triggered a search
  const [renderJobId, setRenderJobId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const { toast } = useToast();

  const handlePlanGenerated = (plan: GeneratedPlan, templateTypeFromBrief?: 'image' | 'video') => {
    setGeneratedPlan(plan);
    // Use template type from brief if provided, otherwise default to video
    if (templateTypeFromBrief) {
      setTemplateType(templateTypeFromBrief);
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

  // Play a soft success sound when rendering finishes
  useEffect(() => {
    if (videoUrl && !isRendering) {
      const audio = new Audio('/success.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    }
  }, [videoUrl, isRendering]);

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

  const handleAutomaticSearch = async () => {
    setHasSearched(true);
    await handleContextualSearch();
  };

  const handleManualSearch = async () => {
    setHasSearched(true);
    await handleSearch();
  };

  // Auto-populate visuals when entering Step 3 using Pexels (videos)
  // or Google-powered AI image generation, based on the selected template type.
  useEffect(() => {
    if (
      currentStep === 3 &&
      generatedPlan &&
      !hasSearched &&
      assets.length === 0 &&
      !isSearching
    ) {
      void handleAutomaticSearch();
    }
  }, [currentStep, generatedPlan, hasSearched, assets.length, isSearching]);

  const handleRegenerateImage = async (assetId: string, prompt: string) => {
    setIsSearching(true);
    setSearchError(null);
    try {
      const newAsset = await regenerateImage(prompt);

      setAssets(prev => prev.map(asset =>
        asset.id === assetId ? newAsset : asset
      ));

      setSelectedAssets(prev => prev.map(asset =>
        asset.id === assetId ? newAsset : asset
      ));

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

      setAssetPrompts(prev => {
        const next = new Map(prev);
        const existingPrompt = prev.get(assetId) || prompt;
        next.delete(assetId);
        next.set(newAsset.id, existingPrompt);
        return next;
      });
    } catch (err: any) {
      setSearchError(
        err.response?.data?.detail ||
        'We couldn\'t regenerate the image. Please try again.'
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleAssetSelectionChange = (id: string, selected: boolean) => {
    const maxSelection = 1; // Single video selection

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
    const requiredCount = 1; // Require a single video selection
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

  const STEPS = [
    { number: 1, label: "What's your topic?" },
    { number: 2, label: "Review your script" },
    {
      number: 3,
      label: templateType === 'image' ? 'Pick your image' : 'Pick your video',
    },
    { number: 4, label: "Download & post" },
  ];

  const renderStep = () => {
    const prefillTopic = (location.state as any)?.prefillTopic;

    switch (currentStep) {
      case 1:
        return (
          <ContentBriefForm
            onPlanGenerated={handlePlanGenerated}
            initialTopic={prefillTopic}
            onGeneratingChange={setIsGeneratingPlan}
            formId="content-brief-form"
          />
        );
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
        const requiredCount = 1;
        const hasCorrectSelection = selectedAssetIds.size === requiredCount;

        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">
                  {templateType === 'image' ? 'Choose Your Image' : 'Choose Your Video'}
                </CardTitle>
                <CardDescription className="text-lg">
                  {templateType === 'image'
                    ? 'Select 1 image that matches your script'
                    : 'Select 1 video that matches your script'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <AssetGrid
                  assets={assets}
                  selectedIds={selectedAssetIds}
                  selectedOrder={selectedAssetOrder}
                  onSelectionChange={handleAssetSelectionChange}
                  maxSelection={requiredCount}
                  templateType={templateType}
                  onRegenerate={handleRegenerateImage}
                  assetPrompts={assetPrompts}
                />

                {/* Collapsed search - only show if needed */}
                {assets.length === 0 && !isSearching && (
                  <div className="text-center py-8">
                    <p className="text-fg-subtle mb-4">
                      {templateType === 'image'
                        ? 'No images loaded yet'
                        : 'No videos loaded yet'}
                    </p>
                    <Button onClick={handleAutomaticSearch}>
                      {templateType === 'image' ? 'Load Images' : 'Load Videos'}
                    </Button>
                  </div>
                )}

                {!hasSearched && assets.length > 0 && (
                  <div className="text-center">
                    <Button
                      variant="outline"
                      onClick={() => setHasSearched(true)}
                    >
                      {templateType === 'image'
                        ? '🔍 Search for different images'
                        : '🔍 Search for different videos'}
                    </Button>
                  </div>
                )}

                {hasSearched && (
                  <div className="flex gap-2">
                    <Input
                      placeholder={
                        templateType === 'image'
                          ? "Search images (e.g., 'nature', 'product', 'coffee')"
                          : "Search videos (e.g., 'coffee', 'workout', 'nature')"
                      }
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleManualSearch();
                      }}
                      className="text-lg"
                    />
                    <Button
                      onClick={handleManualSearch}
                      disabled={isSearching || !searchQuery.trim()}
                    >
                      {isSearching ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Search className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                )}

                {isSearching && (
                  <div className="text-center py-4">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                    <p className="text-fg-subtle mt-2">
                      {templateType === 'image'
                        ? 'Searching for images...'
                        : 'Searching for videos...'}
                    </p>
                  </div>
                )}

                {searchError && (
                  <Card className="bg-bg-error-subtle border-border-error">
                    <CardContent className="py-3">
                      <p className="text-fg-error text-sm">{searchError}</p>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>

            {/* Selection confirmation */}
            {hasCorrectSelection && (
              <Card className="bg-bg-success-subtle border-2 border-border-success">
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-8 h-8 text-fg-success" />
                    <div>
                      <p className="text-lg font-semibold text-fg-success">
                        {templateType === 'image'
                          ? "✓ Perfect! You've selected your image"
                          : "✓ Perfect! You've selected your video"}
                      </p>
                      <p className="text-sm text-fg-subtle">
                        {templateType === 'image'
                          ? 'Click "Create My Image Post" below to continue'
                          : 'Click "Create My Video" below to continue'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Show requirement if not met */}
            {!hasCorrectSelection && assets.length > 0 && (
              <Card className="bg-bg-warning-subtle border-border-warning">
                <CardContent className="py-3">
                  <p className="text-fg-warning text-sm">
                    {templateType === 'image'
                      ? `Please select ${requiredCount} image to continue`
                      : `Please select ${requiredCount} video to continue`}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            {/* Rendering in progress */}
            {isRendering && !videoUrl && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Creating Your Video...</h2>
                  <p className="text-lg text-fg-subtle">
                    This usually takes 30-60 seconds. Hang tight!
                  </p>

                  {renderJobId && (
                    <div className="mt-6">
                      <RenderStatusCard jobId={renderJobId} onComplete={handleRenderComplete} onError={handleRenderError} />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Render error */}
            {renderError && (
              <Card className="border-2 border-border-error bg-bg-error-subtle">
                <CardContent className="py-8">
                  <div className="flex items-start gap-4">
                    <AlertCircle className="w-10 h-10 text-fg-error flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-fg-error mb-3">
                        Video Creation Issue
                      </h3>
                      <p className="text-lg text-fg-body mb-4 whitespace-pre-line">
                        {renderError}
                      </p>
                      <div className="flex gap-3">
                        <Button onClick={startRender} size="lg">
                          Try Again
                        </Button>
                        <Button
                          onClick={() => setCurrentStep(3)}
                          variant="outline"
                          size="lg"
                        >
                          Pick Different Video
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Success! Video is ready */}
            {videoUrl && !isRendering && (
              <div className="space-y-6">
                {/* Big success message */}
                <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-500">
                  <CardContent className="py-10 text-center">
                    <CheckCircle2 className="w-24 h-24 text-green-600 mx-auto mb-4" />
                    <h1 className="text-5xl font-bold text-green-900 mb-2">
                      🎉 Your Video is Ready!
                    </h1>
                    <p className="text-xl text-green-800">
                      Great job! Now let's get it posted.
                    </p>
                  </CardContent>
                </Card>

                {/* Video preview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">Preview Your Video</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-[9/16] max-w-md mx-auto bg-black rounded-lg overflow-hidden shadow-2xl">
                      <video
                        src={videoUrl}
                        controls
                        autoPlay
                        loop
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Action buttons */}
                <Card className="border-2 border-bg-action">
                  <CardHeader>
                    <CardTitle className="text-2xl">What do you want to do?</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Download button - PRIMARY ACTION */}
                    <Button
                      size="lg"
                      className="w-full h-20 px-6 text-2xl font-bold bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = videoUrl;
                        link.download = `unicity-video-${Date.now()}.mp4`;
                        link.click();
                        toast({
                          title: "Download started!",
                          description: "Check your downloads folder",
                        });
                      }}
                    >
                      📥 Download Video to Phone
                    </Button>

                    {/* Copy caption button */}
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full h-16 text-xl"
                      onClick={() => {
                        navigator.clipboard.writeText(caption);
                        toast({
                          title: "✅ Caption copied!",
                          description: "Paste it when you post to TikTok/Instagram",
                          duration: 3000,
                        });
                      }}
                    >
                      📋 Copy Caption to Clipboard
                    </Button>

                    {/* Show the caption */}
                    <Card className="bg-bg-elevated">
                      <CardHeader>
                        <CardTitle className="text-lg">Your Caption</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-base text-fg-body whitespace-pre-wrap leading-relaxed">
                          {caption}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Instructions */}
                    <Card className="bg-blue-50 border-2 border-blue-200">
                      <CardHeader>
                        <CardTitle className="text-xl text-blue-900 flex items-center gap-2">
                          📱 How to Post This to TikTok/Instagram
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ol className="list-decimal list-inside space-y-3 text-lg text-blue-900">
                          <li>Download the video above (if you haven't already)</li>
                          <li>Open TikTok or Instagram app on your phone</li>
                          <li>Tap the <strong>"+"</strong> button to create a post</li>
                          <li>Select the video you just downloaded</li>
                          <li>Paste the caption (already copied to clipboard!)</li>
                          <li>Add trending music (optional but recommended)</li>
                          <li>Tap <strong>"Post"</strong> and you're done! 🎉</li>
                        </ol>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>

                {/* Next actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    className="h-16 px-8 text-xl"
                    onClick={() => {
                      // Reset wizard state
                      setCurrentStep(1);
                      setGeneratedPlan(null);
                      setScript('');
                      setCaption('');
                      setAssets([]);
                      setSelectedAssetIds(new Set());
                      setSelectedAssetOrder([]);
                      setSelectedAssets([]);
                      setVideoUrl(null);
                      setRenderJobId(null);
                      setRenderError(null);
                      setSearchQuery('');
                      setHasSearched(false);

                      toast({
                        title: "Let's create another!",
                        description: "Starting fresh from Step 1",
                      });
                    }}
                  >
                    ➕ Create Another Post
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-16 px-8 text-xl"
                    onClick={() => navigate('/dashboard')}
                  >
                    ✅ Done - Back to Dashboard
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <StepIndicator currentStep={currentStep} totalSteps={4} steps={STEPS} />

      <div className="min-h-[400px]">
        {renderStep()}
      </div>

      {/* Bottom navigation */}
      <div className="flex justify-between items-center mt-8 pt-6 border-t border-border-default">
        {/* Back button */}
        {currentStep > 1 && currentStep < 4 ? (
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              setCurrentStep(prev => {
                const index = WIZARD_STEPS.indexOf(prev);
                if (index === -1 || index === 0) return prev;
                return WIZARD_STEPS[index - 1];
              });
            }}
            disabled={isGeneratingPlan || isRendering}
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
        ) : (
          <div />
        )}

        {/* Next/Action button - only show for steps 1-3 */}
        {currentStep < 4 && (
          <Button
            size="lg"
            className="min-w-[200px]"
            form={currentStep === 1 ? 'content-brief-form' : undefined}
            type={currentStep === 1 ? 'submit' : 'button'}
            onClick={
              currentStep === 1
                ? undefined
                : () => {
                    if (currentStep === 2) {
                      setCurrentStep(3);
                    } else if (currentStep === 3 && selectedAssetIds.size === 1) {
                      startRender();
                      setCurrentStep(4);
                    }
                  }
            }
            disabled={
              (currentStep === 1 && isGeneratingPlan) ||
              (currentStep === 2 && !script.trim()) ||
              (currentStep === 3 && selectedAssetIds.size !== 1) ||
              isRendering
            }
          >
            {currentStep === 1 && (
              <>
                {isGeneratingPlan ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    Generate Script
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </>
            )}
            {currentStep === 2 && (
              <>
                {templateType === 'image' ? 'Next: Choose Image' : 'Next: Choose Video'}
                <ChevronRight className="w-5 h-5 ml-2" />
              </>
            )}
            {currentStep === 3 && (
              <>
                Create My Video
                <ChevronRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};
