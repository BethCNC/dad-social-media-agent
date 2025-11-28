import { type AssetResult } from '../../lib/assetsApi';
import { Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AssetGridProps {
  assets: AssetResult[];
  selectedIds: Set<string>;
  onSelectionChange: (id: string, selected: boolean) => void;
}

export const AssetGrid = ({
  assets,
  selectedIds,
  onSelectionChange,
}: AssetGridProps) => {
  const formatDuration = (seconds: number) => {
    return `${seconds}s`;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">
        Select Video Clips ({selectedIds.size} selected)
      </h3>
      
      {assets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground text-lg">
              No videos found. Try a different search term.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map((asset) => {
            const isSelected = selectedIds.has(asset.id);
            return (
              <Card
                key={asset.id}
                className={cn(
                  "relative overflow-hidden cursor-pointer transition-all hover:shadow-md",
                  isSelected
                    ? "ring-2 ring-primary border-primary"
                    : "hover:border-primary/50"
                )}
                onClick={() => onSelectionChange(asset.id, !isSelected)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectionChange(asset.id, !isSelected);
                  }
                }}
                aria-label={`${isSelected ? 'Deselect' : 'Select'} video clip ${asset.id}`}
                aria-pressed={isSelected}
              >
                <CardContent className="p-0">
                  <div className="aspect-video bg-muted relative">
                    <img
                      src={asset.thumbnail_url}
                      alt="Video thumbnail"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <div className="bg-primary text-primary-foreground rounded-full p-2">
                          <Check className="w-6 h-6" aria-hidden="true" />
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-2 right-2 bg-black/75 text-white px-2 py-1 rounded text-sm font-medium">
                      {formatDuration(asset.duration_seconds)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
