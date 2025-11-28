import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Search, Loader2 } from 'lucide-react';
import { ContentBriefForm } from '../components/forms/ContentBriefForm';
import { ScriptPreview } from '../components/planning/ScriptPreview';
import { CaptionPreview } from '../components/planning/CaptionPreview';
import { AssetGrid } from '../components/assets/AssetGrid';
import { RenderStatusCard } from '../components/video/RenderStatusCard';
import { ScheduleForm } from '../components/social/ScheduleForm';
import { type GeneratedPlan } from '../lib/contentApi';
import { searchAssets, type AssetResult } from '../lib/assetsApi';
import { renderVideo, type VideoRenderRequest } from '../lib/videoApi';
import { type ScheduleResponse } from '../lib/socialApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type WizardStep = 1 | 2 | 3 | 4 | 5;

export const NewPostWizard = () => {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);
  const [script, setScript] = useState<string>('');
  const [caption, setCaption] = useState<string>('');
  const [assets, setAssets] = useState<AssetResult[]>([]);
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [renderJobId, setRenderJobId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  const handlePlanGenerated = (plan: GeneratedPlan) => {
    setGeneratedPlan(plan);
    setScript(plan.script);
    setCaption(plan.caption);
    setCurrentStep(2);
  };

  // Auto-search when entering step 3
  useEffect(() => {
    if (currentStep === 3 && generatedPlan && assets.length === 0) {
      // Extract keywords from shot plan descriptions
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
  }, [currentStep, generatedPlan]);

  // Auto-start render when entering step 4
  useEffect(() => {
    if (currentStep === 4 && !renderJobId && !videoUrl && selectedAssetIds.size > 0) {
      startRender();
    }
  }, [currentStep]);

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
        'We couldn\'t search for videos. Please try again.'
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleAssetSelectionChange = (id: string, selected: boolean) => {
    setSelectedAssetIds((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const startRender = async () => {
    if (selectedAssetIds.size === 0 || !script.trim()) {
      setRenderError('Please select video clips and ensure script is filled.');
      return;
    }

    setIsRendering(true);
    setRenderError(null);

    try {
      // Get selected assets with their URLs
      const selectedAssets = assets.filter((asset) =>
        selectedAssetIds.has(asset.id)
      );

      const renderRequest: VideoRenderRequest = {
        assets: selectedAssets.map((asset) => ({
          id: asset.video_url, // Use video URL for Creatomate
          start_at: null,
          end_at: null,
        })),
        script: script,
        title: null,
      };

      const job = await renderVideo(renderRequest);
      setRenderJobId(job.job_id);
    } catch (err: any) {
      setRenderError(
        err.response?.data?.detail ||
        'We couldn\'t start video rendering. Please try again.'
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
        // For step 3, require at least one asset selected
        if (currentStep === 3 && selectedAssetIds.size === 0) {
          return;
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
    'Step 1: Describe Your Video',
    'Step 2: Review Script & Caption',
    'Step 3: Select Video Clips',
    'Step 4: Render Video',
    'Step 5: Schedule Post',
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <ContentBriefForm onPlanGenerated={handlePlanGenerated} />;
      case 2:
        if (!generatedPlan) {
          return (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground text-lg">
                  Please complete Step 1 first.
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
        return (
          <div className="space-y-6">
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
                placeholder="Search for video clips..."
                className="text-base h-11"
                aria-label="Search for video clips"
              />
              <Button
                onClick={() => handleSearch()}
                disabled={isSearching || !searchQuery.trim()}
                size="lg"
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

            {searchError && (
              <Card className="border-destructive/20 bg-destructive/10">
                <CardContent className="py-4">
                  <p className="text-destructive text-base font-medium">{searchError}</p>
                </CardContent>
              </Card>
            )}

            <AssetGrid
              assets={assets}
              selectedIds={selectedAssetIds}
              onSelectionChange={handleAssetSelectionChange}
            />

            {selectedAssetIds.size === 0 && assets.length > 0 && (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-amber-600 text-base">
                    Please select at least one video clip to continue.
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
                  <p className="text-destructive text-base font-medium">{renderError}</p>
                </CardContent>
              </Card>
              <Button
                onClick={startRender}
                disabled={isRendering}
                size="lg"
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
                <CardTitle className="text-green-600">Your video is ready!</CardTitle>
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
              <p className="text-muted-foreground text-base">Starting video render...</p>
            </CardContent>
          </Card>
        );
      case 5:
        if (!videoUrl) {
          return (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground text-lg">
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
        <CardHeader className="space-y-4">
          <CardTitle className="text-3xl font-bold">
            {stepTitles[currentStep - 1]}
          </CardTitle>
          <div className="flex items-center gap-2" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={5} aria-label={`Step ${currentStep} of 5`}>
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={cn(
                  "flex-1 h-2 rounded-full transition-colors",
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

          <div className="flex justify-between items-center pt-6 border-t border-border">
            <Button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              variant="outline"
              size="lg"
              aria-label="Go to previous step"
            >
              <ChevronLeft className="w-5 h-5" aria-hidden="true" />
              Previous
            </Button>
            <Button
              onClick={handleNext}
              disabled={
                currentStep === 5 ||
                (currentStep >= 2 && !generatedPlan) ||
                (currentStep === 3 && selectedAssetIds.size === 0) ||
                (currentStep === 4 && !videoUrl)
              }
              size="lg"
              aria-label="Go to next step"
            >
              Next
              <ChevronRight className="w-5 h-5" aria-hidden="true" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
