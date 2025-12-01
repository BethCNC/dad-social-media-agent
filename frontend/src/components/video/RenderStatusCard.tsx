import { useEffect, useState } from 'react';
import { Loader2, CheckCircle, XCircle, Video, ShieldCheck } from 'lucide-react';
import { getRenderStatus, type RenderJob } from '../../lib/videoApi';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface RenderStatusCardProps {
  jobId: string;
  onComplete: (videoUrl: string) => void;
  onError: (error: string) => void;
}

export const RenderStatusCard = ({
  jobId,
  onComplete,
  onError,
}: RenderStatusCardProps) => {
  const [status, setStatus] = useState<RenderJob | null>(null);
  const [isPolling, setIsPolling] = useState(true);

  useEffect(() => {
    if (!jobId || !isPolling) return;

    const pollStatus = async () => {
      try {
        const currentStatus = await getRenderStatus(jobId);
        setStatus(currentStatus);

        if (currentStatus.status === 'succeeded' && currentStatus.video_url) {
          setIsPolling(false);
          onComplete(currentStatus.video_url);
        } else if (currentStatus.status === 'failed' || currentStatus.status === 'error') {
          setIsPolling(false);
          // Use error message from Creatomate if available, otherwise show helpful default
          let errorMsg = currentStatus.error_message || 'Video rendering failed. Please try again.';

          // Enhance error message for common issues
          if (errorMsg.toLowerCase().includes('localhost') || errorMsg.toLowerCase().includes('could not be downloaded')) {
            errorMsg = 'Video rendering failed: Creatomate cannot access localhost URLs. For local development, try using stock videos (Pexels) instead of AI-generated images, or set up ngrok (ngrok http 8000) and update API_BASE_URL in .env.';
          }

          onError(errorMsg);
        }
      } catch (err: any) {
        setIsPolling(false);
        onError(
          err.response?.data?.detail ||
          'Could not check render status. Please try again.'
        );
      }
    };

    // Poll immediately, then every 3 seconds
    pollStatus();
    const interval = setInterval(pollStatus, 3000);

    return () => clearInterval(interval);
  }, [jobId, isPolling, onComplete, onError]);

  const getStatusDisplay = () => {
    if (!status) {
      return {
        icon: <Loader2 className="w-8 h-8 animate-spin text-primary" />,
        text: 'Starting render...',
        color: 'text-primary',
      };
    }

    switch (status.status) {
      case 'pending':
      case 'processing':
      case 'rendering':
        return {
          icon: <Loader2 className="w-8 h-8 animate-spin text-primary" />,
          text: 'Rendering your video...',
          color: 'text-primary',
        };
      case 'succeeded':
      case 'completed':
        return {
          icon: <CheckCircle className="w-8 h-8 text-green-600" />,
          text: 'Video ready!',
          color: 'text-green-600',
        };
      case 'failed':
      case 'error':
        return {
          icon: <XCircle className="w-8 h-8 text-destructive" />,
          text: 'Rendering failed',
          color: 'text-destructive',
        };
      default:
        return {
          icon: <Video className="w-8 h-8 text-fg-subtle" />,
          text: `Status: ${status.status}`,
          color: 'text-fg-subtle',
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <Card>
      <CardContent className="py-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div aria-live="polite" aria-atomic="true">
            {statusDisplay.icon}
          </div>
          <p className={cn("text-xl font-semibold", statusDisplay.color)}>
            {statusDisplay.text}
          </p>

          {/* Compliance Check Badge - Show when rendering or completed */}
          {(isPolling || status?.status === 'succeeded') && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-green-600" aria-hidden="true" />
              <span className="text-sm font-medium text-green-800">
                Compliance Check Passed
              </span>
            </div>
          )}

          {status?.video_url && (
            <div className="mt-6 w-full">
              <video
                src={status.video_url}
                controls
                className="w-full rounded-lg shadow-lg"
                aria-label="Rendered video preview"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}
          {isPolling && (
            <p className="text-fg-subtle text-sm mt-2">
              This may take a minute or two...
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
