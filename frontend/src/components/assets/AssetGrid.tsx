import { type AssetResult } from '../../lib/assetsApi';
import { Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AssetGridProps {
  assets: AssetResult[];
  selectedIds: Set<string>;
  selectedOrder?: string[]; // Array of IDs in selection order
  onSelectionChange: (id: string, selected: boolean) => void;
  maxSelection?: number; // Maximum number of assets that can be selected
  templateType?: 'image' | 'video'; // Template type for display purposes
}

export const AssetGrid = ({
  assets,
  selectedIds,
  selectedOrder = [],
  onSelectionChange,
  maxSelection,
  templateType = 'video',
}: AssetGridProps) => {
  const formatDuration = (seconds: number) => {
    return `${seconds}s`;
  };

  const isSelectionLimitReached = maxSelection !== undefined && selectedIds.size >= maxSelection;
  const canSelect = (assetId: string) => {
    if (!maxSelection) return true;
    if (selectedIds.has(assetId)) return true; // Can always deselect
    return selectedIds.size < maxSelection;
  };

  const assetTypeLabel = templateType === 'image' ? 'images' : 'video clips';
  const selectionText = maxSelection 
    ? `${selectedIds.size} of ${maxSelection} selected`
    : `${selectedIds.size} selected`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">
          Select {assetTypeLabel} ({selectionText})
        </h3>
        {maxSelection && (
          <div className={cn(
            "text-sm px-3 py-1 rounded-full",
            selectedIds.size === maxSelection
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-600"
          )}>
            {selectedIds.size === maxSelection ? 'Selection complete' : `Select ${maxSelection - selectedIds.size} more`}
          </div>
        )}
      </div>
      
      {maxSelection && selectedIds.size < maxSelection && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            {templateType === 'image' 
              ? 'Please select exactly 1 image for the image template.'
              : 'Please select exactly 2 video clips for the video template.'}
          </p>
        </div>
      )}
      
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
            const canSelectThis = canSelect(asset.id);
            const isDisabled = !canSelectThis && !isSelected;
            
            return (
              <Card
                key={asset.id}
                className={cn(
                  "relative overflow-hidden transition-all",
                  isDisabled 
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer hover:shadow-md",
                  isSelected
                    ? "ring-2 ring-primary border-primary"
                    : isDisabled
                    ? "border-gray-200"
                    : "hover:border-primary/50"
                )}
                onClick={() => {
                  if (!isDisabled) {
                    onSelectionChange(asset.id, !isSelected);
                  }
                }}
                role="button"
                tabIndex={isDisabled ? -1 : 0}
                onKeyDown={(e) => {
                  if (!isDisabled && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onSelectionChange(asset.id, !isSelected);
                  }
                }}
                aria-label={`${isSelected ? 'Deselect' : 'Select'} ${assetTypeLabel.slice(0, -1)} ${asset.id}`}
                aria-pressed={isSelected}
                aria-disabled={isDisabled}
              >
                <CardContent className="p-0">
                  <div className="aspect-video bg-muted relative">
                    <img
                      src={asset.thumbnail_url}
                      alt="Video thumbnail"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {/* Selection number badge in top-left corner - always show when selected */}
                    {isSelected && selectedOrder.includes(asset.id) && (
                      <div className="absolute top-2 left-2 bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg border-2 border-white z-10">
                        <span className="text-sm font-bold">
                          {selectedOrder.indexOf(asset.id) + 1}
                        </span>
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <div className="bg-primary text-primary-foreground rounded-full p-2">
                          <Check className="w-6 h-6" aria-hidden="true" />
                        </div>
                      </div>
                    )}
                    {isDisabled && (
                      <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center">
                        <div className="bg-gray-800 text-white rounded-lg px-3 py-1 text-xs font-medium">
                          Limit reached
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
